/**
 * Patient Service — business logic layer
 */
import type {
  VitalsReading, MedicationReminder,
  HealthReportDataPoint, ScheduleEvent, UpcomingEvent,
  PatientDashboardVital, PatientDashboardMedication, PatientAppointment,
  MedicalRecord, PatientCondition, CareHistoryEntry,
  PatientProfile, EmergencyData, PrivacyData,
} from "@/backend/models";
import {
  MOCK_VITALS_DATA,
  MOCK_MEDICATION_REMINDERS,
  MOCK_HEALTH_REPORT_DATA,
  MOCK_TODAY_EVENTS,
  MOCK_UPCOMING_EVENTS,
  MOCK_PATIENT_DASHBOARD_VITALS,
  MOCK_PATIENT_DASHBOARD_MEDICATIONS,
  MOCK_PATIENT_APPOINTMENTS,
  MOCK_MEDICAL_RECORDS,
  MOCK_PATIENT_CONDITIONS,
  MOCK_PATIENT_ALLERGIES,
  MOCK_CARE_HISTORY,
  MOCK_PATIENT_PROFILE,
  MOCK_EMERGENCY_DATA,
  MOCK_PRIVACY_DATA,
} from "@/backend/api/mock";
import { USE_SUPABASE, sbRead, sbWrite, sb, currentUserId } from "./_sb";

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

function isDemoAuthMode(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const mode = window.localStorage.getItem("carenet-auth-mode");
    if (mode === "demo") return true;

    const rawUser = window.localStorage.getItem("carenet-auth");
    if (!rawUser) return false;
    const parsed = JSON.parse(rawUser) as { id?: string; email?: string };
    return (
      typeof parsed.id === "string" && parsed.id.startsWith("demo-")
    ) || (
      typeof parsed.email === "string" && parsed.email.endsWith("@carenet.demo")
    );
  } catch {
    return false;
  }
}

function shouldUseSupabase(): boolean {
  return USE_SUPABASE && !isDemoAuthMode();
}

