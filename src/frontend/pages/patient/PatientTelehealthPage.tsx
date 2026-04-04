import { useTranslation } from "react-i18next";
import { Video } from "lucide-react";
import { useAsyncData, useDocumentTitle, useSection15PatientId } from "@/frontend/hooks";
import { section15Service } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { Section15PageLayout } from "@/frontend/components/shared/Section15PageLayout";
import { cn } from "@/frontend/theme/tokens";

export default function PatientTelehealthPage() {
  const { t } = useTranslation("common");
  useDocumentTitle(t("pageTitles.patientTelehealth", "Telehealth"));
  const { patientId, loading: pidLoading } = useSection15PatientId();
  const { data, loading } = useAsyncData(
    () => (patientId ? section15Service.getTelehealth(patientId) : Promise.resolve([])),
    [patientId],
  );

  if (pidLoading || !patientId || loading || !data) return <PageSkeleton cards={2} />;

  return (
    <Section15PageLayout
      title={t("pageTitles.patientTelehealth", "Telehealth")}
      subtitle={t("section15.telehealthSubtitle", "Scheduled video visits (provider integration upcoming).")}
    >
      <div className="space-y-3">
        {data.length === 0 ? (
          <p className="text-sm" style={{ color: cn.textSecondary }}>{t("section15.empty", "No entries yet.")}</p>
        ) : (
          data.map((s) => (
            <div key={s.id} className="finance-card p-4 flex gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: cn.tealBg }}>
                <Video className="w-4 h-4" style={{ color: cn.teal }} aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: cn.text }}>{s.providerName}</p>
                <p className="text-xs" style={{ color: cn.textSecondary }}>{new Date(s.scheduledAt).toLocaleString()} · {s.status}</p>
                {s.meetingUrl ? (
                  <a href={s.meetingUrl} className="text-sm mt-2 inline-block" style={{ color: cn.teal }} target="_blank" rel="noreferrer">
                    Join meeting
                  </a>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </Section15PageLayout>
  );
}
