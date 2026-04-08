import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  FileText, CreditCard, Clock, CheckCircle2, AlertTriangle,
  ArrowRight, Eye, Upload, Filter, TrendingUp, Banknote,
} from "lucide-react";
import { cn } from "@/frontend/theme/tokens";
import { Button } from "@/frontend/components/ui/button";
import { PageHero } from "@/frontend/components/PageHero";
import { formatBDT } from "@/backend/utils/currency";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { billingService } from "@/backend/services/billing.service";
import { useAuth } from "@/frontend/auth/AuthContext";
import { USE_SUPABASE } from "@/backend/services/supabase";
import { subscribeToBillingForUser } from "@/backend/services/realtime";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { useTranslation } from "react-i18next";
import type { BillingInvoice, PaymentProof } from "@/backend/models";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  unpaid: { label: "Unpaid", color: "#EF4444", bg: "rgba(239,68,68,0.1)", icon: Clock },
  proof_submitted: { label: "Proof Submitted", color: "#E8A838", bg: "rgba(232,168,56,0.1)", icon: Upload },
  verified: { label: "Verified", color: "#5FB865", bg: "rgba(95,184,101,0.1)", icon: CheckCircle2 },
  paid: { label: "Paid", color: "#2E7D32", bg: "rgba(46,125,50,0.1)", icon: CheckCircle2 },
  partial: { label: "Partial", color: "#E8A838", bg: "rgba(232,168,56,0.1)", icon: Clock },
  disputed: { label: "Disputed", color: "#EF4444", bg: "rgba(239,68,68,0.1)", icon: AlertTriangle },
  overdue: { label: "Overdue", color: "#EF4444", bg: "rgba(239,68,68,0.1)", icon: AlertTriangle },
};

const proofStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending Review", color: "#E8A838", bg: "rgba(232,168,56,0.1)" },
  verified: { label: "Verified", color: "#5FB865", bg: "rgba(95,184,101,0.1)" },
  rejected: { label: "Rejected", color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
  expired: { label: "Expired", color: "#9E9E9E", bg: "rgba(158,158,158,0.1)" },
};

