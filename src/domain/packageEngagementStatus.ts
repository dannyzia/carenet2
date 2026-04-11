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
