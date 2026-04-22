import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { CheckCircle, XCircle, Clock, Eye, Copy, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/frontend/theme/tokens";
import { ResponsiveTable, type Column } from "@/frontend/components/ResponsiveTable";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { billingService } from "@/backend/services";
import { subscribeToAdminPaymentProofs } from "@/backend/services/realtime";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { PageHero } from "@/frontend/components/PageHero";
import { useAuth } from "@/backend/store/auth";
import { useTranslation } from "react-i18next";
import { getSupabaseClient } from "@/backend/services/supabase";
import type { PaymentProof } from "@/backend/models";

const columns: Column<PaymentProof>[] = [
  { key: "invoiceId", label: "Invoice ID", primary: true, render: (row) => <span className="font-mono text-xs" style={{ color: cn.text }}>{row.invoiceId.slice(0, 8)}...</span> },
  { key: "submittedBy", label: "Guardian", render: (row) => <span style={{ color: cn.textSecondary }}>{row.submittedBy.name}</span> },
  { key: "receivedBy", label: "Provider", render: (row) => <span style={{ color: cn.textSecondary }}>{row.receivedBy.name}</span> },
  { key: "amount", label: "Amount", render: (row) => <span style={{ color: cn.text }}>{row.amount} CP</span> },
  { key: "method", label: "Method", render: (row) => <span className="capitalize text-xs" style={{ color: cn.textSecondary }}>{row.method}</span> },
  { key: "submittedAt", label: "Date Submitted", render: (row) => <span className="text-xs" style={{ color: cn.textSecondary }}>{new Date(row.submittedAt).toLocaleDateString()}</span> },
  { key: "status", label: "Status", render: (row) => {
    const statusConfig = {
      pending: { icon: Clock, color: "#E8A838", bg: "#FFB54D20", label: "Pending" },
      verified: { icon: CheckCircle, color: "#5FB865", bg: "#7CE57720", label: "Verified" },
      rejected: { icon: XCircle, color: "#EF4444", bg: "#EF444420", label: "Rejected" },
    };
    const config = statusConfig[row.status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: config.bg, color: config.color }}>
        <Icon className="w-3 h-3" />{config.label}
      </span>
    );
  }},
];

const mobileCard = (row: PaymentProof, onView: () => void) => (
  <div className="space-y-2 p-3 rounded-lg" style={{ background: cn.bgCard }}>
    <div className="flex items-center justify-between">
      <p className="text-xs font-mono" style={{ color: cn.text }}>{row.invoiceId.slice(0, 8)}...</p>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]">
        {row.status === "pending" && <Clock className="w-3 h-3" style={{ color: "#E8A838" }} />}
        {row.status === "verified" && <CheckCircle className="w-3 h-3" style={{ color: "#5FB865" }} />}
        {row.status === "rejected" && <XCircle className="w-3 h-3" style={{ color: "#EF4444" }} />}
        <span style={{ color: cn.textSecondary }}>{row.status}</span>
      </span>
    </div>
    <div className="flex items-center justify-between text-xs" style={{ color: cn.textSecondary }}>
      <span>{row.submittedBy.name}</span>
      <span>{row.amount} CP</span>
    </div>
    <button onClick={onView} className="w-full text-xs py-1.5 rounded-lg" style={{ background: cn.pink, color: "white" }}>
      View Details
    </button>
  </div>
);

