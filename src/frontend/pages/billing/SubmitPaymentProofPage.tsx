import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft, Upload, CreditCard, CheckCircle2, FileImage,
  Smartphone, Building2, Banknote, AlertCircle, Loader2, Save, Copy,
} from "lucide-react";
import { useAriaToast } from "@/frontend/hooks/useAriaToast";
import { cn } from "@/frontend/theme/tokens";
import { Button } from "@/frontend/components/ui/button";
import { PageHero } from "@/frontend/components/PageHero";
import { formatBDT } from "@/backend/utils/currency";
import { useAsyncData, useDocumentTitle, useFormDraft } from "@/frontend/hooks";
import { billingService } from "@/backend/services/billing.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import type { ManualPaymentMethod } from "@/backend/models";
import { useTranslation } from "react-i18next";

const METHODS: { id: ManualPaymentMethod; name: string; icon: React.ReactNode; color: string; bg: string; desc: string }[] = [
  { id: "bkash", name: "bKash", icon: <Smartphone className="w-5 h-5" />, color: "#D12053", bg: "rgba(209,32,83,0.08)", desc: "Mobile banking via bKash" },
  { id: "nagad", name: "Nagad", icon: <Smartphone className="w-5 h-5" />, color: "#ED6E1B", bg: "rgba(237,110,27,0.08)", desc: "Mobile banking via Nagad" },
  { id: "rocket", name: "Rocket", icon: <Smartphone className="w-5 h-5" />, color: "#8E24AA", bg: "rgba(142,36,170,0.08)", desc: "DBBL Mobile Banking" },
  { id: "bank_transfer", name: "Bank Transfer", icon: <Building2 className="w-5 h-5" />, color: "#37474F", bg: "rgba(55,71,79,0.08)", desc: "Direct bank transfer (NPSB)" },
  { id: "cash", name: "Cash Payment", icon: <Banknote className="w-5 h-5" />, color: "#2E7D32", bg: "rgba(46,125,50,0.08)", desc: "In-person cash payment" },
];

interface ProofFormData {
  method: ManualPaymentMethod | "";
  referenceNumber: string;
  notes: string;
  screenshotName: string;
}

