import { WorkQueue } from "@/frontend/components/dashboard/WorkQueue";
import { useTranslation } from "react-i18next";
import type { OperationalDashboardQueueRow } from "@/backend/models/operationalDashboard.model";

export function AgencyActionQueue({ rows }: { rows: OperationalDashboardQueueRow[] }) {
  const { t } = useTranslation(["dashboard", "common"]);
  const columnLabels = {
    type: t("dashboard:admin.queueColType"),
    priority: t("dashboard:admin.queueColPriority"),
    entity: t("dashboard:admin.queueColEntity"),
    reason: t("dashboard:admin.queueColReason"),
    time: t("dashboard:admin.queueColTime"),
    actions: t("dashboard:admin.queueColActions"),
  };

  return (
    <WorkQueue
      title={t("dashboard:agency.executive.actionQueueTitle")}
      rows={rows}
      columnLabels={columnLabels}
      emptyLabel={t("dashboard:agency.executive.actionQueueEmpty")}
    />
  );
}
