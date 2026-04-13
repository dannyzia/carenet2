/**
 * Pure adapter: raw agency fetches → {@link AgencyExecutiveDashboardData}.
 * Fill-rate v1: see {@link executiveFillRatePercent}.
 */
import type {
  ActiveShift,
  AgencyDashboardSummary,
  AgencyPlacement,
  RequirementInboxItem,
  ShiftAlert,
} from "@/backend/models";
import type {
  AgencyExecutiveActiveJob,
  AgencyExecutiveAlert,
  AgencyExecutiveDashboardData,
  AgencyExecutiveJobAction,
  AgencyExecutiveNotificationSummary,
} from "@/backend/models/agencyExecutiveDashboard.model";
import type { CaregivingJobListRow } from "@/backend/services/caregivingJob.service";
import type {
  PackageCaregiverEngagement,
  PackageClientEngagement,
} from "@/backend/models/packageEngagement.model";
import type {
  OperationalDashboardKpi,
  OperationalDashboardQueueRow,
  OperationalQueuePriority,
} from "@/backend/models/operationalDashboard.model";
import { agencyAppPaths } from "@/backend/navigation/agencyAppPaths";
import { isOpenPackageEngagementStatus } from "@/domain/packageEngagementStatus";
import {
  AGENCY_EXECUTIVE_CAPS,
  CJ_JOB_NEEDS_START_STATUSES,
  CJ_JOB_STATUSES_OPERATIONAL,
  CJ_JOB_STATUS_ACTIVE,
  executiveFillRatePercent,
  formatEngagementQueueTimestamp,
  isRequirementActionableStatus,
  isShiftAlertHighSeverity,
  monitoringStatusSortRank,
  PACKAGE_CAREGIVER_STATUS_APPLIED,
  PLACEMENT_STATUS_ACTIVE,
  REQUIREMENT_PRIORITY_URGENT,
  REQUIREMENT_STATUS_NEW,
  shiftNeedsCheckInAction,
} from "@/backend/domain/agency/agencyExecutive.constants";

function shiftAlertToMessage(a: ShiftAlert): {
  messageKey: string;
  messageParams: Record<string, string | number>;
} {
  const typeNorm = a.type.toLowerCase().replace(/-/g, "_");
  const caregiver = a.caregiverName ?? "";
  const patient = a.patientName ?? "";
  const window = a.time ?? "";
  if (typeNorm === "late_checkin" && caregiver && patient) {
    return {
      messageKey: "dashboard:agency.executive.alertShift.lateCheckin",
      messageParams: { caregiver, patient },
    };
  }
  if (typeNorm === "missed" && caregiver && patient) {
    return {
      messageKey: "dashboard:agency.executive.alertShift.missed",
      messageParams: { caregiver, patient, window },
    };
  }
  if (typeNorm === "no_log" && caregiver && patient) {
    return {
      messageKey: "dashboard:agency.executive.alertShift.noLog",
      messageParams: { caregiver, patient, window },
    };
  }
  return {
    messageKey: "dashboard:agency.executive.alertShift.generic",
    messageParams: { window },
  };
}

function jobActionsForShift(shift: ActiveShift): AgencyExecutiveJobAction[] {
  const needsStart = shiftNeedsCheckInAction(shift);
  const actions: AgencyExecutiveJobAction[] = [];
  if (needsStart) {
    actions.push({
      kind: "start",
      labelKey: "dashboard:agency.executive.jobStart",
      to: agencyAppPaths.placementCheckinFocus(shift.placement),
    });
  }
  actions.push({
    kind: "message",
    labelKey: "dashboard:agency.executive.jobMessage",
    to: agencyAppPaths.messages(),
  });
  actions.push({
    kind: "escalate",
    labelKey: "dashboard:agency.executive.jobEscalate",
    to: agencyAppPaths.shiftMonitoring(),
  });
  return actions;
}

