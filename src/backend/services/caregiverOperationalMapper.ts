import type { CaregiverDashboardSummary, UpcomingScheduleItem } from "@/backend/models";
import type {
  OperationalDashboardData,
  OperationalDashboardAction,
  OperationalDashboardQueueRow,
  OperationalQueuePriority,
} from "@/backend/models/operationalDashboard.model";

export interface CaregiverOperationalInputs {
  summary: CaregiverDashboardSummary;
  upcoming: UpcomingScheduleItem[];
  /** ISO YYYY-MM-DD — shifts without `date` are treated as today (mock-friendly). */
  todayIso: string;
  walletBalance: number;
  walletPendingDue: number;
  contractActive: number;
  contractPendingOffers: number;
}

function shiftPriority(_i: number): OperationalQueuePriority {
  return "medium";
}

export function mapCaregiverOperationalDashboard(input: CaregiverOperationalInputs): OperationalDashboardData {
  const actions: OperationalDashboardAction[] = [
    { id: "jobs", labelKey: "dashboard:caregiver.opsFindJobs", to: "/caregiver/jobs" },
    { id: "schedule", labelKey: "dashboard:caregiver.opsMySchedule", to: "/caregiver/schedule" },
    { id: "messages", labelKey: "dashboard:caregiver.opsMessages", to: "/caregiver/messages" },
  ];

  const todays = input.upcoming.filter((s) => !s.date || s.date === input.todayIso);
  const queue: OperationalDashboardQueueRow[] = todays.map((s, i) => {
    const href = s.shiftId ? `/caregiver/shift/${encodeURIComponent(s.shiftId)}` : "/caregiver/schedule";
    return {
      id: s.shiftId ?? `shift-${i}`,
      type: "",
      typeKey: "dashboard:caregiver.shiftQueueType",
      priority: shiftPriority(i),
      entity: s.patient,
      reason: s.type,
      time: s.time,
      href,
      primaryActionLabelKey: "dashboard:caregiver.queueOpenShift",
    };
  });

  return { actions, queue, kpis: [] };
}
