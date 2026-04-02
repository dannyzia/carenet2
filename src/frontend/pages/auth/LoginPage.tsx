import { useState, useRef, useEffect } from "react";
import { useLocation, Link } from "react-router";
import { useTransitionNavigate } from "@/frontend/hooks/useTransitionNavigate";
import { Heart, Mail, Lock, Eye, EyeOff, ArrowRight, ChevronDown, ChevronUp, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@/frontend/hooks";
import { cn } from "@/frontend/theme/tokens";
import { useAuth } from "@/frontend/auth/AuthContext";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, DEMO_TOTP } from "@/frontend/auth/mockAuth";
import type { Role } from "@/frontend/auth/types";

type Step = "credentials" | "mfa" | "role-select";

const roleLabels: Record<Role, string> = {
  caregiver: "Caregiver", guardian: "Guardian", patient: "Patient",
  agency: "Agency", admin: "Admin", moderator: "Moderator", shop: "Shop Owner",
};

const roleGradients: Record<Role, string> = {
  caregiver: "var(--cn-gradient-caregiver)", guardian: "var(--cn-gradient-guardian)",
  patient: "linear-gradient(135deg, #81D4FA, #0288D1)", agency: "linear-gradient(135deg, #80CBC4, #00897B)",
  admin: "linear-gradient(135deg, #B8A7FF, #8B7AE8)", moderator: "linear-gradient(135deg, #FFD180, #FFB74D)",
  shop: "linear-gradient(135deg, #FFAB91, #E64A19)",
};

