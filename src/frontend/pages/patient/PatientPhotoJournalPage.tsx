import { useTranslation } from "react-i18next";
import { useAsyncData, useDocumentTitle, useSection15PatientId } from "@/frontend/hooks";
import { section15Service } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { Section15PageLayout } from "@/frontend/components/shared/Section15PageLayout";
import { cn } from "@/frontend/theme/tokens";

export default function PatientPhotoJournalPage() {
  const { t } = useTranslation("common");
  useDocumentTitle(t("pageTitles.patientPhotoJournal", "Photo journal"));
  const { patientId, loading: pidLoading } = useSection15PatientId();
  const { data, loading } = useAsyncData(
    () => (patientId ? section15Service.getPhotoJournal(patientId) : Promise.resolve([])),
    [patientId],
  );

  if (pidLoading || !patientId || loading || !data) return <PageSkeleton cards={3} />;

  return (
    <Section15PageLayout
      title={t("pageTitles.patientPhotoJournal", "Photo journal")}
      subtitle={t("section15.photoSubtitle", "Wound and condition photos with captions.")}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.length === 0 ? (
          <p className="text-sm col-span-full" style={{ color: cn.textSecondary }}>{t("section15.empty", "No entries yet.")}</p>
        ) : (
          data.map((p) => (
            <div key={p.id} className="finance-card overflow-hidden">
              <img src={p.imageUrl} alt="" className="w-full h-40 object-cover" />
              <div className="p-3">
                <p className="text-xs mb-1" style={{ color: cn.textSecondary }}>{new Date(p.loggedAt).toLocaleString()}</p>
                <p className="text-sm" style={{ color: cn.text }}>{p.caption}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Section15PageLayout>
  );
}
