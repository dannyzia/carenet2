import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { Package, Users, UserCircle } from "lucide-react";
import { cn } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { packageEngagementService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useTranslation } from "react-i18next";
import { Button } from "@/frontend/components/ui/button";

type LeadTab = "clients" | "caregivers";

export default function AgencyPackageLeadsPage() {
  const { t: tDoc } = useTranslation("common");
  useDocumentTitle(tDoc("pageTitles.agencyPackageLeads", "Package leads"));

  const { t } = useTranslation("common", { keyPrefix: "agencyPackageLeads" });
  const [searchParams] = useSearchParams();
  const tabFromUrl: LeadTab = searchParams.get("tab") === "caregivers" ? "caregivers" : "clients";
  const [tab, setTab] = useState<LeadTab>(tabFromUrl);
  useEffect(() => {
    setTab(tabFromUrl);
  }, [tabFromUrl]);

  const { data: clientLeads, loading: lc, refetch: rfC } = useAsyncData(
    () => packageEngagementService.listAgencyClientEngagements(),
    [],
  );
  const { data: cgLeads, loading: lg, refetch: rfG } = useAsyncData(
    () => packageEngagementService.listAgencyCaregiverEngagements(),
    [],
  );

  const acceptClient = async (id: string) => {
    await packageEngagementService.setClientEngagementStatus(id, "accepted");
    await rfC();
  };
  const declineClient = async (id: string) => {
    await packageEngagementService.setClientEngagementStatus(id, "declined");
    await rfC();
  };
  const acceptCg = async (id: string) => {
    await packageEngagementService.setCaregiverEngagementStatus(id, "accepted");
    await rfG();
  };
  const declineCg = async (id: string) => {
    await packageEngagementService.setCaregiverEngagementStatus(id, "declined");
    await rfG();
  };

  if (lc || lg || !clientLeads || !cgLeads) return <PageSkeleton cards={3} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cn.tealBg }}>
          <Package className="w-5 h-5" style={{ color: cn.teal }} />
        </div>
        <div>
          <h1 className="text-xl" style={{ color: cn.text }}>{t("title")}</h1>
          <p className="text-sm" style={{ color: cn.textSecondary }}>{t("subtitle")}</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-xl" style={{ background: cn.bgInput }}>
        <button
          type="button"
          onClick={() => setTab("clients")}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm cn-touch-target"
          style={{
            background: tab === "clients" ? "white" : "transparent",
            color: tab === "clients" ? cn.text : cn.textSecondary,
            boxShadow: tab === "clients" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}
        >
          <Users className="w-4 h-4" aria-hidden />
          {t("tabClients")}
        </button>
        <button
          type="button"
          onClick={() => setTab("caregivers")}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm cn-touch-target"
          style={{
            background: tab === "caregivers" ? "white" : "transparent",
            color: tab === "caregivers" ? cn.text : cn.textSecondary,
            boxShadow: tab === "caregivers" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}
        >
          <UserCircle className="w-4 h-4" aria-hidden />
          {t("tabCaregivers")}
        </button>
      </div>

      {tab === "clients" && (
        <div className="space-y-3">
          {clientLeads.length === 0 && (
            <p className="text-sm" style={{ color: cn.textSecondary }}>{t("emptyClients")}</p>
          )}
          {clientLeads.map((row) => (
            <div key={row.id} className="stat-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium" style={{ color: cn.text }}>{t("packageIdLabel", { id: row.package_contract_id.slice(0, 8) })}</p>
                <p className="text-xs" style={{ color: cn.textSecondary }}>{t("statusLabel", { status: row.status })}</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => void declineClient(row.id)}>{t("decline")}</Button>
                <Button type="button" size="sm" onClick={() => void acceptClient(row.id)}>{t("accept")}</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "caregivers" && (
        <div className="space-y-3">
          {cgLeads.length === 0 && (
            <p className="text-sm" style={{ color: cn.textSecondary }}>{t("emptyCaregivers")}</p>
          )}
          {cgLeads.map((row) => (
            <div key={row.id} className="stat-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium" style={{ color: cn.text }}>{t("packageIdLabel", { id: row.package_contract_id.slice(0, 8) })}</p>
                <p className="text-xs" style={{ color: cn.textSecondary }}>{t("statusLabel", { status: row.status })}</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => void declineCg(row.id)}>{t("decline")}</Button>
                <Button type="button" size="sm" onClick={() => void acceptCg(row.id)}>{t("accept")}</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