export const patientService = {
  /** Get vitals time-series for charts */
  async getVitalsData(patientId?: string): Promise<VitalsReading[]> {
    if (shouldUseSupabase()) {
      const pid = patientId || "me";
      return sbRead(`vitals:${pid}`, async () => {
        const userId = patientId || await currentUserId();
        const { data, error } = await sb().from("patient_vitals")
          .select("*")
          .eq("patient_id", userId)
          .order("recorded_at", { ascending: true })
          .limit(50);
        if (error) throw error;
        return (data || []).map((d: any) => ({
          time: d.recorded_at,
          bp: parseInt(d.bp?.split("/")[0]) || 0,
          heartRate: parseInt(d.heart_rate) || parseInt(d.pulse) || 0,
          sugar: parseInt(d.glucose) || 0,
        }));
      });
    }
    await delay();
    return MOCK_VITALS_DATA;
  },

  /** Get medication reminders for today */
  async getMedicationReminders(): Promise<MedicationReminder[]> {
    if (shouldUseSupabase()) {
      return sbRead("med-reminders", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("prescriptions")
          .select("*")
          .eq("patient_id", userId)
          .eq("status", "active");
        if (error) throw error;
        return (data || []).map((d: any, i: number) => ({
          id: i + 1,
          name: d.medicine_name,
          dosage: d.dosage,
          timing: (d.timing || [])[0] || "morning",
          instructed: d.instructions || "",
          taken: false,
          refill: d.refill_date || "",
        }));
      });
    }
    await delay();
    return MOCK_MEDICATION_REMINDERS;
  },

  async getHealthReportData(): Promise<HealthReportDataPoint[]> {
    if (shouldUseSupabase()) {
      return sbRead("health-report", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("patient_vitals")
          .select("recorded_at, bp, glucose")
          .eq("patient_id", userId)
          .order("recorded_at", { ascending: true })
          .limit(30);
        if (error) throw error;
        return (data || []).map((d: any) => ({
          day: new Date(d.recorded_at).toLocaleDateString("en", { weekday: "short" }),
          bp: parseInt(d.bp?.split("/")[0]) || 0,
          sugar: parseInt(d.glucose) || 0,
        }));
      });
    }
    await delay();
    return MOCK_HEALTH_REPORT_DATA;
  },

  async getTodayEvents(): Promise<ScheduleEvent[]> {
    if (shouldUseSupabase()) {
      return sbRead("today-events", async () => {
        const userId = await currentUserId();
        const today = new Date().toISOString().split("T")[0];
        const { data, error } = await sb().from("daily_tasks")
          .select("*")
          .eq("patient_id", userId)
          .eq("date", today)
          .order("time", { ascending: true });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id,
          title: d.title,
          time: d.time,
          duration: "1h",
          caregiver: d.caregiver_name || "",
          type: "general" as const,
          notes: d.details,
        }));
      });
    }
    await delay();
    return MOCK_TODAY_EVENTS;
  },

  async getUpcomingEvents(): Promise<UpcomingEvent[]> {
    if (shouldUseSupabase()) {
      return sbRead("upcoming-events", async () => {
        const userId = await currentUserId();
        const today = new Date().toISOString().split("T")[0];
        const { data, error } = await sb().from("daily_tasks")
          .select("*")
          .eq("patient_id", userId)
          .gte("date", today)
          .order("date", { ascending: true })
          .order("time", { ascending: true })
          .limit(10);
        if (error) throw error;
        return (data || []).map((d: any) => ({
          date: d.date,
          title: d.title,
          time: d.time,
          type: d.type,
        }));
      });
    }
    await delay();
    return MOCK_UPCOMING_EVENTS;
  },

  /** Mark a medication as taken */
  async markMedicationTaken(medId: number): Promise<void> {
    if (shouldUseSupabase()) {
      return sbWrite(async () => {
        // Would update a medication_tracking table — not yet created
        console.log(`[patient.service] Medication ${medId} marked as taken (Supabase)`);
      });
    }
    await delay(100);
    console.log(`[patient.service] Medication ${medId} marked as taken`);
  },

  async getDashboardVitals(): Promise<PatientDashboardVital[]> {
    if (shouldUseSupabase()) {
      return sbRead("dashboard-vitals", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("patient_vitals")
          .select("*")
          .eq("patient_id", userId)
          .order("recorded_at", { ascending: false })
          .limit(1);
        if (error) throw error;
        if (!data || data.length === 0) return [];
        const d = data[0] as any;
        return [
          { label: "Blood Pressure", value: d.bp || "N/A", unit: "mmHg", color: "#E91E63", status: "normal", trend: "stable" },
          { label: "Blood Sugar", value: d.glucose || "N/A", unit: "mg/dL", color: "#FF9800", status: "normal", trend: "stable" },
          { label: "Heart Rate", value: d.heart_rate || d.pulse || "N/A", unit: "bpm", color: "#4CAF50", status: "normal", trend: "stable" },
          { label: "Temperature", value: d.temperature || "N/A", unit: "", color: "#2196F3", status: "normal", trend: "stable" },
        ];
      });
    }
    await delay();
    return MOCK_PATIENT_DASHBOARD_VITALS;
  },

  async getDashboardMedications(): Promise<PatientDashboardMedication[]> {
    if (shouldUseSupabase()) {
      return sbRead("dashboard-meds", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("prescriptions")
          .select("medicine_name, timing")
          .eq("patient_id", userId)
          .eq("status", "active")
          .limit(10);
        if (error) throw error;
        return (data || []).map((d: any) => ({
          name: d.medicine_name,
          time: (d.timing || [])[0] || "morning",
          taken: false,
        }));
      });
    }
    await delay();
    return MOCK_PATIENT_DASHBOARD_MEDICATIONS;
  },

  async getAppointments(): Promise<PatientAppointment[]> {
    // Appointments not yet a dedicated table — uses daily_tasks with type=event
    await delay();
    return MOCK_PATIENT_APPOINTMENTS;
  },

  async getMedicalRecords(): Promise<MedicalRecord[]> {
    // Medical records table not yet created
    await delay();
    return MOCK_MEDICAL_RECORDS;
  },

  async getConditions(): Promise<PatientCondition[]> {
    if (shouldUseSupabase()) {
      return sbRead("conditions", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("patients")
          .select("conditions")
          .eq("id", userId)
          .single();
        if (error) throw error;
        const colors = ["#E91E63", "#FF9800", "#4CAF50", "#2196F3", "#9C27B0"];
        return (data?.conditions || []).map((c: string, i: number) => ({
          name: c.replace(/_/g, " "),
          since: "2024",
          severity: "moderate",
          color: colors[i % colors.length],
        }));
      });
    }
    await delay();
    return MOCK_PATIENT_CONDITIONS;
  },

  async getAllergies(): Promise<string[]> {
    await delay();
    return MOCK_PATIENT_ALLERGIES;
  },

  async getCareHistory(): Promise<CareHistoryEntry[]> {
    if (shouldUseSupabase()) {
      return sbRead("care-history", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("shifts")
          .select("*, caregiver_profiles!shifts_caregiver_id_fkey(name)")
          .eq("patient_id", userId)
          .eq("status", "completed")
          .order("date", { ascending: false })
          .limit(20);
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id,
          date: d.date,
          caregiver: d.caregiver_profiles?.name || "Unknown",
          type: "shift",
          duration: `${d.start_time} - ${d.end_time}`,
          rating: 0,
          tasks: [],
          notes: d.notes || "",
        }));
      });
    }
    await delay();
    return MOCK_CARE_HISTORY;
  },

  async getProfile(): Promise<PatientProfile> {
    if (shouldUseSupabase()) {
      return sbRead("patient-profile", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("patients")
          .select("*")
          .eq("id", userId)
          .single();
        if (error) throw error;
        const d = data as any;
        return {
          name: d.name, age: d.age, gender: d.gender, phone: d.phone || "",
          email: "", address: d.location, bloodType: d.blood_group || "",
          emergencyContact: { name: "", relation: "", phone: "" },
          guardian: { name: "", role: d.relation || "", since: d.created_at },
        };
      });
    }
    await delay();
    return MOCK_PATIENT_PROFILE;
  },

  async getEmergencyData(): Promise<EmergencyData> {
    await delay();
    return MOCK_EMERGENCY_DATA;
  },

  async getPrivacyData(): Promise<PrivacyData> {
    await delay();
    return MOCK_PRIVACY_DATA;
  },
};

