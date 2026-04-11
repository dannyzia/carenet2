import React, { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Search, Star, Shield, MapPin, Clock, Users, DollarSign, Package, ChevronRight, CheckCircle2, TrendingUp,
} from "lucide-react";
import { cn } from "@/frontend/theme/tokens";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import type { AgencyPackage, CareCategory } from "@/backend/models";
import { useTranslation } from "react-i18next";
import {
  categoryColors,
  categoryLabels,
  filterAgencyPackages,
  formatAgencyPackagePrice,
} from "./agencyPackageFormatters";

export interface AgencyPackageBrowseListProps {
  packages: AgencyPackage[] | undefined;
  loading: boolean;
  /** e.g. /guardian/marketplace/package */
  packageDetailPathPrefix: string;
  /** Browser history state for PackageDetailPage back link */
  listBackUrl: string;
}

export function AgencyPackageBrowseList({
  packages,
  loading,
  packageDetailPathPrefix,
  listBackUrl,
}: AgencyPackageBrowseListProps) {
  const { t } = useTranslation("common", { keyPrefix: "marketplacePackages" });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<CareCategory | "">("");

  const filtered = useMemo(
    () => filterAgencyPackages(packages || [], searchQuery, filterCategory),
    [packages, searchQuery, filterCategory],
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: cn.textSecondary }} />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm"
            style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as CareCategory | "")}
          className="px-3 py-2.5 rounded-xl border text-sm"
          style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}
          aria-label={t("categoryFilterAria")}
        >
          <option value="">{t("allCategories")}</option>
          {(Object.keys(categoryLabels) as CareCategory[]).map((k) => (
            <option key={k} value={k}>
              {t(`categories.${k}`, { defaultValue: categoryLabels[k] })}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <PageSkeleton />
      ) : (
        <div className="space-y-3">
          {filtered.map((pkg) => (
            <Link
              key={pkg.id}
              to={`${packageDetailPathPrefix}/${pkg.id}`}
              state={{ fromMarketplacePackages: listBackUrl }}
              className="block stat-card p-4 hover:shadow-md transition-shadow no-underline"
            >
              {pkg.featured && (
                <div className="flex items-center gap-1 mb-2">
                  <Star className="w-3 h-3" style={{ color: cn.amber }} />
                  <span className="text-xs" style={{ color: cn.amber }}>{t("featured")}</span>
                </div>
              )}
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-sm" style={{ color: cn.text }}>{pkg.meta.title}</h3>
                <span className="text-sm shrink-0" style={{ color: cn.green }}>{formatAgencyPackagePrice(pkg.pricing)}</span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[9px]"
                  style={{ background: "var(--cn-gradient-agency)" }}
                >
                  {pkg.agency_name.slice(0, 2)}
                </div>
                <span className="text-xs" style={{ color: cn.text }}>{pkg.agency_name}</span>
                {pkg.agency_verified && <Shield className="w-3 h-3" style={{ color: cn.teal }} />}
                {pkg.agency_rating != null && (
                  <span className="flex items-center gap-0.5 text-xs" style={{ color: cn.amber }}>
                    <Star className="w-3 h-3" /> {pkg.agency_rating}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {pkg.meta.category.map((cat) => {
                  const cc = categoryColors[cat];
                  return (
                    <span key={cat} className="px-2 py-0.5 rounded-full text-xs" style={{ background: cc.bg, color: cc.color }}>
                      {t(`categories.${cat}`, { defaultValue: categoryLabels[cat] })}
                    </span>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mb-3" style={{ color: cn.textSecondary }}>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> {(pkg.staffing.caregiver_count || 0) + (pkg.staffing.nurse_count || 0)} {t("staffSuffix")}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {pkg.schedule?.hours_per_day || 8}{t("hoursPerDaySuffix")}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {pkg.party.service_area?.slice(0, 2).join(", ")}
                  {(pkg.party.service_area?.length || 0) > 2 ? ` +${(pkg.party.service_area?.length || 0) - 2}` : ""}
                </span>
                {pkg.sla?.replacement_time_hours != null && (
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> {pkg.sla.replacement_time_hours}{t("replacementHoursSuffix")}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {[...(pkg.services?.personal_care || []), ...(pkg.services?.medical_support || [])].slice(0, 5).map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded-full text-xs" style={{ background: cn.bgInput, color: cn.textSecondary }}>{s}</span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${cn.border}` }}>
                <div className="flex items-center gap-3 text-xs" style={{ color: cn.textSecondary }}>
                  {pkg.compliance?.trial_available && (
                    <span className="flex items-center gap-1" style={{ color: cn.teal }}>
                      <CheckCircle2 className="w-3 h-3" /> {t("trialAvailable")}
                    </span>
                  )}
                  {!!pkg.subscribers && <span>{t("subscribersCount", { count: pkg.subscribers })}</span>}
                </div>
                <span className="flex items-center gap-1 text-xs" style={{ color: cn.green }}>
                  {t("viewDetails")} <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto mb-3" style={{ color: cn.borderLight }} />
              <p className="text-sm" style={{ color: cn.textSecondary }}>{t("emptyFiltered")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