function mapShiftToActiveJob(shift: ActiveShift, idx: number): AgencyExecutiveActiveJob {
  const placementHref = agencyAppPaths.placementDetail(shift.placement);
  const statusSlug = shift.status.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
  return {
    id: `shift-${shift.placement}-${idx}`,
    patientLabel: shift.patient,
    caregiverLabel: shift.caregiver,
    windowLabel: shift.time,
    status: shift.status,
    statusKey: `dashboard:agency.executive.shiftStatus.${statusSlug}`,
    isLive: true,
    placementHref,
    actions: jobActionsForShift(shift),
  };
}

function mapCjJobToActiveJob(job: CaregivingJobListRow, idx: number): AgencyExecutiveActiveJob {
  const primary = job.caregiving_job_caregiver_assignments[0];
  const caregiverLabel = primary?.assignment_label || "\u2014";
  const placementHref = agencyAppPaths.caregivingJobsBase();
  const st = job.status.toLowerCase();
  const needsStart = (CJ_JOB_NEEDS_START_STATUSES as readonly string[]).includes(st);
  const actions: AgencyExecutiveJobAction[] = [];
  if (needsStart) {
    actions.push({
      kind: "start",
      labelKey: "dashboard:agency.executive.jobStart",
      to: agencyAppPaths.caregivingJobs({ job: job.id }),
    });
  }
  actions.push({
    kind: "message",
    labelKey: "dashboard:agency.executive.jobMessage",
    to: agencyAppPaths.messages(),
  });
  actions.push({
    kind: "escalate",
    labelKey: "dashboard:agency.executive.jobEscalate",
    to: agencyAppPaths.shiftMonitoring(),
  });
  return {
    id: `cj-${job.id}-${idx}`,
    patientLabelKey: "dashboard:agency.executive.careJobPatientLabel",
    patientLabelParams: { shortId: job.id.slice(-AGENCY_EXECUTIVE_CAPS.careJobShortIdSuffixLen) },
    patientLabel: "",
    caregiverLabel,
    windowLabel: job.start_date || job.created_at.slice(0, 10),
    status: job.status,
    statusKey: `dashboard:agency.executive.jobStatus.${st.replace(/-/g, "_")}`,
    isLive: st === CJ_JOB_STATUS_ACTIVE,
    placementHref,
    actions,
  };
}

function buildActiveJobs(
  shifts: ActiveShift[],
  cjJobs: CaregivingJobListRow[],
  max: number,
): AgencyExecutiveActiveJob[] {
  const fromShifts = shifts.map((s, i) => mapShiftToActiveJob(s, i));
  fromShifts.sort((a, b) => monitoringStatusSortRank(a.status) - monitoringStatusSortRank(b.status));
  const out = [...fromShifts];
  if (out.length < max) {
    const todayIso = new Date().toISOString().slice(0, 10);
    const allowed = new Set(CJ_JOB_STATUSES_OPERATIONAL as readonly string[]);
    const supplemental = cjJobs.filter((j) => {
      const st = j.status.toLowerCase();
      if (!allowed.has(st)) return false;
      if (!j.start_date) return true;
      return j.start_date.slice(0, 10) === todayIso;
    });
    for (let i = 0; i < supplemental.length && out.length < max; i++) {
      out.push(mapCjJobToActiveJob(supplemental[i], i));
    }
  }
  return out.slice(0, max);
}

function buildAlerts(
  shiftAlerts: ShiftAlert[],
  requirements: RequirementInboxItem[],
): AgencyExecutiveAlert[] {
  const out: AgencyExecutiveAlert[] = shiftAlerts.map((a, i) => {
    const { messageKey, messageParams } = shiftAlertToMessage(a);
    return {
      id: `shift-alert-${i}`,
      messageKey,
      messageParams,
      severity: isShiftAlertHighSeverity(a.type) ? "high" : "medium",
      filterHref: agencyAppPaths.shiftMonitoring(),
    };
  });
  const urgentWaiting = requirements.filter(
    (r) => isRequirementActionableStatus(r.status) && r.priority === REQUIREMENT_PRIORITY_URGENT,
  ).length;
  if (urgentWaiting > 0) {
    out.push({
      id: "req-urgent-waiting",
      messageKey: "dashboard:agency.executive.alertClientsWaiting",
      messageParams: { count: urgentWaiting },
      severity: "high",
      filterHref: agencyAppPaths.requirementsInbox(),
    });
  }
  return out;
}

