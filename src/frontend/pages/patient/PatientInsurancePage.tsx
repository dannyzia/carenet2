import { useTranslation } from "react-i18next";
import { useAsyncData, useDocumentTitle, useSection15PatientId } from "@/frontend/hooks";
import { section15Service } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { Section15PageLayout } from "@/frontend/components/shared/Section15PageLayout";
import { cn } from "@/frontend/theme/tokens";

export default function PatientInsurancePage() {
  const { t } = useTranslation("common");
  useDocumentTitle(t("pageTitles.patientInsurance", "Insurance"));
  const { patientId, loading: pidLoading } = useSection15PatientId();
  const { data, loading } = useAsyncData(
    () => (patientId ? section15Service.getInsurance(patientId) : Promise.resolve([])),
    [patientId],
  );

  if (pidLoading || !patientId || loading || !data) return <PageSkeleton cards={2} />;

  return (
    <Section15PageLayout
      title={t("pageTitles.patientInsurance", "Insurance")}
      subtitle={t("section15.insuranceSubtitle", "Coverage summary for this patient.")}
    >
      <div className="space-y-3">
        {data.length === 0 ? (
          <p className="text-sm" style={{ color: cn.textSecondary }}>{t("section15.empty", "No entries yet.")}</p>
        ) : (
          data.map((i) => (
            <div key={i.id} className="finance-card p-4">
              <p className="text-sm font-medium" style={{ color: cn.text }}>{i.providerName}</p>
              <p className="text-xs" style={{ color: cn.textSecondary }}>Policy {i.policyNumber}</p>
              <p className="text-sm mt-2" style={{ color: cn.text }}>{i.coverageSummary}</p>
              {i.validUntil ? (
                <p className="text-xs mt-2" style={{ color: cn.textSecondary }}>Valid until {i.validUntil}</p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </Section15PageLayout>
  );
}
