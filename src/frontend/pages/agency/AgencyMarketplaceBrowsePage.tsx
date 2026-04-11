/**
 * Agency posted care requirements — browse open requests from guardians/patients and place bids.
 * (Agency care packages live under /agency/care-packages.)
 */
import { useState } from "react";
import { Link } from "react-router";
import {
  Search,
  Megaphone,
  AlertTriangle,
  Send,
  X,
  MessageSquare,
  Package,
} from "lucide-react";
import { cn } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { marketplaceService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useAriaToast } from "@/frontend/hooks/useAriaToast";
import type { CareContract, CareCategory, UCCFPricingRequest, StaffLevel } from "@/backend/models";
import { useTranslation } from "react-i18next";

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

const levelLabels: Record<StaffLevel, string> = { L1: "Caregiver", L2: "Trained", L3: "Nurse", L4: "ICU Nurse" };

function timeAgo(d: string) {
  const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AgencyMarketplaceBrowsePage() {
  const { t } = useTranslation("common", { keyPrefix: "agencyRequirementBoard" });
  const { t: tDoc } = useTranslation("common");
  useDocumentTitle(tDoc("pageTitles.agencyCareRequirementBoard", "Posted care requirements"));

  const [searchQ, setSearchQ] = useState("");
  const [filterCat, setFilterCat] = useState<CareCategory | "">("");
  const [expandedBidForm, setExpandedBidForm] = useState<string | null>(null);

  const { data: requests, loading: loadingReqs } = useAsyncData(() => marketplaceService.getCareRequests());

  const publishedRequests = (requests || []).filter((r) => ["published", "bidding"].includes(r.status));
  const filtered = publishedRequests.filter((r) => {
    if (searchQ) {
      const q = searchQ.toLowerCase();
      if (!r.meta.title.toLowerCase().includes(q) && !r.meta.location.city.toLowerCase().includes(q)) return false;
    }
    if (filterCat && !r.meta.category.includes(filterCat)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cn.tealBg }}>
              <Megaphone className="w-5 h-5" style={{ color: cn.teal }} />
            </div>
            <div>
              <h1 className="text-xl" style={{ color: cn.text }}>{t("title")}</h1>
              <p className="text-sm" style={{ color: cn.textSecondary }}>{t("subtitle")}</p>
            </div>
          </div>
          <Link
            to="/agency/care-packages"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium no-underline border cn-touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cn-teal)] focus-visible:ring-offset-2"
            style={{ borderColor: cn.border, color: cn.teal, background: cn.bgInput }}
          >
            <Package className="w-4 h-4" aria-hidden />
            {t("linkCarePackages")}
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: cn.textSecondary }} aria-hidden />
            <input
              type="search"
              placeholder={t("searchPlaceholder")}
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm"
              style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}
            />
          </div>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value as CareCategory | "")}
            className="px-3 py-2.5 rounded-xl border text-sm min-w-[8rem]"
            style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}
            aria-label={t("categoryFilterAria")}
          >
            <option value="">{t("allCategories")}</option>
            {Object.entries(categoryLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {loadingReqs ? (
          <PageSkeleton />
        ) : (
          <div className="space-y-3">
            {filtered.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                expandedBidForm={expandedBidForm}
                setExpandedBidForm={setExpandedBidForm}
              />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <Megaphone className="w-12 h-12 mx-auto mb-3" style={{ color: cn.borderLight }} aria-hidden />
                <p className="text-sm" style={{ color: cn.textSecondary }}>{t("empty")}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Expandable care request card with inline bid form */
function RequestCard({
  req,
  expandedBidForm,
  setExpandedBidForm,
}: {
  req: CareContract;
  expandedBidForm: string | null;
  setExpandedBidForm: (id: string | null) => void;
}) {
  const { t } = useTranslation("common", { keyPrefix: "agencyRequirementBoard" });
  const [bidPrice, setBidPrice] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [bidRemarks, setBidRemarks] = useState("");
  const isExpanded = expandedBidForm === req.id;
  const pricing = req.pricing as UCCFPricingRequest;
  const toast = useAriaToast();

  const handleSubmitBid = async () => {
    if (!bidPrice) {
      toast.error(t("bidPriceRequired"));
      return;
    }
    await marketplaceService.submitBid({
      contract_id: req.id,
      agency_id: "agency-001",
      agency_name: "HealthCare Pro BD",
      proposed_pricing: {
        base_price: +bidPrice,
        pricing_model: pricing.preferred_model || "monthly",
      },
      proposed_staffing: req.staffing,
      proposed_schedule: req.schedule,
      message: bidMessage,
      remarks: bidRemarks || undefined,
    });
    toast.success(t("bidSubmitted"));
    setExpandedBidForm(null);
    setBidPrice("");
    setBidMessage("");
    setBidRemarks("");
  };

  return (
    <div className="stat-card overflow-hidden">
      <div className="p-4">
        {req.care_subject?.risk_level === "high" && (
          <div className="flex items-center gap-1 mb-2">
            <AlertTriangle className="w-3 h-3" style={{ color: "#EF4444" }} aria-hidden />
            <span className="text-xs" style={{ color: "#EF4444" }}>{t("highRisk")}</span>
          </div>
        )}

        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-sm" style={{ color: cn.text }}>{req.meta.title}</h3>
          <span className="text-sm shrink-0" style={{ color: cn.green }}>
            ৳{pricing.budget_min?.toLocaleString()} - ৳{pricing.budget_max?.toLocaleString()}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {req.meta.category.map((c) => (
            <span
              key={c}
              className="px-2 py-0.5 rounded-full text-xs"
              style={{ background: categoryColors[c].bg, color: categoryColors[c].color }}
            >
              {categoryLabels[c]}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-xs">
          <div className="p-2 rounded-lg" style={{ background: cn.bgInput }}>
            <span className="block" style={{ color: cn.textSecondary }}>{t("staffLevel")}</span>
            <span style={{ color: cn.text }}>
              {req.staffing.required_level} ({levelLabels[req.staffing.required_level]})
            </span>
          </div>
          <div className="p-2 rounded-lg" style={{ background: cn.bgInput }}>
            <span className="block" style={{ color: cn.textSecondary }}>{t("schedule")}</span>
            <span style={{ color: cn.text }}>
              {req.schedule?.hours_per_day || 8}h/day {req.schedule?.shift_type || ""}
            </span>
          </div>
          <div className="p-2 rounded-lg" style={{ background: cn.bgInput }}>
            <span className="block" style={{ color: cn.textSecondary }}>{t("location")}</span>
            <span style={{ color: cn.text }}>{req.meta.location.area || req.meta.location.city}</span>
          </div>
          <div className="p-2 rounded-lg" style={{ background: cn.bgInput }}>
            <span className="block" style={{ color: cn.textSecondary }}>{t("duration")}</span>
            <span style={{ color: cn.text }}>{req.meta.duration_type.replace(/_/g, " ")}</span>
          </div>
        </div>

        {req.care_subject && (
          <div className="p-3 rounded-xl mb-3" style={{ background: cn.bgInput }}>
            <p className="text-xs" style={{ color: cn.textSecondary }}>
              {t("patientIntro", {
                age: req.care_subject.age,
                gender: req.care_subject.gender || "—",
                mobility: req.care_subject.mobility,
              })}
              {req.care_subject.cognitive && req.care_subject.cognitive !== "normal"
                ? t("cognitiveSuffix", { level: req.care_subject.cognitive })
                : null}
            </p>
            {req.care_subject.condition_summary && (
              <p className="text-xs mt-1" style={{ color: cn.text }}>{req.care_subject.condition_summary}</p>
            )}
          </div>
        )}

        {req.medical && (req.medical.devices?.length || req.medical.procedures_required?.length) ? (
          <div className="flex flex-wrap gap-1 mb-3">
            {req.medical.devices?.map((d) => (
              <span key={d} className="px-2 py-0.5 rounded-full text-xs" style={{ background: "rgba(239,68,68,0.08)", color: "#EF4444" }}>{d}</span>
            ))}
            {req.medical.procedures_required?.map((p) => (
              <span key={p} className="px-2 py-0.5 rounded-full text-xs" style={{ background: "rgba(232,168,56,0.08)", color: "#E8A838" }}>{p}</span>
            ))}
          </div>
        ) : null}

        <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${cn.border}` }}>
          <div className="flex items-center gap-3 text-xs" style={{ color: cn.textSecondary }}>
            <span>{t("postedAgo", { time: timeAgo(req.created_at) })}</span>
            {(req.bid_count || 0) > 0 && (
              <span className="flex items-center gap-1" style={{ color: cn.amber }}>
                <MessageSquare className="w-3 h-3" aria-hidden />
                {t("bidsCount", { count: req.bid_count || 0 })}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setExpandedBidForm(isExpanded ? null : req.id)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs text-white cn-touch-target"
            style={{ background: isExpanded ? cn.textSecondary : "var(--cn-gradient-agency)" }}
          >
            {isExpanded ? (
              <>
                <X className="w-3 h-3" aria-hidden />
                {t("closeBid")}
              </>
            ) : (
              <>
                <Send className="w-3 h-3" aria-hidden />
                {t("placeBid")}
              </>
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-3" style={{ background: cn.bgInput, borderTop: `1px solid ${cn.border}` }}>
          <h4 className="text-sm" style={{ color: cn.text }}>{t("submitBidTitle")}</h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: cn.textSecondary }}>{t("yourPriceLabel")}</label>
              <input
                type="number"
                value={bidPrice}
                onChange={(e) => setBidPrice(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border text-sm"
                style={{ borderColor: cn.border, color: cn.text, background: "white" }}
                placeholder={`${pricing.budget_min} - ${pricing.budget_max}`}
              />
            </div>
            <div className="flex items-end">
              <div className="p-2.5 rounded-xl text-xs w-full" style={{ background: "rgba(95,184,101,0.08)" }}>
                <span style={{ color: cn.textSecondary }}>{t("budgetRangeLabel")}</span>
                <span className="block" style={{ color: cn.green }}>
                  ৳{pricing.budget_min?.toLocaleString()} - ৳{pricing.budget_max?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: cn.textSecondary }}>{t("coverMessageLabel")}</label>
            <textarea
              value={bidMessage}
              onChange={(e) => setBidMessage(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border text-sm resize-none"
              style={{ borderColor: cn.border, color: cn.text, background: "white" }}
              placeholder={t("coverMessagePlaceholder")}
            />
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: cn.textSecondary }}>
              <AlertTriangle className="w-3 h-3 inline mr-1" style={{ color: "#E8A838" }} aria-hidden />
              {t("deviationRemarksLabel")}
            </label>
            <textarea
              value={bidRemarks}
              onChange={(e) => setBidRemarks(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border text-sm resize-none"
              style={{ borderColor: cn.border, color: cn.text, background: "white" }}
              placeholder={t("deviationPlaceholder")}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => void handleSubmitBid()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm cn-touch-target"
              style={{ background: "var(--cn-gradient-agency)" }}
            >
              <Send className="w-4 h-4" aria-hidden />
              {t("submitBid")}
            </button>
            <button
              type="button"
              onClick={() => setExpandedBidForm(null)}
              className="px-4 py-2.5 rounded-xl border text-sm cn-touch-target"
              style={{ borderColor: cn.border, color: cn.textSecondary }}
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
