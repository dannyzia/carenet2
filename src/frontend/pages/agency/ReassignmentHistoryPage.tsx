import { ArrowRightLeft } from "lucide-react";
import { backupService } from "@/backend/services";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { cn } from "@/frontend/theme/tokens";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export default function ReassignmentHistoryPage() {
  const { t } = useTranslation("common");
  useDocumentTitle(t("pageTitles.reassignmentHistory", "Reassignment history"));

  const { data: reassignments, loading, refetch } = useAsyncData(() => backupService.getReassignmentHistory());

  if (loading || !reassignments) return <PageSkeleton cards={3} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl" style={{ color: cn.textHeading }}>
            {t("reassignmentHistory.title")}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: cn.textSecondary }}>
            {t("reassignmentHistory.subtitle")}
          </p>
        </div>
        <Link
          to="/agency/backup-caregiver"
          className="text-sm underline"
          style={{ color: cn.pink }}
        >
          {t("reassignmentHistory.backToBackup")}
        </Link>
      </div>

      <button
        type="button"
        className="text-xs underline"
        style={{ color: cn.textSecondary }}
        onClick={() => refetch()}
      >
        {t("reassignmentHistory.refresh")}
      </button>

      <div className="space-y-2">
        {reassignments.map((r) => (
          <div key={r.id} className="finance-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4" style={{ color: "var(--cn-amber)" }} />
                <span className="text-sm" style={{ color: cn.textHeading }}>
                  {r.fromCaregiverName} → {r.toCaregiverName}
                </span>
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background:
                    r.status === "completed"
                      ? "rgba(95,184,101,0.1)"
                      : r.status === "pending"
                        ? "rgba(245,158,11,0.1)"
                        : "rgba(59,130,246,0.1)",
                  color:
                    r.status === "completed"
                      ? cn.green
                      : r.status === "pending"
                        ? "var(--cn-amber)"
                        : "var(--cn-blue)",
                }}
              >
                {r.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: cn.textSecondary }}>
              <span>
                {t("reassignmentHistory.shift")}: {r.shiftId}
              </span>
              <span>
                {t("reassignmentHistory.reason")}: {r.reason}
              </span>
              <span>
                {t("reassignmentHistory.by")}: {r.reassignedBy}
              </span>
              {r.billingAdjustment ? (
                <span style={{ color: cn.green }}>{r.billingAdjustment}</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
