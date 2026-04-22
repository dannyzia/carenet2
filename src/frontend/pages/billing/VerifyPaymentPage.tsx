import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, CreditCard, FileText,
  User, Calendar, Hash, MessageSquare, AlertCircle, Loader2,
  ShieldCheck, Smartphone, Building2, Banknote,
} from "lucide-react";
import { useAriaToast } from "@/frontend/hooks/useAriaToast";
import { cn } from "@/frontend/theme/tokens";
import { Button } from "@/frontend/components/ui/button";
import { PageHero } from "@/frontend/components/PageHero";
import { formatBDT } from "@/backend/utils/currency";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { billingService } from "@/backend/services/billing.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { useAuth } from "@/backend/store/auth";
import { useTranslation } from "react-i18next";

const methodIcons: Record<string, { icon: typeof Smartphone; color: string; bg: string; label: string }> = {
  bkash: { icon: Smartphone, color: "#D12053", bg: "rgba(209,32,83,0.08)", label: "bKash" },
  nagad: { icon: Smartphone, color: "#ED6E1B", bg: "rgba(237,110,27,0.08)", label: "Nagad" },
  rocket: { icon: Smartphone, color: "#8E24AA", bg: "rgba(142,36,170,0.08)", label: "Rocket" },
  bank_transfer: { icon: Building2, color: "#37474F", bg: "rgba(55,71,79,0.08)", label: "Bank Transfer" },
  cash: { icon: Banknote, color: "#2E7D32", bg: "rgba(46,125,50,0.08)", label: "Cash" },
};

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  pending: { label: "Pending Verification", color: "#E8A838", bg: "rgba(232,168,56,0.1)", icon: Clock },
  verified: { label: "Verified", color: "#5FB865", bg: "rgba(95,184,101,0.1)", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "#EF4444", bg: "rgba(239,68,68,0.1)", icon: XCircle },
  expired: { label: "Expired", color: "#9E9E9E", bg: "rgba(158,158,158,0.1)", icon: Clock },
};

