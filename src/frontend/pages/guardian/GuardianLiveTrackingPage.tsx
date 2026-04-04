import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";
import { useAsyncData, useDocumentTitle, useSection15PatientId } from "@/frontend/hooks";
import { section15Service } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { Section15PageLayout } from "@/frontend/components/shared/Section15PageLayout";
import { cn } from "@/frontend/theme/tokens";

export default function GuardianLiveTrackingPage() {
  const { t } = useTranslation("common");
  useDocumentTitle(t("pageTitles.guardianLiveTracking", "Live tracking"));
  const { patientId, loading: pidLoading } = useSection15PatientId();
  const { data, loading } = useAsyncData(
    () => (patientId ? section15Service.getLocationPings(patientId) : Promise.resolve([])),
    [patientId],
  );

  if (pidLoading || !patientId || loading || !data) return <PageSkeleton cards={3} />;

  const latest = data[0];

  return (
    <Section15PageLayout
      title={t("pageTitles.guardianLiveTracking", "Live tracking")}
      subtitle={t("section15.liveTrackingSubtitle", "Latest caregiver check-in coordinates (map integration next).")}
    >
      {latest ? (
        <div className="finance-card p-5 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4" style={{ color: cn.green }} aria-hidden="true" />
            <span className="text-sm font-medium" style={{ color: cn.text }}>{t("section15.lastPing", "Last ping")}</span>
          </div>
          <p className="text-xs" style={{ color: cn.textSecondary }}>{new Date(latest.recordedAt).toLocaleString()}</p>
          <p className="text-sm mt-2 font-mono" style={{ color: cn.text }}>{latest.lat.toFixed(5)}, {latest.lng.toFixed(5)}</p>
        </div>
      ) : null}
      <div className="space-y-2">
        <p className="text-xs font-medium" style={{ color: cn.textSecondary }}>{t("section15.history", "History")}</p>
        {data.map((p) => (
          <div key={p.id} className="finance-card p-3 text-xs flex justify-between" style={{ color: cn.textSecondary }}>
            <span>{new Date(p.recordedAt).toLocaleString()}</span>
            <span className="font-mono">{p.lat.toFixed(4)}, {p.lng.toFixed(4)}</span>
          </div>
        ))}
      </div>
    </Section15PageLayout>
  );
}
