import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router";
import { useTransitionNavigate } from "@/frontend/hooks/useTransitionNavigate";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@/frontend/hooks";
import { cn } from "@/frontend/theme/tokens";
import { useAuth } from "@/frontend/auth/AuthContext";
import { USE_SUPABASE, supabase } from "@/backend/services/supabase";
import { getAuthEmailRedirectTo } from "@/frontend/auth/authEmailRedirect";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/frontend/auth/mockAuth";
import type { Role } from "@/frontend/auth/types";

type Step = "credentials" | "role-select";

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
  const { login, demoLogin, user, isAuthenticated } = useAuth();

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDemo, setShowDemo] = useState(false);

  const returnTo = (location.state as any)?.from || null;

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const params = new URLSearchParams(hash.slice(1));
    const errCode = params.get("error_code");
    const errDesc = params.get("error_description");
    if (errCode) {
      if (errCode === "otp_expired") {
        setError(t("auth:login.linkExpired"));
      } else if (errDesc) {
        setError(decodeURIComponent(errDesc.replace(/\+/g, " ")));
      } else {
        setError(t("auth:login.confirmFailed"));
      }
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

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
      if (result.user) {
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

  const handleGoogleLogin = async () => {
    if (!USE_SUPABASE) {
      setError("Google login is not available in demo mode");
      return;
    }
    setError("");
    setIsLoading(true);
    const { error: googleErr } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setIsLoading(false);
    if (googleErr) {
      setError(googleErr.message);
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

  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "rate-limited">("idle");
  const [showResend, setShowResend] = useState(false);

  const handleResendConfirmation = async () => {
    const target = resendEmail.trim() || email.trim();
    if (!target) return;
    setResendStatus("sending");
    const redirectTo = getAuthEmailRedirectTo();
    const { error: resendErr } = await supabase.auth.resend({
      type: "signup",
      email: target,
      options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
    });
    if (resendErr) {
      setResendStatus(resendErr.status === 429 || resendErr.message.toLowerCase().includes("rate") ? "rate-limited" : "rate-limited");
    } else {
      setResendStatus("sent");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: cn.bgPage }}>
      <div className="w-full max-w-md mb-8 text-center">
        <img src="/logo.png" alt="" className="w-16 h-16 rounded-2xl object-contain mx-auto mb-4" width={64} height={64} />
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
                <label htmlFor="carenet-login-email" className="block text-sm mb-1.5" style={{ color: cn.text }}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: cn.textSecondary }} aria-hidden />
                  <input id="carenet-login-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder="you@example.com" className="w-full pl-10 pr-4 py-3.5 rounded-xl border text-sm" style={{ background: cn.bgInput, borderColor: error ? "#EF4444" : cn.border, color: cn.text, fontSize: "16px" }} autoComplete="email" required />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="carenet-login-password" className="block text-sm" style={{ color: cn.text }}>Password</label>
                  <Link to="/auth/forgot-password" className="text-xs underline-offset-2 hover:underline" style={{ color: cn.pink }}>{t("auth:login.forgotPassword")}</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: cn.textSecondary }} aria-hidden />
                  <input id="carenet-login-password" type={showPwd ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} placeholder="Enter password" className="w-full pl-10 pr-10 py-3.5 rounded-xl border text-sm" style={{ background: cn.bgInput, borderColor: error ? "#EF4444" : cn.border, color: cn.text, fontSize: "16px" }} autoComplete="current-password" required />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: cn.textSecondary }}
                    aria-label={showPwd ? t("auth:login.hidePassword") : t("auth:login.showPassword")}
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" aria-hidden /> : <Eye className="w-4 h-4" aria-hidden />}
                  </button>
                 </div>
               </div>
               {error && (
                 <div className="text-sm text-center py-2 px-3 rounded-lg" style={{ color: "#EF4444", background: "rgba(239,68,68,0.08)" }}>
                   <p>{error}</p>
                 </div>
               )}
              <button type="submit" disabled={isLoading || !email || !password} className="w-full py-3.5 rounded-xl text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all cn-touch-target" style={{ background: "var(--cn-gradient-caregiver)", boxShadow: "0 4px 15px rgba(254,180,197,0.35)" }}>
                {isLoading ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <>{t("auth:login.loginBtn")}<ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
            {USE_SUPABASE && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => { setShowResend(!showResend); setResendStatus("idle"); }}
                  className="w-full text-xs text-center py-2 hover:underline"
                  style={{ color: cn.textSecondary }}
                >
                  Didn't receive a confirmation email?
                </button>
                {showResend && (
                  <div className="mt-2 rounded-xl p-4 space-y-3" style={{ background: cn.bgInput, border: `1px solid ${cn.border}` }}>
                    <p className="text-xs" style={{ color: cn.textSecondary }}>
                      Enter the email you signed up with and we'll resend the confirmation link.
                    </p>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={resendEmail || email}
                      onChange={(e) => setResendEmail(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border text-sm"
                      style={{ background: cn.bgPage, borderColor: cn.border, color: cn.text, fontSize: "16px" }}
                    />
                    {resendStatus === "sent" && (
                      <p className="text-xs text-center" style={{ color: cn.green }}>✓ Confirmation email sent — check your inbox and spam folder.</p>
                    )}
                    {resendStatus === "rate-limited" && (
                      <p className="text-xs text-center" style={{ color: "#F59E0B" }}>Too many attempts. Please wait a few minutes and try again.</p>
                    )}
                    {(resendStatus === "idle" || resendStatus === "sending") && (
                      <button
                        type="button"
                        onClick={handleResendConfirmation}
                        disabled={resendStatus === "sending" || !(resendEmail.trim() || email.trim())}
                        className="w-full py-2.5 rounded-lg text-white text-sm disabled:opacity-50 transition-all"
                        style={{ background: cn.pink }}
                      >
                        {resendStatus === "sending" ? "Sending…" : "Resend confirmation email"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px" style={{ background: cn.border }} />
              <span className="text-xs" style={{ color: cn.textSecondary }}>{t("auth:login.orContinue")}</span>
              <div className="flex-1 h-px" style={{ background: cn.border }} />
            </div>
            {USE_SUPABASE && (
              <button onClick={handleGoogleLogin} disabled={isLoading} className="w-full py-3.5 rounded-xl border flex items-center justify-center gap-3 disabled:opacity-50 transition-all cn-touch-target" style={{ borderColor: cn.border, color: cn.text }}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.96 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.38 8.55 1 10.22 1 12s.38 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.96 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm font-medium">{t("auth:login.continueWithGoogle")}</span>
              </button>
            )}
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
                <Link
                  to="/auth/role-selection"
                  className="font-medium underline underline-offset-2 decoration-1 hover:opacity-90"
                  style={{ color: cn.pink }}
                >
                  {t("auth:login.signUp")}
                </Link>
              </p>
            </div>
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
