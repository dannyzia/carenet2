import type { GuardianActivity, GuardianDashboardAlert } from "@/backend/models";
import type {
  OperationalDashboardAction,
  OperationalDashboardData,
  OperationalDashboardQueueRow,
} from "@/backend/models/operationalDashboard.model";

export interface GuardianOperationalInputs {
  alerts: GuardianDashboardAlert[];
  activity: GuardianActivity[];
}

export function mapGuardianOperationalDashboard(input: GuardianOperationalInputs): OperationalDashboardData {
  const actions: OperationalDashboardAction[] = [
    { id: "post-req", labelKey: "dashboard:guardian.opsPostRequirement", to: "/guardian/care-requirement-wizard" },
    { id: "requirements", labelKey: "dashboard:guardian.opsCareRequirements", to: "/guardian/care-requirements" },
    { id: "placements", labelKey: "dashboard:guardian.opsPlacements", to: "/guardian/placements" },
    { id: "messages", labelKey: "dashboard:guardian.opsMessages", to: "/guardian/messages" },
  ];

  const alertRows: OperationalDashboardQueueRow[] = input.alerts.map((a) => ({
    id: `alert-${a.id}`,
    type: "",
    typeKey: "dashboard:guardian.queueTypeAlert",
    priority: "high" as const,
    entity: a.title,
    reason: a.subtitle ?? "",
    time: "—",
    href: a.actionPath.startsWith("/") ? a.actionPath : `/${a.actionPath}`,
    primaryActionLabelKey: "dashboard:guardian.queueOpenItem",
  }));

  const activityRows: OperationalDashboardQueueRow[] = input.activity.slice(0, 8).map((act, i) => ({
    id: `activity-${i}`,
    type: "",
    typeKey: "dashboard:guardian.queueTypeActivity",
    priority: "low" as const,
    entity: act.text,
    reason: "",
    time: act.time,
    href: act.link && act.link.startsWith("/") ? act.link : act.link ? `/${act.link}` : "/guardian/dashboard",
    primaryActionLabelKey: "dashboard:guardian.queueOpenItem",
  }));

  const queue = [...alertRows, ...activityRows];

  return { actions, queue, kpis: [] };
}
