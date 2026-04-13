import type { ActivityItem, AdminDashboardSummary, PendingItem } from "@/backend/models";
import type {
  OperationalDashboardData,
  OperationalDashboardAction,
  OperationalDashboardQueueRow,
  OperationalQueuePriority,
} from "@/backend/models/operationalDashboard.model";

export interface AdminDashboardRaw {
  summary: AdminDashboardSummary;
  pendingItems: PendingItem[];
  recentActivity: ActivityItem[];
}

function adminPendingPath(type: string): string {
  const s = type.toLowerCase();
  if (s.includes("verification")) return "/admin/verifications";
  if (s.includes("withdraw")) return "/admin/payments";
  if (s.includes("dispute")) return "/admin/disputes";
  if (s.includes("report")) return "/admin/reports";
  return "/admin/reports";
}

function pendingPriority(type: string): OperationalQueuePriority {
  const s = type.toLowerCase();
  if (s.includes("report") || s.includes("dispute") || s.includes("withdraw")) return "high";
  return "medium";
}

function activityHref(activityType: string): string {
  switch (activityType) {
    case "flag":
      return "/admin/reports";
    case "payment":
      return "/admin/payments";
    case "verify":
      return "/admin/verifications";
    case "resolve":
      return "/admin/disputes";
    case "new":
      return "/admin/agency-approvals";
    default:
      return "/admin/reports";
  }
}

function activityPriority(activityType: string): OperationalQueuePriority {
  if (activityType === "flag" || activityType === "payment") return "high";
  if (activityType === "resolve") return "low";
  return "medium";
}

export function mapAdminDashboardRaw(raw: AdminDashboardRaw): OperationalDashboardData {
  const actions: OperationalDashboardAction[] = [
    { id: "approvals", labelKey: "dashboard:admin.opsReviewApprovals", to: "/admin/verifications" },
    { id: "flags", labelKey: "dashboard:admin.opsResolveFlags", to: "/admin/reports" },
    { id: "payouts", labelKey: "dashboard:admin.opsProcessPayouts", to: "/admin/payments" },
  ];

  const pendingSorted = [...raw.pendingItems].sort((a, b) => b.count - a.count);
  const pendingRows: OperationalDashboardQueueRow[] = pendingSorted.map((p, i) => {
    const path = p.path || adminPendingPath(p.type);
    return {
      id: `pending-${i}-${encodeURIComponent(p.type)}`,
      type: p.type,
      priority: pendingPriority(p.type),
      entity: "",
      entityKey: "dashboard:admin.queueBucketEntity",
      entityParams: { count: p.count },
      reason: "",
      reasonKey: "dashboard:admin.queueBucketReason",
      time: "\u2014",
      href: path,
      primaryActionLabelKey: "dashboard:admin.queueOpenQueue",
    };
  });

  const activityRows: OperationalDashboardQueueRow[] = raw.recentActivity.slice(0, 8).map((a, i) => {
    const pr = activityPriority(a.type);
    const short = a.text.length > 80 ? `${a.text.slice(0, 77)}\u2026` : a.text;
    return {
      id: `activity-${i}`,
      type: "",
      typeKey: `dashboard:admin.activityTypes.${a.type}`,
      priority: pr,
      entity: short,
      reason: "",
      reasonKey: "dashboard:admin.queueFeedReason",
      time: a.time,
      href: activityHref(a.type),
      primaryActionLabelKey: "dashboard:admin.queueReview",
    };
  });

  const queue = [...pendingRows, ...activityRows];

  return { actions, queue, kpis: [] };
}
