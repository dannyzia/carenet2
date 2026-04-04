import type {
  CareDiaryEntry,
  PatientCarePlanDoc,
  HealthAlertRule,
  CaregiverLocationPing,
  SymptomJournalEntry,
  PhotoJournalEntry,
  NutritionLogEntry,
  RehabLogEntry,
  FamilyBoardPost,
  InsurancePolicyRow,
  TelehealthSessionRow,
  CareScorecardSnapshot,
} from "@/backend/models";

/** Seeded patient row (Amina Begum) — guardian views */
export const MOCK_SECTION15_PATIENT_ID = "10000000-0000-0000-0000-000000000001";
/** Demo patient auth.users id (amina@carenet.demo) — patient-role views */
export const MOCK_SECTION15_PATIENT_AUTH_ID = "00000000-0000-0000-0000-000000000003";

function cloneForAuthPatient<T extends { patientId: string }>(rows: T[]): T[] {
  return rows.map((r) => ({ ...r, patientId: MOCK_SECTION15_PATIENT_AUTH_ID }));
}

export const MOCK_CARE_DIARY: CareDiaryEntry[] = [
  {
    id: "cd-1",
    patientId: MOCK_SECTION15_PATIENT_ID,
    entryDate: "2026-04-01",
    body: "Patient was alert and cooperative. Light breakfast, no issues.",
    mood: "good",
    createdBy: "00000000-0000-0000-0000-000000000001",
    createdAt: "2026-04-01T08:30:00Z",
  },
  {
    id: "cd-2",
    patientId: MOCK_SECTION15_PATIENT_ID,
    entryDate: "2026-04-02",
    body: "Afternoon walk in the garden. BP checked — stable.",
    mood: "good",
    createdBy: "00000000-0000-0000-0000-000000000001",
    createdAt: "2026-04-02T14:00:00Z",
  },
];

export const MOCK_CARE_PLAN: PatientCarePlanDoc[] = [
  {
    id: "cp-1",
    patientId: MOCK_SECTION15_PATIENT_ID,
    title: "Diabetes & hypertension plan",
    body: "• Medications as prescribed\n• Daily vitals morning & evening\n• Low-sodium diet\n• Report dizziness immediately",
    updatedAt: "2026-03-20T10:00:00Z",
    createdBy: "00000000-0000-0000-0000-000000000002",
  },
];

export const MOCK_ALERT_RULES: HealthAlertRule[] = [
  {
    id: "ar-1",
    patientId: MOCK_SECTION15_PATIENT_ID,
    metricType: "glucose",
    operator: ">",
    thresholdValue: 200,
    enabled: true,
    createdAt: "2026-03-01T00:00:00Z",
  },
  {
    id: "ar-2",
    patientId: MOCK_SECTION15_PATIENT_ID,
    metricType: "systolic_bp",
    operator: ">",
    thresholdValue: 160,
    enabled: true,
    createdAt: "2026-03-01T00:00:00Z",
  },
];

export const MOCK_LOCATION_PINGS: CaregiverLocationPing[] = [
  {
    id: "lp-1",
    patientId: MOCK_SECTION15_PATIENT_ID,
    caregiverId: "00000000-0000-0000-0000-000000000001",
    lat: 23.7461,
    lng: 90.3742,
    recordedAt: "2026-04-03T09:15:00Z",
  },
];

export const MOCK_SYMPTOMS: SymptomJournalEntry[] = [
  {
    id: "sj-1",
    patientId: MOCK_SECTION15_PATIENT_ID,
    loggedAt: "2026-04-02T11:00:00Z",
    severity: 3,
    notes: "Mild headache after lunch; improved with rest.",
  },
];

export const MOCK_PHOTOS: PhotoJournalEntry[] = [
  {
    id: "pj-1",
    patientId: MOCK_SECTION15_PATIENT_ID,
    imageUrl: "https://placehold.co/400x300/e8d5e0/333?text=Wound+check",
    caption: "Dressing clean and dry — day 3",
    loggedAt: "2026-04-01T16:00:00Z",
  },
];

export const MOCK_NUTRITION: NutritionLogEntry[] = [
  {
    id: "nl-1",
    patientId: MOCK_SECTION15_PATIENT_ID,
    loggedAt: "2026-04-03T07:30:00Z",
    mealType: "Breakfast",
    description: "Oats, banana, milk (low sugar)",
    calories: 320,
  },
];

export const MOCK_REHAB: RehabLogEntry[] = [
  {
    id: "rb-1",
    patientId: MOCK_SECTION15_PATIENT_ID,
    loggedAt: "2026-04-03T10:00:00Z",
    activity: "Seated leg raises",
    durationMins: 15,
    notes: "Completed without pain.",
  },
];

export const MOCK_FAMILY_BOARD: FamilyBoardPost[] = [
  {
    id: "fb-1",
    patientId: MOCK_SECTION15_PATIENT_ID,
    authorId: "00000000-0000-0000-0000-000000000002",
    body: "Doctor visit moved to Thursday 4pm — please confirm transport.",
    createdAt: "2026-04-02T18:00:00Z",
  },
];

