import { useState } from "react";
import { Link } from "react-router";
import { useTransitionNavigate } from "@/frontend/hooks/useTransitionNavigate";
import { Heart, Shield } from "lucide-react";
import { cn } from "@/frontend/theme/tokens";
import { useAuth } from "@/frontend/auth/AuthContext";
import { isDemoUser } from "@/frontend/auth/mockAuth";
import { USE_SUPABASE } from "@/backend/services/supabase";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@/frontend/hooks";

export default function MFAVerifyPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.mfaVerify", "MFA Verify"));

  const navigate = useTransitionNavigate();
  const { user, verifyMfa } = useAuth();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isDemo = !USE_SUPABASE || (user != null && isDemoUser(user));

  const handleOtpChange = (val: string, idx: number) => {
    const n = [...otp]; n[idx] = val.replace(/\D/, "").slice(-1); setOtp(n);
    if (val && idx < 5) (document.getElementById(`verify-otp-${idx + 1}`) as HTMLInputElement)?.focus();
    if (n.every(v => v)) setError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) (document.getElementById(`verify-otp-${idx - 1}`) as HTMLInputElement)?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length !== 6) return;
    e.preventDefault();
    setOtp(pasted.split(""));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.some(v => !v)) { setError("Please enter all 6 digits."); return; }
    setLoading(true);
    setError("");

    const result = await verifyMfa(otp.join(""));

    if (result.success) {
      const role = result.user?.activeRole || user?.activeRole || "guardian";
      navigate(`/${role}/dashboard`);
    } else {
      const msg = result.error || "Invalid code";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: cn.bgPage }}>
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FEB4C5 0%, #DB869A 100%)", boxShadow: "0px 4px 18px rgba(240,161,180,0.35)" }}>
            <Heart className="w-7 h-7 text-white" />
          </div>
        </div>
        <div className="finance-card p-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(128,130,237,0.1)" }}>
            <Shield className="w-7 h-7" style={{ color: "#7B5EA7" }} />
          </div>
          <h1 className="text-2xl text-center mb-2" style={{ color: cn.text }}>Two-Factor Authentication</h1>
          <p className="text-center text-sm mb-6" style={{ color: cn.textSecondary }}>Enter the 6-digit code from your authenticator app (Google Authenticator, Authy, etc.)</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-2 justify-center">
              {otp.map((val, i) => (
                <input key={i} id={`verify-otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={val} onChange={(e) => handleOtpChange(e.target.value, i)} onKeyDown={(e) => handleKeyDown(e, i)} onPaste={i === 0 ? handlePaste : undefined} className="w-12 text-center border-2 rounded-xl text-xl outline-none transition-all" style={{ height: "3.25rem", borderColor: error ? "#EF4444" : val ? cn.pink : cn.border, color: cn.text, boxShadow: val ? `0 0 0 3px rgba(219,134,154,0.15)` : "none" }} />
              ))}
            </div>
            {error && <p className="text-center text-sm" style={{ color: "#EF4444" }}>{error}</p>}
            {/* Demo hint — only shown when using mock/demo auth */}
            {isDemo && (
              <div className="p-3 rounded-lg text-xs text-center" style={{ background: cn.bgInput, color: cn.textSecondary }}>
                Demo: use code <strong>123456</strong>
              </div>
            )}
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl text-white disabled:opacity-60" style={{ background: "radial-gradient(118.75% 157.07% at 34.74% -18.75%, #DB869A 0%, #8082ED 100%)", boxShadow: "-4px 30px 30px rgba(219,134,154,0.25)" }}>
              {loading ? "Verifying..." : "Verify & Sign In"}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: cn.textSecondary }}>
              <Link to="/auth/login" className="hover:underline" style={{ color: cn.pink }}>Back to login</Link>
            </p>
            <p className="text-sm mt-2" style={{ color: cn.textSecondary }}>
              Lost access to your authenticator?{" "}
              <Link to="/auth/forgot-password" className="hover:underline" style={{ color: cn.pink }}>Reset account</Link>
            </p>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: ".finance-card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }" }} />
    </div>
  );
}