function reqPriorityToQueuePriority(p: RequirementInboxItem["priority"]): OperationalQueuePriority {
  if (p === REQUIREMENT_PRIORITY_URGENT) return "high";
  if (p === "low") return "low";
  return "medium";
}

function buildQueue(
  clientEng: PackageClientEngagement[],
  cgEng: PackageCaregiverEngagement[],
  requirements: RequirementInboxItem[],
): OperationalDashboardQueueRow[] {
  const rows: OperationalDashboardQueueRow[] = [];
  const cap = AGENCY_EXECUTIVE_CAPS.queueRowsPerSource;
  const idLen = AGENCY_EXECUTIVE_CAPS.packageContractIdDisplayLen;

  clientEng
    .filter((e) => isOpenPackageEngagementStatus(e.status))
    .slice(0, cap)
    .forEach((e, i) => {
      rows.push({
        id: `lead-${e.id}-${i}`,
        type: "",
        typeKey: "dashboard:agency.executive.queueTypeLead",
        priority: "medium",
        entity: e.package_contract_id.slice(0, idLen) + "\u2026",
        reason: "",
        reasonKey: "dashboard:agency.executive.queueReasonLead",
        reasonParams: { status: String(e.status) },
        time: formatEngagementQueueTimestamp(e.updated_at),
        href: agencyAppPaths.packageLeadsTab("clients"),
        primaryActionLabelKey: "dashboard:agency.executive.queueOpenLead",
        inlineActions: [
          {
            labelKey: "dashboard:agency.executive.queueAccept",
            to: agencyAppPaths.packageLeadsTab("clients"),
            variant: "default",
          },
          { labelKey: "dashboard:agency.executive.queueMessage", to: agencyAppPaths.messages(), variant: "outline" },
        ],
      });
    });

  cgEng
    .filter((e) => isOpenPackageEngagementStatus(e.status))
    .slice(0, cap)
    .forEach((e, i) => {
      rows.push({
        id: `apply-${e.id}-${i}`,
        type: "",
        typeKey: "dashboard:agency.executive.queueTypeApply",
        priority: e.status === PACKAGE_CAREGIVER_STATUS_APPLIED ? "high" : "medium",
        entity: e.package_contract_id.slice(0, idLen) + "\u2026",
        reason: "",
        reasonKey: "dashboard:agency.executive.queueReasonApply",
        reasonParams: { status: String(e.status) },
        time: formatEngagementQueueTimestamp(e.updated_at),
        href: agencyAppPaths.packageLeadsTab("caregivers"),
        primaryActionLabelKey: "dashboard:agency.executive.queueReviewApply",
        inlineActions: [
          { labelKey: "dashboard:agency.executive.queueAssign", to: agencyAppPaths.caregivers(), variant: "outline" },
          { labelKey: "dashboard:agency.executive.queueMessage", to: agencyAppPaths.messages(), variant: "outline" },
        ],
      });
    });

  requirements
    .filter((r) => isRequirementActionableStatus(r.status))
    .slice(0, cap)
    .forEach((r, i) => {
      rows.push({
        id: `match-${r.id}-${i}`,
        type: "",
        typeKey: "dashboard:agency.executive.queueTypeMatch",
        priority: reqPriorityToQueuePriority(r.priority),
        entity: r.patientName,
        reason: "",
        reasonKey: "dashboard:agency.executive.queueReasonMatch",
        reasonParams: { careType: r.careType },
        time: r.submittedAgo || r.submittedDate,
        href: agencyAppPaths.requirementReview(r.id),
        primaryActionLabelKey: "dashboard:agency.executive.queueOpenMatch",
        inlineActions: [
          { labelKey: "dashboard:agency.executive.queueAssign", to: agencyAppPaths.caregivers(), variant: "outline" },
          { labelKey: "dashboard:agency.executive.queueMessage", to: agencyAppPaths.messages(), variant: "outline" },
        ],
      });
    });

  const rank: Record<OperationalQueuePriority, number> = { high: 0, medium: 1, low: 2 };
  rows.sort((a, b) => rank[a.priority] - rank[b.priority]);
  return rows.slice(0, AGENCY_EXECUTIVE_CAPS.queueRowsMax);
}

