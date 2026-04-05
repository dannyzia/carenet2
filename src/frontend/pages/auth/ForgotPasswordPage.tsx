import { Mail, Heart, CheckCircle, Phone, Search } from "lucide-react";
import { cn } from "@/frontend/theme/tokens";
import { Link } from "react-router";
import { useState } from "react";
import { useAuth } from "@/frontend/auth/AuthContext";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@/frontend/hooks";
import { USE_SUPABASE, supabase } from "@/backend/services/supabase";

type Tab = "email" | "phone";

export default function ForgotPasswordPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.forgotPassword", "Forgot Password"));

  const { forgotPassword } = useAuth();
  const [tab, setTab] = useState<Tab>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [foundEmail, setFoundEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await forgotPassword(email);
    setLoading(false);
    if (result.success) {
      setSent(true);
    } else {
      setError(result.error || "Failed to send reset email");
    }
  };

  const handlePhoneSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    
    setLoading(true);
    setError("");
    
    try {
      // Query profiles by phone number
      const { data: profiles, error: queryErr } = await supabase
        .from("profiles")
        .select("email, name")
        .eq("phone", phone.trim())
        .limit(1);
      
      if (queryErr) throw queryErr;
      
      if (!profiles || profiles.length === 0) {
        setError("No account found with this phone number");
        setLoading(false);
        return;
      }
      
      const profile = profiles[0];
      const foundEmail = profile.email;
      setFoundEmail(foundEmail);
      
      // Send password reset to the found email
      const result = await forgotPassword(foundEmail);
      setLoading(false);
      
      if (result.success) {
        setSent(true);
      } else {
        setError(result.error || "Failed to send reset email");
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Failed to find account");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: cn.bgPage }}>
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FEB4C5 0%, #DB869A 100%)", boxShadow: "0px 4px 18px rgba(240,161,180,0.35)" }}><Heart className="w-7 h-7 text-white" /></div>
        </div>
        <div className="finance-card p-8">
          {!sent ? (
            <>
              <h1 className="text-2xl text-center mb-2" style={{ color: cn.text }}>Forgot Password?</h1>
              
              {/* Tab Switcher */}
              <div className="flex rounded-xl border mb-6" style={{ borderColor: cn.border }}>
                <button onClick={() => { setTab("email"); setError(""); }} className={`flex-1 py-2.5 text-sm font-medium rounded-l-xl transition-all ${tab === "email" ? "text-white" : ""}`} style={{ background: tab === "email" ? "var(--cn-gradient-caregiver)" : "transparent", color: tab === "email" ? "#FFF" : cn.text }}>
                  <Mail className="w-4 h-4 inline mr-2" />
                  By Email
                </button>
                <button onClick={() => { setTab("phone"); setError(""); }} className={`flex-1 py-2.5 text-sm font-medium rounded-r-xl transition-all ${tab === "phone" ? "text-white" : ""}`} style={{ background: tab === "phone" ? "var(--cn-gradient-caregiver)" : "transparent", color: tab === "phone" ? "#FFF" : cn.text }}>
                  <Phone className="w-4 h-4 inline mr-2" />
                  By Phone
                </button>
              </div>
              
              {/* Email Tab */}
              {tab === "email" && (
                <form onSubmit={handleEmailSubmit} className="space-y-5">
                  <p className="text-center text-sm mb-4" style={{ color: cn.textSecondary }}>Enter your registered email. We'll send a password reset link.</p>
                  <div>
                    <label className="block text-sm mb-1.5" style={{ color: cn.text }}>Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: cn.textSecondary }} />
                      <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput, fontSize: "16px" }} autoComplete="email" required />
                    </div>
                  </div>
                  {error && <p className="text-sm text-center py-2 px-3 rounded-lg" style={{ color: "#EF4444", background: "rgba(239,68,68,0.08)" }}>{error}</p>}
                  <button type="submit" disabled={loading} className="w-full py-3 rounded-xl text-white transition-opacity disabled:opacity-70" style={{ background: "radial-gradient(118.75% 157.07% at 34.74% -18.75%, #DB869A 0%, #8082ED 100%)", boxShadow: "-4px 30px 30px rgba(219,134,154,0.25)" }}>{loading ? "Sending..." : "Send Reset Link"}</button>
                </form>
              )}
              
              {/* Phone Tab */}
              {tab === "phone" && (
                <form onSubmit={handlePhoneSearch} className="space-y-5">
                  <p className="text-center text-sm mb-4" style={{ color: cn.textSecondary }}>Enter your phone number to find your account.</p>
                  <div>
                    <label className="block text-sm mb-1.5" style={{ color: cn.text }}>Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: cn.textSecondary }} />
                      <input type="tel" placeholder="+880 1XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput, fontSize: "16px" }} autoComplete="tel" required />
                    </div>
                  </div>
                  {error && <p className="text-sm text-center py-2 px-3 rounded-lg" style={{ color: "#EF4444", background: "rgba(239,68,68,0.08)" }}>{error}</p>}
                  <button type="submit" disabled={loading} className="w-full py-3 rounded-xl text-white transition-opacity disabled:opacity-70" style={{ background: "radial-gradient(118.75% 157.07% at 34.74% -18.75%, #DB869A 0%, #8082ED 100%)", boxShadow: "-4px 30px 30px rgba(219,134,154,0.25)" }}>{loading ? "Finding..." : "Find My Account"}</button>
                </form>
              )}
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#7CE57720" }}><CheckCircle className="w-8 h-8" style={{ color: cn.green }} /></div>
              <h2 className="text-xl mb-2" style={{ color: cn.text }}>Check Your Email</h2>
              <p className="text-sm mb-6" style={{ color: cn.textSecondary }}>
                We've sent a password reset link to <strong>{tab === "phone" ? foundEmail : email}</strong>. 
                Click the link in the email to set a new password.
              </p>
              <p className="text-xs" style={{ color: cn.textSecondary }}>Didn't receive it? Check your spam folder, or <button onClick={() => { setSent(false); setEmail(""); setPhone(""); setFoundEmail(""); }} className="hover:underline" style={{ color: cn.pink }}>try again</button>.</p>
            </div>
          )}
          <p className="mt-6 text-center text-sm" style={{ color: cn.textSecondary }}>Remember your password?{" "}<Link to="/auth/login" className="hover:underline" style={{ color: cn.pink }}>Sign In</Link></p>
        </div>
      </div>
    </div>
  );
}