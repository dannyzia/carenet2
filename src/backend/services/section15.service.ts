/**
 * Section 15 / v2.0 — patient-scoped journals, alerts, and visibility.
 * Mock-first reads; Supabase uses v2_* tables when migration 20260403120000 is applied.
 * Writes require auth when Supabase is enabled (RLS: created_by / author_id = auth.uid()).
 */
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
  CreateCareDiaryEntryInput,
  CreateFamilyBoardPostInput,
  CreateSymptomJournalInput,
} from "@/backend/models";
import {
  MOCK_CARE_PLAN_ALL,
  MOCK_ALERT_RULES_ALL,
  MOCK_LOCATION_PINGS_ALL,
  MOCK_PHOTOS_ALL,
  MOCK_NUTRITION_ALL,
  MOCK_REHAB_ALL,
  MOCK_INSURANCE_ALL,
  MOCK_TELEHEALTH_ALL,
  MOCK_SCORECARDS_ALL,
  MOCK_SECTION15_PATIENT_ID,
  mergeMockCareDiary,
  mergeMockFamilyBoard,
  mergeMockSymptoms,
  section15MockWriteStore,
} from "@/backend/api/mock/section15Mocks";
import { USE_SUPABASE, sb, currentUserId, sbWrite } from "./_sb";

const delay = (ms = 180) => new Promise((r) => setTimeout(r, ms));

/** Placeholder auth id for mock-mode writes (demo only) */
const MOCK_SECTION15_WRITER_ID = "00000000-0000-0000-0000-000000000001";

async function withMock<T>(fn: () => Promise<T>, mock: T): Promise<T> {
  if (!USE_SUPABASE) {
    await delay();
    return mock;
  }
  try {
    return await fn();
  } catch {
    await delay();
    return mock;
  }
}

function filterByPatient<T extends { patientId: string }>(rows: T[], patientId: string): T[] {
  return rows.filter((r) => r.patientId === patientId);
}

function mapCareDiaryRow(d: Record<string, unknown>): CareDiaryEntry {
  const ed = d.entry_date;
  const entryDate = typeof ed === "string" ? ed.slice(0, 10) : String(ed ?? "").slice(0, 10);
  return {
    id: String(d.id),
    patientId: String(d.patient_id),
    entryDate,
    body: String(d.body ?? ""),
    mood: d.mood != null && d.mood !== "" ? String(d.mood) : undefined,
    createdBy: String(d.created_by),
    createdAt: String(d.created_at),
  };
}

function mapFamilyRow(d: Record<string, unknown>): FamilyBoardPost {
  return {
    id: String(d.id),
    patientId: String(d.patient_id),
    authorId: String(d.author_id),
    body: String(d.body ?? ""),
    createdAt: String(d.created_at),
  };
}

function mapSymptomRow(d: Record<string, unknown>): SymptomJournalEntry {
  return {
    id: String(d.id),
    patientId: String(d.patient_id),
    loggedAt: String(d.logged_at),
    severity: Number(d.severity),
    notes: String(d.notes ?? ""),
  };
}

