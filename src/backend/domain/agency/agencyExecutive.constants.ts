/**
 * Caps and domain literals for the agency executive dashboard mapper.
 * Route strings live in {@link agencyAppPaths}; engagement terminal set in {@link packageEngagementStatus}.
 */

export const AGENCY_EXECUTIVE_CAPS = {
  activeJobsMax: 5,
  queueRowsPerSource: 6,
  queueRowsMax: 14,
  packageContractIdDisplayLen: 8,
  careJobShortIdSuffixLen: 6,
} as const;

/** Placement row status treated as “active” for fill-rate proxy. */
export const PLACEMENT_STATUS_ACTIVE = "active";

/** Caregiving job statuses included in supplemental “today” active list. */
export const CJ_JOB_STATUSES_OPERATIONAL = ["active", "scheduled", "pending"] as const;

export const CJ_JOB_STATUS_ACTIVE = "active";

export const CJ_JOB_NEEDS_START_STATUSES = ["scheduled", "pending"] as const;

/** Recruitment board job statuses treated as still open. */
export const RECRUITMENT_JOB_TERMINAL_STATUSES = ["closed", "filled"] as const;

export function isRecruitmentJobOpen(status: string): boolean {
  const s = status.toLowerCase();
  return !(RECRUITMENT_JOB_TERMINAL_STATUSES as readonly string[]).includes(s);
}

/** Requirement inbox rows that still need agency triage in the action queue. */
export const REQUIREMENT_INBOX_ACTIONABLE_STATUSES = ["new", "under-review"] as const;

export function isRequirementActionableStatus(status: string): boolean {
  return (REQUIREMENT_INBOX_ACTIONABLE_STATUSES as readonly string[]).includes(status);
}

/** Requirement rows counted as “new” in fill-rate denominator. */
export const REQUIREMENT_STATUS_NEW = "new";

/** Requirement priority → queue priority mapping is handled in mapper using these values. */
export const REQUIREMENT_PRIORITY_URGENT = "urgent";

/** Caregiver engagement status that bumps queue priority. */
export const PACKAGE_CAREGIVER_STATUS_APPLIED = "applied";

/** Shift / monitoring status tokens (normalized slug uses underscores). */
export const MONITORING_STATUS_RANK_GROUPS = {
  late: ["late"],
  grace: ["grace", "warning"],
  steady: ["active", "in_progress", "on_time", "scheduled", "pending"],
} as const;

export function normalizeMonitoringStatusToken(status: string): string {
  return status.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
}

export function monitoringStatusSortRank(status: string): number {
  const x = normalizeMonitoringStatusToken(status);
  if ((MONITORING_STATUS_RANK_GROUPS.late as readonly string[]).includes(x)) return 0;
  if ((MONITORING_STATUS_RANK_GROUPS.grace as readonly string[]).includes(x)) return 1;
  if ((MONITORING_STATUS_RANK_GROUPS.steady as readonly string[]).includes(x)) return 2;
  return 3;
}

const CHECKIN_MISSING_MARKERS = new Set(["-", "\u2014", "—"]);

export function shiftNeedsCheckInAction(shift: { status: string; checkedIn: string }): boolean {
  const st = shift.status.toLowerCase();
  if (st === "late") return true;
  const ci = shift.checkedIn.trim();
  if (ci === "") return true;
  return CHECKIN_MISSING_MARKERS.has(shift.checkedIn) || CHECKIN_MISSING_MARKERS.has(ci);
}

export const SHIFT_ALERT_TYPES_HIGH_SEVERITY = ["missed", "late_checkin"] as const;

export function isShiftAlertHighSeverity(alertType: string): boolean {
  const t = alertType.toLowerCase().replace(/-/g, "_");
  return (SHIFT_ALERT_TYPES_HIGH_SEVERITY as readonly string[]).includes(t);
}

/** Fixed-width display (no locale) for engagement `updated_at` in the queue. */
export function formatEngagementQueueTimestamp(iso: string): string {
  return iso.slice(0, 16).replace("T", " ");
}

/**
 * Fill-rate v1: active placements / (active + open board + new inbox rows), capped at 100%.
 */
export function executiveFillRatePercent(params: {
  activePlacements: number;
  openBoardRequirementCount: number;
  newRequirementCount: number;
}): number {
  const denom =
    params.activePlacements + params.openBoardRequirementCount + params.newRequirementCount;
  if (denom <= 0) return 0;
  return Math.min(100, Math.round((100 * params.activePlacements) / denom));
}
