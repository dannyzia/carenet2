import type { ModerationQueueItem, ModeratorDashboardStats } from "@/backend/models";
import type {
  OperationalDashboardData,
  OperationalDashboardAction,
  OperationalDashboardQueueRow,
  OperationalQueueInlineAction,
  OperationalQueuePriority,
} from "@/backend/models/operationalDashboard.model";

function normPriority(p: string): OperationalQueuePriority {
  const x = String(p).toLowerCase();
  if (x === "high") return "high";
  if (x === "low") return "low";
  return "medium";
}

function reviewHref(itemType: string): string {
  if (itemType === "Report") return "/moderator/reports";
  if (itemType === "Content") return "/moderator/content";
  return "/moderator/reviews";
}

function queueTypeKey(itemType: string): string {
  const slug = itemType === "Review" ? "review" : itemType === "Report" ? "report" : itemType === "Content" ? "content" : "other";
  return `dashboard:moderator.queueTypes.${slug}`;
}

export function mapModeratorOperationalDashboard(
  queue: ModerationQueueItem[],
  _stats: ModeratorDashboardStats,
): OperationalDashboardData {
  const actions: OperationalDashboardAction[] = [
    { id: "reviews", labelKey: "dashboard:moderator.opsOpenReviews", to: "/moderator/reviews" },
    { id: "reports", labelKey: "dashboard:moderator.opsOpenReports", to: "/moderator/reports" },
    { id: "content", labelKey: "dashboard:moderator.opsOpenContent", to: "/moderator/content" },
  ];

  const queueRows: OperationalDashboardQueueRow[] = queue.map((item) => {
    const href = reviewHref(item.type);
    const inlineActions: OperationalQueueInlineAction[] = [
      { labelKey: "dashboard:moderator.review", to: href, variant: "outline" },
      { labelKey: "dashboard:moderator.opsEscalate", to: "/moderator/escalations", variant: "outline" },
    ];
    return {
      id: `mod-${item.id}`,
      type: "",
      typeKey: queueTypeKey(item.type),
      priority: normPriority(item.priority),
      entity: item.content,
      reason: "",
      reasonKey: "dashboard:moderator.queueMeta",
      reasonParams: { reporter: item.reporter, time: item.time },
      time: item.time,
      href,
      primaryActionLabelKey: "dashboard:moderator.queueOpenCase",
      inlineActions,
    };
  });

  return { actions, queue: queueRows, kpis: [] };
}
