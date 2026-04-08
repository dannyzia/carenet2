/**
 * BidReviewPage — Guardian reviews bids on their care request
 * Shows requirement-vs-bid compliance matrix with remarks
 */
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import {
  ArrowLeft, Star, Shield, CheckCircle2, AlertTriangle, XCircle, MinusCircle,
  Clock, DollarSign, Users, MessageSquare, ChevronDown, ChevronUp, Send,
  ThumbsUp, ThumbsDown, RotateCcw, Timer,
} from "lucide-react";
import { cn } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { marketplaceService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useAriaToast } from "@/frontend/hooks/useAriaToast";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/frontend/components/shared/ConfirmDialog";
import type { CareContractBid, BidComplianceSection, ComplianceStatus } from "@/backend/models";
import { useAuth } from "@/frontend/auth/AuthContext";
import { USE_SUPABASE } from "@/backend/services/supabase";
import { subscribeToCareContractBids } from "@/backend/services/realtime";

/** Compliance icon config — labels resolved via t() inside component */
const complianceIconConfig: Record<ComplianceStatus, { icon: typeof CheckCircle2; color: string; labelKey: string }> = {
  met: { icon: CheckCircle2, color: "#5FB865", labelKey: "bidReview.complianceMet" },
  partial: { icon: AlertTriangle, color: "#E8A838", labelKey: "bidReview.compliancePartial" },
  unmet: { icon: XCircle, color: "#EF4444", labelKey: "bidReview.complianceUnmet" },
  not_applicable: { icon: MinusCircle, color: "#9CA3AF", labelKey: "bidReview.complianceNA" },
};

