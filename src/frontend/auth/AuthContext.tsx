import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import type { AuthContextType, User, Role, RegisterData } from "./types";
import {
  mockLogin,
  mockVerifyTotp,
  mockRegister,
  mockForgotPassword,
  mockResetPassword,
  getDemoUserByRole,
  mockRequestOtp,
  mockVerifyOtp,
  isDemoUser,
} from "./mockAuth";
import { USE_SUPABASE, supabase } from "@/backend/services/supabase";
import { clearAllDedup } from "@/backend/utils/dedup";
import { stopDemoSimulation } from "@/backend/services/realtime";
import { registerDeviceForPush } from "@/frontend/native/registerDevice";
import { unregisterDeviceForPush } from "@/frontend/native/unregisterDevice";

const STORAGE_KEY = "carenet-auth";
/** `"demo"` = mock / @carenet.demo (Dexie keys must follow this user); `"live"` = Supabase or non-demo mock */
const AUTH_MODE_KEY = "carenet-auth-mode";

const AuthContext = createContext<AuthContextType | null>(null);

type AuthMode = "demo" | "live";

function readAuthMode(): AuthMode | null {
  const v = localStorage.getItem(AUTH_MODE_KEY);
  if (v === "demo" || v === "live") return v;
  return null;
}

/**
 * Persist auth to localStorage so refresh doesn't lose session.
 */
function persistUser(user: User | null) {
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_MODE_KEY, isDemoUser(user) ? "demo" : "live");
  } else {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(AUTH_MODE_KEY);
  }
}

function loadPersistedUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** One-time: legacy installs had no mode flag — infer demo from persisted user */
function migrateAuthModeIfNeeded() {
  if (localStorage.getItem(AUTH_MODE_KEY)) return;
  const u = loadPersistedUser();
  if (u && isDemoUser(u)) {
    localStorage.setItem(AUTH_MODE_KEY, "demo");
  }
}

/**
 * Map a Supabase auth user + profile to our app User type.
 */
