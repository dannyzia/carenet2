import { Briefcase, Package } from "lucide-react";
import { cn } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { marketplaceService } from "@/backend/services";
import { AgencyPackageBrowseList } from "@/frontend/components/marketplace/AgencyPackageBrowseList";
import { useTranslation } from "react-i18next";

export default function CaregiverMarketplaceHubPage() {
  const { t: tDoc } = useTranslation("common");
  useDocumentTitle(tDoc("pageTitles.caregiverMarketplaceHub", "Care packages"));

  const { t } = useTranslation("common", { keyPrefix: "marketplacePackages" });
  const { data: packages, loading } = useAsyncData(() => marketplaceService.getAgencyPackages());

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cn.greenBg }}>
          <Briefcase className="w-5 h-5" style={{ color: cn.green }} />
        </div>
        <div>
          <h1 className="text-xl" style={{ color: cn.text }}>{t("caregiverHubTitle")}</h1>
          <p className="text-sm" style={{ color: cn.textSecondary }}>{t("caregiverHubSubtitle")}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm" style={{ color: cn.textSecondary }}>
        <Package className="w-4 h-4" aria-hidden />
        <span>{t("publishedPackagesHint")}</span>
      </div>

      <AgencyPackageBrowseList
        packages={packages}
        loading={loading}
        packageDetailPathPrefix="/caregiver/marketplace/package"
        listBackUrl="/caregiver/marketplace-hub"
      />
    </div>
  );
}