export default function VerifyPaymentPage() {
  const { t } = useTranslation("common");
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.verifyPayment", "Verify Payment"));

  const toast = useAriaToast();
  const navigate = useNavigate();
  const { proofId } = useParams();
  const { data: proof, loading } = useAsyncData(() => billingService.getProofById(proofId ?? ""), [proofId]);
  const { user } = useAuth();
  const [action, setAction] = useState<"idle" | "confirming_verify" | "confirming_reject" | "processing" | "done">("idle");
  const [rejectReason, setRejectReason] = useState("");

  if (loading || !proof) return <PageSkeleton />;

  // Auth guard: only admin/moderator can verify
  const isVerifier = user?.activeRole === 'admin' || user?.activeRole === 'moderator';
  if (!isVerifier) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: cn.bgPage }}>
        <div className="text-center max-w-sm mx-auto p-6 rounded-xl" style={{ background: cn.surface }}>
          <ShieldCheck className="w-12 h-12 mx-auto mb-4" style={{ color: cn.textSecondary }} />
          <h2 className="text-xl mb-2" style={{ color: cn.text }}>Verification Restricted</h2>
          <p className="text-sm mb-6" style={{ color: cn.textSecondary }}>
            {t("billing.verificationHandledByPlatform", "Payment verification is handled by the CareNet Platform team.")}
          </p>
          <Button className="w-full rounded-xl" onClick={() => navigate("/billing")}>Back to Billing</Button>
        </div>
      </div>
    );
  }

  const st = statusConfig[proof.status] || statusConfig.pending;
  const StatusIcon = st.icon;
  const method = methodIcons[proof.method] || methodIcons.bkash;
  const MethodIcon = method.icon;

  const handleVerify = async () => {
    setAction("processing");
    try {
      await billingService.verifyPaymentProof(proof.id);
      toast.success("Payment verified successfully", {
        description: t("billing.providerWalletCredited", "Payment verified. Provider wallet credited."),
      });
      setAction("done");
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        toast.error("Unauthorized", {
          description: t("billing.moderatorFeatureDisabled", "Payment verification is currently restricted to Admins."),
        });
      } else {
        toast.error("Failed to verify payment", {
          description: err.message || "Please try again.",
        });
      }
      setAction("idle");
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setAction("processing");
    try {
      await billingService.rejectPaymentProof(proof.id, rejectReason);
      toast.error("Payment proof rejected", {
        description: `${proof.submittedBy.name} has been notified of the rejection.`,
      });
      setAction("done");
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        toast.error("Unauthorized", {
          description: t("billing.moderatorFeatureDisabled", "Payment verification is currently restricted to Admins."),
        });
      } else {
        toast.error("Failed to reject payment", {
          description: err.message || "Please try again.",
        });
      }
      setAction("idle");
    }
  };

  if (action === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: cn.bgPage }}>
        <div className="text-center max-w-sm mx-auto">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(95,184,101,0.1)" }}>
            <CheckCircle2 className="w-10 h-10" style={{ color: cn.green }} />
          </div>
          <h2 className="text-xl mb-2" style={{ color: cn.text }}>Action Completed</h2>
          <p className="text-sm mb-6" style={{ color: cn.textSecondary }}>The payment proof status has been updated. The submitter will be notified.</p>
          <Button className="w-full rounded-xl" style={{ background: cn.green, color: "white" }} onClick={() => navigate("/billing")}>Back to Billing</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHero gradient="var(--cn-gradient-agency)" className="pt-8 pb-32 px-6">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/70 hover:text-white text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-2xl text-white flex items-center gap-2"><ShieldCheck className="w-7 h-7" /> Verify Payment</h1>
          <p className="text-white/70 text-sm mt-1">Review and verify payment proof {proof.id}</p>
        </div>
      </PageHero>

      <div className="max-w-2xl mx-auto px-6 -mt-20 space-y-6 pb-8">
        {/* Status Banner */}
        <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: st.bg }}>
          <StatusIcon className="w-6 h-6" style={{ color: st.color }} />
          <div>
            <p className="text-sm" style={{ color: st.color }}>{st.label}</p>
            <p className="text-xs" style={{ color: `${st.color}99` }}>Submitted {proof.submittedAt}</p>
          </div>
        </div>

        {/* Proof Details Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 space-y-5" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.05)", border: "1px solid rgba(255,255,255,0.4)" }}>
          {/* Amount */}
          <div className="text-center py-4 rounded-xl" style={{ background: cn.pinkBg }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: cn.textSecondary }}>Payment Amount</p>
            <p className="text-3xl" style={{ color: cn.pink }}>{formatBDT(proof.amount)}</p>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Submitted By", value: proof.submittedBy.name, sub: proof.submittedBy.role, icon: User, color: cn.blue },
              { label: "Payment Method", value: method.label, sub: `Ref: ${proof.referenceNumber}`, icon: MethodIcon, color: method.color },
              { label: "Invoice", value: proof.invoiceId, sub: "Related Invoice", icon: FileText, color: cn.purple },
              { label: "Date", value: proof.submittedAt, sub: "Submission Date", icon: Calendar, color: cn.teal },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: cn.bgInput }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${item.color}15` }}>
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: cn.textSecondary }}>{item.label}</p>
                  <p className="text-sm truncate" style={{ color: cn.text }}>{item.value}</p>
                  <p className="text-xs truncate" style={{ color: cn.textSecondary }}>{item.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Reference Number Highlight */}
          <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed" style={{ borderColor: method.color + "40" }}>
            <Hash className="w-5 h-5" style={{ color: method.color }} />
            <div>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: cn.textSecondary }}>Transaction Reference</p>
              <p className="text-lg tracking-wider" style={{ color: cn.text, fontFamily: "monospace" }}>{proof.referenceNumber}</p>
            </div>
          </div>

          {/* Notes */}
          {proof.notes && (
            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: cn.bgInput }}>
              <MessageSquare className="w-4 h-4 mt-1 shrink-0" style={{ color: cn.textSecondary }} />
              <div>
                <p className="text-[10px] uppercase tracking-widest" style={{ color: cn.textSecondary }}>Notes from Payer</p>
                <p className="text-sm mt-1" style={{ color: cn.text }}>{proof.notes}</p>
              </div>
            </div>
          )}

          {/* Rejection reason (if rejected) */}
          {proof.status === "rejected" && proof.rejectionReason && (
            <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "rgba(239,68,68,0.06)" }}>
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#EF4444" }} />
              <div>
                <p className="text-sm" style={{ color: "#EF4444" }}>Rejection Reason</p>
                <p className="text-sm mt-1" style={{ color: cn.text }}>{proof.rejectionReason}</p>
                {proof.verifiedByName && <p className="text-xs mt-1" style={{ color: cn.textSecondary }}>By {proof.verifiedByName} on {proof.verifiedAt}</p>}
              </div>
            </div>
          )}

          {/* Verified info */}
          {proof.status === "verified" && (
            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "rgba(95,184,101,0.06)" }}>
              <CheckCircle2 className="w-5 h-5" style={{ color: cn.green }} />
              <div>
                <p className="text-sm" style={{ color: cn.green }}>Verified by {proof.verifiedByName}</p>
                <p className="text-xs" style={{ color: cn.textSecondary }}>{proof.verifiedAt}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons (only for pending proofs) */}
        {proof.status === "pending" && action === "idle" && (
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 space-y-4" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.05)", border: "1px solid rgba(255,255,255,0.4)" }}>
            <h3 className="text-sm" style={{ color: cn.text }}>
              <ShieldCheck className="w-4 h-4 inline mr-2" style={{ color: cn.teal }} />
              Verification Actions
            </h3>
            <p className="text-xs" style={{ color: cn.textSecondary }}>
              Please verify this payment against your records before approving.
            </p>
            <div className="flex gap-3">
              <Button className="flex-1 h-12 rounded-xl text-white" style={{ background: cn.green }} onClick={() => setAction("confirming_verify")}>
                <CheckCircle2 className="w-4 h-4 mr-2" /> Verify Payment
              </Button>
              <Button variant="outline" className="flex-1 h-12 rounded-xl" style={{ borderColor: "#EF4444", color: "#EF4444" }} onClick={() => setAction("confirming_reject")}>
                <XCircle className="w-4 h-4 mr-2" /> Reject
              </Button>
            </div>
          </div>
        )}

        {/* Confirm Verify */}
        {action === "confirming_verify" && (
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 space-y-4" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.05)", border: "1px solid rgba(255,255,255,0.4)" }}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" style={{ color: cn.green }} />
              <h3 className="text-sm" style={{ color: cn.text }}>Confirm Verification</h3>
            </div>
            <p className="text-sm" style={{ color: cn.textSecondary }}>
              Are you sure you received <span style={{ color: cn.pink }}>{formatBDT(proof.amount)}</span> via <span style={{ color: cn.text }}>{method.label}</span> with reference <span style={{ color: cn.text, fontFamily: "monospace" }}>{proof.referenceNumber}</span>?
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setAction("idle")}>Cancel</Button>
              <Button className="flex-1 rounded-xl text-white" style={{ background: cn.green }} onClick={handleVerify}>
                Yes, Verify
              </Button>
            </div>
          </div>
        )}

        {/* Confirm Reject */}
        {action === "confirming_reject" && (
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 space-y-4" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.05)", border: "1px solid rgba(255,255,255,0.4)" }}>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5" style={{ color: "#EF4444" }} />
              <h3 className="text-sm" style={{ color: cn.text }}>Reject Payment Proof</h3>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: cn.textSecondary }}>Reason for Rejection *</label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Reference number does not match our records..."
                className="w-full px-4 py-3 rounded-xl border text-sm resize-none" rows={3}
                style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput, fontSize: "16px" }} />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setAction("idle")}>Cancel</Button>
              <Button className="flex-1 rounded-xl text-white" style={{ background: "#EF4444" }} onClick={handleReject} disabled={!rejectReason.trim()}>
                Reject
              </Button>
            </div>
          </div>
        )}

        {/* Processing */}
        {action === "processing" && (
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 text-center" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.05)" }}>
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: cn.pink }} />
            <p className="text-sm" style={{ color: cn.text }}>Processing...</p>
          </div>
        )}
      </div>
    </div>
  );
}