export const section15Service = {
  defaultDemoPatientId: MOCK_SECTION15_PATIENT_ID,

  async getCareDiary(patientId: string): Promise<CareDiaryEntry[]> {
    const mock = mergeMockCareDiary(patientId);
    return withMock(async () => {
      const { data, error } = await sb()
        .from("v2_care_diary_entries")
        .select("*")
        .eq("patient_id", patientId)
        .order("entry_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []).map((row: Record<string, unknown>) => mapCareDiaryRow(row));
    }, mock);
  },

  async createCareDiaryEntry(patientId: string, input: CreateCareDiaryEntryInput): Promise<CareDiaryEntry> {
    const body = input.body.trim();
    if (!body) throw new Error("Care diary entry cannot be empty");
    const entryDate = (input.entryDate?.trim().slice(0, 10) || new Date().toISOString().slice(0, 10)) as string;
    const mood = input.mood?.trim() || undefined;

    if (!USE_SUPABASE) {
      await delay();
      const row: CareDiaryEntry = {
        id: crypto.randomUUID(),
        patientId,
        entryDate,
        body,
        mood,
        createdBy: MOCK_SECTION15_WRITER_ID,
        createdAt: new Date().toISOString(),
      };
      section15MockWriteStore.careDiary.unshift(row);
      return row;
    }

    const uid = await currentUserId();
    return sbWrite(async () => {
      const { data, error } = await sb()
        .from("v2_care_diary_entries")
        .insert({
          patient_id: patientId,
          body,
          entry_date: entryDate,
          mood: mood ?? null,
          created_by: uid,
        })
        .select("*")
        .single();
      if (error) throw error;
      return mapCareDiaryRow(data as Record<string, unknown>);
    });
  },

  async getCarePlan(patientId: string): Promise<PatientCarePlanDoc[]> {
    const mock = filterByPatient(MOCK_CARE_PLAN_ALL, patientId);
    return withMock(async () => {
      const { data, error } = await sb()
        .from("v2_patient_care_plans")
        .select("*")
        .eq("patient_id", patientId)
        .order("updated_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id,
        patientId: d.patient_id,
        title: d.title,
        body: d.body,
        updatedAt: d.updated_at,
        createdBy: d.created_by,
      }));
    }, mock);
  },

  async getAlertRules(patientId: string): Promise<HealthAlertRule[]> {
    const mock = filterByPatient(MOCK_ALERT_RULES_ALL, patientId);
    return withMock(async () => {
      const { data, error } = await sb()
        .from("v2_health_alert_rules")
        .select("*")
        .eq("patient_id", patientId);
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id,
        patientId: d.patient_id,
        metricType: d.metric_type,
        operator: d.operator,
        thresholdValue: d.threshold_value != null ? Number(d.threshold_value) : null,
        enabled: d.enabled,
        createdAt: d.created_at,
      }));
    }, mock);
  },

  async getLocationPings(patientId: string): Promise<CaregiverLocationPing[]> {
    const mock = filterByPatient(MOCK_LOCATION_PINGS_ALL, patientId);
    return withMock(async () => {
      const { data, error } = await sb()
        .from("v2_caregiver_location_pings")
        .select("*")
        .eq("patient_id", patientId)
        .order("recorded_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id,
        patientId: d.patient_id,
        caregiverId: d.caregiver_id,
        shiftId: d.shift_id,
        lat: Number(d.lat),
        lng: Number(d.lng),
        recordedAt: d.recorded_at,
      }));
    }, mock);
  },

  async getSymptoms(patientId: string): Promise<SymptomJournalEntry[]> {
    const mock = mergeMockSymptoms(patientId);
    return withMock(async () => {
      const { data, error } = await sb()
        .from("v2_symptom_journal_entries")
        .select("*")
        .eq("patient_id", patientId)
        .order("logged_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []).map((row: Record<string, unknown>) => mapSymptomRow(row));
    }, mock);
  },

  async createSymptomJournalEntry(patientId: string, input: CreateSymptomJournalInput): Promise<SymptomJournalEntry> {
    const severity = Math.min(10, Math.max(1, Math.round(Number(input.severity))));
    const notes = input.notes.trim();
    if (!USE_SUPABASE) {
      await delay();
      const row: SymptomJournalEntry = {
        id: crypto.randomUUID(),
        patientId,
        loggedAt: new Date().toISOString(),
        severity,
        notes,
      };
      section15MockWriteStore.symptoms.unshift(row);
      return row;
    }

    const uid = await currentUserId();
    return sbWrite(async () => {
      const { data, error } = await sb()
        .from("v2_symptom_journal_entries")
        .insert({
          patient_id: patientId,
          severity,
          notes,
          created_by: uid,
        })
        .select("*")
        .single();
      if (error) throw error;
      return mapSymptomRow(data as Record<string, unknown>);
    });
  },

  async getPhotoJournal(patientId: string): Promise<PhotoJournalEntry[]> {
    const mock = filterByPatient(MOCK_PHOTOS_ALL, patientId);
    return withMock(async () => {
      const { data, error } = await sb()
        .from("v2_photo_journal_entries")
        .select("*")
        .eq("patient_id", patientId)
        .order("logged_at", { ascending: false })
        .limit(40);
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id,
        patientId: d.patient_id,
        imageUrl: d.image_url,
        caption: d.caption,
        loggedAt: d.logged_at,
      }));
    }, mock);
  },

  async getNutrition(patientId: string): Promise<NutritionLogEntry[]> {
    const mock = filterByPatient(MOCK_NUTRITION_ALL, patientId);
    return withMock(async () => {
      const { data, error } = await sb()
        .from("v2_nutrition_logs")
        .select("*")
        .eq("patient_id", patientId)
        .order("logged_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id,
        patientId: d.patient_id,
        loggedAt: d.logged_at,
        mealType: d.meal_type,
        description: d.description,
        calories: d.calories != null ? Number(d.calories) : null,
      }));
    }, mock);
  },

  async getRehab(patientId: string): Promise<RehabLogEntry[]> {
    const mock = filterByPatient(MOCK_REHAB_ALL, patientId);
    return withMock(async () => {
      const { data, error } = await sb()
        .from("v2_rehab_logs")
        .select("*")
        .eq("patient_id", patientId)
        .order("logged_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id,
        patientId: d.patient_id,
        loggedAt: d.logged_at,
        activity: d.activity,
        durationMins: d.duration_mins,
        notes: d.notes,
      }));
    }, mock);
  },

  async getFamilyBoard(patientId: string): Promise<FamilyBoardPost[]> {
    const mock = mergeMockFamilyBoard(patientId);
    return withMock(async () => {
      const { data, error } = await sb()
        .from("v2_family_board_posts")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(40);
      if (error) throw error;
      return (data || []).map((row: Record<string, unknown>) => mapFamilyRow(row));
    }, mock);
  },

  async createFamilyBoardPost(patientId: string, input: CreateFamilyBoardPostInput): Promise<FamilyBoardPost> {
    const text = input.body.trim();
    if (!text) throw new Error("Post cannot be empty");

    if (!USE_SUPABASE) {
      await delay();
      const row: FamilyBoardPost = {
        id: crypto.randomUUID(),
        patientId,
        authorId: MOCK_SECTION15_WRITER_ID,
        body: text,
        createdAt: new Date().toISOString(),
      };
      section15MockWriteStore.familyBoard.unshift(row);
      return row;
    }

    const uid = await currentUserId();
    return sbWrite(async () => {
      const { data, error } = await sb()
        .from("v2_family_board_posts")
        .insert({
          patient_id: patientId,
          body: text,
          author_id: uid,
        })
        .select("*")
        .single();
      if (error) throw error;
      return mapFamilyRow(data as Record<string, unknown>);
    });
  },

  async getInsurance(patientId: string): Promise<InsurancePolicyRow[]> {
    const mock = filterByPatient(MOCK_INSURANCE_ALL, patientId);
    return withMock(async () => {
      const { data, error } = await sb()
        .from("v2_insurance_policies")
        .select("*")
        .eq("patient_id", patientId);
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id,
        patientId: d.patient_id,
        providerName: d.provider_name,
        policyNumber: d.policy_number,
        coverageSummary: d.coverage_summary,
        validUntil: d.valid_until,
      }));
    }, mock);
  },

  async getTelehealth(patientId: string): Promise<TelehealthSessionRow[]> {
    const mock = filterByPatient(MOCK_TELEHEALTH_ALL, patientId);
    return withMock(async () => {
      const { data, error } = await sb()
        .from("v2_telehealth_sessions")
        .select("*")
        .eq("patient_id", patientId)
        .order("scheduled_at", { ascending: true })
        .limit(20);
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id,
        patientId: d.patient_id,
        scheduledAt: d.scheduled_at,
        providerName: d.provider_name,
        meetingUrl: d.meeting_url,
        status: d.status,
      }));
    }, mock);
  },

  async getScorecards(patientId: string, scope?: "guardian" | "agency"): Promise<CareScorecardSnapshot[]> {
    let mock = filterByPatient(MOCK_SCORECARDS_ALL, patientId);
    if (scope) mock = mock.filter((m) => m.scope === scope);
    return withMock(async () => {
      let q = sb().from("v2_care_scorecards").select("*").eq("patient_id", patientId);
      if (scope) q = q.eq("scope", scope);
      const { data, error } = await q.order("created_at", { ascending: false }).limit(12);
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id,
        patientId: d.patient_id,
        scope: d.scope,
        periodStart: d.period_start,
        periodEnd: d.period_end,
        metrics: (d.metrics || {}) as Record<string, unknown>,
        createdAt: d.created_at,
      }));
    }, mock);
  },
};