export default function SubmitPaymentProofPage() {
  const { t } = useTranslation("common");
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.submitPaymentProof", "Submit Payment Proof"));

  const toast = useAriaToast();
  const navigate = useNavigate();
  const { invoiceId } = useParams();
  const { data: invoice, loading } = useAsyncData(() => billingService.getInvoiceById(invoiceId ?? ""), [invoiceId]);
  const { data: platformDetails } = useAsyncData(() => billingService.getPlatformPaymentDetails(), []);
  const { draft, isRestored, isSaving, updateDraft, clearDraft } = useFormDraft<ProofFormData>("payment-proof-" + invoiceId, "current-user");

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [step, setStep] = useState<"form" | "submitting" | "success">("form");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const form = draft ?? { method: "" as const, referenceNumber: "", notes: "", screenshotName: "" };

  if (loading || !invoice) return <PageSkeleton />;

  const selectedMethod = METHODS.find((m) => m.id === form.method);
  const isValid = form.method && form.referenceNumber.trim().length >= 5;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setStep("submitting");
    try {
      await billingService.submitPaymentProof({
        invoiceId: invoice.id,
        amount: invoice.total,
        method: form.method,
        referenceNumber: form.referenceNumber,
        notes: form.notes,
        screenshotFile,
      });
      await clearDraft();
      toast.success("Payment proof submitted successfully", {
        description: t("billing.platformVerifying", "CareNet Platform is verifying your payment."),
      });
      setStep("success");
    } catch {
      toast.error("Failed to submit payment proof", {
        description: "Please check your connection and try again.",
      });
      setStep("form");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshotFile(file);
      updateDraft({ screenshotName: file.name });
    }
  };

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: cn.bgPage }}>
        <div className="text-center max-w-sm mx-auto">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(95,184,101,0.1)" }}>
            <CheckCircle2 className="w-10 h-10" style={{ color: cn.green }} />
          </div>
          <h2 className="text-xl mb-2" style={{ color: cn.text }}>Payment Proof Submitted!</h2>
          <p className="text-sm mb-2" style={{ color: cn.textSecondary }}>
            Your payment proof for <span style={{ color: cn.text }}>{invoice.id}</span> is being verified by the {t("billing.platformName", "CareNet Platform")}.
          </p>
          <p className="text-sm mb-6" style={{ color: cn.textSecondary }}>
            You'll receive a notification once it's verified.
          </p>
          <div className="space-y-2 mb-6 text-left">
            {[
              { label: "Amount", value: formatBDT(invoice.total) },
              { label: "Method", value: selectedMethod?.name || form.method },
              { label: "Reference", value: form.referenceNumber },
              { label: "Invoice", value: invoice.id },
            ].map((r) => (
              <div key={r.label} className="flex justify-between text-sm py-2 border-b" style={{ borderColor: cn.borderLight }}>
                <span style={{ color: cn.textSecondary }}>{r.label}</span>
                <span style={{ color: cn.text }}>{r.value}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => navigate("/billing")}>Back to Billing</Button>
            <Button className="flex-1 rounded-xl" style={{ background: cn.green, color: "white" }} onClick={() => navigate("/billing")}>Done</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHero gradient="var(--cn-gradient-guardian)" className="pt-8 pb-32 px-6">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/70 hover:text-white text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-2xl text-white flex items-center gap-2"><Upload className="w-7 h-7" /> Submit Payment Proof</h1>
          <p className="text-white/70 text-sm mt-1">Invoice {invoice.id} — {invoice.description}</p>
        </div>
      </PageHero>

      <div className="max-w-2xl mx-auto px-6 -mt-20 space-y-6 pb-8">
        {isRestored && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: cn.amberBg }}>
            <Save className="w-4 h-4" style={{ color: cn.amber }} />
            <p className="text-sm" style={{ color: cn.amber }}>Draft restored from a previous session</p>
            {isSaving && <Loader2 className="w-3 h-3 animate-spin ml-auto" style={{ color: cn.amber }} />}
          </div>
        )}

        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 text-center" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.04)", border: "1px solid rgba(255,255,255,0.4)" }}>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: cn.textSecondary }}>Amount to Pay</p>
          <p className="text-3xl" style={{ color: cn.pink }}>{formatBDT(invoice.total)}</p>
          <p className="text-xs mt-1" style={{ color: cn.textSecondary }}>To: {t("billing.payToPlatform", "CareNet Platform")}</p>
        </div>

        {platformDetails && (platformDetails.bkash || platformDetails.bankAccount) && (
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.05)", border: "1px solid rgba(255,255,255,0.4)" }}>
            <h3 className="text-sm mb-4" style={{ color: cn.text }}>
              {t("billing.payInstructions", "Send payment to CareNet using one of the methods below, then upload your proof.")}
            </h3>
            {platformDetails.bkash && (
              <div className="flex items-center justify-between p-3 rounded-xl mb-3" style={{ background: cn.bgInput }}>
                <div>
                  <p className="text-xs" style={{ color: cn.textSecondary }}>{t("billing.platformBkashLabel", "bKash Number")}</p>
                  <p className="text-sm font-mono" style={{ color: cn.text }}>{platformDetails.bkash}</p>
                </div>
                <button
                  onClick={() => handleCopy(platformDetails.bkash, "bkash")}
                  className="p-2 rounded-lg"
                  style={{ background: cn.surface }}
                  title={t("billing.copyToClipboard", "Copy")}
                >
                  <Copy className="w-4 h-4" style={{ color: cn.textSecondary }} />
                </button>
              </div>
            )}
            {platformDetails.bankAccount && (
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: cn.bgInput }}>
                <div>
                  <p className="text-xs" style={{ color: cn.textSecondary }}>{t("billing.platformBankLabel", "Bank Account")}</p>
                  <p className="text-sm" style={{ color: cn.text }}>{platformDetails.bankName} — {platformDetails.bankAccount}</p>
                </div>
                <button
                  onClick={() => handleCopy(`${platformDetails.bankName} — ${platformDetails.bankAccount}`, "bank")}
                  className="p-2 rounded-lg"
                  style={{ background: cn.surface }}
                  title={t("billing.copyToClipboard", "Copy")}
                >
                  <Copy className="w-4 h-4" style={{ color: cn.textSecondary }} />
                </button>
              </div>
            )}
          </div>
        )}

        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.05)", border: "1px solid rgba(255,255,255,0.4)" }}>
          <h3 className="text-sm mb-4" style={{ color: cn.text }}>
            <CreditCard className="w-4 h-4 inline mr-2" style={{ color: cn.pink }} />
            Payment Method Used
          </h3>
          <div className="space-y-2">
            {METHODS.map((method) => (
              <button key={method.id} onClick={() => updateDraft({ method: method.id })}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all cn-touch-target"
                style={{ borderColor: form.method === method.id ? method.color : cn.border, background: form.method === method.id ? method.bg : "transparent" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: method.bg, color: method.color }}>
                  {method.icon}
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm" style={{ color: cn.text }}>{method.name}</p>
                  <p className="text-xs" style={{ color: cn.textSecondary }}>{method.desc}</p>
                </div>
                {form.method === method.id && <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: method.color }} />}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 space-y-5" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.05)", border: "1px solid rgba(255,255,255,0.4)" }}>
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: cn.textSecondary }}>
              Transaction Reference Number *
            </label>
            <input type="text" value={form.referenceNumber} onChange={(e) => updateDraft({ referenceNumber: e.target.value })}
              placeholder="e.g. TXN8A4F2K9X01" className="w-full px-4 py-3 rounded-xl border text-sm"
              style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput, fontSize: "16px" }} />
            <p className="text-xs mt-1" style={{ color: cn.textSecondary }}>
              Enter the transaction ID from your {selectedMethod?.name || "payment"} confirmation
            </p>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: cn.textSecondary }}>
              Payment Screenshot (Optional)
            </label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            <button onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed transition-all hover:bg-gray-50"
              style={{ borderColor: cn.border, color: cn.textSecondary }}>
              <FileImage className="w-5 h-5" />
              {form.screenshotName ? (
                <span className="text-sm" style={{ color: cn.text }}>{form.screenshotName}</span>
              ) : (
                <span className="text-sm">Tap to upload screenshot</span>
              )}
            </button>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: cn.textSecondary }}>
              Notes (Optional)
            </label>
            <textarea value={form.notes} onChange={(e) => updateDraft({ notes: e.target.value })}
              placeholder="Any additional details about this payment..."
              className="w-full px-4 py-3 rounded-xl border text-sm resize-none"
              rows={3} style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput, fontSize: "16px" }} />
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: cn.amberBg }}>
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: cn.amber }} />
          <div>
            <p className="text-sm" style={{ color: cn.amber }}>{t("billing.pendingAdminVerification", "Pending Admin Verification")}</p>
            <p className="text-xs mt-1" style={{ color: "#B8860B" }}>
              Your payment proof will be reviewed by the {t("billing.platformName", "CareNet Platform")}. Please ensure the reference number and amount are correct to avoid delays.
            </p>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={!isValid || step === "submitting"}
          className="w-full h-14 rounded-2xl text-white text-lg flex items-center justify-center gap-2 cn-touch-target disabled:opacity-50 transition-all"
          style={{ background: isValid ? cn.green : cn.border, boxShadow: isValid ? "0 10px 30px rgba(95,184,101,0.25)" : "none" }}>
          {step === "submitting" ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
          ) : (
            <><Upload className="w-5 h-5" /> Submit Payment Proof</>
          )}
        </button>

        {isSaving && (
          <p className="text-center text-xs flex items-center justify-center gap-1" style={{ color: cn.textSecondary }}>
            <Save className="w-3 h-3" /> Draft saved
          </p>
        )}
      </div>
    </div>
  );
}