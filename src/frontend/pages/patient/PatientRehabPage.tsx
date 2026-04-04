import { useTranslation } from "react-i18next";
import { useAsyncData, useDocumentTitle, useSection15PatientId } from "@/frontend/hooks";
import { section15Service } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { Section15PageLayout } from "@/frontend/components/shared/Section15PageLayout";
import { cn } from "@/frontend/theme/tokens";

export default function PatientRehabPage() {
  const { t } = useTranslation("common");
  useDocumentTitle(t("pageTitles.patientRehab", "Rehabilitation"));
  const { patientId, loading: pidLoading } = useSection15PatientId();
  const { data, loading } = useAsyncData(
    () => (patientId ? section15Service.getRehab(patientId) : Promise.resolve([])),
    [patientId],
  );

  if (pidLoading || !patientId || loading || !data) return <PageSkeleton cards={3} />;

  return (
    <Section15PageLayout
      title={t("pageTitles.patientRehab", "Rehabilitation")}
      subtitle={t("section15.rehabSubtitle", "Exercise and therapy sessions.")}
    >
      <div className="space-y-3">
        {data.length === 0 ? (
          <p className="text-sm" style={{ color: cn.textSecondary }}>{t("section15.empty", "No entries yet.")}</p>
        ) : (
          data.map((r) => (
            <div key={r.id} className="finance-card p-4">
              <p className="text-sm font-medium" style={{ color: cn.text }}>{r.activity}</p>
              <p className="text-xs" style={{ color: cn.textSecondary }}>{r.durationMins} min · {new Date(r.loggedAt).toLocaleString()}</p>
              {r.notes ? <p className="text-sm mt-2" style={{ color: cn.text }}>{r.notes}</p> : null}
            </div>
          ))
        )}
      </div>
    </Section15PageLayout>
  );
}
