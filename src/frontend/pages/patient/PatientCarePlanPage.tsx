import { useTranslation } from "react-i18next";
import { useAsyncData, useDocumentTitle, useSection15PatientId } from "@/frontend/hooks";
import { section15Service } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { Section15PageLayout } from "@/frontend/components/shared/Section15PageLayout";
import { cn } from "@/frontend/theme/tokens";

export default function PatientCarePlanPage() {
  const { t } = useTranslation("common");
  useDocumentTitle(t("pageTitles.patientCarePlan", "Care plan"));
  const { patientId, loading: pidLoading } = useSection15PatientId();
  const { data, loading } = useAsyncData(
    () => (patientId ? section15Service.getCarePlan(patientId) : Promise.resolve([])),
    [patientId],
  );

  if (pidLoading || !patientId || loading || !data) return <PageSkeleton cards={3} />;

  return (
    <Section15PageLayout
      title={t("pageTitles.patientCarePlan", "Care plan")}
      subtitle={t("section15.carePlanSubtitle", "Goals and instructions from your guardian and care team.")}
    >
      <div className="space-y-3">
        {data.length === 0 ? (
          <p className="text-sm" style={{ color: cn.textSecondary }}>{t("section15.empty", "No entries yet.")}</p>
        ) : (
          data.map((p) => (
            <div key={p.id} className="finance-card p-4">
              <h2 className="text-sm font-medium mb-2" style={{ color: cn.text }}>{p.title}</h2>
              <p className="text-sm whitespace-pre-wrap" style={{ color: cn.textSecondary }}>{p.body}</p>
              <p className="text-xs mt-2" style={{ color: cn.textSecondary }}>Updated {new Date(p.updatedAt).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>
    </Section15PageLayout>
  );
}
