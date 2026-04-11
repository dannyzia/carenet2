/**
 * AgencyBidManagementPage — Agency tracks all submitted bids, responds to counters
 */
import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router";
import {
  Gavel, Clock, CheckCircle2, XCircle, RotateCcw, AlertTriangle,
  ChevronRight, DollarSign, Users, MapPin, Filter, Send, MessageSquare,
  TrendingUp, Eye, Timer,
} from "lucide-react";
import { cn } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { marketplaceService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useAriaToast } from "@/frontend/hooks/useAriaToast";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/frontend/components/shared/ConfirmDialog";
import type { CareContractBid, BidStatus } from "@/backend/models";
import { useAuth } from "@/frontend/auth/AuthContext";
import { USE_SUPABASE } from "@/backend/services/supabase";
import { subscribeToCareContractBids } from "@/backend/services/realtime";

type TabFilter = "all" | "pending" | "countered" | "accepted" | "rejected" | "withdrawn" | "expired";

/** Visual config (non-i18n) kept at module level; labels resolved via t() */
const statusColors: Record<BidStatus, { color: string; bg: string; icon: typeof Clock }> = {
  pending: { color: "#E8A838", bg: "rgba(232,168,56,0.12)", icon: Clock },
  accepted: { color: "#5FB865", bg: "rgba(95,184,101,0.12)", icon: CheckCircle2 },
  rejected: { color: "#EF4444", bg: "rgba(239,68,68,0.12)", icon: XCircle },
  countered: { color: "#7B5EA7", bg: "rgba(123,94,167,0.12)", icon: RotateCcw },
  expired: { color: "#6B7280", bg: "rgba(107,114,128,0.12)", icon: AlertTriangle },
  withdrawn: { color: "#6B7280", bg: "rgba(107,114,128,0.12)", icon: XCircle },
};

const statusLabelKeys: Record<BidStatus, string> = {
  pending: "agencyBids.statusPending",
  accepted: "agencyBids.statusAccepted",
  rejected: "agencyBids.statusRejected",
  countered: "agencyBids.statusCountered",
  expired: "agencyBids.statusExpired",
  withdrawn: "agencyBids.statusWithdrawn",
};

const tabKeys: { key: TabFilter; labelKey: string }[] = [
  { key: "all", labelKey: "agencyBids.allBids" },
  { key: "pending", labelKey: "agencyBids.pending" },
  { key: "countered", labelKey: "agencyBids.countered" },
  { key: "accepted", labelKey: "agencyBids.won" },
  { key: "rejected", labelKey: "agencyBids.lost" },
  { key: "expired", labelKey: "agencyBids.expired" },
  { key: "withdrawn", labelKey: "agencyBids.withdrawn" },
];