function mapSupabaseUser(supaUser: any, profile?: any): User {
  const meta = supaUser.user_metadata || {};
  const role = profile?.role || meta.role || "guardian";
  return {
    id: supaUser.id,
    name: profile?.name || meta.name || supaUser.email?.split("@")[0] || "",
    email: supaUser.email || "",
    phone: profile?.phone || meta.phone,
    avatarUrl: profile?.avatar_url || meta.avatar_url,
    roles: [role as Role],
    activeRole: role as Role,
    district: profile?.district || meta.district,
    createdAt: supaUser.created_at || new Date().toISOString(),
    mfaEnrolled: false,
    profile: profile || undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Holds user temporarily between password step and MFA verify step
  const pendingMfaUser = useRef<User | null>(null);

  // ─── Restore session on mount ───
  useEffect(() => {
    migrateAuthModeIfNeeded();

    if (!USE_SUPABASE) {
      const persisted = loadPersistedUser();
      if (persisted) {
        setUser(persisted);
        registerDeviceForPush().catch((e) =>
          console.warn("[AuthContext] Device registration failed on restore:", e)
        );
      }
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const applySupabaseSession = async (session: import("@supabase/supabase-js").Session | null) => {
      if (cancelled) return;
      const mode = readAuthMode();
      const persisted = loadPersistedUser();

      // Demo / mock users: keep stable ids for Dexie — do not replace with Supabase JWT user
      if (mode === "demo" && persisted && isDemoUser(persisted)) {
        if (session?.user) {
          await supabase.auth.signOut();
          return;
        }
        setUser(persisted);
        persistUser(persisted);
        setIsLoading(false);
        return;
      }

      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        const appUser = mapSupabaseUser(session.user, profile);
        setUser(appUser);
        persistUser(appUser);
        registerDeviceForPush().catch(() => {});
      } else {
        setUser(null);
        persistUser(null);
      }
      setIsLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySupabaseSession(session);
    });

    void (async () => {
      migrateAuthModeIfNeeded();
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      await applySupabaseSession(session);
    })();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // ─── Login ───
  const login = useCallback(async (email: string, password: string) => {
    // Always allow built-in demo credentials, even when Supabase is configured.
    // This keeps manual test/demo flows stable across environments.
    if (email.toLowerCase().endsWith("@carenet.demo")) {
      const demoResult = await mockLogin(email, password);
      if (demoResult.success && demoResult.user) {
        if (demoResult.needsMfa) {
          pendingMfaUser.current = demoResult.user;
          return { success: true, needsMfa: true, user: demoResult.user };
        }
        setUser(demoResult.user);
        persistUser(demoResult.user);
        registerDeviceForPush().catch(() => {});
        return { success: true, user: demoResult.user };
      }
      return demoResult;
    }

    if (USE_SUPABASE) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      if (data.user) {
        // Check if MFA is enrolled
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totpFactors = factors?.totp || [];
        if (totpFactors.length > 0) {
          // Need MFA verification
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();
          const appUser = mapSupabaseUser(data.user, profile);
          pendingMfaUser.current = appUser;
          return { success: true, needsMfa: true, user: appUser };
        }
        // No MFA — already set by onAuthStateChange listener
        return { success: true };
      }
      return { success: false, error: "Login failed" };
    }

    // Mock mode
    const result = await mockLogin(email, password);
    if (result.success && result.user) {
      if (result.needsMfa) {
        pendingMfaUser.current = result.user;
        return { success: true, needsMfa: true, user: result.user };
      }
      setUser(result.user);
      persistUser(result.user);
      registerDeviceForPush().catch(() => {});
      return { success: true, user: result.user };
    }
    return result;
  }, []);

  // ─── Verify MFA ───
  const verifyMfa = useCallback(async (code: string) => {
    const pendingUser = pendingMfaUser.current;

    // Demo credential logins should stay fully on mock auth, even when Supabase is configured.
    if (pendingUser && isDemoUser(pendingUser)) {
      const result = await mockVerifyTotp(code);
      if (result.success) {
        pendingMfaUser.current = null;
        setUser(pendingUser);
        persistUser(pendingUser);
        registerDeviceForPush().catch(() => {});
        return { success: true, user: pendingUser };
      }
      return { success: false, error: result.error || "Verification failed" };
    }

    if (USE_SUPABASE) {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.[0];
      if (!totpFactor) return { success: false, error: "No TOTP factor enrolled" };

      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      });
      if (challengeErr) return { success: false, error: challengeErr.message };

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challenge.id,
        code,
      });
      if (verifyErr) return { success: false, error: verifyErr.message };

      // MFA verified — user is now fully authenticated
      if (pendingMfaUser.current) {
        const verifiedUser = pendingMfaUser.current;
        pendingMfaUser.current = null;
        setUser(verifiedUser);
        persistUser(verifiedUser);
        registerDeviceForPush().catch(() => {});
        return { success: true, user: verifiedUser };
      }
      return { success: true };
    }

    // Mock mode
    const result = await mockVerifyTotp(code);
    if (result.success && pendingMfaUser.current) {
      const verifiedUser = pendingMfaUser.current;
      pendingMfaUser.current = null;
      setUser(verifiedUser);
      persistUser(verifiedUser);
      registerDeviceForPush().catch(() => {});
      return { success: true, user: verifiedUser };
    }
    return { success: false, error: result.error || "Verification failed" };
  }, []);

  // ─── Register ───
  const register = useCallback(async (data: RegisterData) => {
    // Keep demo registration flows independent from Supabase availability/rate limits.
    if (data.email.toLowerCase().endsWith("@carenet.demo")) {
      const demoRegister = await mockRegister(data);
      if (demoRegister.success && demoRegister.user) {
        setUser(demoRegister.user);
        persistUser(demoRegister.user);
        registerDeviceForPush().catch(() => {});
      }
      return demoRegister;
    }

    if (USE_SUPABASE) {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: data.role,
            phone: data.phone,
            district: data.district,
          },
        },
      });
      if (error) return { success: false, error: error.message };
      if (authData.user) {
        const appUser = mapSupabaseUser(authData.user);
        // Keep the newly registered user available immediately for MFA setup/skip flows.
        // onAuthStateChange will reconcile against Supabase session lifecycle afterwards.
        setUser(appUser);
        persistUser(appUser);
        return { success: true, user: appUser };
      }
      return { success: false, error: "Registration failed" };
    }

    // Mock mode
    const result = await mockRegister(data);
    if (result.success && result.user) {
      setUser(result.user);
      persistUser(result.user);
      registerDeviceForPush().catch(() => {});
    }
    return result;
  }, []);

  // ─── Forgot Password ───
  const forgotPassword = useCallback(async (email: string) => {
    if (USE_SUPABASE) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    }
    return mockForgotPassword(email);
  }, []);

  // ─── Reset Password ───
  const resetPassword = useCallback(async (password: string) => {
    if (USE_SUPABASE) {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return { success: false, error: error.message };
      return { success: true };
    }
    return mockResetPassword(password);
  }, []);

  // ─── Switch Role ───
  const switchRole = useCallback(
    (role: Role) => {
      if (!user) return;
      const roles = user.roles.includes(role)
        ? user.roles
        : [...user.roles, role];
      const updated = { ...user, roles, activeRole: role };
      setUser(updated);
      persistUser(updated);
    },
    [user]
  );

  // ─── Logout ───
  const logout = useCallback(async () => {
    unregisterDeviceForPush().catch(() => {});
    pendingMfaUser.current = null;
    if (USE_SUPABASE) {
      await supabase.auth.signOut();
    }
    setUser(null);
    persistUser(null);
    clearAllDedup();
    stopDemoSimulation();
  }, []);

  // ─── Demo Login (always mock, for dev/demo purposes) ───
  const demoLogin = useCallback(async (role: Role) => {
    const demoUser = getDemoUserByRole(role);
    persistUser(demoUser);
    setUser(demoUser);
    if (USE_SUPABASE) {
      await supabase.auth.signOut();
    }
    registerDeviceForPush().catch(() => {});
  }, []);

  // Legacy aliases for backward compatibility
  const requestOtp = useCallback(async (_phone: string) => {
    return mockRequestOtp(_phone);
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string) => {
    const result = await mockVerifyOtp(phone, code);
    if (result.success && result.user) {
      setUser(result.user);
      persistUser(result.user);
    }
    return result;
  }, []);

  const registerUser = useCallback(async (data: any) => {
    const mapped: RegisterData = {
      name: data.name || "",
      email: data.email || "",
      password: data.password || "demo1234",
      phone: data.phone,
      role: data.role || "guardian",
    };
    return register(mapped);
  }, [register]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && user.roles.length > 0,
    isLoading,
    login,
    verifyMfa,
    register,
    forgotPassword,
    resetPassword,
    switchRole,
    logout,
    demoLogin,
    // Legacy
    requestOtp,
    verifyOtp,
    registerUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
