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
import { activationService } from "@/backend/services/activation.service";
import { agentDebugLog } from "@/frontend/auth/debugAuthLog";
import i18n from "@/frontend/i18n";
import { getAuthEmailRedirectTo } from "@/frontend/auth/authEmailRedirect";
import { clearAllDedup } from "@/backend/utils/dedup";
import { isMfaRequired } from "./mfaConfig";
import { stopDemoSimulation } from "@/backend/services/realtime";
import { registerDeviceForPush } from "@/frontend/native/registerDevice";
import { unregisterDeviceForPush } from "@/frontend/native/unregisterDevice";
import { getMyChanPProfile } from "@/backend/services/channelPartnerService";

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
 * Infer role from email local-part for known test patterns.
 * caregiver* → caregiver, guardian* → guardian, patient* → patient,
 * shopowner* → shop, agent1 → admin, agent → agency.
 */
function inferRoleFromEmail(email: string): Role | null {
  const local = email.split("@")[0].toLowerCase();
  if (local.startsWith("caregiver")) return "caregiver";
  if (local.startsWith("guardian")) return "guardian";
  if (local.startsWith("patient")) return "patient";
  if (local.startsWith("shopowner")) return "shop";
  if (local.startsWith("channelpartner") || local.startsWith("channel_partner") || local.startsWith("cp")) return "channel_partner";
  if (local === "agent1") return "admin";
  if (local === "agent") return "agency";
  return null;
}

/**
 * Map a Supabase auth user + profile to our app User type.
 */
function mapSupabaseUser(supaUser: any, profile?: any, mfaEnrolled?: boolean, myChanPId?: string): User {
  const meta = supaUser.user_metadata || {};
  const email = supaUser.email || "";
  const role =
    profile?.role
    || meta.role
    || inferRoleFromEmail(email)
    || "guardian";
  return {
    id: supaUser.id,
    name: profile?.name || meta.name || email.split("@")[0] || "",
    email,
    phone: profile?.phone || meta.phone,
    avatarUrl: profile?.avatar_url || meta.avatar_url,
    roles: [role as Role],
    activeRole: role as Role,
    district: profile?.district || meta.district,
    createdAt: supaUser.created_at || new Date().toISOString(),
    mfaEnrolled: mfaEnrolled ?? false,
    profile: profile || undefined,
    myChanPId,
    activationStatus: profile?.activation_status,
    activationNote: profile?.activation_note,
  };
}

/**
 * Lookup Channel Partner ID for channel_partner role users.
 * Called during login to cache myChanPId for realtime subscriptions (Spec 2.12c).
 * @param user - The user object (must have activeRole = channel_partner)
 */
