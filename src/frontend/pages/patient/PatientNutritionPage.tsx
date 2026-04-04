import { useTranslation } from "react-i18next";
import { useAsyncData, useDocumentTitle, useSection15PatientId } from "@/frontend/hooks";
import { section15Service } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { Section15PageLayout } from "@/frontend/components/shared/Section15PageLayout";
import { cn } from "@/frontend/theme/tokens";

export default function PatientNutritionPage() {
  const { t } = useTranslation("common");
  useDocumentTitle(t("pageTitles.patientNutrition", "Nutrition"));
  const { patientId, loading: pidLoading } = useSection15PatientId();
  const { data, loading } = useAsyncData(
    () => (patientId ? section15Service.getNutrition(patientId) : Promise.resolve([])),
    [patientId],
  );

  if (pidLoading || !patientId || loading || !data) return <PageSkeleton cards={3} />;

  return (
    <Section15PageLayout
      title={t("pageTitles.patientNutrition", "Nutrition")}
      subtitle={t("section15.nutritionSubtitle", "Meals and intake notes.")}
    >
      <div className="space-y-3">
        {data.length === 0 ? (
          <p className="text-sm" style={{ color: cn.textSecondary }}>{t("section15.empty", "No entries yet.")}</p>
        ) : (
          data.map((n) => (
            <div key={n.id} className="finance-card p-4">
              <p className="text-xs mb-1" style={{ color: cn.textSecondary }}>{n.mealType} · {new Date(n.loggedAt).toLocaleString()}</p>
              <p className="text-sm" style={{ color: cn.text }}>{n.description}</p>
              {n.calories != null ? (
                <p className="text-xs mt-1" style={{ color: cn.textSecondary }}>{n.calories} kcal</p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </Section15PageLayout>
  );
}
