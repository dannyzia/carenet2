import type {
  PatientAppointment,
  PatientDashboardMedication,
  PatientDashboardVital,
} from "@/backend/models";
import type {
  OperationalDashboardAction,
  OperationalDashboardData,
  OperationalDashboardQueueRow,
  OperationalQueuePriority,
} from "@/backend/models/operationalDashboard.model";

export interface PatientOperationalInputs {
  vitals: PatientDashboardVital[];
  medications: PatientDashboardMedication[];
  appointments: PatientAppointment[];
}

function medPriority(m: PatientDashboardMedication): OperationalQueuePriority {
  if (!m.taken) return "high";
  return "medium";
}

export function mapPatientOperationalDashboard(input: PatientOperationalInputs): OperationalDashboardData {
  const actions: OperationalDashboardAction[] = [
    { id: "post-req", labelKey: "dashboard:patient.opsPostRequirement", to: "/patient/care-requirement-wizard" },
    { id: "requirements", labelKey: "dashboard:patient.opsMyRequirements", to: "/patient/care-requirements" },
    { id: "placements", labelKey: "dashboard:patient.opsPlacements", to: "/patient/placements" },
    { id: "messages", labelKey: "dashboard:patient.opsMessages", to: "/patient/messages" },
  ];

  const medRows: OperationalDashboardQueueRow[] = input.medications.slice(0, 6).map((m, i) => ({
    id: `med-${i}`,
    type: "",
    typeKey: "dashboard:patient.queueTypeMedication",
    priority: medPriority(m),
    entity: m.name,
    reasonKey: m.taken ? "dashboard:patient.medTaken" : "dashboard:patient.medDue",
    reason: "",
    time: m.time,
    href: "/patient/medical-records",
    primaryActionLabelKey: "dashboard:patient.queueOpenRecords",
  }));

  const apptRows: OperationalDashboardQueueRow[] = input.appointments.slice(0, 4).map((a, i) => ({
    id: `appt-${i}`,
    type: "",
    typeKey: "dashboard:patient.queueTypeAppointment",
    priority: "medium" as const,
    entity: a.type,
    reasonKey: "dashboard:patient.queueApptReason",
    reasonParams: { doctor: a.doctor, date: a.date },
    reason: "",
    time: a.time,
    href: "/patient/schedule",
    primaryActionLabelKey: "dashboard:patient.queueOpenSchedule",
  }));

  const vitalRows: OperationalDashboardQueueRow[] = input.vitals.slice(0, 4).map((v, i) => ({
    id: `vital-${i}`,
    type: "",
    typeKey: "dashboard:patient.queueTypeVital",
    priority: "low" as const,
    entity: v.label,
    reason: `${v.value} ${v.unit} · ${v.status}`,
    time: v.trend,
    href: "/patient/medical-records",
    primaryActionLabelKey: "dashboard:patient.queueOpenRecords",
  }));

  const queue = [...medRows, ...apptRows, ...vitalRows];

  return { actions, queue, kpis: [] };
}