export default function AdminPaymentProofsPage() {
  const { t } = useTranslation("common");
  useDocumentTitle(t("billing.adminProofDashboard", "Payment Proof Verification"));

  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [selectedProof, setSelectedProof] = useState<PaymentProof | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isModeratorEnabled, setIsModeratorEnabled] = useState<boolean | null>(null);

  const { data: proofs, loading, error, refetch } = useAsyncData(
    () => billingService.getPaymentProofsForAdmin(activeFilter === "all" ? undefined : activeFilter),
    [activeFilter]
  );

  // Check moderator permission if moderator role
  useEffect(() => {
    if (user?.activeRole === "moderator") {
      getSupabaseClient()
        .from("platform_config")
        .select("value")
        .eq("key", "moderator_can_verify_payments")
        .single()
        .then(({ data }) => {
          const allowed = data ? JSON.parse(data.value || "false") : false;
          setIsModeratorEnabled(allowed);
        });
    } else {
      setIsModeratorEnabled(null); // Not a moderator
    }
  }, [user?.activeRole]);

  // Realtime subscription
  useEffect(() => {
    const unsubscribe = subscribeToAdminPaymentProofs(() => refetch());
    return unsubscribe;
  }, [refetch]);

  const handleApprove = async () => {
    if (!selectedProof) return;
    setShowRejectForm(false);
    try {
      const result = await billingService.verifyPaymentProof(selectedProof.id);
      if (result.success) {
        setSelectedProof(null);
        refetch();
      }
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        alert(t("billing.moderatorFeatureDisabled", "Payment verification is currently restricted to Admins."));
      } else {
        alert(err.message || "Failed to verify payment proof");
      }
    }
  };

  const handleReject = async () => {
    if (!selectedProof || !rejectReason.trim()) return;
    try {
      const result = await billingService.rejectPaymentProof(selectedProof.id, rejectReason);
      if (result.success) {
        setSelectedProof(null);
        setRejectReason("");
        refetch();
      }
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        alert(t("billing.moderatorFeatureDisabled", "Payment verification is currently restricted to Admins."));
      } else {
        alert(err.message || "Failed to reject payment proof");
      }
    }
  };

  // Moderator feature disabled
  if (user?.activeRole === "moderator" && isModeratorEnabled === false) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="p-6 rounded-xl flex items-start gap-4" style={{ background: "#FFB54D20", border: "1px solid #FFB54D40" }}>
          <AlertCircle className="w-6 h-6 flex-shrink-0" style={{ color: "#E8A838" }} />
          <div>
            <h3 className="font-semibold mb-1" style={{ color: cn.text }}>
              {t("billing.moderatorFeatureDisabled", "Payment verification is currently restricted to Admins")}
            </h3>
            <p className="text-sm" style={{ color: cn.textSecondary }}>
              Contact your admin to enable moderator access to payment proof verification.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <PageSkeleton cards={4} />;
  if (error) return <div className="p-6 text-center" style={{ color: cn.textSecondary }}>Error loading payment proofs. <button onClick={() => refetch()} className="underline">Retry</button></div>;

  const filteredProofs = proofs || [];

  return (
    <div>
      <PageHero gradient="var(--cn-gradient-admin)" className="pt-8 pb-32 px-6">
        <h1 className="text-3xl font-bold" style={{ color: "white" }}>
          {t("billing.adminProofDashboard", "Payment Proof Verification")}
        </h1>
        <p className="text-lg mt-2" style={{ color: "rgba(255,255,255,0.8)" }}>
          Review and verify payment submissions from guardians
        </p>
      </PageHero>

      <div className="px-6 -mt-20">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 space-y-6" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.05)", border: "1px solid rgba(255,255,255,0.4)" }}>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["all", "pending", "verified", "rejected"].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className="px-4 py-2 rounded-lg text-sm capitalize whitespace-nowrap transition-colors"
            style={{
              background: activeFilter === filter ? cn.pink : cn.bgCard,
              color: activeFilter === filter ? "white" : cn.text,
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ResponsiveTable
          columns={columns}
          data={filteredProofs}
          keyExtractor={(row) => row.id}
          mobileCard={(row) => mobileCard(row, () => setSelectedProof(row))}
          emptyMessage="No payment proofs found"
          onRowClick={(row) => setSelectedProof(row)}
        />
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedProof && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedProof(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-xl p-6 space-y-4"
              style={{ background: cn.bgCard }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold" style={{ color: cn.text }}>Payment Proof Details</h3>
                  <p className="text-xs font-mono" style={{ color: cn.textSecondary }}>{selectedProof.invoiceId}</p>
                </div>
                <button onClick={() => setSelectedProof(null)} className="p-1 rounded" style={{ background: cn.bgCard }}>
                  <XCircle className="w-5 h-5" style={{ color: cn.textSecondary }} />
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: cn.textSecondary }}>Guardian</span>
                  <span style={{ color: cn.text }}>{selectedProof.submittedBy.name}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: cn.textSecondary }}>Amount</span>
                  <span style={{ color: cn.text }}>{selectedProof.amount} CP</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: cn.textSecondary }}>Method</span>
                  <span className="capitalize" style={{ color: cn.text }}>{selectedProof.method}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: cn.textSecondary }}>Reference</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono" style={{ color: cn.text }}>{selectedProof.referenceNumber}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(selectedProof.referenceNumber)}
                      className="p-1 rounded"
                      style={{ background: cn.bgCard }}
                    >
                      <Copy className="w-3 h-3" style={{ color: cn.textSecondary }} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: cn.textSecondary }}>Submitted</span>
                  <span style={{ color: cn.text }}>{new Date(selectedProof.submittedAt).toLocaleString()}</span>
                </div>
                {selectedProof.notes && (
                  <div>
                    <span style={{ color: cn.textSecondary }}>Notes</span>
                    <p className="mt-1 p-2 rounded" style={{ background: cn.bgCard, color: cn.text }}>{selectedProof.notes}</p>
                  </div>
                )}
                {selectedProof.screenshotUrl && (
                  <div>
                    <span style={{ color: cn.textSecondary }}>Screenshot</span>
                    <button
                      onClick={() => window.open(selectedProof.screenshotUrl!, "_blank")}
                      className="mt-1 flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
                      style={{ background: cn.pink, color: "white" }}
                    >
                      <Eye className="w-4 h-4" /> View Screenshot
                    </button>
                  </div>
                )}
              </div>

              {selectedProof.status === "pending" && (
                <div className="flex gap-3 pt-4 border-t" style={{ borderColor: cn.border }}>
                  <button
                    onClick={handleApprove}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm"
                    style={{ background: "#5FB865" }}
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm"
                    style={{ background: "#EF4444", color: "white" }}
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}

              {showRejectForm && (
                <div className="space-y-3 pt-4 border-t" style={{ borderColor: cn.border }}>
                  <textarea
                    placeholder="Enter rejection reason..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full p-3 rounded-lg text-sm resize-none"
                    style={{ background: cn.bgCard, color: cn.text, minHeight: "80px" }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleReject}
                      disabled={!rejectReason.trim()}
                      className="flex-1 px-4 py-2 rounded-lg text-sm text-white disabled:opacity-50"
                      style={{ background: "#EF4444" }}
                    >
                      Confirm Rejection
                    </button>
                    <button
                      onClick={() => { setShowRejectForm(false); setRejectReason(""); }}
                      className="px-4 py-2 rounded-lg text-sm"
                      style={{ background: cn.bgCard, color: cn.text }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