export default function BidReviewPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.bidReview", "Bid Review"));

  const toast = useAriaToast();
  const { user } = useAuth();
  const { id: requestId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("guardian");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showCounterForm, setShowCounterForm] = useState<string | null>(null);
  const [counterMessage, setCounterMessage] = useState("");
  const [, setTick] = useState(0);
  const [confirmAcceptBidId, setConfirmAcceptBidId] = useState<string | null>(null);
  const [confirmRejectBidId, setConfirmRejectBidId] = useState<string | null>(null);

  // Real-time countdown: re-render every 60s to update expiry displays
  useEffect(() => {
    const interval = setInterval(() => setTick(prev => prev + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  const { data: request, loading: loadingReq } = useAsyncData(() =>
    marketplaceService.getCareRequestById(requestId || "")
  );
  const { data: bids, loading: loadingBids, refetch } = useAsyncData(() =>
    marketplaceService.getBidsForRequest(requestId || "")
  );

  useEffect(() => {
    if (!USE_SUPABASE || !user?.id || !requestId) return;
    return subscribeToCareContractBids([requestId], user.id, () => {
      void refetch();
    });
  }, [user?.id, requestId, refetch]);

  if (loadingReq || loadingBids) return <PageSkeleton />;
  if (!request) return <div className="text-center py-12"><p style={{ color: cn.textSecondary }}>{t("bidReview.requestNotFound")}</p></div>;

  const sortedBids = [...(bids || [])].sort((a, b) => b.compliance.overall_score - a.compliance.overall_score);

  const toggleSection = (bidId: string, section: string) => {
    const key = `${bidId}-${section}`;
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAccept = async (bidId: string) => {
    setConfirmAcceptBidId(bidId);
  };

  const executeAccept = async () => {
    if (!confirmAcceptBidId) return;
    const bidId = confirmAcceptBidId;
    setConfirmAcceptBidId(null);
    await marketplaceService.acceptBid(bidId);
    toast.success(t("bidReview.bidAccepted"));
    refetch();
  };

  const handleReject = async (bidId: string) => {
    setConfirmRejectBidId(bidId);
  };

  const executeReject = async () => {
    if (!confirmRejectBidId) return;
    const bidId = confirmRejectBidId;
    setConfirmRejectBidId(null);
    await marketplaceService.rejectBid(bidId);
    toast.success(t("bidReview.bidRejected"));
    refetch();
  };

  const handleCounter = async (bidId: string) => {
    if (!counterMessage.trim()) return;
    await marketplaceService.counterBid(bidId, counterMessage);
    toast.success(t("bidReview.counterSent"));
    setShowCounterForm(null);
    setCounterMessage("");
    refetch();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Confirmation Dialog — Accept */}
      <ConfirmDialog
        open={!!confirmAcceptBidId}
        title={t("bidReview.confirmAcceptTitle")}
        description={t("bidReview.confirmAcceptDesc")}
        confirmLabel={t("bidReview.confirm")}
        cancelLabel={t("bidReview.cancel")}
        variant="warning"
        onConfirm={executeAccept}
        onCancel={() => setConfirmAcceptBidId(null)}
      />
      {/* Confirmation Dialog — Reject */}
      <ConfirmDialog
        open={!!confirmRejectBidId}
        title={t("bidReview.confirmRejectTitle")}
        description={t("bidReview.confirmRejectDesc")}
        confirmLabel={t("bidReview.confirm")}
        cancelLabel={t("bidReview.cancel")}
        variant="danger"
        onConfirm={executeReject}
        onCancel={() => setConfirmRejectBidId(null)}
      />

      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center border cn-touch-target" style={{ borderColor: cn.border }}>
          <ArrowLeft className="w-4 h-4" style={{ color: cn.textSecondary }} />
        </button>
        <div>
          <h1 className="text-xl" style={{ color: cn.text }}>{t("bidReview.title")}</h1>
          <p className="text-sm" style={{ color: cn.textSecondary }}>{request.meta.title}</p>
        </div>
      </div>

      {/* Request Summary */}
      <div className="stat-card p-4">
        <h3 className="text-sm mb-2" style={{ color: cn.text }}>{t("bidReview.requirementsSummary")}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs" style={{ color: cn.textSecondary }}>
          <div><span className="block" style={{ color: cn.text }}>{t("bidReview.staffLevel")}</span>{request.staffing.required_level}</div>
          <div><span className="block" style={{ color: cn.text }}>{t("bidReview.staffCount")}</span>{(request.staffing.caregiver_count || 0) + (request.staffing.nurse_count || 0)} {t("bidReview.total")}</div>
          <div><span className="block" style={{ color: cn.text }}>{t("bidReview.schedule")}</span>{request.schedule?.hours_per_day || 8}h/day, {request.schedule?.shift_type || "day"}</div>
          <div><span className="block" style={{ color: cn.text }}>{t("bidReview.budget")}</span>{"budget_min" in request.pricing ? `৳${(request.pricing as any).budget_min?.toLocaleString()} - ৳${(request.pricing as any).budget_max?.toLocaleString()}` : "N/A"}</div>
        </div>
      </div>

      {/* Bid Count */}
      <p className="text-sm" style={{ color: cn.textSecondary }}>
        {t("bidReview.bidsReceived", { count: sortedBids.length })}
      </p>

      {/* Bid Cards */}
      {sortedBids.map((bid, idx) => (
        <BidCard
          key={bid.id}
          bid={bid}
          rank={idx + 1}
          expandedSections={expandedSections}
          toggleSection={toggleSection}
          showCounterForm={showCounterForm}
          setShowCounterForm={setShowCounterForm}
          counterMessage={counterMessage}
          setCounterMessage={setCounterMessage}
          onAccept={handleAccept}
          onReject={handleReject}
          onCounter={handleCounter}
        />
      ))}

      {sortedBids.length === 0 && (
        <div className="text-center py-12 stat-card">
          <MessageSquare className="w-12 h-12 mx-auto mb-3" style={{ color: cn.borderLight }} />
          <p className="text-sm" style={{ color: cn.textSecondary }}>{t("bidReview.noBidsYet")}</p>
        </div>
      )}
    </div>
  );
}

function BidCard({
  bid,
  rank,
  expandedSections,
  toggleSection,
  showCounterForm,
  setShowCounterForm,
  counterMessage,
  setCounterMessage,
  onAccept,
  onReject,
  onCounter,
}: {
  bid: CareContractBid;
  rank: number;
  expandedSections: Record<string, boolean>;
  toggleSection: (bidId: string, section: string) => void;
  showCounterForm: string | null;
  setShowCounterForm: (id: string | null) => void;
  counterMessage: string;
  setCounterMessage: (msg: string) => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onCounter: (id: string) => void;
}) {
  const scoreColor = bid.compliance.overall_score >= 85 ? "#5FB865" : bid.compliance.overall_score >= 70 ? "#E8A838" : "#EF4444";
  const isDisabled = bid.status !== "pending";
  const expiryInfo = marketplaceService.getBidExpiryInfo(bid);
  const isExpired = bid.status === "expired" || expiryInfo.expired;
  const expiryUrgent = !isExpired && expiryInfo.remainingHours <= 6;
  const { t } = useTranslation("guardian");

  return (
    <div className={`stat-card overflow-hidden ${isExpired ? "opacity-60" : ""}`}>
      {/* Expiry Banner */}
      {(bid.status === "pending" || bid.status === "countered") && (
        <div className="flex items-center gap-2 px-4 py-2 text-xs" style={{
          background: isExpired ? "rgba(239,68,68,0.08)" : expiryUrgent ? "rgba(232,168,56,0.08)" : "rgba(0,137,123,0.06)",
          borderBottom: `1px solid ${isExpired ? "rgba(239,68,68,0.15)" : expiryUrgent ? "rgba(232,168,56,0.15)" : cn.borderLight}`,
        }}>
          <Timer className="w-3 h-3" style={{ color: isExpired ? "#EF4444" : expiryUrgent ? "#E8A838" : cn.teal }} />
          <span style={{ color: isExpired ? "#EF4444" : expiryUrgent ? "#E8A838" : cn.textSecondary }}>
            {isExpired
              ? t("bidReview.bidExpired")
              : t("bidReview.expiresIn", { time: expiryInfo.remainingHours <= 24 ? `${expiryInfo.remainingHours}h` : `${Math.ceil(expiryInfo.remainingHours / 24)}d` })}
          </span>
          {!isExpired && (
            <span className="ml-auto text-[10px]" style={{ color: cn.textSecondary }}>
              {new Date(bid.expires_at).toLocaleDateString()}
            </span>
          )}
        </div>
      )}
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs relative" style={{ background: "var(--cn-gradient-agency)" }}>
              {bid.agency_name.slice(0, 2)}
              {rank <= 3 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] flex items-center justify-center text-white" style={{ background: rank === 1 ? "#5FB865" : rank === 2 ? "#E8A838" : "#0288D1" }}>
                  {rank}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: cn.text }}>{bid.agency_name}</span>
                {bid.agency_verified && <Shield className="w-3 h-3" style={{ color: cn.teal }} />}
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: cn.textSecondary }}>
                {bid.agency_rating && <span className="flex items-center gap-0.5"><Star className="w-3 h-3" style={{ color: cn.amber }} /> {bid.agency_rating}</span>}
                <span><Clock className="w-3 h-3 inline" /> {new Date(bid.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg" style={{ color: cn.green }}>৳{bid.proposed_pricing.base_price?.toLocaleString()}</p>
            <p className="text-xs" style={{ color: cn.textSecondary }}>/{bid.proposed_pricing.pricing_model || "mo"}</p>
          </div>
        </div>

        {/* Overall Compliance Score */}
        <div className="flex items-center gap-3 p-3 rounded-xl mb-3" style={{ background: cn.bgInput }}>
          <div className="relative w-14 h-14 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={cn.borderLight} strokeWidth="3" />
              <path
                d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke={scoreColor} strokeWidth="3"
                strokeDasharray={`${bid.compliance.overall_score}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs" style={{ color: scoreColor }}>
              {bid.compliance.overall_score}%
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm mb-1" style={{ color: cn.text }}>{t("bidReview.complianceScore")}</p>
            <div className="flex gap-3 text-xs">
              {([
                { status: "met" as const, count: bid.compliance.met_count },
                { status: "partial" as const, count: bid.compliance.partial_count },
                { status: "unmet" as const, count: bid.compliance.unmet_count },
              ]).map(({ status, count }) => {
                const ci = complianceIconConfig[status];
                const Icon = ci.icon;
                return (
                  <span key={status} className="flex items-center gap-1" style={{ color: ci.color }}>
                    <Icon className="w-3 h-3" /> {count} {t(ci.labelKey)}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Agency Message */}
        {bid.message && (
          <div className="p-3 rounded-xl mb-3" style={{ background: "rgba(0,137,123,0.06)", borderLeft: "3px solid var(--cn-teal)" }}>
            <p className="text-xs" style={{ color: cn.textSecondary }}>{t("bidReview.agencyMessage")}</p>
            <p className="text-sm mt-1" style={{ color: cn.text }}>{bid.message}</p>
          </div>
        )}

        {/* General Remarks (if partial/unmet) */}
        {bid.remarks && (
          <div className="p-3 rounded-xl mb-3" style={{ background: "rgba(232,168,56,0.06)", borderLeft: "3px solid #E8A838" }}>
            <p className="text-xs" style={{ color: "#E8A838" }}>{t("bidReview.deviationRemarks")}</p>
            <p className="text-sm mt-1" style={{ color: cn.text }}>{bid.remarks}</p>
          </div>
        )}

        {/* Counter Offer display */}
        {bid.counter_offer && (
          <div className="p-3 rounded-xl mb-3" style={{ background: "rgba(123,94,167,0.06)", borderLeft: "3px solid #7B5EA7" }}>
            <p className="text-xs" style={{ color: "#7B5EA7" }}>{t("bidReview.counterOffer")} ({bid.counter_offer.from})</p>
            <p className="text-sm mt-1" style={{ color: cn.text }}>{bid.counter_offer.message}</p>
          </div>
        )}
      </div>

      {/* Compliance Sections (expandable) */}
      <div style={{ borderTop: `1px solid ${cn.border}` }}>
        {bid.compliance.sections.map((section) => {
          const isExpanded = expandedSections[`${bid.id}-${section.section}`];
          return (
            <div key={section.section} style={{ borderBottom: `1px solid ${cn.border}` }}>
              <button
                onClick={() => toggleSection(bid.id, section.section)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm cn-touch-target"
              >
                <div className="flex items-center gap-2">
                  <span style={{ color: cn.text }}>{t(`bidReview.complianceSection_${section.section}`, { defaultValue: section.label })}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{
                    background: section.section_score >= 85 ? "rgba(95,184,101,0.12)" : section.section_score >= 70 ? "rgba(232,168,56,0.12)" : "rgba(239,68,68,0.12)",
                    color: section.section_score >= 85 ? "#5FB865" : section.section_score >= 70 ? "#E8A838" : "#EF4444",
                  }}>{section.section_score}%</span>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4" style={{ color: cn.textSecondary }} /> : <ChevronDown className="w-4 h-4" style={{ color: cn.textSecondary }} />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-3 space-y-2">
                  {section.items.map((item) => {
                    const ci = complianceIconConfig[item.status];
                    const Icon = ci.icon;
                    return (
                      <div key={item.field} className="p-3 rounded-xl" style={{ background: cn.bgInput }}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-xs" style={{ color: cn.textSecondary }}>{t(`bidReview.complianceField_${item.field}`, { defaultValue: item.label })}</span>
                          <span className="flex items-center gap-1 text-xs shrink-0" style={{ color: ci.color }}>
                            <Icon className="w-3 h-3" /> {t(ci.labelKey)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="block text-[10px]" style={{ color: cn.textSecondary }}>{t("bidReview.required")}</span>
                            <span style={{ color: cn.text }}>{item.required_value}</span>
                          </div>
                          <div>
                            <span className="block text-[10px]" style={{ color: cn.textSecondary }}>{t("bidReview.offered")}</span>
                            <span style={{ color: item.status === "met" ? cn.text : ci.color }}>{item.offered_value}</span>
                          </div>
                        </div>
                        {item.remark && (
                          <div className="mt-2 p-2 rounded-lg text-xs" style={{ background: "rgba(232,168,56,0.06)" }}>
                            <span style={{ color: "#E8A838" }}>{t("bidReview.remark")}: </span>
                            <span style={{ color: cn.text }}>{item.remark}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      {bid.status === "pending" && (
        <div className="p-4" style={{ borderTop: `1px solid ${cn.border}` }}>
          {showCounterForm === bid.id ? (
            <div className="space-y-3">
              <textarea
                value={counterMessage}
                onChange={(e) => setCounterMessage(e.target.value)}
                placeholder={t("bidReview.counterPlaceholder")}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border text-sm resize-none"
                style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}
              />
              <div className="flex gap-2">
                <button onClick={() => onCounter(bid.id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm" style={{ background: "#7B5EA7" }}>
                  <Send className="w-4 h-4" /> {t("bidReview.sendCounter")}
                </button>
                <button onClick={() => setShowCounterForm(null)} className="px-4 py-2.5 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.textSecondary }}>
                  {t("bidReview.cancel")}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => onAccept(bid.id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm" style={{ background: "var(--cn-gradient-guardian)" }}>
                <ThumbsUp className="w-4 h-4" /> {t("bidReview.acceptBid")}
              </button>
              <button onClick={() => setShowCounterForm(bid.id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm" style={{ borderColor: "#7B5EA7", color: "#7B5EA7" }}>
                <RotateCcw className="w-4 h-4" /> {t("bidReview.counter")}
              </button>
              <button onClick={() => onReject(bid.id)} className="px-4 py-2.5 rounded-xl border text-sm" style={{ borderColor: "#EF4444", color: "#EF4444" }}>
                <ThumbsDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Status badge for non-pending bids */}
      {bid.status !== "pending" && (
        <div className="px-4 pb-4">
          <span className="px-3 py-1.5 rounded-lg text-xs" style={{
            background: bid.status === "accepted" ? "rgba(95,184,101,0.12)" : bid.status === "countered" ? "rgba(123,94,167,0.12)" : "rgba(239,68,68,0.12)",
            color: bid.status === "accepted" ? "#5FB865" : bid.status === "countered" ? "#7B5EA7" : "#EF4444",
          }}>
            {bid.status === "accepted" ? t("bidReview.statusAccepted") : bid.status === "countered" ? t("bidReview.statusCounterSent") : bid.status === "rejected" ? t("bidReview.statusRejected") : bid.status}
          </span>
        </div>
      )}
    </div>
  );
}