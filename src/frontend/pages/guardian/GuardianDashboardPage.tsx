import React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { useAuth } from "@/frontend/auth/AuthContext";
import { guardianService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { ActionBar } from "@/frontend/components/dashboard/ActionBar";
import { WorkQueue } from "@/frontend/components/dashboard/WorkQueue";
import { formatDashboardDate } from "@/frontend/utils/dashboardFormat";
import i18n from "@/frontend/i18n";

export default function GuardianDashboardPage() {
  const { t } = useTranslation(["dashboard", "common"]);
  const { user } = useAuth();
  useDocumentTitle(t("common:pageTitles.guardianDashboard", "Dashboard"));

  const locale = i18n.language || "en";
  const { data: dash, loading, error } = useAsyncData(() => guardianService.getOperationalDashboard());

  if (loading) {
    return <PageSkeleton variant="dashboard" />;
  }

  if (error || !dash) {
    return (
      <div className="p-6 space-y-2">
        <h1 className="text-xl font-semibold" style={{ color: cn.text }}>
          {t("dashboard:guardian.welcome", { name: user?.name?.replace(/^Mock_/, "") || "User" })}
        </h1>
        <p className="text-sm" style={{ color: cn.red }}>{t("common:error.generic")}</p>
      </div>
    );
  }

  const today = formatDashboardDate(new Date(), locale);
  const displayName = user?.name?.replace(/^Mock_/, "") || "User";
  const queueCount = dash.queue.filter((r) => r.priority === "high").length;

  const queueColumns = {
    type: t("dashboard:admin.queueColType"),
    priority: t("dashboard:admin.queueColPriority"),
    entity: t("dashboard:admin.queueColEntity"),
    reason: t("dashboard:admin.queueColReason"),
    time: t("dashboard:admin.queueColTime"),
    actions: t("dashboard:admin.queueColActions"),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl" style={{ color: cn.text }}>
            {t("dashboard:guardian.welcome", { name: displayName })}
          </h1>
          <p className="text-sm" style={{ color: cn.textSecondary }}>
            {t("dashboard:guardian.subtitle")} — {today}
          </p>
        </div>
        {queueCount > 0 && (
          <span
            className="px-3 py-1 rounded-full text-sm self-start"
            style={{ background: cn.amberBg ?? "rgba(232, 168, 56, 0.2)", color: cn.amber }}
          >
            {t("dashboard:shared.needsAttention", { count: queueCount })}
          </span>
        )}
      </div>

      <ActionBar actions={dash.actions} role="guardian" ariaLabelKey="dashboard:guardian.opsAriaLabel" />

      <WorkQueue
        title={t("dashboard:guardian.workQueueTitle")}
        rows={dash.queue}
        columnLabels={queueColumns}
        emptyLabel={t("dashboard:guardian.workQueueEmpty")}
      />
    </div>
  );
}