function buildNotifications(
  clientEng: PackageClientEngagement[],
  cgEng: PackageCaregiverEngagement[],
  pendingContractSignals: number,
): AgencyExecutiveNotificationSummary {
  const clientInterests = clientEng.filter((e) => isOpenPackageEngagementStatus(e.status)).length;
  const caregiverApplications = cgEng.filter((e) => isOpenPackageEngagementStatus(e.status)).length;
  return {
    clientInterests,
    caregiverApplications,
    contractUpdates: pendingContractSignals,
  };
}

export interface AgencyExecutiveMapperInput {
  summary: AgencyDashboardSummary;
  monitoring: { shifts: ActiveShift[]; alerts: ShiftAlert[] };
  cjJobs: CaregivingJobListRow[];
  clientEngagements: PackageClientEngagement[];
  caregiverEngagements: PackageCaregiverEngagement[];
  requirements: RequirementInboxItem[];
  placements: AgencyPlacement[];
  openBoardRequirementCount: number;
  contractPendingOffers: number;
  activeJobsCount: number;
  activeJobsHref: string;
  useSupabaseCj: boolean;
}

export function buildAgencyExecutiveDashboard(input: AgencyExecutiveMapperInput): AgencyExecutiveDashboardData {
  const activePlacements = input.placements.filter(
    (p) => String(p.status).toLowerCase() === PLACEMENT_STATUS_ACTIVE,
  ).length;
  const newReqs = input.requirements.filter((r) => r.status === REQUIREMENT_STATUS_NEW).length;
  const fillRatePercent = executiveFillRatePercent({
    activePlacements,
    openBoardRequirementCount: input.openBoardRequirementCount,
    newRequirementCount: newReqs,
  });
  const denom = activePlacements + input.openBoardRequirementCount + newReqs;

  const alerts = buildAlerts(input.monitoring.alerts, input.requirements);
  const activeJobs = buildActiveJobs(
    input.monitoring.shifts,
    input.cjJobs,
    AGENCY_EXECUTIVE_CAPS.activeJobsMax,
  );
  const queue = buildQueue(input.clientEngagements, input.caregiverEngagements, input.requirements);
  const notifications = buildNotifications(
    input.clientEngagements,
    input.caregiverEngagements,
    input.contractPendingOffers,
  );

  const kpis: OperationalDashboardKpi[] = [
    {
      id: "jobs",
      labelKey: "dashboard:agency.activeJobs",
      format: "count",
      value: input.activeJobsCount,
      hintKey: input.useSupabaseCj
        ? "dashboard:agency.activeJobsHintCj"
        : "dashboard:agency.activeJobsHintRecruitment",
      to: input.activeJobsHref,
    },
    {
      id: "revenue",
      labelKey: "dashboard:agency.revenueCompactLabel",
      labelParams: { month: input.summary.revenueMonthLabel },
      format: "bdtCompact",
      value: input.summary.revenueThisMonthBdt,
      to: agencyAppPaths.reports(),
    },
    {
      id: "fillRate",
      labelKey: "dashboard:agency.executive.kpiFillRate",
      format: "plain",
      value: `${fillRatePercent}%`,
      hintKey: "dashboard:agency.executive.kpiFillRateHint",
      hintParams: { active: activePlacements, open: denom },
      to: agencyAppPaths.placements(),
    },
  ];

  return { alerts, activeJobs, queue, notifications, kpis };
}
