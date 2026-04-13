import React from "react";
import { useTranslation } from "react-i18next";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { moderatorService } from "@/backend/services/moderator.service";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { ActionBar } from "@/frontend/components/dashboard/ActionBar";
import { WorkQueue } from "@/frontend/components/dashboard/WorkQueue";
import { cn } from "@/frontend/theme/tokens";
import { formatDashboardDate } from "@/frontend/utils/dashboardFormat";
import i18n from "@/frontend/i18n";

export default function ModeratorDashboardPage() {
  const { t } = useTranslation(["dashboard", "common"]);
  useDocumentTitle(t("common:pageTitles.moderatorDashboard", "Dashboard"));

  const locale = i18n.language || "en";
  const { data: dash, loading, error } = useAsyncData(() => moderatorService.getOperationalDashboard());

  if (loading) {
    return <PageSkeleton variant="dashboard" />;
  }

  if (error || !dash) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: cn.text }}>
            {t("dashboard:moderator.title")}
          </h1>
        </div>
        <p className="text-sm" style={{ color: cn.red }}>
          {t("dashboard:moderator.queueLoadError")}
        </p>
      </div>
    );
  }

  const subtitle = t("dashboard:shared.subtitleWithDate", {
    context: t("dashboard:moderator.subtitle"),
    date: formatDashboardDate(new Date(), locale),
  });

  const urgent = dash.queue.filter((r) => r.priority === "high").length;

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
          <h1 className="text-2xl font-semibold" style={{ color: cn.text }}>
            {t("dashboard:moderator.title")}
          </h1>
          <p className="text-sm" style={{ color: cn.textSecondary }}>
            {subtitle}
          </p>
        </div>
        {urgent > 0 && (
          <span
            className="px-3 py-1 rounded-full text-sm self-start"
            style={{ background: cn.amberBg ?? "rgba(232, 168, 56, 0.2)", color: cn.amber }}
          >
            {t("dashboard:shared.needsAttention", { count: urgent })}
          </span>
        )}
      </div>

      <ActionBar actions={dash.actions} role="moderator" ariaLabelKey="dashboard:moderator.opsAriaLabel" />

      <WorkQueue
        title={t("dashboard:moderator.workQueueTitle")}
        rows={dash.queue}
        columnLabels={queueColumns}
        emptyLabel={t("dashboard:moderator.workQueueEmpty")}
      />
    </div>
  );
}