export const MOCK_INSURANCE: InsurancePolicyRow[] = [
  {
    id: "in-1",
    patientId: MOCK_SECTION15_PATIENT_ID,
    providerName: "National Health Shield",
    policyNumber: "NHS-BD-77821",
    coverageSummary: "Inpatient + selected outpatient; copay ৳500",
    validUntil: "2027-01-01",
  },
];

export const MOCK_TELEHEALTH: TelehealthSessionRow[] = [
  {
    id: "th-1",
    patientId: MOCK_SECTION15_PATIENT_ID,
    scheduledAt: "2026-04-10T14:00:00Z",
    providerName: "Dr. Rahman (Cardiology)",
    meetingUrl: null,
    status: "scheduled",
  },
];

export const MOCK_SCORECARDS: CareScorecardSnapshot[] = [
  {
    id: "sc-1",
    patientId: MOCK_SECTION15_PATIENT_ID,
    scope: "guardian",
    periodStart: "2026-03-01",
    periodEnd: "2026-03-31",
    metrics: { onTimeShifts: 0.94, vitalsLogged: 28, incidents: 0, guardianRating: 4.7 },
    createdAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "sc-2",
    patientId: MOCK_SECTION15_PATIENT_ID,
    scope: "agency",
    periodStart: "2026-03-01",
    periodEnd: "2026-03-31",
    metrics: { placementQuality: 0.91, caregiverUtilization: 0.78, openIncidents: 0 },
    createdAt: "2026-04-01T00:00:00Z",
  },
];

/** Merged mock rows for either guardian patient UUID or patient auth UUID */
export const MOCK_CARE_DIARY_ALL: CareDiaryEntry[] = [...MOCK_CARE_DIARY, ...cloneForAuthPatient(MOCK_CARE_DIARY)];
export const MOCK_CARE_PLAN_ALL: PatientCarePlanDoc[] = [...MOCK_CARE_PLAN, ...cloneForAuthPatient(MOCK_CARE_PLAN)];
export const MOCK_ALERT_RULES_ALL: HealthAlertRule[] = [...MOCK_ALERT_RULES, ...cloneForAuthPatient(MOCK_ALERT_RULES)];
export const MOCK_LOCATION_PINGS_ALL: CaregiverLocationPing[] = [...MOCK_LOCATION_PINGS, ...cloneForAuthPatient(MOCK_LOCATION_PINGS)];
export const MOCK_SYMPTOMS_ALL: SymptomJournalEntry[] = [...MOCK_SYMPTOMS, ...cloneForAuthPatient(MOCK_SYMPTOMS)];
export const MOCK_PHOTOS_ALL: PhotoJournalEntry[] = [...MOCK_PHOTOS, ...cloneForAuthPatient(MOCK_PHOTOS)];
export const MOCK_NUTRITION_ALL: NutritionLogEntry[] = [...MOCK_NUTRITION, ...cloneForAuthPatient(MOCK_NUTRITION)];
export const MOCK_REHAB_ALL: RehabLogEntry[] = [...MOCK_REHAB, ...cloneForAuthPatient(MOCK_REHAB)];
export const MOCK_FAMILY_BOARD_ALL: FamilyBoardPost[] = [...MOCK_FAMILY_BOARD, ...cloneForAuthPatient(MOCK_FAMILY_BOARD)];
export const MOCK_INSURANCE_ALL: InsurancePolicyRow[] = [...MOCK_INSURANCE, ...cloneForAuthPatient(MOCK_INSURANCE)];
export const MOCK_TELEHEALTH_ALL: TelehealthSessionRow[] = [...MOCK_TELEHEALTH, ...cloneForAuthPatient(MOCK_TELEHEALTH)];
export const MOCK_SCORECARDS_ALL: CareScorecardSnapshot[] = [...MOCK_SCORECARDS, ...cloneForAuthPatient(MOCK_SCORECARDS)];

/** In-memory rows appended by `section15Service` writes when Supabase is off or for local demo */
export const section15MockWriteStore: {
  careDiary: CareDiaryEntry[];
  familyBoard: FamilyBoardPost[];
  symptoms: SymptomJournalEntry[];
} = { careDiary: [], familyBoard: [], symptoms: [] };

function byPatient<T extends { patientId: string }>(rows: T[], patientId: string): T[] {
  return rows.filter((r) => r.patientId === patientId);
}

export function mergeMockCareDiary(patientId: string): CareDiaryEntry[] {
  const all = [...MOCK_CARE_DIARY_ALL, ...section15MockWriteStore.careDiary];
  return byPatient(all, patientId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function mergeMockFamilyBoard(patientId: string): FamilyBoardPost[] {
  const all = [...MOCK_FAMILY_BOARD_ALL, ...section15MockWriteStore.familyBoard];
  return byPatient(all, patientId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function mergeMockSymptoms(patientId: string): SymptomJournalEntry[] {
  const all = [...MOCK_SYMPTOMS_ALL, ...section15MockWriteStore.symptoms];
  return byPatient(all, patientId).sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
}
