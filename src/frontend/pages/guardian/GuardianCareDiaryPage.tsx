import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useAsyncData, useDocumentTitle, useSection15PatientId } from "@/frontend/hooks";
import { section15Service } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { Section15PageLayout } from "@/frontend/components/shared/Section15PageLayout";
import { Section15CareDiaryForm } from "@/frontend/components/shared/Section15CareDiaryForm";
import { cn } from "@/frontend/theme/tokens";

export default function GuardianCareDiaryPage() {
  const { t } = useTranslation("common");
  useDocumentTitle(t("pageTitles.guardianCareDiary", "Care diary"));
  const { patientId, loading: pidLoading } = useSection15PatientId();
  const { data, loading, refetch } = useAsyncData(
    () => (patientId ? section15Service.getCareDiary(patientId) : Promise.resolve([])),
    [patientId],
  );

  if (pidLoading || !patientId || loading || !data) return <PageSkeleton cards={4} />;

  return (
    <Section15PageLayout
      title={t("pageTitles.guardianCareDiary", "Care diary")}
      subtitle={t("section15.guardianCareDiarySubtitle", "Use ?patientId= to switch patients when you manage more than one.")}
    >
      <p className="text-xs -mt-2 mb-2">
        <Link to={`/patient/care-log?patientId=${patientId}`} className="underline" style={{ color: cn.teal }}>
          {t("section15.openPatientView", "Open patient view")}
        </Link>
      </p>
      <Section15CareDiaryForm patientId={patientId} onSaved={refetch} />
      <div className="space-y-3">
        {data.length === 0 ? (
          <p className="text-sm" style={{ color: cn.textSecondary }}>{t("section15.empty", "No entries yet.")}</p>
        ) : (
          data.map((e) => (
            <div key={e.id} className="finance-card p-4">
              <p className="text-xs mb-1" style={{ color: cn.textSecondary }}>{e.entryDate}{e.mood ? ` · ${e.mood}` : ""}</p>
              <p className="text-sm whitespace-pre-wrap" style={{ color: cn.text }}>{e.body}</p>
            </div>
          ))
        )}
      </div>
    </Section15PageLayout>
  );
}
