import { useState } from "react";
import { Link } from "react-router";
import { useTransitionNavigate } from "@/frontend/hooks/useTransitionNavigate";
import { Heart, Shield, CheckCircle, Copy } from "lucide-react";
import { useAuth } from "@/frontend/auth/AuthContext";
import { cn } from "@/frontend/theme/tokens";
import { DEMO_TOTP } from "@/frontend/auth/mockAuth";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@/frontend/hooks";

export default function MFASetupPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.mfaSetup", "MFA Setup"));

  const navigate = useTransitionNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<"setup" | "verify" | "done">("setup");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const demoSecret = "JBSW Y3DP EHPK 3PXP";

  const handleCopy = async () => {
    await navigator.clipboard?.writeText(demoSecret.replace(/\s/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOtpChange = (val: string, idx: number) => {
    const n = [...otp]; n[idx] = val.replace(/\D/, "").slice(-1); setOtp(n);
    if (val && idx < 5) (document.getElementById(`mfa-otp-${idx + 1}`) as HTMLInputElement)?.focus();
  };

  const handleVerify = () => {
    if (otp.some(v => !v)) { setError("Enter all 6 digits"); return; }
    setLoading(true);
    setError("");
    setTimeout(() => {
      if (otp.join("") === DEMO_TOTP) { setStep("done"); }
      else { setError(`Invalid code. Demo: use ${DEMO_TOTP}`); }
      setLoading(false);
    }, 1000);
  };

  const activeRole = user?.activeRole || "guardian";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: cn.bgPage }}>
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FEB4C5 0%, #DB869A 100%)", boxShadow: "0px 4px 18px rgba(240,161,180,0.35)" }}>
            <Heart className="w-7 h-7 text-white" />
          </div>
        </div>

        <div className="finance-card p-8">
          {step === "setup" && (
            <>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(128,130,237,0.1)" }}>
                <Shield className="w-7 h-7" style={{ color: "#7B5EA7" }} />
              </div>
              <h1 className="text-2xl text-center mb-2" style={{ color: cn.text }}>Set Up Authenticator</h1>
              <p className="text-center text-sm mb-6" style={{ color: cn.textSecondary }}>Scan the QR code with Google Authenticator, Authy, or any TOTP app</p>

              {/* QR Code placeholder */}
              <div className="w-48 h-48 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: cn.bgInput }}>
                <div className="text-center">
                  <Shield className="w-12 h-12 mx-auto mb-2" style={{ color: cn.border }} />
                  <p className="text-xs" style={{ color: cn.textSecondary }}>QR Code</p>
                  <p className="text-[10px]" style={{ color: cn.textSecondary }}>(Live QR with Supabase)</p>
                </div>
              </div>

              {/* Manual secret key */}
              <p className="text-xs text-center mb-2" style={{ color: cn.textSecondary }}>Or enter this key manually:</p>
              <div className="p-3 rounded-xl flex items-center justify-between mb-6" style={{ background: cn.bgInput }}>
                <code className="text-sm tracking-wider" style={{ color: cn.text }}>{demoSecret}</code>
                <button type="button" onClick={handleCopy} aria-label="Copy secret key" className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
                  <Copy className="w-4 h-4" style={{ color: copied ? cn.green : cn.textSecondary }} />
                </button>
              </div>

              <div className="p-3 rounded-lg text-xs text-center mb-4" style={{ background: "#FFF5F7", color: cn.textSecondary }}>
                Demo: use code <strong>{DEMO_TOTP}</strong> to verify
              </div>

              <button onClick={() => setStep("verify")} className="w-full py-3 rounded-xl text-white" style={{ background: "radial-gradient(118.75% 157.07% at 34.74% -18.75%, #DB869A 0%, #8082ED 100%)" }}>
                I've added the key
              </button>
            </>
          )}

          {step === "verify" && (
            <>
              <h1 className="text-2xl text-center mb-2" style={{ color: cn.text }}>Verify Setup</h1>
              <p className="text-center text-sm mb-6" style={{ color: cn.textSecondary }}>Enter the 6-digit code from your authenticator app</p>
              <div className="flex gap-2 justify-center mb-6">
                {otp.map((v, i) => (
                  <input key={i} id={`mfa-otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={v} onChange={(e) => handleOtpChange(e.target.value, i)} className="w-11 h-12 text-center border-2 rounded-xl text-lg outline-none transition-all" style={{ borderColor: v ? cn.pink : cn.border, color: cn.text, background: cn.bgInput }} />
                ))}
              </div>
              {error && <p className="text-center text-sm mb-4" style={{ color: "#EF4444" }}>{error}</p>}
              <button onClick={handleVerify} disabled={loading} className="w-full py-3 rounded-xl text-white disabled:opacity-60" style={{ background: "radial-gradient(118.75% 157.07% at 34.74% -18.75%, #DB869A 0%, #8082ED 100%)" }}>
                {loading ? "Verifying..." : "Verify & Enable"}
              </button>
              <button onClick={() => setStep("setup")} className="mt-3 w-full text-center text-sm hover:underline" style={{ color: cn.textSecondary }}>Back</button>
            </>
          )}

          {step === "done" && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: cn.greenBg }}>
                <CheckCircle className="w-8 h-8" style={{ color: cn.green }} />
              </div>
              <h2 className="text-xl mb-2" style={{ color: cn.text }}>Authenticator Enabled!</h2>
              <p className="text-sm mb-6" style={{ color: cn.textSecondary }}>Your account is now protected with two-factor authentication via Google Authenticator.</p>
              <button onClick={() => navigate(`/${activeRole}/dashboard`, { replace: true })} className="w-full py-3 rounded-xl text-white" style={{ background: "radial-gradient(118.75% 157.07% at 34.74% -18.75%, #DB869A 0%, #8082ED 100%)" }}>
                Continue to Dashboard
              </button>
            </div>
          )}
        </div>

        {step !== "done" && (
          <p className="mt-6 text-center text-sm" style={{ color: cn.textSecondary }}>
            <Link to={`/${activeRole}/dashboard`} className="hover:underline" style={{ color: cn.pink }}>Skip for now</Link>
          </p>
        )}
      </div>
    </div>
  );
}