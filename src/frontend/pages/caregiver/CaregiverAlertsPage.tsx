import { useTranslation } from "react-i18next";
import { Bell } from "lucide-react";
import { useAsyncData, useDocumentTitle, useSection15PatientId } from "@/frontend/hooks";
import { section15Service } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { Section15PageLayout } from "@/frontend/components/shared/Section15PageLayout";
import { cn } from "@/frontend/theme/tokens";

export default function CaregiverAlertsPage() {
  const { t } = useTranslation("common");
  useDocumentTitle(t("pageTitles.caregiverAlerts", "Alerts"));
  const { patientId, loading: pidLoading } = useSection15PatientId();
  const { data, loading } = useAsyncData(
    () => (patientId ? section15Service.getAlertRules(patientId) : Promise.resolve([])),
    [patientId],
  );

  if (pidLoading || !patientId || loading || !data) return <PageSkeleton cards={3} />;

  return (
    <Section15PageLayout
      title={t("pageTitles.caregiverAlerts", "Alerts")}
      subtitle={t("section15.caregiverAlertsSubtitle", "Active rules for the current patient context (?patientId=).")}
    >
      <div className="space-y-3">
        {data.map((r) => (
          <div key={r.id} className="finance-card p-4 flex gap-3 items-start">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: cn.blueBg }}>
              <Bell className="w-4 h-4" style={{ color: cn.blue }} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: cn.text }}>{r.metricType}</p>
              <p className="text-xs" style={{ color: cn.textSecondary }}>
                {r.enabled ? "Active" : "Paused"} · {r.operator} {r.thresholdValue ?? "—"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section15PageLayout>
  );
}