export default function LoginPage() {
  const navigate = useTransitionNavigate();
  const location = useLocation();
  const { t } = useTranslation(["auth", "common"]);
  useDocumentTitle(t("common:pageTitles.signIn", "Sign In"));
  const { login, verifyMfa, demoLogin, user, isAuthenticated } = useAuth();

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [totp, setTotp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDemo, setShowDemo] = useState(false);
  const [pendingUser, setPendingUser] = useState<{ name?: string } | null>(null);
  const totpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const returnTo = (location.state as any)?.from || null;

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(returnTo || `/${user.activeRole}/dashboard`, { replace: true });
    }
  }, [isAuthenticated, user, navigate, returnTo]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);
    if (result.success) {
      if (result.needsMfa) {
        setPendingUser({ name: result.user?.name });
        setStep("mfa");
        setTimeout(() => totpRefs.current[0]?.focus(), 100);
      } else if (result.user) {
        if (result.user.roles.length === 0) {
          navigate("/auth/role-selection", { state: { newUser: true } });
        } else if (result.user.roles.length > 1) {
          setStep("role-select");
        } else {
          navigate(returnTo || `/${result.user.activeRole}/dashboard`, { replace: true });
        }
      }
    } else {
      setError(result.error || "Login failed");
    }
  };

  const handleVerifyMfa = async (explicitCode?: string) => {
    const code = explicitCode ?? totp.join("");
    if (code.length < 6) return;
    setError("");
    setIsLoading(true);
    const result = await verifyMfa(code);
    setIsLoading(false);
    if (result.success && result.user) {
      if (result.user.roles.length === 0) {
        navigate("/auth/role-selection", { state: { newUser: true } });
      } else if (result.user.roles.length > 1) {
        setStep("role-select");
      } else {
        navigate(returnTo || `/${result.user.activeRole}/dashboard`, { replace: true });
      }
    } else {
      setError(result.error || "Verification failed");
      setTotp(["", "", "", "", "", ""]);
      totpRefs.current[0]?.focus();
    }
  };

  const handleTotpChange = (val: string, idx: number) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...totp];
    next[idx] = digit;
    setTotp(next);
    if (digit && idx < 5) totpRefs.current[idx + 1]?.focus();
    if (digit && idx === 5 && next.every((d) => d)) {
      setTimeout(() => void handleVerifyMfa(next.join("")), 0);
    }
  };

  const handleTotpKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Backspace" && !totp[idx] && idx > 0) totpRefs.current[idx - 1]?.focus();
  };

  const handleTotpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...totp];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setTotp(next);
    if (pasted.length === 6) {
      totpRefs.current[5]?.focus();
      setTimeout(() => void handleVerifyMfa(next.join("")), 0);
    }
  };

  const handleDemoLogin = async (role: Role) => {
    await demoLogin(role);
    navigate(`/${role}/dashboard`, { replace: true });
  };

  const handleRoleSelect = (role: Role) => {
    if (!user) return;
    navigate(`/${role}/dashboard`, { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: cn.bgPage }}>
      <div className="w-full max-w-md mb-8 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--cn-gradient-caregiver)", boxShadow: "0px 4px 18px rgba(240,161,180,0.35)" }}>
          <Heart className="w-8 h-8 text-white" />
        </div>
        <h1 className="mb-1 text-3xl" style={{ color: cn.text }}>{t("common:app.name")}</h1>
        <p className="text-sm" style={{ color: cn.textSecondary }}>{t("common:app.tagline")}</p>
      </div>

      <div className="w-full max-w-md finance-card p-8">
        {step === "credentials" && (
          <>
            <h2 className="text-2xl text-center mb-1" style={{ color: cn.text }}>{t("auth:login.title")}</h2>
            <p className="text-center text-sm mb-6" style={{ color: cn.textSecondary }}>Sign in with your email and password</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm mb-1.5" style={{ color: cn.text }}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: cn.textSecondary }} />
                  <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder="you@example.com" className="w-full pl-10 pr-4 py-3.5 rounded-xl border text-sm" style={{ background: cn.bgInput, borderColor: error ? "#EF4444" : cn.border, color: cn.text, fontSize: "16px" }} autoComplete="email" required />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm" style={{ color: cn.text }}>Password</label>
                  <Link to="/auth/forgot-password" className="text-xs hover:underline" style={{ color: cn.pink }}>Forgot password?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: cn.textSecondary }} />
                  <input type={showPwd ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} placeholder="Enter password" className="w-full pl-10 pr-10 py-3.5 rounded-xl border text-sm" style={{ background: cn.bgInput, borderColor: error ? "#EF4444" : cn.border, color: cn.text, fontSize: "16px" }} autoComplete="current-password" required />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: cn.textSecondary }}>{showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
                <p className="text-xs mt-1.5" style={{ color: cn.textSecondary }}>Demo: {DEMO_ACCOUNTS[0].email} / {DEMO_PASSWORD}</p>
              </div>
              {error && <p className="text-sm text-center py-2 px-3 rounded-lg" style={{ color: "#EF4444", background: "rgba(239,68,68,0.08)" }}>{error}</p>}
              <button type="submit" disabled={isLoading || !email || !password} className="w-full py-3.5 rounded-xl text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all cn-touch-target" style={{ background: "var(--cn-gradient-caregiver)", boxShadow: "0 4px 15px rgba(254,180,197,0.35)" }}>
                {isLoading ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <>{t("auth:login.loginBtn")}<ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px" style={{ background: cn.border }} />
              <span className="text-xs" style={{ color: cn.textSecondary }}>{t("auth:login.orContinue")}</span>
              <div className="flex-1 h-px" style={{ background: cn.border }} />
            </div>
            <div>
              <button onClick={() => setShowDemo(!showDemo)} className="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all cn-touch-target" style={{ borderColor: cn.border, color: cn.text }}>
                <span className="text-sm">{t("auth:login.demoAccess")}</span>
                {showDemo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showDemo && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs px-1" style={{ color: cn.textSecondary }}>{t("auth:login.demoHint")}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {DEMO_ACCOUNTS.map((acc) => (
                      <button key={acc.role} onClick={() => handleDemoLogin(acc.role)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all hover:shadow-sm cn-touch-target" style={{ borderColor: cn.border }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] shrink-0" style={{ background: roleGradients[acc.role] }}>{acc.role.charAt(0).toUpperCase()}</div>
                        <div className="min-w-0">
                          <p className="text-xs truncate" style={{ color: cn.text }}>{roleLabels[acc.role]}</p>
                          <p className="text-[10px] truncate" style={{ color: cn.textSecondary }}>{acc.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 text-center">
              <p className="text-sm" style={{ color: cn.textSecondary }}>
                {t("auth:login.noAccount")}{" "}
                <Link to="/auth/role-selection" className="hover:underline" style={{ color: cn.pink }}>{t("auth:login.signUp")}</Link>
              </p>
            </div>
          </>
        )}

        {step === "mfa" && (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(128,130,237,0.1)" }}>
                <Shield className="w-7 h-7" style={{ color: "#7B5EA7" }} />
              </div>
            </div>
            <h2 className="text-2xl text-center mb-1" style={{ color: cn.text }}>Two-Factor Authentication</h2>
            <p className="text-center text-sm mb-6" style={{ color: cn.textSecondary }}>
              {pendingUser?.name ? `Welcome back, ${pendingUser.name}! ` : ""}Enter the 6-digit code from your authenticator app
            </p>
            <div className="flex gap-2.5 justify-center mb-6" onPaste={handleTotpPaste}>
              {totp.map((digit, i) => (
                <input key={i} ref={(el) => { totpRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={(e) => handleTotpChange(e.target.value, i)} onKeyDown={(e) => handleTotpKeyDown(e, i)} className="w-12 h-14 text-center rounded-xl border text-xl transition-all focus:outline-none" style={{ borderColor: digit ? cn.pink : cn.border, color: cn.text, background: cn.bgInput, boxShadow: digit ? `0 0 0 2px ${cn.pinkBg}` : "none", fontSize: "20px" }} />
              ))}
            </div>
            <div className="p-3 rounded-lg text-xs text-center mb-4" style={{ background: "#FFF5F7", color: cn.textSecondary }}>
              Demo: use code <strong>{DEMO_TOTP}</strong>
            </div>
            {error && <p className="text-sm text-center mb-4 py-2 px-3 rounded-lg" style={{ color: "#EF4444", background: "rgba(239,68,68,0.08)" }}>{error}</p>}
            <button onClick={handleVerifyMfa} disabled={isLoading || totp.some((d) => !d)} className="w-full py-3.5 rounded-xl text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all cn-touch-target" style={{ background: "var(--cn-gradient-caregiver)", boxShadow: "0 4px 15px rgba(254,180,197,0.35)" }}>
              {isLoading ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : "Verify & Sign In"}
            </button>
            <button onClick={() => { setStep("credentials"); setTotp(["", "", "", "", "", ""]); setError(""); }} className="mt-3 w-full text-center text-sm hover:underline" style={{ color: cn.textSecondary }}>Back to login</button>
          </>
        )}

        {step === "role-select" && user && (
          <>
            <h2 className="text-2xl text-center mb-1" style={{ color: cn.text }}>{t("auth:roleSelection.title")}</h2>
            <p className="text-center text-sm mb-6" style={{ color: cn.textSecondary }}>Welcome back, {user.name}! {t("auth:roleSelection.subtitle")}</p>
            <div className="space-y-3">
              {user.roles.map((role) => (
                <button key={role} onClick={() => handleRoleSelect(role)} className="w-full flex items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-md cn-touch-target" style={{ borderColor: cn.border }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: roleGradients[role] }}>{roleLabels[role].charAt(0)}</div>
                  <div className="flex-1 text-left">
                    <p className="text-sm" style={{ color: cn.text }}>{roleLabels[role]}</p>
                    <p className="text-xs" style={{ color: cn.textSecondary }}>{t(`auth:roleSelection.${role}Desc`, { defaultValue: `Continue as ${roleLabels[role]}` })}</p>
                  </div>
                  <ArrowRight className="w-4 h-4" style={{ color: cn.textSecondary }} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-8 text-center text-xs" style={{ color: cn.textSecondary }}>
        <p>{t("common:app.name")} Platform v2.0</p>
      </div>
    </div>
  );
}
