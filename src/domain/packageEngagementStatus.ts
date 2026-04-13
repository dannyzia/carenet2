/**
 * Terminal package engagement statuses (client or caregiver lane).
 * Aligns with historical `agencyService` “open engagement” checks.
 */
export const PACKAGE_ENGAGEMENT_TERMINAL_STATUSES = ["accepted", "declined", "withdrawn", "expired"] as const;

export function isOpenPackageEngagementStatus(status: string): boolean {
  return !(PACKAGE_ENGAGEMENT_TERMINAL_STATUSES as readonly string[]).includes(status);
}

/**
 * Mirrors `public.package_engagement_status_transition_ok` in
 * `20260410120000_package_engagements.sql` for client-side checks and tests.
 */
export function packageEngagementStatusTransitionOk(
  oldStatus: string,
  newStatus: string,
  isTerminalAllowed = true
): boolean {
  if (oldStatus === newStatus) return true;
  if (
    isTerminalAllowed &&
    ["accepted", "declined", "withdrawn", "expired"].includes(newStatus)
  ) {
    return true;
  }
  if (oldStatus === "draft" && ["interested", "applied"].includes(newStatus)) return true;
  if (oldStatus === "interested" && ["negotiating", "withdrawn", "declined", "expired"].includes(newStatus))
    return true;
  if (oldStatus === "applied" && ["negotiating", "withdrawn", "declined", "expired"].includes(newStatus))
    return true;
  if (
    oldStatus === "negotiating" &&
    ["negotiating", "accepted", "declined", "withdrawn", "expired"].includes(newStatus)
  ) {
    return true;
  }
  return false;
}
