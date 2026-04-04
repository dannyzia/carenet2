import { useTranslation } from "react-i18next";
import { useAsyncData, useDocumentTitle, useSection15PatientId } from "@/frontend/hooks";
import { section15Service } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { Section15PageLayout } from "@/frontend/components/shared/Section15PageLayout";
import { Section15FamilyBoardForm } from "@/frontend/components/shared/Section15FamilyBoardForm";
import { cn } from "@/frontend/theme/tokens";

export default function GuardianFamilyBoardPage() {
  const { t } = useTranslation("common");
  useDocumentTitle(t("pageTitles.guardianFamilyBoard", "Family board"));
  const { patientId, loading: pidLoading } = useSection15PatientId();
  const { data, loading, refetch } = useAsyncData(
    () => (patientId ? section15Service.getFamilyBoard(patientId) : Promise.resolve([])),
    [patientId],
  );

  if (pidLoading || !patientId || loading || !data) return <PageSkeleton cards={3} />;

  return (
    <Section15PageLayout
      title={t("pageTitles.guardianFamilyBoard", "Family board")}
      subtitle={t("section15.familyBoardSubtitle", "Short updates visible to authorized family members.")}
    >
      <Section15FamilyBoardForm patientId={patientId} onSaved={refetch} />
      <div className="space-y-3">
        {data.length === 0 ? (
          <p className="text-sm" style={{ color: cn.textSecondary }}>{t("section15.empty", "No entries yet.")}</p>
        ) : (
          data.map((p) => (
            <div key={p.id} className="finance-card p-4">
              <p className="text-xs mb-2" style={{ color: cn.textSecondary }}>{new Date(p.createdAt).toLocaleString()}</p>
              <p className="text-sm" style={{ color: cn.text }}>{p.body}</p>
            </div>
          ))
        )}
      </div>
    </Section15PageLayout>
  );
}
