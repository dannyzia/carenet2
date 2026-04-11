/**
 * Agency care package catalog — published/draft offers only (separate from posted care requirements).
 */
import { Link } from "react-router";
import { Package, Plus } from "lucide-react";
import { cn } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { marketplaceService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import type { CareCategory } from "@/backend/models";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/frontend/auth/AuthContext";

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

export default function AgencyPackageCatalogPage() {
  const { t } = useTranslation("common", { keyPrefix: "agencyPackageCatalog" });
  const { t: tDoc } = useTranslation("common");
  useDocumentTitle(tDoc("pageTitles.agencyCarePackageCatalog", "Care package catalog"));

  const { user } = useAuth();
  const agencyOwnerId = user?.id ?? "agency-001";

  const { data: myPackages, loading } = useAsyncData(
    () => marketplaceService.getMyPackages(agencyOwnerId),
    [agencyOwnerId],
  );

  if (loading || !myPackages) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cn.purpleBg }}>
            <Package className="w-5 h-5" style={{ color: cn.purple }} />
          </div>
          <div>
            <h1 className="text-xl" style={{ color: cn.text }}>{t("title")}</h1>
            <p className="text-sm" style={{ color: cn.textSecondary }}>{t("subtitle")}</p>
          </div>
        </div>
        <Link
          to="/agency/package-create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium no-underline cn-touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cn-purple)] focus-visible:ring-offset-2"
          style={{ background: "var(--cn-gradient-agency)" }}
        >
          <Plus className="w-4 h-4" aria-hidden />
          {t("createCta")}
        </Link>
      </div>

      <div className="space-y-4">
        {myPackages.map((pkg) => (
          <div key={pkg.id} className="stat-card p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-sm font-medium" style={{ color: cn.text }}>{pkg.meta.title}</h3>
              <span
                className="px-2 py-0.5 rounded-full text-xs shrink-0"
                style={{
                  background: pkg.status === "published" ? cn.greenBg : cn.bgInput,
                  color: pkg.status === "published" ? cn.green : cn.textSecondary,
                }}
              >
                {pkg.status === "published" ? t("statusLive") : pkg.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {pkg.meta.category.map((c) => (
                <span
                  key={c}
                  className="px-2 py-0.5 rounded-full text-xs"
                  style={{ background: categoryColors[c].bg, color: categoryColors[c].color }}
                >
                  {categoryLabels[c]}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: cn.textSecondary }}>
              <span>
                ৳{pkg.pricing.base_price?.toLocaleString()}/{pkg.pricing.pricing_model}
              </span>
              <span>{(pkg.staffing.caregiver_count || 0) + (pkg.staffing.nurse_count || 0)} staff</span>
              <span>
                {t("subscribersCount", { count: pkg.subscribers || 0 })}
              </span>
            </div>
          </div>
        ))}
        {myPackages.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto mb-3" style={{ color: cn.borderLight }} aria-hidden />
            <p className="text-sm mb-3" style={{ color: cn.textSecondary }}>{t("empty")}</p>
            <Link
              to="/agency/package-create"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm no-underline"
              style={{ background: "var(--cn-gradient-agency)" }}
            >
              <Plus className="w-4 h-4" aria-hidden />
              {t("createFirst")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
