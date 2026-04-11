/**
 * GuardianMarketplaceHubPage — Unified marketplace view for guardians
 * Two tabs at same level:
 *   1. "My Posted Jobs" — care requests with incoming bids
 *   2. "Browse Packages" — agency-published service packages to pick
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  Megaphone, Package, Plus, ChevronRight, Star, Shield, MapPin,
  Clock, Users, DollarSign, MessageSquare,
  CheckCircle2, Briefcase,
  RefreshCw, Timer,
} from "lucide-react";
import { cn } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle, useCareSeekerBasePath } from "@/frontend/hooks";
import { marketplaceService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { AgencyPackageBrowseList } from "@/frontend/components/marketplace/AgencyPackageBrowseList";
import type { CareContract, CareCategory, UCCFPricingRequest, UCCFPricingOffer } from "@/backend/models";
import { useAriaToast } from "@/frontend/hooks/useAriaToast";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/frontend/auth/AuthContext";
import { USE_SUPABASE } from "@/backend/services/supabase";
import { subscribeToCareContractBids } from "@/backend/services/realtime";

type Tab = "my_jobs" | "packages";

const categoryLabels: Record<CareCategory, string> = {
  elderly: "Elderly Care",
  post_surgery: "Post-Surgery",
  chronic: "Chronic Care",
  critical: "Critical/ICU",
  baby: "Baby Care",
  disability: "Disability",
};

const categoryColors: Record<CareCategory, { color: string; bg: string }> = {
  elderly: { color: "#7B5EA7", bg: "rgba(123,94,167,0.12)" },
  post_surgery: { color: "#0288D1", bg: "rgba(2,136,209,0.12)" },
  chronic: { color: "#E8A838", bg: "rgba(232,168,56,0.12)" },
  critical: { color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  baby: { color: "#DB869A", bg: "rgba(219,134,154,0.12)" },
  disability: { color: "#00897B", bg: "rgba(0,137,123,0.12)" },
};

const statusStyles: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "#6B7280", bg: "rgba(107,114,128,0.12)" },
  published: { label: "Published", color: "#0288D1", bg: "rgba(2,136,209,0.12)" },
  bidding: { label: "Bids Active", color: "#E8A838", bg: "rgba(232,168,56,0.12)" },
  locked: { label: "Locked", color: "#7B5EA7", bg: "rgba(123,94,167,0.12)" },
  booked: { label: "Booked", color: "#5FB865", bg: "rgba(95,184,101,0.12)" },
  active: { label: "Active Care", color: "#00897B", bg: "rgba(0,137,123,0.12)" },
  completed: { label: "Completed", color: "#2E7D32", bg: "rgba(46,125,50,0.12)" },
  cancelled: { label: "Expired", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  rated: { label: "Rated", color: "#2E7D32", bg: "rgba(46,125,50,0.12)" },
};

function formatPrice(pricing: UCCFPricingRequest | UCCFPricingOffer): string {
  if ("budget_min" in pricing && pricing.budget_min != null) {
    const model = ("preferred_model" in pricing && pricing.preferred_model) || "monthly";
    return `৳${(pricing.budget_min || 0).toLocaleString()} - ৳${(pricing.budget_max || 0).toLocaleString()}/${model === "monthly" ? "mo" : model === "daily" ? "day" : "hr"}`;
  }
  if ("base_price" in pricing && pricing.base_price != null) {
    const model = pricing.pricing_model || "monthly";
    return `৳${pricing.base_price.toLocaleString()}/${model === "monthly" ? "mo" : model === "daily" ? "day" : "hr"}`;
  }
  return "Contact for pricing";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function GuardianMarketplaceHubPage() {
  const { t: tDocTitle } = useTranslation("common");
  const { t } = useTranslation("guardian");
  useDocumentTitle(tDocTitle("pageTitles.guardianMarketplaceHub", "Guardian Marketplace Hub"));

  const { user } = useAuth();
  const toast = useAriaToast();
  const navigate = useNavigate();
  const base = useCareSeekerBasePath();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl: Tab = searchParams.get("tab") === "packages" ? "packages" : "my_jobs";
  const [activeTab, setActiveTab] = useState<Tab>(tabFromUrl);

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const selectTab = useCallback(
    (tab: Tab) => {
      setActiveTab(tab);
      setSearchParams(
        (p) => {
          const n = new URLSearchParams(p);
          if (tab === "packages") n.set("tab", "packages");
          else n.delete("tab");
          return n;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );
  const { data: myRequests, loading: loadingReqs, refetch: refetchMyRequests } = useAsyncData(() =>
    marketplaceService.getMyRequests(),
    []
  );

  const myRequestIds = useMemo(() => (myRequests ?? []).map((r) => r.id).filter(Boolean), [myRequests]);
  const myRequestIdsKey = myRequestIds.join(",");

  useEffect(() => {
    if (!USE_SUPABASE || !user?.id || myRequestIds.length === 0) return;
    return subscribeToCareContractBids(myRequestIds, user.id, (payload) => {
      void refetchMyRequests();
      if (payload.eventType === "INSERT") {
        toast.success(t("marketplace.newBidToast"));
      }
    });
  }, [user?.id, myRequestIdsKey, myRequestIds, refetchMyRequests, toast, t]);
  const { data: packages, loading: loadingPkgs } = useAsyncData(() =>
    marketplaceService.getAgencyPackages()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cn.greenBg }}>
            <Briefcase className="w-5 h-5" style={{ color: cn.green }} />
          </div>
          <div>
            <h1 className="text-xl" style={{ color: cn.text }}>Care Marketplace</h1>
            <p className="text-sm" style={{ color: cn.textSecondary }}>Post requirements or browse agency packages</p>
          </div>
        </div>
        <Link
          to={`${base}/care-requirement-wizard?direct=true`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm no-underline"
          style={{ background: "var(--cn-gradient-guardian)" }}
        >
          <Plus className="w-4 h-4" /> Post Care Requirement
        </Link>
      </div>

      {/* Tab Switcher — equal-level tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: cn.bgInput }}>
        {([
          { key: "my_jobs" as Tab, label: "My Posted Jobs", icon: Megaphone, count: myRequests?.length || 0 },
          { key: "packages" as Tab, label: "Agency Packages", icon: Package, count: packages?.length || 0 },
        ]).map((tab) => (
          <button
            type="button"
            key={tab.key}
            onClick={() => selectTab(tab.key)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm transition-all cn-touch-target"
            style={{
              background: activeTab === tab.key ? "white" : "transparent",
              color: activeTab === tab.key ? cn.text : cn.textSecondary,
              boxShadow: activeTab === tab.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{
              background: activeTab === tab.key ? cn.greenBg : cn.bgInput,
              color: activeTab === tab.key ? cn.green : cn.textSecondary,
            }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* ─── Tab: My Posted Jobs ─── */}
      {activeTab === "my_jobs" && (
        <div className="space-y-4">
          {loadingReqs ? <PageSkeleton /> : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Requests", value: myRequests?.length || 0, color: cn.green, bg: cn.greenBg },
                  { label: "Receiving Bids", value: myRequests?.filter((r) => r.status === "bidding").length || 0, color: cn.amber, bg: cn.amberBg },
                  { label: "Total Bids", value: myRequests?.reduce((sum, r) => sum + (r.bid_count || 0), 0) || 0, color: "#0288D1", bg: "rgba(2,136,209,0.12)" },
                  { label: "Active Care", value: myRequests?.filter((r) => r.status === "active").length || 0, color: cn.teal, bg: cn.tealBg },
                ].map((s) => (
                  <div key={s.label} className="stat-card p-3 text-center">
                    <p className="text-lg" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs" style={{ color: cn.textSecondary }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Request Cards */}
              <div className="space-y-3">
                {myRequests?.map((req) => {
                  const st = statusStyles[req.status] || statusStyles.draft;
                  const expiry = marketplaceService.getExpiryInfo(req);
                  const isTaken = ["locked", "booked", "active", "completed", "rated"].includes(req.status);
                  const isExpiredOrCancelled = req.status === "cancelled";
                  const canRepost = isTaken || isExpiredOrCancelled;
                  const isLive = ["published", "bidding"].includes(req.status);
                  return (
                    <div key={req.id} className="stat-card hover:shadow-md transition-shadow">
                      <Link
                        to={`${base}/bid-review/${req.id}`}
                        className="block p-4 no-underline"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="text-sm" style={{ color: cn.text }}>{req.meta.title}</h3>
                          <span className="px-2 py-0.5 rounded-full text-xs shrink-0" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {req.meta.category.map((cat) => {
                            const cc = categoryColors[cat];
                            return (
                              <span key={cat} className="px-2 py-0.5 rounded-full text-xs" style={{ background: cc.bg, color: cc.color }}>
                                {categoryLabels[cat]}
                              </span>
                            );
                          })}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mb-3" style={{ color: cn.textSecondary }}>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {req.meta.location.area || req.meta.location.city}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {req.schedule?.hours_per_day || 8}h/{req.meta.duration_type}</span>
                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {formatPrice(req.pricing)}</span>
                        </div>
                        <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${cn.border}` }}>
                          <div className="flex items-center gap-3 text-xs" style={{ color: cn.textSecondary }}>
                            <span>Posted {timeAgo(req.created_at)}</span>
                            {(req.bid_count || 0) > 0 && (
                              <span className="flex items-center gap-1" style={{ color: cn.amber }}>
                                <MessageSquare className="w-3 h-3" /> {req.bid_count} bid{req.bid_count !== 1 ? "s" : ""}
                              </span>
                            )}
                            {/* Expiry timer for live requests */}
                            {isLive && !expiry.expired && (
                              <span className="flex items-center gap-1" style={{ color: expiry.remainingDays <= 3 ? "#EF4444" : cn.textSecondary }}>
                                <Timer className="w-3 h-3" />
                                {expiry.remainingDays}d left
                              </span>
                            )}
                          </div>
                          <span className="flex items-center gap-1 text-xs" style={{ color: cn.green }}>
                            View <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </Link>

                      {req.status === "active" && (
                        <div className="px-4 pb-3">
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              try {
                                await marketplaceService.markCareContractCompleted(req.id);
                                toast.success(t("marketplace.careMarkedComplete"));
                                await refetchMyRequests();
                              } catch (err) {
                                toast.error(err instanceof Error ? err.message : t("marketplace.repostFailed"));
                              }
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium cn-touch-target"
                            style={{ background: `${cn.teal}18`, color: cn.teal }}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden />
                            {t("marketplace.markCareComplete")}
                          </button>
                        </div>
                      )}

                      {/* Re-post button for taken/expired jobs */}
                      {canRepost && (
                        <div className="px-4 pb-4 -mt-1">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await marketplaceService.repostCareRequest(req.id);
                                toast.success("Job re-posted to marketplace!");
                                navigate(0 as any); // refresh
                              } catch {
                                toast.error("Failed to re-post");
                              }
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs transition-colors"
                            style={{ background: cn.bgInput, color: cn.green }}
                          >
                            <RefreshCw className="w-3 h-3" /> Re-post to Marketplace
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {myRequests?.length === 0 && (
                  <div className="text-center py-12">
                    <Megaphone className="w-12 h-12 mx-auto mb-3" style={{ color: cn.borderLight }} />
                    <p className="text-sm" style={{ color: cn.textSecondary }}>No care requirements posted yet</p>
                    <Link to="/guardian/care-requirement-wizard?direct=true" className="inline-flex items-center gap-2 px-4 py-2 mt-3 rounded-xl text-white text-sm no-underline" style={{ background: "var(--cn-gradient-guardian)" }}>
                      <Plus className="w-4 h-4" /> Post Your First Requirement
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── Tab: Browse Agency Packages ─── */}
      {activeTab === "packages" && (
        <AgencyPackageBrowseList
          packages={packages}
          loading={loadingPkgs}
          packageDetailPathPrefix={`${base}/marketplace/package`}
          listBackUrl={`${base}/marketplace-hub?tab=packages`}
        />
      )}
    </div>
  );
}
