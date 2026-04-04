import { useTranslation } from "react-i18next";
import { useAsyncData, useDocumentTitle, useSection15PatientId } from "@/frontend/hooks";
import { section15Service } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { Section15PageLayout } from "@/frontend/components/shared/Section15PageLayout";
import { Section15SymptomForm } from "@/frontend/components/shared/Section15SymptomForm";
import { cn } from "@/frontend/theme/tokens";

export default function PatientSymptomsPage() {
  const { t } = useTranslation("common");
  useDocumentTitle(t("pageTitles.patientSymptoms", "Symptom journal"));
  const { patientId, loading: pidLoading } = useSection15PatientId();
  const { data, loading, refetch } = useAsyncData(
    () => (patientId ? section15Service.getSymptoms(patientId) : Promise.resolve([])),
    [patientId],
  );

  if (pidLoading || !patientId || loading || !data) return <PageSkeleton cards={3} />;

  return (
    <Section15PageLayout
      title={t("pageTitles.patientSymptoms", "Symptom journal")}
      subtitle={t("section15.symptomsSubtitle", "Pain and symptom log over time.")}
    >
      <Section15SymptomForm patientId={patientId} onSaved={refetch} />
      <div className="space-y-3">
        {data.length === 0 ? (
          <p className="text-sm" style={{ color: cn.textSecondary }}>{t("section15.empty", "No entries yet.")}</p>
        ) : (
          data.map((s) => (
            <div key={s.id} className="finance-card p-4">
              <p className="text-xs mb-1" style={{ color: cn.textSecondary }}>
                {new Date(s.loggedAt).toLocaleString()} · {t("section15.severityShort", "Severity")} {s.severity}/10
              </p>
              <p className="text-sm" style={{ color: cn.text }}>{s.notes}</p>
            </div>
          ))
        )}
      </div>
    </Section15PageLayout>
  );
}