export default function BillingOverviewPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("common");
  const { user } = useAuth();
  useDocumentTitle(t("pageTitles.billing", "Billing"));
  const { data, loading, refetch } = useAsyncData(() => billingService.getOverview(), []);
  const [tab, setTab] = useState<"invoices" | "proofs">("invoices");
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (!USE_SUPABASE || !user?.id) return;
    return subscribeToBillingForUser(user.id, () => {
      void refetch();
    });
  }, [user?.id, refetch]);

  if (loading || !data) return <PageSkeleton />;

  const { stats, invoices, recentProofs } = data;

  const filteredInvoices = filter === "all" ? invoices : invoices.filter((i) => i.status === filter);
  const filteredProofs = filter === "all" ? recentProofs : recentProofs.filter((p) => p.status === filter);

  const statCards = [
    { label: "Outstanding", value: formatBDT(stats.totalOutstanding), icon: Banknote, color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
    { label: "Paid (Verified)", value: formatBDT(stats.totalPaid), icon: CheckCircle2, color: "#5FB865", bg: "rgba(95,184,101,0.1)" },
    { label: "Pending Verification", value: String(stats.pendingVerification), icon: Clock, color: "#E8A838", bg: "rgba(232,168,56,0.1)" },
    { label: "Overdue", value: String(stats.overdueCount), icon: AlertTriangle, color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
  ];

  return (
    <div>
      <PageHero gradient="var(--cn-gradient-guardian)" className="pt-8 pb-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl text-white flex items-center gap-2"><FileText className="w-7 h-7" /> Billing & Payments</h1>
              <p className="text-white/70 text-sm mt-1">Manage invoices, submit payment proof, and track verifications</p>
            </div>
          </div>
        </div>
      </PageHero>

      <div className="max-w-5xl mx-auto px-6 -mt-20 space-y-6 pb-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <div key={s.label} className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border" style={{ borderColor: "rgba(255,255,255,0.4)", boxShadow: "0 8px 32px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: s.bg }}>
                  <s.icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-lg" style={{ color: cn.text }}>{s.value}</p>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: cn.textSecondary }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs + Filter */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl overflow-hidden" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.05)", border: "1px solid rgba(255,255,255,0.4)" }}>
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {(["invoices", "proofs"] as const).map((t) => (
                <button key={t} onClick={() => { setTab(t); setFilter("all"); }} className="px-4 py-2 rounded-lg text-sm transition-all" style={{ background: tab === t ? "white" : "transparent", color: tab === t ? cn.text : cn.textSecondary, boxShadow: tab === t ? "0 2px 8px rgba(0,0,0,0.06)" : "none" }}>
                  {t === "invoices" ? "Invoices" : "Payment Proofs"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" style={{ color: cn.textSecondary }} />
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="text-sm border rounded-lg px-2 py-1.5" style={{ borderColor: cn.border, color: cn.text }}>
                <option value="all">All</option>
                {tab === "invoices" ? (
                  <>
                    <option value="unpaid">Unpaid</option>
                    <option value="proof_submitted">Proof Submitted</option>
                    <option value="verified">Verified</option>
                    <option value="disputed">Disputed</option>
                  </>
                ) : (
                  <>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="px-6 pb-6">
            {tab === "invoices" ? (
              <div className="space-y-3">
                {filteredInvoices.length === 0 && <p className="text-center py-8 text-sm" style={{ color: cn.textSecondary }}>No invoices found</p>}
                {filteredInvoices.map((inv) => (
                  <InvoiceCard key={inv.id} invoice={inv} onView={() => navigate(`/billing/invoice/${inv.id}`)} onPay={() => navigate(`/billing/submit-proof/${inv.id}`)} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProofs.length === 0 && <p className="text-center py-8 text-sm" style={{ color: cn.textSecondary }}>No payment proofs found</p>}
                {filteredProofs.map((proof) => (
                  <ProofCard key={proof.id} proof={proof} onView={() => navigate(`/billing/verify/${proof.id}`)} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Coming Soon Gateway Section */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.05)", border: "1px solid rgba(255,255,255,0.4)" }}>
          <h3 className="text-sm mb-4 flex items-center gap-2" style={{ color: cn.text }}>
            <TrendingUp className="w-4 h-4" style={{ color: cn.pink }} /> Payment Gateway Integration
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: "bKash Payment Gateway", color: "#D12053", desc: "Instant automated verification" },
              { name: "SSLCommerz", color: "#2E7D32", desc: "Multi-channel payment gateway" },
            ].map((gw) => (
              <button key={gw.name} disabled className="flex items-center gap-3 p-4 rounded-xl border opacity-50 cursor-not-allowed" style={{ borderColor: cn.border }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${gw.color}15` }}>
                  <CreditCard className="w-5 h-5" style={{ color: gw.color }} />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm" style={{ color: cn.text }}>{gw.name}</p>
                  <p className="text-xs" style={{ color: cn.textSecondary }}>{gw.desc}</p>
                </div>
                <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full" style={{ background: cn.amberBg, color: cn.amber }}>Coming Soon</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InvoiceCard({ invoice, onView, onPay }: { invoice: BillingInvoice; onView: () => void; onPay: () => void }) {
  const st = statusConfig[invoice.status] || statusConfig.unpaid;
  const StatusIcon = st.icon;
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-sm cursor-pointer" style={{ borderColor: cn.border }} onClick={onView}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: st.bg }}>
        <StatusIcon className="w-5 h-5" style={{ color: st.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm truncate" style={{ color: cn.text }}>{invoice.description}</p>
          <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0" style={{ background: st.bg, color: st.color }}>{st.label}</span>
        </div>
        <p className="text-xs mt-0.5" style={{ color: cn.textSecondary }}>
          {invoice.id} &middot; {invoice.fromParty.name} &middot; Due {invoice.dueDate}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm" style={{ color: cn.text }}>{formatBDT(invoice.total)}</p>
        <Link
          to={`/billing/invoice/${invoice.id}`}
          className="text-xs inline-flex items-center gap-1 mt-1"
          style={{ color: cn.pink }}
          onClick={(e) => e.stopPropagation()}
        >
          <Eye className="w-3 h-3" /> View Invoice
        </Link>
        {(invoice.status === "unpaid" || invoice.status === "overdue") && (
          <Button size="sm" className="mt-1 h-7 text-xs rounded-lg" style={{ background: cn.green, color: "white" }} onClick={(e) => { e.stopPropagation(); onPay(); }}>
            <Upload className="w-3 h-3 mr-1" /> Pay
          </Button>
        )}
      </div>
    </div>
  );
}

function ProofCard({ proof, onView }: { proof: PaymentProof; onView: () => void }) {
  const st = proofStatusConfig[proof.status] || proofStatusConfig.pending;
  const methodLabels: Record<string, string> = { bkash: "bKash", nagad: "Nagad", rocket: "Rocket", bank_transfer: "Bank Transfer", cash: "Cash" };
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-sm cursor-pointer" style={{ borderColor: cn.border }} onClick={onView}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: st.bg }}>
        <CreditCard className="w-5 h-5" style={{ color: st.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm truncate" style={{ color: cn.text }}>{methodLabels[proof.method] || proof.method} — {proof.referenceNumber}</p>
          <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0" style={{ background: st.bg, color: st.color }}>{st.label}</span>
        </div>
        <p className="text-xs mt-0.5" style={{ color: cn.textSecondary }}>
          {proof.submittedBy.name} → {proof.receivedBy.name} &middot; {proof.submittedAt}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm" style={{ color: cn.text }}>{formatBDT(proof.amount)}</p>
        <button className="text-xs flex items-center gap-1 mt-1" style={{ color: cn.pink }} onClick={(e) => { e.stopPropagation(); onView(); }}>
          <Eye className="w-3 h-3" /> View
        </button>
      </div>
    </div>
  );
}
