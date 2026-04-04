/** Section 15 / v2.0 — patient-scoped care visibility & journals */

export interface CareDiaryEntry {
  id: string;
  patientId: string;
  entryDate: string;
  body: string;
  mood?: string;
  createdBy: string;
  createdAt: string;
}

export interface PatientCarePlanDoc {
  id: string;
  patientId: string;
  title: string;
  body: string;
  updatedAt: string;
  createdBy: string;
}

export interface HealthAlertRule {
  id: string;
  patientId: string;
  metricType: string;
  operator: string;
  thresholdValue: number | null;
  enabled: boolean;
  createdAt: string;
}

export interface CaregiverLocationPing {
  id: string;
  patientId: string;
  caregiverId: string;
  shiftId?: string;
  lat: number;
  lng: number;
  recordedAt: string;
}

export interface SymptomJournalEntry {
  id: string;
  patientId: string;
  loggedAt: string;
  severity: number;
  notes: string;
}

export interface PhotoJournalEntry {
  id: string;
  patientId: string;
  imageUrl: string;
  caption: string;
  loggedAt: string;
}

export interface NutritionLogEntry {
  id: string;
  patientId: string;
  loggedAt: string;
  mealType: string;
  description: string;
  calories: number | null;
}

export interface RehabLogEntry {
  id: string;
  patientId: string;
  loggedAt: string;
  activity: string;
  durationMins: number;
  notes: string;
}

export interface FamilyBoardPost {
  id: string;
  patientId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface InsurancePolicyRow {
  id: string;
  patientId: string;
  providerName: string;
  policyNumber: string;
  coverageSummary: string;
  validUntil: string | null;
}

export interface TelehealthSessionRow {
  id: string;
  patientId: string;
  scheduledAt: string;
  providerName: string;
  meetingUrl: string | null;
  status: string;
}

export interface CareScorecardSnapshot {
  id: string;
  patientId: string;
  scope: "guardian" | "agency";
  periodStart: string;
  periodEnd: string;
  metrics: Record<string, unknown>;
  createdAt: string;
}

/** Create payloads (Section 15 write paths) */
export interface CreateCareDiaryEntryInput {
  body: string;
  mood?: string;
  /** ISO date YYYY-MM-DD; defaults to today (client / DB) */
  entryDate?: string;
}

export interface CreateFamilyBoardPostInput {
  body: string;
}

export interface CreateSymptomJournalInput {
  /** 1–10 */
  severity: number;
  notes: string;
}
