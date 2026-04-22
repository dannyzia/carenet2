import { useState, useMemo, useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { useTransitionNavigate } from "@/frontend/hooks/useTransitionNavigate";
import { Heart, ArrowLeft, Eye, EyeOff, User, Mail, Lock, Phone, CheckCircle, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@/frontend/hooks";
import { cn } from "@/frontend/theme/tokens";
import { useAuth } from "@/frontend/auth/AuthContext";
import { USE_SUPABASE, supabase } from "@/backend/services/supabase";
import { getAuthEmailRedirectTo } from "@/frontend/auth/authEmailRedirect";
import { getMyChanPProfile, type ChanPProfile } from "@/backend/services/channelPartnerService";
import type { Role } from "@/frontend/auth/types";

const roleConfig: Record<string, { label: string; color: string; gradient: string }> = {
  guardian: { label: "Guardian", color: "#FF8FA3", gradient: "var(--cn-gradient-caregiver)" },
  caregiver: { label: "Caregiver", color: "#7CE577", gradient: "var(--cn-gradient-guardian)" },
  patient: { label: "Patient", color: "#8B7AE8", gradient: "linear-gradient(135deg, #B8A7FF, #8B7AE8)" },
  agency: { label: "Agency Owner", color: "#5B9FFF", gradient: "linear-gradient(135deg, #8EC5FC, #5B9FFF)" },
  shop: { label: "Shop Owner", color: "#E64A19", gradient: "linear-gradient(135deg, #FFAB91, #E64A19)" },
  channel_partner: { label: "Channel Partner", color: "#FFA726", gradient: "linear-gradient(135deg, #FFB74D, #FFA726)" },
};

export default function RegisterPage() {
  const { role } = useParams<{ role: string }>();
  const navigate = useTransitionNavigate();
  const { t } = useTranslation(["auth", "common"]);
  useDocumentTitle(t("common:pageTitles.register", "Register"));
  const { register } = useAuth();
  const [step, setStep] = useState<"form" | "done">("form");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sent" | "rate-limited">("idle");
  const [searchParams] = useSearchParams();
  const isReapplying = searchParams.get("reapply") === "true";
  const [cpProfile, setCpProfile] = useState<ChanPProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const resolvedRole: Role = (role as Role) || "guardian";
  const config = roleConfig[resolvedRole] || roleConfig.guardian;

  useEffect(() => {
    async function loadExistingProfile() {
      if (isReapplying && resolvedRole === "channel_partner") {
        setLoadingProfile(true);
        try {
          const profile = await getMyChanPProfile();
          if (profile && profile.status === "rejected") {
            setCpProfile(profile);
            setFormData({
              name: profile.business_name || "",
              phone: profile.phone || "",
            });
          }
        } catch (err) {
          console.error("Failed to load existing CP profile for reapplication:", err);
        } finally {
          setLoadingProfile(false);
        }
      }
    }
    loadExistingProfile();
  }, [isReapplying, resolvedRole]);

  const password = formData.password || "";
  const confirmPwd = formData.confirmPassword || "";

  const pwdChecks = useMemo(() => [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter", met: /[a-z]/.test(password) },
    { label: "One number", met: /\d/.test(password) },
    { label: "Passwords match", met: password.length > 0 && password === confirmPwd },
  ], [password, confirmPwd]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((formData.email || "").toLowerCase().endsWith("@carenet.demo")) {
      setError("Demo accounts are pre-configured — use the demo login on the Sign In page instead.");
      return;
    }
    const failed = pwdChecks.find((c) => !c.met);
    if (failed) {
      setError(failed.label);
      return;
    }
    setLoading(true);
    setError("");
    const result = await register({
      name: formData.name || "New User",
      email: formData.email || "",
      password: formData.password || "",
      phone: formData.phone,
      role: resolvedRole,
      roleData: {
        referralCode: formData.referralCode,
      },
    });
    setLoading(false);
    if (result.success) {
      if (result.signedInWithoutEmailConfirmation) {
        navigate(`/${resolvedRole}/dashboard`, { replace: true });
        return;
      }
      setRegisteredEmail(formData.email || "");
      setStep("done");
    } else {
      setError(result.error || "Registration failed");
    }
  };

  const handleContinue = () => {
    navigate("/auth/login", { replace: true });
  };

  const handleResendConfirmation = async () => {
    if (!registeredEmail || resending) return;
    setResending(true);
    setResendStatus("idle");
    const redirectTo = getAuthEmailRedirectTo();
    const { error: resendErr } = await supabase.auth.resend({
      type: "signup",
      email: registeredEmail,
      options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
    });
    setResending(false);
    if (resendErr) {
      if (resendErr.message.toLowerCase().includes("rate limit") || resendErr.status === 429) {
        setResendStatus("rate-limited");
      } else {
        setResendStatus("rate-limited");
      }
    } else {
      setResendStatus("sent");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: cn.bgPage }}>
      <div className="w-full max-w-md mb-6 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: config.gradient, boxShadow: `0px 4px 18px ${config.color}50` }}>
          <Heart className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl mb-1" style={{ color: cn.text }}>
          {isReapplying ? `Reapply as ${config.label}` : `Register as ${config.label}`}
        </h1>
        <p className="text-sm" style={{ color: cn.textSecondary }}>
          {isReapplying ? "Update your application details" : "Create your CareNet account"}
        </p>
      </div>

      {isReapplying && cpProfile && (
        <div className="w-full max-w-md mb-4 rounded-lg p-4" style={{ backgroundColor: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
          <p className="text-sm font-medium mb-2" style={{ color: cn.red }}>Previous application was rejected</p>
          {cpProfile.rejectionReason && (
            <p className="text-xs mb-2" style={{ color: cn.textSecondary }}>
              <span className="font-medium">Reason:</span> {cpProfile.rejectionReason}
            </p>
          )}
          <p className="text-xs" style={{ color: cn.textSecondary }}>
            Please update your information and submit a new application.
          </p>
        </div>
      )}

      <div className="w-full max-w-md finance-card p-8">
        {step === "form" && (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1" style={{ color: cn.text }}>Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: cn.textSecondary }} />
                <input type="text" placeholder="Your full name" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput, fontSize: "16px" }} required />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: cn.text }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: cn.textSecondary }} />
                <input type="email" placeholder="you@example.com" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput, fontSize: "16px" }} autoComplete="email" required />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: cn.text }}>Phone Number (Optional)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: cn.textSecondary }} />
                <input type="tel" placeholder="+880 1XXXXXXXXX" value={formData.phone || ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput, fontSize: "16px" }} />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: cn.text }}>{t("auth:register.referralCode", "Referral Code (optional)")}</label>
              <input type="text" placeholder={t("auth:register.referralCodePlaceholder", "Enter referral code")} value={formData.referralCode || ""} onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput, fontSize: "16px" }} />
            </div>
            {(role === "agency" || role === "shop") && (
              <div>
                <label className="block text-sm mb-1" style={{ color: cn.text }}>{role === "agency" ? "Agency Name" : "Shop Name"}</label>
                <input type="text" placeholder={role === "agency" ? "Your agency name" : "Your shop name"} value={formData.orgName || ""} onChange={(e) => setFormData({ ...formData, orgName: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput, fontSize: "16px" }} required />
              </div>
            )}
            <div>
              <label className="block text-sm mb-1" style={{ color: cn.text }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: cn.textSecondary }} />
                <input type={showPwd ? "text" : "password"} placeholder="Create a password" value={password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full pl-10 pr-10 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput, fontSize: "16px" }} autoComplete="new-password" required />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: cn.textSecondary }}>{showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: cn.text }}>Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: cn.textSecondary }} />
                <input type={showConfirmPwd ? "text" : "password"} placeholder="Re-enter your password" value={confirmPwd} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="w-full pl-10 pr-10 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput, fontSize: "16px" }} autoComplete="new-password" required />
                <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: cn.textSecondary }}>{showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>
            {(password.length > 0 || confirmPwd.length > 0) && (
              <div className="space-y-1.5 px-1">
                {pwdChecks.map((c) => (
                  <div key={c.label} className="flex items-center gap-2 text-xs" style={{ color: c.met ? cn.green : cn.textSecondary }}>
                    <Check className={c.met ? "w-3.5 h-3.5" : "w-3.5 h-3.5 opacity-30"} />
                    <span>{c.label}</span>
                  </div>
                ))}
              </div>
            )}
            {error && (
              <div className="text-sm text-center py-2 px-3 rounded-lg" style={{ color: "#EF4444", background: "rgba(239,68,68,0.08)" }}>
                <p>{error}</p>
                {(error.toLowerCase().includes("rate limit") || error.toLowerCase().includes("already registered") || error.toLowerCase().includes("sign in")) && (
                  <button type="button" onClick={() => navigate("/auth/login")} className="mt-2 text-xs font-medium underline underline-offset-2" style={{ color: cn.pink }}>
                    Go to Sign In
                  </button>
                )}
              </div>
            )}
            <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl text-white flex items-center justify-center gap-2 disabled:opacity-50 cn-touch-target" style={{ background: config.gradient }}>
              {loading ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : "Create Account"}
            </button>
          </form>
        )}

        {step === "done" && (
          <div className="text-center space-y-5">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: cn.greenBg }}>
              <CheckCircle className="w-8 h-8" style={{ color: cn.green }} />
            </div>
            <div>
              <h2 className="text-xl mb-2" style={{ color: cn.text }}>Account Created!</h2>
              <p className="text-sm" style={{ color: cn.textSecondary }}>
                Welcome to CareNet as a {config.label}.
              </p>
            </div>
            {USE_SUPABASE && (
              <div className="rounded-xl p-4 text-left space-y-3" style={{ background: cn.bgInput, border: `1px solid ${cn.border}` }}>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 shrink-0" style={{ color: cn.pink }} />
                  <p className="text-sm font-medium" style={{ color: cn.text }}>Check your email to confirm</p>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: cn.textSecondary }}>
                  We sent a confirmation link to{" "}
                  <span className="font-medium" style={{ color: cn.text }}>{registeredEmail}</span>.
                  {" "}Open that email and click the link — then come back here to sign in.
                </p>
                <p className="text-xs" style={{ color: cn.textSecondary }}>
                  Don't see it? Check your <strong>spam / junk</strong> folder first.
                </p>
                <div className="pt-1 border-t" style={{ borderColor: cn.border }}>
                  {resendStatus === "sent" && (
                    <p className="text-xs text-center" style={{ color: cn.green }}>✓ Confirmation email resent — check your inbox.</p>
                  )}
                  {resendStatus === "rate-limited" && (
                    <p className="text-xs text-center" style={{ color: "#F59E0B" }}>
                      Too many resend attempts. Please wait a few minutes before trying again.
                    </p>
                  )}
                  {resendStatus === "idle" && (
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={resending}
                      className="w-full text-xs py-2 rounded-lg border transition-all disabled:opacity-50"
                      style={{ borderColor: cn.border, color: cn.textSecondary }}
                    >
                      {resending ? "Sending…" : "Resend confirmation email"}
                    </button>
                  )}
                </div>
              </div>
            )}
            <button onClick={handleContinue} className="w-full py-3.5 rounded-xl text-white cn-touch-target" style={{ background: config.gradient }}>
              Go to Sign In
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm" style={{ color: cn.textSecondary }}>
          Already have an account?{" "}
          <Link to="/auth/login" className="hover:underline" style={{ color: cn.pink }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
