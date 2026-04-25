import React, { useState } from "react";
import {
  Briefcase,
  Megaphone,
  Package,
  MapPin,
  Clock,
  DollarSign,
} from "lucide-react";
import { cn } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { marketplaceService } from "@/backend/services";
import { AgencyPackageBrowseList } from "@/frontend/components/marketplace/AgencyPackageBrowseList";
import {
  categoryColors,
  categoryLabels,
} from "@/frontend/components/marketplace/agencyPackageFormatters";
import type { CareContract, CareCategory } from "@/backend/models";
import { useTranslation } from "react-i18next";

type I18nT = ReturnType<typeof useTranslation>["t"];

type Tab = "packages" | "requests";

const OPEN_STATUSES: string[] = ["published", "bidding"];

export default function CaregiverMarketplaceHubPage() {
  const { t: tDoc } = useTranslation("common");
  useDocumentTitle(tDoc("pageTitles.caregiverMarketplaceHub", "Care packages"));

  const { t } = useTranslation("common", { keyPrefix: "marketplacePackages" });
  const { data: packages, loading } = useAsyncData(() =>
    marketplaceService.getAgencyPackages(),
  );
  const { data: allRequests, loading: loadingReqs } = useAsyncData(() =>
    marketplaceService.getCareRequests(),
  );

  const [tab, setTab] = useState<Tab>("packages");

  // Only show open (published / bidding) care requests
  const requests = (allRequests || []).filter(
    (r) => OPEN_STATUSES.includes(r.status) && r.meta?.type === "request",
  );

  const tabs: { key: Tab; label: string; icon: typeof Package }[] = [
    {
      key: "packages",
      label: t("tabAgencyPackages", "Agency Packages"),
      icon: Package,
    },
    {
      key: "requests",
      label: t("tabCareRequests", "Care Requests"),
      icon: Megaphone,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: cn.greenBg }}
        >
          <Briefcase className="w-5 h-5" style={{ color: cn.green }} />
        </div>
        <div>
          <h1 className="text-xl" style={{ color: cn.text }}>
            {t("caregiverHubTitle")}
          </h1>
          <p className="text-sm" style={{ color: cn.textSecondary }}>
            {t("caregiverHubSubtitle")}
          </p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map((tb) => {
          const isActive = tab === tb.key;
          const Icon = tb.icon;
          return (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className="px-3 py-2 rounded-lg text-sm whitespace-nowrap flex items-center gap-1.5 cn-touch-target"
              style={{
                background: isActive ? cn.greenBg : "transparent",
                color: isActive ? cn.green : cn.textSecondary,
              }}
            >
              <Icon className="w-4 h-4" aria-hidden />
              {tb.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab: Agency Packages ── */}
      {tab === "packages" && (
        <>
          <div
            className="flex items-center gap-2 text-sm"
            style={{ color: cn.textSecondary }}
          >
            <Package className="w-4 h-4" aria-hidden />
            <span>{t("publishedPackagesHint")}</span>
          </div>

          <AgencyPackageBrowseList
            packages={packages ?? undefined}
            loading={loading}
            packageDetailPathPrefix="/caregiver/marketplace/package"
            listBackUrl="/caregiver/marketplace-hub"
          />
        </>
      )}

      {/* ── Tab: Care Requests ── */}
      {tab === "requests" && (
        <>
          <div
            className="flex items-center gap-2 text-sm"
            style={{ color: cn.textSecondary }}
          >
            <Megaphone className="w-4 h-4" aria-hidden />
            <span>
              {t(
                "careRequestsHint",
                "Open care requests from guardians in your area",
              )}
            </span>
          </div>

          {loadingReqs ? (
            <div className="finance-card p-8 text-center">
              <p className="text-sm" style={{ color: cn.textSecondary }}>
                {t("loading", "Loading…")}
              </p>
            </div>
          ) : requests.length === 0 ? (
            <div className="finance-card p-8 text-center">
              <Megaphone
                className="w-8 h-8 mx-auto mb-2"
                style={{ color: cn.textSecondary }}
              />
              <p className="text-sm" style={{ color: cn.textSecondary }}>
                {t(
                  "noCareRequests",
                  "No open care requests right now. Check back later!",
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <CareRequestCard key={req.id} request={req} t={t} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Inline care-request card (kept in this file for simplicity) ─── */

function CareRequestCard({ request, t }: { request: CareContract; t: I18nT }) {
  const pricing = request.pricing;
  const budgetMin = "budget_min" in pricing ? pricing.budget_min : undefined;
  const budgetMax = "budget_max" in pricing ? pricing.budget_max : undefined;
  const preferredModel =
    ("preferred_model" in pricing && pricing.preferred_model) || "monthly";
  const modelSuffix =
    preferredModel === "monthly"
      ? "mo"
      : preferredModel === "daily"
        ? "day"
        : "hr";

  const location = request.meta?.location;
  const locationLabel = [location?.area, location?.city]
    .filter(Boolean)
    .join(", ");

  const schedule = request.schedule;
  const scheduleLabel =
    schedule?.hours_per_day != null
      ? `${schedule.hours_per_day}h/${t("day", "day")}`
      : request.meta?.duration_type
        ? t(
            `duration_${request.meta.duration_type}`,
            request.meta.duration_type,
          )
        : null;

  return (
    <div className="stat-card p-4 space-y-3">
      {/* Title + Status */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm" style={{ color: cn.text }}>
          {request.meta?.title || t("untitledRequest", "Untitled Request")}
        </h3>
        <span
          className="px-2 py-0.5 rounded-full text-xs shrink-0"
          style={{ background: cn.amberBg, color: cn.amber }}
        >
          {request.status}
        </span>
      </div>

      {/* Category badges */}
      <div className="flex flex-wrap gap-1.5">
        {(request.meta?.category || []).map((cat) => {
          const cc = categoryColors[cat];
          return (
            <span
              key={cat}
              className="px-2 py-0.5 rounded-full text-xs"
              style={{ background: cc?.bg, color: cc?.color }}
            >
              {t(`categories.${cat}`, categoryLabels[cat] || cat)}
            </span>
          );
        })}
      </div>

      {/* Budget */}
      {(budgetMin != null || budgetMax != null) && (
        <div
          className="flex items-center gap-1.5 text-sm"
          style={{ color: cn.green }}
        >
          <DollarSign className="w-4 h-4" aria-hidden />
          <span>
            ৳{budgetMin?.toLocaleString() ?? "—"} – ৳
            {budgetMax?.toLocaleString() ?? "—"}
            <span className="text-xs">/{modelSuffix}</span>
          </span>
        </div>
      )}

      {/* Location + Schedule row */}
      <div
        className="flex flex-wrap gap-x-4 gap-y-1 text-xs"
        style={{ color: cn.textSecondary }}
      >
        {locationLabel && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" aria-hidden />
            {locationLabel}
          </span>
        )}
        {scheduleLabel && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" aria-hidden />
            {scheduleLabel}
          </span>
        )}
        {request.meta?.start_date && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" aria-hidden />
            {t("starts", "Starts")}{" "}
            {new Date(request.meta.start_date).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Informational note */}
      <div
        className="text-xs p-2 rounded-lg"
        style={{ background: cn.blueBg, color: cn.blue }}
      >
        {t(
          "careRequestApplyHint",
          "To apply, find a matching agency package and apply through your agency.",
        )}
      </div>
    </div>
  );
}
