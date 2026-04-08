/** Patient profile — the person receiving care */
export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  relation?: string;
  bloodGroup?: string;
  dob?: string;
  location: string;
  phone?: string;
  /** Name of emergency contact for this patient (may differ from guardian). */
  emergencyContactName?: string;
  conditions: string[];
  status: "active" | "inactive" | "discharged";
  avatar?: string;
  color?: string;
  caregiver?: { name: string; rating: number; since: string };
  vitals?: PatientVitals;
}

/** Latest vitals snapshot */
export interface PatientVitals {
  bp?: string;
  glucose?: string;
  pulse?: string;
  weight?: string;
  temperature?: string;
}

/** Vitals time-series entry for charts */
export interface VitalsReading {
  time: string;
  bp: number;
  heartRate: number;
  sugar: number;
}

/** Medical prescription */
export interface Prescription {
  id: string;
  patientName: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  timing: string[];
  duration: string;
  prescribedBy: string;
  startDate: string;
  endDate: string;
  instructions: string;
  status: "active" | "completed" | "discontinued";
  refillDate?: string;
}

/** Medication reminder entry */
export interface MedicationReminder {
  id: number;
  name: string;
  dosage: string;
  timing: string;
  instructed: string;
  taken: boolean;
  refill: string;
}

// ─── Health Reports ───
export interface HealthReportDataPoint { day: string; bp: number; sugar: number; }

// ─── Schedule ───
export interface ScheduleEvent {
  id: string; title: string; time: string; duration: string;
  caregiver: string; type: "medication" | "vitals" | "therapy" | "meal" | "appointment" | "general";
  location?: string; notes?: string;
}

export interface UpcomingEvent { date: string; title: string; time: string; type: string; }

// ─── Dashboard ───
export interface PatientDashboardVital {
  /** i18n key under `dashboard.patient.vitals` when set; otherwise `label` is shown as-is */
  vitalKey?: "bloodPressure" | "bloodGlucose" | "pulseRate";
  label: string; value: string; unit: string; color: string; status: string; trend: string;
}

export interface PatientDashboardMedication { name: string; time: string; taken: boolean; }

export interface PatientAppointment {
  doctor: string; type: string; date: string; time: string; location: string;
}

// ─── Medical Records ───
export interface MedicalRecord {
  id: string; type: string; title: string; date: string;
  doctor: string; facility: string; status: string;
}

export interface PatientCondition { name: string; since: string; severity: string; color: string; }

// ─── Care History ───
export interface CareHistoryEntry {
  id: string; date: string; caregiver: string; type: string; duration: string;
  rating: number; tasks: string[]; notes: string;
}

// ─── Service Return Types (untyped methods) ───
export interface PatientProfile {
  name: string; age: number; gender: string; phone: string;
  email: string; address: string; bloodType: string;
  emergencyContact: { name: string; relation: string; phone: string };
  guardian: { name: string; role: string; since: string };
}

export interface EmergencyContact {
  name: string; role: string; phone: string; color: string;
}

export interface EmergencyData {
  contacts: EmergencyContact[];
  medical: { bloodGroup: string; allergies: string; chronic: string };
  location: string;
}

export interface AuthorizedAccess {
  name: string; role: string; level: string; expires: string;
}

export interface AccessLogEntry {
  user: string; action: string; time: string;
}

export interface PrivacyData {
  authorized: AuthorizedAccess[];
  accessLogs: AccessLogEntry[];
}