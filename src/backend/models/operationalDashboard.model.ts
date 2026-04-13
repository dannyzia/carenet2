/**
 * Shared operational dashboard contract — execution-first layout:
 * actions → queue → kpis (no charts in payload).
 */

export type OperationalDashboardKpiFormat = "count" | "bdtCompact" | "percent" | "plain" | "carePoints";

/** Primary CTA row */
export interface OperationalDashboardAction {
  id: string;
  /** i18n key (e.g. dashboard:admin.opsReviewApprovals) */
  labelKey: string;
  to: string;
}

export type OperationalQueuePriority = "high" | "medium" | "low";

/** Optional extra navigation actions (e.g. moderator Review / Escalate) */
export interface OperationalQueueInlineAction {
  labelKey: string;
  to: string;
  variant?: "default" | "outline" | "destructive";
}

/** Unified work queue row */
export interface OperationalDashboardQueueRow {
  id: string;
  /** Raw type label when no typeKey */
  type: string;
  /** Optional i18n key for type column */
  typeKey?: string;
  priority: OperationalQueuePriority;
  /** Raw entity text when no entityKey */
  entity: string;
  entityKey?: string;
  entityParams?: Record<string, string | number>;
  reason: string;
  reasonKey?: string;
  reasonParams?: Record<string, string | number>;
  time: string;
  href: string;
  primaryActionLabelKey: string;
  inlineActions?: OperationalQueueInlineAction[];
}

/** Bottom KPI strip (≤4 recommended) */
export interface OperationalDashboardKpi {
  id: string;
  labelKey: string;
  labelParams?: Record<string, string | number>;
  format: OperationalDashboardKpiFormat;
  value: number | string;
  hintKey?: string;
  hintParams?: Record<string, string | number>;
  to?: string;
}

export interface OperationalDashboardData {
  actions: OperationalDashboardAction[];
  queue: OperationalDashboardQueueRow[];
  kpis: OperationalDashboardKpi[];
}
