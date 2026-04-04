import { useTranslation } from "react-i18next";
import { Radio } from "lucide-react";
import { useAsyncData, useDocumentTitle, useSection15PatientId } from "@/frontend/hooks";
import { section15Service } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { Section15PageLayout } from "@/frontend/components/shared/Section15PageLayout";
import { cn } from "@/frontend/theme/tokens";

export default function GuardianLiveMonitorPage() {
  const { t } = useTranslation("common");
  useDocumentTitle(t("pageTitles.guardianLiveMonitor", "Live monitor"));
  const { patientId, loading: pidLoading } = useSection15PatientId();
  const { data: pings, loading: l1 } = useAsyncData(
    () => (patientId ? section15Service.getLocationPings(patientId) : Promise.resolve([])),
    [patientId],
  );
  const { data: cards, loading: l2 } = useAsyncData(
    () => (patientId ? section15Service.getScorecards(patientId, "guardian") : Promise.resolve([])),
    [patientId],
  );

  if (pidLoading || !patientId || l1 || l2 || !pings || !cards) return <PageSkeleton cards={4} />;

  const metrics = cards[0]?.metrics as Record<string, number> | undefined;

  return (
    <Section15PageLayout
      title={t("pageTitles.guardianLiveMonitor", "Live monitor")}
      subtitle={t("section15.liveMonitorSubtitle", "Snapshot of movement and quality signals.")}
    >
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="finance-card p-4 text-center">
          <Radio className="w-5 h-5 mx-auto mb-1" style={{ color: cn.pink }} aria-hidden="true" />
          <p className="text-lg font-semibold" style={{ color: cn.text }}>{pings.length}</p>
          <p className="text-xs" style={{ color: cn.textSecondary }}>{t("section15.pings24h", "Recent pings")}</p>
        </div>
        <div className="finance-card p-4 text-center">
          <p className="text-lg font-semibold" style={{ color: cn.text }}>{metrics?.onTimeShifts != null ? `${Math.round(metrics.onTimeShifts * 100)}%` : "—"}</p>
          <p className="text-xs" style={{ color: cn.textSecondary }}>{t("section15.onTime", "On-time shifts")}</p>
        </div>
      </div>
      {cards[0] ? (
        <div className="finance-card p-4">
          <p className="text-xs mb-2" style={{ color: cn.textSecondary }}>
            {cards[0].periodStart} → {cards[0].periodEnd}
          </p>
          <pre className="text-xs overflow-auto" style={{ color: cn.text }}>{JSON.stringify(cards[0].metrics, null, 2)}</pre>
        </div>
      ) : null}
    </Section15PageLayout>
  );
}
