import { useTranslation } from "react-i18next";
import { useAsyncData, useDocumentTitle, useSection15PatientId } from "@/frontend/hooks";
import { section15Service } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { Section15PageLayout } from "@/frontend/components/shared/Section15PageLayout";
import { cn } from "@/frontend/theme/tokens";

export default function AgencyCareScorecardPage() {
  const { t } = useTranslation("common");
  useDocumentTitle(t("pageTitles.agencyCareScorecard", "Care scorecard"));
  const { patientId, loading: pidLoading } = useSection15PatientId();
  const { data, loading } = useAsyncData(
    () => (patientId ? section15Service.getScorecards(patientId, "agency") : Promise.resolve([])),
    [patientId],
  );

  if (pidLoading || !patientId || loading || !data) return <PageSkeleton cards={3} />;

  return (
    <Section15PageLayout
      title={t("pageTitles.agencyCareScorecard", "Care scorecard")}
      subtitle={t("section15.agencyScorecardSubtitle", "Agency lens on placement quality (?patientId= for a specific client).")}
    >
      <div className="space-y-3">
        {data.length === 0 ? (
          <p className="text-sm" style={{ color: cn.textSecondary }}>{t("section15.empty", "No entries yet.")}</p>
        ) : (
          data.map((c) => (
            <div key={c.id} className="finance-card p-4">
              <p className="text-xs mb-2" style={{ color: cn.textSecondary }}>{c.periodStart} → {c.periodEnd}</p>
              <pre className="text-xs overflow-auto whitespace-pre-wrap" style={{ color: cn.text }}>{JSON.stringify(c.metrics, null, 2)}</pre>
            </div>
          ))
        )}
      </div>
    </Section15PageLayout>
  );
}