async function lookupChanPId(user: User | null): Promise<string | undefined> {
  if (!user || user.activeRole !== "channel_partner") {
    return undefined;
  }
  // Already cached
  if (user.myChanPId) {
    return user.myChanPId;
  }
  try {
    // Pass user.id directly to avoid localStorage race condition (fixes Critical Bug #2)
    const profile = await getMyChanPProfile(user.id);
    return profile?.id;
  } catch (e) {
    console.warn("[AuthContext] Failed to lookup ChanP ID:", e);
    return undefined;
  }
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
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const mfaEnrolled = (factors?.totp?.length ?? 0) > 0;
        const appUser = mapSupabaseUser(session.user, profile, mfaEnrolled);
        // Cache myChanPId for channel_partner users (Spec 2.12c)
        const chanPId = await lookupChanPId(appUser);
        const userWithChanPId = chanPId ? { ...appUser, myChanPId: chanPId } : appUser;
        setUser(userWithChanPId);
        persistUser(userWithChanPId);
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
        // Cache myChanPId for channel_partner users (Spec 2.12c)
        const chanPId = await lookupChanPId(demoResult.user);
        const userWithChanPId = chanPId ? { ...demoResult.user, myChanPId: chanPId } : demoResult.user;
        if (demoResult.needsMfa && isMfaRequired()) {
          pendingMfaUser.current = userWithChanPId;
          return { success: true, needsMfa: true, user: userWithChanPId };
        }
        setUser(userWithChanPId);
        persistUser(userWithChanPId);
        registerDeviceForPush().catch(() => {});
        return { success: true, user: userWithChanPId };
      }
      return demoResult;
    }

    if (USE_SUPABASE) {
      const emailForAuth = email.trim();
      // #region agent log
      agentDebugLog({
        runId: "pre-signin",
        hypothesisId: "H3-H4",
        location: "AuthContext.tsx:login",
        message: "supabase signIn pre",
        data: {
          useSupabase: USE_SUPABASE,
          emailTrimLen: emailForAuth.length,
          passwordLen: password.length,
          sbHost: (() => {
            try {
              return new URL(String(import.meta.env.VITE_SUPABASE_URL || "")).hostname;
            } catch {
              return "parse_fail";
            }
          })(),
        },
      });
      // #endregion
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailForAuth,
        password,
      });
      if (error) {
        // #region agent log
        const em = error.message.toLowerCase();
        agentDebugLog({
          runId: "post-fix",
          hypothesisId: "H1-H2",
          location: "AuthContext.tsx:login",
          message: "supabase signIn error",
          data: {
            errMessage: error.message,
            errName: error.name,
            errStatus: (error as { status?: number }).status,
            isEmailNotConfirmed: em.includes("email not confirmed"),
            isInvalidCreds: em.includes("invalid login credentials"),
          },
        });
        // #endregion
        if (em.includes("email not confirmed")) {
          return {
            success: false,
            error: i18n.t("login.emailNotConfirmed", { ns: "auth" }),
          };
        }
        if (em.includes("invalid login credentials")) {
          return {
            success: false,
            error: i18n.t("login.invalidCredentials", { ns: "auth" }),
          };
        }
        return { success: false, error: error.message };
      }
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();
        const appUser = mapSupabaseUser(data.user, profile, false);
        // Cache myChanPId for channel_partner users (Spec 2.12c)
        const chanPId = await lookupChanPId(appUser);
        const userWithChanPId = chanPId ? { ...appUser, myChanPId: chanPId } : appUser;
        setUser(userWithChanPId);
        persistUser(userWithChanPId);
        registerDeviceForPush().catch(() => {});
        return { success: true, user: userWithChanPId };
      }
      return { success: false, error: "Login failed" };
    }

    // Mock mode
    const result = await mockLogin(email, password);
    if (result.success && result.user) {
      // Cache myChanPId for channel_partner users (Spec 2.12c)
      const chanPId = await lookupChanPId(result.user);
      const userWithChanPId = chanPId ? { ...result.user, myChanPId: chanPId } : result.user;
      if (result.needsMfa && isMfaRequired()) {
        pendingMfaUser.current = userWithChanPId;
        return { success: true, needsMfa: true, user: userWithChanPId };
      }
      setUser(userWithChanPId);
      persistUser(userWithChanPId);
      registerDeviceForPush().catch(() => {});
      return { success: true, user: userWithChanPId };
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

  // ─── Enroll MFA ───
  const enrollMfa = useCallback(async () => {
    const MOCK_SECRET = "JBSWY3DPEHPK3PXP";

    if (!USE_SUPABASE || !user || isDemoUser(user)) {
      return { success: true, factorId: "mock-factor", qrCode: undefined, secret: MOCK_SECRET };
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: "No active session. Please log in first." };
    }

    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    if (error) return { success: false, error: error.message };
    const totp = data?.totp;
    if (!totp) return { success: false, error: "No TOTP data returned" };
    return {
      success: true,
      factorId: data.id,
      qrCode: totp.qr_code,
      secret: totp.secret,
    };
  }, [user]);

  // ─── Register ───
  const register = useCallback(async (data: RegisterData) => {
    // Demo accounts have their own one-click login flow on the Sign In page;
    // they must never go through the signup/registration path.
    if (data.email.toLowerCase().endsWith("@carenet.demo")) {
      return {
        success: false,
        error:
          "Demo accounts cannot be registered. Use the demo login on the Sign In page.",
      };
    }

    if (USE_SUPABASE) {
      const normalizedEmail = data.email.trim().toLowerCase();
      const normalizedPhone = data.phone.trim();

      const redirectTo = getAuthEmailRedirectTo();
      const { data: availRows, error: availErr } = await supabase.rpc("check_signup_availability", {
        p_email: normalizedEmail,
        p_phone: normalizedPhone,
      });
      if (!availErr && availRows && availRows.length > 0) {
        const row = availRows[0] as { email_busy?: boolean; phone_busy?: boolean };
        if (row.email_busy) {
          return { success: false, error: "This email is already registered. Sign in instead." };
        }
        if (row.phone_busy) {
          return { success: false, error: "This phone number is already registered." };
        }
      }

      const { data: authData, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: data.password,
        options: {
          ...(redirectTo ? { emailRedirectTo: redirectTo } : {}),
          data: {
            name: data.name,
            role: data.role,
            phone: data.phone,
            district: data.district,
            ...(data.roleData || {}),
          },
        },
      });
      if (error) {
        if (
          error.message.toLowerCase().includes("rate limit") ||
          error.message.toLowerCase().includes("email rate limit")
        ) {
          return {
            success: false,
            error: "Too many signup attempts for this email. Please wait a few minutes and try again, or sign in if you already registered.",
          };
        }
        return { success: false, error: error.message };
      }
      const signedUpUser = authData.user;
      if (!signedUpUser) {
        return { success: false, error: "Registration failed" };
      }
      // Supabase returns an obfuscated user with identities: [] when the email already exists
      // (no error, and typically no new confirmation email).
      const identities = signedUpUser.identities;
      if (Array.isArray(identities) && identities.length === 0) {
        return {
          success: false,
          error: "This email is already registered. Sign in instead.",
        };
      }
      if (authData.session) {
        return { success: true, signedInWithoutEmailConfirmation: true };
      }
      
      return { success: true };
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
    // Cache myChanPId for channel_partner users (Spec 2.12c)
    const chanPId = await lookupChanPId(demoUser);
    const userWithChanPId = chanPId ? { ...demoUser, myChanPId: chanPId } : demoUser;
    persistUser(userWithChanPId);
    setUser(userWithChanPId);
    if (USE_SUPABASE) {
      await supabase.auth.signOut();
    }
    registerDeviceForPush().catch(() => {});
  }, []);

  // ─── Refresh Activation Status ───
  const refreshActivationStatus = useCallback(async () => {
    if (!user) return;
    const status = await activationService.getMyActivationStatus();
    if (status) {
      const updated = { ...user, activationStatus: status.activationStatus, activationNote: status.activationNote };
      setUser(updated);
      persistUser(updated);
    }
  }, [user]);

  // Legacy aliases for backward compatibility
  const requestOtp = useCallback(async (_phone: string) => {
    return mockRequestOtp(_phone);
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string) => {
    const result = await mockVerifyOtp(phone, code);
    if (result.success && result.user) {
      // Cache myChanPId for channel_partner users (Spec 2.12c)
      const chanPId = await lookupChanPId(result.user);
      const userWithChanPId = chanPId ? { ...result.user, myChanPId: chanPId } : result.user;
      setUser(userWithChanPId);
      persistUser(userWithChanPId);
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
    enrollMfa,
    register,
    forgotPassword,
    resetPassword,
    switchRole,
    logout,
    demoLogin,
    refreshActivationStatus,
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
