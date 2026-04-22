import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useTransitionNavigate } from "@/frontend/hooks/useTransitionNavigate";
import { Heart, Shield, CheckCircle, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/frontend/auth/AuthContext";
import { cn } from "@/frontend/theme/tokens";
import { isDemoUser } from "@/frontend/auth/mockAuth";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@/frontend/hooks";
import { QRCodeSVG } from "qrcode.react";
import { USE_SUPABASE } from "@/backend/services/supabase";
import { isMfaRequired } from "@/frontend/auth/mfaConfig";

const DEMO_SECRET = "JBSWY3DPEHPK3PXP";

/** Format a plain secret into spaced groups of 4 for readability */
function spacedSecret(s: string): string {
  return s.replace(/(.{4})/g, "$1 ").trim();
}

/** Build an otpauth URI for mock/demo fallback */
function buildOtpauthUri(secret: string, account: string, issuer: string): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

export default function MFASetupPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.mfaSetup", "MFA Setup"));

  const navigate = useTransitionNavigate();
  const { user, enrollMfa, verifyMfa } = useAuth();

  useEffect(() => {
    if (!isMfaRequired()) navigate("/", { replace: true });
  }, [navigate]);

  const [step, setStep] = useState<"setup" | "verify" | "done">("setup");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showManual, setShowManual] = useState(false);

  // Enroll data — populated on mount
  const [factorId, setFactorId] = useState<string>("");
  const [qrDataUri, setQrDataUri] = useState<string>("");   // data URI from Supabase, or "" for SVG path
  const [secret, setSecret] = useState<string>(DEMO_SECRET);

  const accountName = user?.email || user?.name || "user@carenet.app";
  const issuer = "CareNet";

  const isDemo = !USE_SUPABASE || (user != null && isDemoUser(user));

  // ── Enroll on mount ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setEnrolling(true);
      const result = await enrollMfa();
      if (cancelled) return;
      if (result.success) {
        if (result.factorId) setFactorId(result.factorId);
        if (result.secret) setSecret(result.secret);
        // Supabase returns a ready-made data URI in qr_code; mock returns undefined
        if (result.qrCode) setQrDataUri(result.qrCode);
      } else {
        setError(result.error || "Failed to initialize MFA setup");
      }
      setEnrolling(false);
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // otpauth URI used only when Supabase didn't provide a data URI (mock fallback)
  const otpauthUri = buildOtpauthUri(secret, accountName, issuer);

  const handleCopy = async () => {
    await navigator.clipboard?.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOtpChange = (val: string, idx: number) => {
    const n = [...otp];
    n[idx] = val.replace(/\D/, "").slice(-1);
    setOtp(n);
    if (val && idx < 5) (document.getElementById(`mfa-otp-${idx + 1}`) as HTMLInputElement)?.focus();
  };

  const handleVerify = async () => {
    if (otp.some((v) => !v)) { setError("Enter all 6 digits"); return; }
    setLoading(true);
    setError("");

    const code = otp.join("");
    const result = await verifyMfa(code);

    if (result.success) {
      // Mark user mfaEnrolled locally if still in setup flow
      setStep("done");
    } else {
      const msg = result.error || "Invalid code";
      // Don't leak the demo hint when the user is on a real Supabase account
      setError(isDemo ? `${msg}` : msg);
    }
    setLoading(false);
  };

  const activeRole = user?.activeRole || "guardian";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-6" style={{ backgroundColor: cn.bgPage }}>
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FEB4C5 0%, #DB869A 100%)", boxShadow: "0px 4px 18px rgba(240,161,180,0.35)" }}>
            <Heart className="w-7 h-7 text-white" />
          </div>
        </div>

        <div className="finance-card p-6 md:p-8">
          {step === "setup" && (
            <>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(128,130,237,0.1)" }}>
                <Shield className="w-7 h-7" style={{ color: "#7B5EA7" }} />
              </div>
              <h1 className="text-2xl text-center mb-2" style={{ color: cn.text }}>Set Up Authenticator</h1>
              <p className="text-center text-sm mb-6" style={{ color: cn.textSecondary }}>Follow these steps to enable two-factor authentication</p>

              {enrolling ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: cn.pink, borderTopColor: "transparent" }} />
                </div>
              ) : (
                <>
                  {/* ── Step-by-step instructions ── */}
                  <div className="space-y-4 mb-6">
                    {/* Step 1 */}
                    <div className="flex gap-3">
                      <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: cn.pink }}>1</div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: cn.text }}>Open Google Authenticator on your phone</p>
                        <p className="text-xs" style={{ color: cn.textSecondary }}>Download from the App Store or Google Play if you don't have it</p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-3">
                      <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: cn.pink }}>2</div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: cn.text }}>Tap the <strong>+</strong> button to add a new account</p>
                        <p className="text-xs" style={{ color: cn.textSecondary }}>Choose <strong>"Scan a QR code"</strong> (recommended) or <strong>"Enter a setup key"</strong></p>
                      </div>
                    </div>

                    {/* Step 3 — QR code */}
                    <div className="flex gap-3">
                      <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: cn.pink }}>3</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-3" style={{ color: cn.text }}>Scan this QR code with your authenticator app:</p>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          {/* QR Code */}
                          <div className="bg-white rounded-2xl p-3 shadow-sm">
                            {qrDataUri ? (
                              /* Supabase returns a data URI — render as <img> */
                              <img src={qrDataUri} alt="MFA QR code" width={160} height={160} style={{ display: "block" }} />
                            ) : (
                              /* Mock/demo — generate from the otpauth URI */
                              <QRCodeSVG value={otpauthUri} size={160} level="M" includeMargin={false} />
                            )}
                          </div>

                          {/* Manual entry */}
                          <div className="flex-1 w-full">
                            <button
                              type="button"
                              onClick={() => setShowManual((v) => !v)}
                              className="flex items-center gap-2 text-xs font-medium w-full"
                              style={{ color: cn.pink }}
                            >
                              {showManual ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              Can't scan? Enter key manually
                            </button>

                            {showManual && (
                              <div className="mt-3 p-3 rounded-xl space-y-2" style={{ background: cn.bgInput }}>
                                <p className="text-xs font-medium" style={{ color: cn.text }}>Enter these details in Google Authenticator:</p>

                                <div className="space-y-1.5">
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider" style={{ color: cn.textSecondary }}>Account name</p>
                                    <p className="text-sm font-mono" style={{ color: cn.text }}>{accountName}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider" style={{ color: cn.textSecondary }}>Key</p>
                                    <div className="flex items-center gap-2">
                                      <code className="text-sm tracking-wider flex-1" style={{ color: cn.text }}>{spacedSecret(secret)}</code>
                                      <button type="button" onClick={handleCopy} aria-label="Copy secret key" className="p-1 rounded hover:bg-black/5 transition-colors shrink-0">
                                        <Copy className="w-3.5 h-3.5" style={{ color: copied ? cn.green : cn.textSecondary }} />
                                      </button>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider" style={{ color: cn.textSecondary }}>Type of key</p>
                                    <p className="text-sm" style={{ color: cn.text }}>
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded" style={{ background: "rgba(128,130,237,0.1)", color: "#7B5EA7" }}>
                                        Time-based
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex gap-3">
                      <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: cn.pink }}>4</div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: cn.text }}>Your authenticator will show a 6-digit code</p>
                        <p className="text-xs" style={{ color: cn.textSecondary }}>The code changes every 30 seconds — that's normal</p>
                      </div>
                    </div>
                  </div>

                  {/* Demo notice — only show for demo/mock users */}
                  {isDemo && (
                    <div className="p-3 rounded-lg text-xs text-center mb-4" style={{ background: "#FFF5F7", color: cn.textSecondary }}>
                      Demo mode: use code <strong>123456</strong> to verify
                    </div>
                  )}

                  {error && <p className="text-center text-sm mb-4" style={{ color: "#EF4444" }}>{error}</p>}

                  <button onClick={() => setStep("verify")} className="w-full py-3 rounded-xl text-white font-medium" style={{ background: "radial-gradient(118.75% 157.07% at 34.74% -18.75%, #DB869A 0%, #8082ED 100%)" }}>
                    I've added the account — Verify
                  </button>
                </>
              )}
            </>
          )}

          {step === "verify" && (
            <>
              <h1 className="text-2xl text-center mb-2" style={{ color: cn.text }}>Verify Setup</h1>
              <p className="text-center text-sm mb-6" style={{ color: cn.textSecondary }}>Enter the 6-digit code shown in your authenticator app</p>
              <div className="flex gap-2 justify-center mb-6">
                {otp.map((v, i) => (
                  <input key={i} id={`mfa-otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={v} onChange={(e) => handleOtpChange(e.target.value, i)} className="w-11 h-12 text-center border-2 rounded-xl text-lg outline-none transition-all" style={{ borderColor: v ? cn.pink : cn.border, color: cn.text, background: cn.bgInput }} />
                ))}
              </div>
              {error && <p className="text-center text-sm mb-4" style={{ color: "#EF4444" }}>{error}</p>}
              <button onClick={handleVerify} disabled={loading} className="w-full py-3 rounded-xl text-white font-medium disabled:opacity-60" style={{ background: "radial-gradient(118.75% 157.07% at 34.74% -18.75%, #DB869A 0%, #8082ED 100%)" }}>
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
              <button onClick={() => navigate(`/${activeRole}/dashboard`, { replace: true })} className="w-full py-3 rounded-xl text-white font-medium" style={{ background: "radial-gradient(118.75% 157.07% at 34.74% -18.75%, #DB869A 0%, #8082ED 100%)" }}>
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