export default function AgencyBidManagementPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.agencyBidManagement", "Agency Bid Management"));

  const { t } = useTranslation("common");
  const { user } = useAuth();
  const toast = useAriaToast();
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [counterMessage, setCounterMessage] = useState("");
  const [, setTick] = useState(0);
  const [confirmAction, setConfirmAction] = useState<{ type: "withdraw" | "acceptCounter"; bidId: string } | null>(null);
  const expiryLiveRef = useRef<HTMLDivElement>(null);
  const prevExpiredIdsRef = useRef<Set<string>>(new Set());

  const { data: allBids, loading, refetch } = useAsyncData(
    () => marketplaceService.getMyBids(user?.id ?? "agency-current"),
    [user?.id],
  );

  const bidContractIds = useMemo(
    () => [...new Set((allBids ?? []).map((b) => b.contract_id).filter(Boolean))],
    [allBids],
  );
  const bidContractIdsKey = bidContractIds.join(",");

  useEffect(() => {
    if (!USE_SUPABASE || !user?.id || bidContractIds.length === 0) return;
    return subscribeToCareContractBids(bidContractIds, user.id, (payload) => {
      void refetch();
      if (payload.eventType === "UPDATE" && payload.newRecord && payload.oldRecord) {
        const ns = String((payload.newRecord as { status?: string }).status ?? "");
        const os = String((payload.oldRecord as { status?: string }).status ?? "");
        if (ns && ns !== os) {
          toast.success(t("agencyBids.bidStatusUpdated"));
        }
      }
    });
  }, [user?.id, bidContractIdsKey, bidContractIds, refetch, toast, t]);

  // Real-time countdown: re-render every 60s to update bid expiry displays
  useEffect(() => {
    const interval = setInterval(() => setTick(prev => prev + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Announce newly expired bids via aria-live region
  useEffect(() => {
    if (!allBids) return;
    const currentExpired = new Set(
      allBids
        .filter(b => {
          if (b.status === "expired") return true;
          if (!b.expires_at) return false;
          try {
            return marketplaceService.getBidExpiryInfo(b).expired;
          } catch {
            return false;
          }
        })
        .map(b => b.id)
    );
    const newlyExpired = allBids.filter(
      b => currentExpired.has(b.id) && !prevExpiredIdsRef.current.has(b.id)
    );
    if (newlyExpired.length > 0 && expiryLiveRef.current) {
      expiryLiveRef.current.textContent = "";
      requestAnimationFrame(() => {
        if (expiryLiveRef.current) {
          expiryLiveRef.current.textContent = newlyExpired
            .map(b => t("agencyBids.bidExpiredAnnounce", { id: b.contract_id }))
            .join(". ");
        }
      });
    }
    prevExpiredIdsRef.current = currentExpired;
  }, [allBids, t]);

  // Listen for package subscription notifications (same pattern as AgencyDashboardPage)
  useEffect(() => {
    const unsubscribe = marketplaceService.onPackageSubscription((agencyId, packageTitle) => {
      toast.success(t("agencyBids.newSubscriber", { title: packageTitle }), {
        duration: 6000,
        description: t("agencyBids.checkPackages"),
      });
    });
    return unsubscribe;
  }, []);

  const filteredBids = (allBids || []).filter(b =>
    activeTab === "all" ? true : b.status === activeTab
  );

  const stats = {
    total: allBids?.length || 0,
    pending: allBids?.filter(b => b.status === "pending").length || 0,
    countered: allBids?.filter(b => b.status === "countered").length || 0,
    won: allBids?.filter(b => b.status === "accepted").length || 0,
    winRate: allBids?.length
      ? Math.round(((allBids.filter(b => b.status === "accepted").length) / allBids.length) * 100)
      : 0,
  };

  const handleRespondToCounter = async (bidId: string) => {
    if (!counterMessage.trim()) return;
    try {
      await marketplaceService.respondToCounter(bidId, "counter", {
        message: counterMessage,
      });
      toast.success(t("agencyBids.responseSent"));
      setRespondingTo(null);
      setCounterMessage("");
      refetch();
    } catch {
      toast.error(t("agencyBids.responseFailed"));
    }
  };

  const handleAcceptCounter = async (bidId: string) => {
    setConfirmAction({ type: "acceptCounter", bidId });
  };

  const handleRejectCounter = async (bidId: string) => {
    try {
      await marketplaceService.respondToCounter(bidId, "reject");
      toast.success(t("agencyBids.counterRejected"));
      refetch();
    } catch {
      toast.error(t("agencyBids.counterRejectFailed"));
    }
  };

  const handleWithdraw = async (bidId: string) => {
    setConfirmAction({ type: "withdraw", bidId });
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    const { type, bidId } = confirmAction;
    setConfirmAction(null);
    if (type === "withdraw") {
      try {
        await marketplaceService.withdrawBid(bidId);
        toast.success(t("agencyBids.bidWithdrawn"));
        refetch();
      } catch {
        toast.error(t("agencyBids.withdrawFailed"));
      }
    } else if (type === "acceptCounter") {
      try {
        await marketplaceService.respondToCounter(bidId, "accept");
        toast.success(t("agencyBids.counterAccepted"));
        refetch();
      } catch {
        toast.error(t("agencyBids.counterAcceptFailed"));
      }
    }
  };

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return t("agencyBids.justNow");
    if (hours < 24) return t("agencyBids.hoursAgo", { count: hours });
    const days = Math.floor(hours / 24);
    return t("agencyBids.daysAgo", { count: days });
  }

  return (
    <div className="space-y-6">
      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.type === "withdraw" ? t("agencyBids.confirmWithdrawTitle") : t("agencyBids.confirmAcceptTitle")}
        description={confirmAction?.type === "withdraw" ? t("agencyBids.confirmWithdrawDesc") : t("agencyBids.confirmAcceptDesc")}
        confirmLabel={t("agencyBids.confirm")}
        cancelLabel={t("agencyBids.cancel")}
        variant={confirmAction?.type === "withdraw" ? "danger" : "warning"}
        onConfirm={executeConfirmedAction}
        onCancel={() => setConfirmAction(null)}
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cn.tealBg }}>
          <Gavel className="w-5 h-5" style={{ color: cn.teal }} />
        </div>
        <div>
          <h1 className="text-xl" style={{ color: cn.text }}>{t("agencyBids.title")}</h1>
          <p className="text-sm" style={{ color: cn.textSecondary }}>{t("agencyBids.subtitle")}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t("agencyBids.totalBids"), value: stats.total, color: cn.teal, bg: cn.tealBg },
          { label: t("agencyBids.pending"), value: stats.pending, color: cn.amber, bg: cn.amberBg },
          { label: t("agencyBids.needResponse"), value: stats.countered, color: cn.purple, bg: cn.purpleBg },
          { label: t("agencyBids.winRate"), value: `${stats.winRate}%`, color: cn.green, bg: cn.greenBg },
        ].map(s => (
          <div key={s.label} className="stat-card p-3 text-center">
            <p className="text-lg" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs" style={{ color: cn.textSecondary }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: cn.bgInput }}>
        {tabKeys.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-shrink-0 px-4 py-2.5 rounded-lg text-xs transition-all cn-touch-target"
            style={{
              background: activeTab === tab.key ? "white" : "transparent",
              color: activeTab === tab.key ? cn.text : cn.textSecondary,
              boxShadow: activeTab === tab.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {t(tab.labelKey)}
            {tab.key !== "all" && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]" style={{
                background: activeTab === tab.key ? cn.tealBg : cn.bgInput,
                color: activeTab === tab.key ? cn.teal : cn.textSecondary,
              }}>
                {tab.key === "pending" ? stats.pending : tab.key === "countered" ? stats.countered : tab.key === "accepted" ? stats.won : allBids?.filter(b => b.status === tab.key).length || 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bid Cards */}
      {loading ? <PageSkeleton /> : (
        <div className="space-y-3">
          {filteredBids.map(bid => {
            const sc = statusColors[bid.status];
            const StatusIcon = sc.icon;
            const isCountered = bid.status === "countered" && bid.counter_offer?.from === "patient";
            const expiryInfo = marketplaceService.getBidExpiryInfo(bid);
            const bidExpired = bid.status === "expired" || expiryInfo.expired;
            const expiryUrgent = !bidExpired && expiryInfo.remainingHours <= 6;

            return (
              <div key={bid.id} className={`stat-card p-4 space-y-3 ${bidExpired ? "opacity-60" : ""}`}>
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: cn.text }}>{t("agencyBids.bidOnContract", { id: bid.contract_id })}</p>
                    <p className="text-xs" style={{ color: cn.textSecondary }}>{t("agencyBids.submitted", { time: timeAgo(bid.created_at) })}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs flex items-center gap-1" style={{ background: sc.bg, color: sc.color }}>
                    <StatusIcon className="w-3 h-3" /> {t(statusLabelKeys[bid.status])}
                  </span>
                </div>

                {/* Bid Details */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: cn.textSecondary }}>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    ৳{(bid.proposed_pricing.base_price || 0).toLocaleString()}/{bid.proposed_pricing.pricing_model || "mo"}
                  </span>
                  {bid.proposed_staffing && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {t("agencyBids.level", { level: bid.proposed_staffing.required_level })}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> {t("agencyBids.score", { score: bid.compliance.overall_score })}
                  </span>
                  {/* Bid expiry countdown */}
                  {(bid.status === "pending" || bid.status === "countered") && (
                    <span className="flex items-center gap-1" style={{
                      color: bidExpired ? "#EF4444" : expiryUrgent ? "#E8A838" : cn.textSecondary,
                    }}>
                      <Timer className="w-3 h-3" />
                      {bidExpired
                        ? t("agencyBids.expired")
                        : expiryInfo.remainingHours <= 24
                          ? t("agencyBids.hLeft", { count: expiryInfo.remainingHours })
                          : t("agencyBids.dLeft", { count: Math.ceil(expiryInfo.remainingHours / 24) })}
                    </span>
                  )}
                </div>

                {/* Compliance mini bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: cn.bgInput }}>
                    <div className="h-full rounded-full" style={{
                      width: `${bid.compliance.overall_score}%`,
                      background: bid.compliance.overall_score >= 80 ? cn.green : bid.compliance.overall_score >= 60 ? cn.amber : cn.red,
                    }} />
                  </div>
                  <span className="text-[10px]" style={{ color: cn.textSecondary }}>
                    {t("agencyBids.metCount", { met: bid.compliance.met_count, total: bid.compliance.total_count })}
                  </span>
                </div>

                {/* Counter offer banner */}
                {isCountered && bid.counter_offer && (
                  <div className="p-3 rounded-xl" style={{ background: "rgba(123,94,167,0.08)", border: `1px solid rgba(123,94,167,0.2)` }}>
                    <p className="text-xs mb-1" style={{ color: cn.purple }}>
                      <RotateCcw className="w-3 h-3 inline mr-1" />
                      {t("agencyBids.guardianCounterOffer")}
                    </p>
                    <p className="text-xs" style={{ color: cn.text }}>"{bid.counter_offer.message}"</p>
                    {bid.counter_offer.pricing && (
                      <p className="text-xs mt-1" style={{ color: cn.textSecondary }}>
                        {t("agencyBids.proposed")}: ৳{(bid.counter_offer.pricing.base_price || 0).toLocaleString()}/{bid.counter_offer.pricing.pricing_model || "mo"}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${cn.borderLight}` }}>
                  <Link
                    to="/agency/care-requirement-board"
                    className="text-xs flex items-center gap-1 no-underline"
                    style={{ color: cn.teal }}
                  >
                    <Eye className="w-3 h-3" /> {t("agencyBids.viewRequest")}
                  </Link>

                  <div className="flex gap-2">
                    {isCountered && (
                      <>
                        {respondingTo === bid.id ? (
                          <div className="flex gap-2 items-center">
                            <input
                              value={counterMessage}
                              onChange={e => setCounterMessage(e.target.value)}
                              placeholder={t("agencyBids.counterPlaceholder")}
                              className="px-3 py-1.5 rounded-lg border text-xs w-48"
                              style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}
                            />
                            <button
                              onClick={() => handleRespondToCounter(bid.id)}
                              className="px-3 py-1.5 rounded-lg text-white text-xs"
                              style={{ background: "var(--cn-gradient-agency)" }}
                            >
                              <Send className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setRespondingTo(null)}
                              className="px-2 py-1.5 rounded-lg text-xs"
                              style={{ color: cn.textSecondary }}
                            >
                              {t("agencyBids.cancel")}
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleAcceptCounter(bid.id)}
                              className="px-3 py-1.5 rounded-lg text-xs text-white"
                              style={{ background: cn.green }}
                            >
                              {t("agencyBids.accept")}
                            </button>
                            <button
                              onClick={() => handleRejectCounter(bid.id)}
                              className="px-3 py-1.5 rounded-lg text-xs border"
                              style={{ borderColor: cn.border, color: cn.red }}
                            >
                              {t("agencyBids.decline")}
                            </button>
                            <button
                              onClick={() => setRespondingTo(bid.id)}
                              className="px-3 py-1.5 rounded-lg text-xs text-white"
                              style={{ background: "var(--cn-gradient-agency)" }}
                            >
                              {t("agencyBids.counter")}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                    {bid.status === "pending" && (
                      <button
                        onClick={() => handleWithdraw(bid.id)}
                        className="px-3 py-1.5 rounded-lg text-xs border"
                        style={{ borderColor: cn.border, color: cn.textSecondary }}
                      >
                        {t("agencyBids.withdraw")}
                      </button>
                    )}
                  </div>
                </div>

                {/* Message preview */}
                {bid.message && (
                  <p className="text-xs px-3 py-2 rounded-lg" style={{ background: cn.bgInput, color: cn.textSecondary }}>
                    <MessageSquare className="w-3 h-3 inline mr-1" /> {bid.message}
                  </p>
                )}
              </div>
            );
          })}

          {filteredBids.length === 0 && (
            <div className="text-center py-12">
              <Gavel className="w-12 h-12 mx-auto mb-3" style={{ color: cn.borderLight }} />
              <p className="text-sm" style={{ color: cn.textSecondary }}>
                {activeTab === "all" ? t("agencyBids.noBidsYet") : t("agencyBids.noBidsFilter", { status: activeTab })}
              </p>
              <Link to="/agency/care-requirement-board" className="inline-flex items-center gap-2 px-4 py-2 mt-3 rounded-xl text-white text-sm no-underline" style={{ background: "var(--cn-gradient-agency)" }}>
                {t("agencyBids.browseRequests")}
              </Link>
            </div>
          )}
        </div>
      )}
      <div ref={expiryLiveRef} className="sr-only" aria-live="assertive" aria-atomic="true" />
    </div>
  );
}