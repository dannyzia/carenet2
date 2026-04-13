import type {
  AgencyExecutiveActiveJob,
  AgencyExecutiveAlert,
  AgencyExecutiveDashboardData,
} from "@/backend/models/agencyExecutiveDashboard.model";
import type {
  OperationalDashboardAction,
  OperationalDashboardData,
  OperationalDashboardQueueRow,
  OperationalQueuePriority,
} from "@/backend/models/operationalDashboard.model";
import { agencyAppPaths } from "@/backend/navigation/agencyAppPaths";

function alertSeverityToPriority(s: AgencyExecutiveAlert["severity"]): OperationalQueuePriority {
  if (s === "high") return "high";
  if (s === "low") return "low";
  return "medium";
}

function mapAlertToRow(a: AgencyExecutiveAlert, i: number): OperationalDashboardQueueRow {
  const href = a.filterHref && a.filterHref.startsWith("/") ? a.filterHref : agencyAppPaths.shiftMonitoring();
  return {
    id: `exec-alert-${a.id ?? i}`,
    type: "",
    typeKey: "dashboard:agency.executive.queueTypeAlert",
    priority: alertSeverityToPriority(a.severity),
    entityKey: a.messageKey,
    entityParams: a.messageParams,
    entity: a.message ?? "",
    reason: "",
    time: "—",
    href,
    primaryActionLabelKey: "dashboard:agency.executive.queueOpenAlert",
  };
}

/**
 * Flatten agency executive payload into the shared operational dashboard shape
 * (header + ActionBar + WorkQueue; no KPI strip on the page).
 */
export function mapAgencyExecutiveToOperationalDashboard(exec: AgencyExecutiveDashboardData): OperationalDashboardData {
  const actions: OperationalDashboardAction[] = [
    { id: "packages", labelKey: "dashboard:agency.opsBrowsePackages", to: "/agency/care-packages" },
    { id: "req-board", labelKey: "dashboard:agency.opsRequirementBoard", to: "/agency/care-requirement-board" },
    { id: "leads", labelKey: "dashboard:agency.opsPackageLeads", to: "/agency/package-leads" },
    { id: "jobs", labelKey: "dashboard:agency.opsCaregivingJobs", to: agencyAppPaths.caregivingJobsBase() },
  ];

  const alertRows = exec.alerts.map(mapAlertToRow);
  const activeJobRows = exec.activeJobs.map(mapActiveJobToRow);
  const queue = [...alertRows, ...activeJobRows, ...exec.queue];

  return { actions, queue, kpis: [] };
}
