/**
 * Agency executive (interrupt-driven) dashboard payload — separate from
 * {@link OperationalDashboardData} used by admin/moderator/caregiver ops layouts.
 */
import type {
  OperationalDashboardKpi,
  OperationalDashboardQueueRow,
} from "./operationalDashboard.model";

export type AgencyExecutiveAlertSeverity = "high" | "medium" | "low";

export interface AgencyExecutiveAlert {
  id: string;
  /** Prefer i18n when set */
  messageKey?: string;
  messageParams?: Record<string, string | number>;
  /** Fallback / mock copy */
  message?: string;
  severity: AgencyExecutiveAlertSeverity;
  filterHref?: string;
}

export type AgencyExecutiveJobActionKind =
  | "start"
  | "message"
  | "escalate"
  | "complete"
  | "resolveDelay";

export interface AgencyExecutiveJobAction {
  kind: AgencyExecutiveJobActionKind;
  labelKey: string;
  to?: string;
}

export interface AgencyExecutiveActiveJob {
  id: string;
  patientLabel: string;
  /** When set, UI should prefer this i18n key (+ params) over raw `patientLabel`. */
  patientLabelKey?: string;
  patientLabelParams?: Record<string, string | number>;
  caregiverLabel: string;
  location?: string;
  windowLabel: string;
  status: string;
  statusKey?: string;
  isLive?: boolean;
  placementHref: string;
  actions: AgencyExecutiveJobAction[];
}

export interface AgencyExecutiveNotificationSummary {
  caregiverApplications: number;
  clientInterests: number;
  contractUpdates: number;
}

export interface AgencyExecutiveDashboardData {
  alerts: AgencyExecutiveAlert[];
  activeJobs: AgencyExecutiveActiveJob[];
  queue: OperationalDashboardQueueRow[];
  notifications: AgencyExecutiveNotificationSummary;
  kpis: OperationalDashboardKpi[];
}
