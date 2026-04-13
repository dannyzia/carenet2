/**
 * Canonical in-app paths for the agency role shell.
 * Keep in sync with [src/app/routes.ts](src/app/routes.ts) `path: "agency/…"` entries.
 */
const AGENCY = "/agency";

function withQuery(base: string, query?: Record<string, string>): string {
  if (!query || Object.keys(query).length === 0) return base;
  const q = new URLSearchParams(query).toString();
  return `${base}?${q}`;
}

export const agencyAppPaths = {
  messages: () => `${AGENCY}/messages`,
  shiftMonitoring: () => `${AGENCY}/shift-monitoring`,
  caregivingJobs: (query?: Record<string, string>) => withQuery(`${AGENCY}/caregiving-jobs`, query),
  caregivingJobsBase: () => `${AGENCY}/caregiving-jobs`,
  jobManagement: () => `${AGENCY}/job-management`,
  placementDetail: (placementId: string) => `${AGENCY}/placement/${encodeURIComponent(placementId)}`,
  placementCheckinFocus: (placementId: string) =>
    `${AGENCY}/placement/${encodeURIComponent(placementId)}?focus=checkin`,
  packageLeadsTab: (tab: "clients" | "caregivers") => `${AGENCY}/package-leads?tab=${tab}`,
  caregivers: () => `${AGENCY}/caregivers`,
  requirementsInbox: () => `${AGENCY}/requirements-inbox`,
  requirementReview: (requirementId: string) => `${AGENCY}/requirement-review/${encodeURIComponent(requirementId)}`,
  reports: () => `${AGENCY}/reports`,
  placements: () => `${AGENCY}/placements`,
  bidManagement: () => `${AGENCY}/bid-management`,
} as const;
