/**
 * Patient Service — business logic layer
 */
import type {
  VitalsReading, MedicationReminder,
  HealthReportDataPoint, ScheduleEvent, UpcomingEvent,
  PatientDashboardVital, PatientDashboardMedication, PatientAppointment,
  MedicalRecord, PatientCondition, CareHistoryEntry,
  PatientProfile,
  EmergencyData,
  PrivacyData,
} from "@/backend/models";
import type { OperationalDashboardData } from "@/backend/models/operationalDashboard.model";
import { mapPatientOperationalDashboard } from "./patientOperationalMapper";
import { USE_SUPABASE, sbRead, sbWrite, sb, sbData, currentUserId, useInAppMockDataset } from "./_sb";
import { demoOfflineDelayAndPick } from "./demoOfflineMock";

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

export const patientService = {
  /** Get vitals time-series for charts */
  async getVitalsData(patientId?: string): Promise<VitalsReading[]> {
    if (USE_SUPABASE) {
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
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_VITALS_DATA);
  },

  /** Get medication reminders for today */
  async getMedicationReminders(): Promise<MedicationReminder[]> {
    if (USE_SUPABASE) {
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
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_MEDICATION_REMINDERS);
  },

  async getHealthReportData(): Promise<HealthReportDataPoint[]> {
    if (USE_SUPABASE) {
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
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_HEALTH_REPORT_DATA);
  },

  async getTodayEvents(): Promise<ScheduleEvent[]> {
    if (USE_SUPABASE) {
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
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_TODAY_EVENTS);
  },

  async getUpcomingEvents(): Promise<UpcomingEvent[]> {
    if (USE_SUPABASE) {
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
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_UPCOMING_EVENTS);
  },

  /** Mark a medication as taken */
  async markMedicationTaken(medId: number): Promise<void> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        // Would update a medication_tracking table — not yet created
        console.log(`[patient.service] Medication ${medId} marked as taken (Supabase)`);
      });
    }
    if (!useInAppMockDataset()) {
      throw new Error("[CareNet] Connect Supabase or use Demo Access.");
    }
    await delay(100);
    console.log(`[patient.service] Medication ${medId} marked as taken`);
  },

  async getDashboardVitals(): Promise<PatientDashboardVital[]> {
    if (USE_SUPABASE) {
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
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_PATIENT_DASHBOARD_VITALS);
  },

  async getDashboardMedications(): Promise<PatientDashboardMedication[]> {
    if (USE_SUPABASE) {
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
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_PATIENT_DASHBOARD_MEDICATIONS);
  },

  async getAppointments(): Promise<PatientAppointment[]> {
    if (USE_SUPABASE) {
      return sbRead("appointments", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("daily_tasks")
          .select("*")
          .eq("patient_id", userId)
          .eq("type", "event")
          .order("date", { ascending: true })
          .order("time", { ascending: true });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id,
          title: d.title,
          date: d.date,
          time: d.time,
          doctor: d.details || "",
          location: d.location || "",
          notes: d.notes || "",
        }));
      });
    }
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_PATIENT_APPOINTMENTS);
  },

  async getMedicalRecords(): Promise<MedicalRecord[]> {
    if (USE_SUPABASE) {
      return sbRead("medical-records", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("medical_records")
          .select("*")
          .eq("patient_id", userId)
          .order("date", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id,
          date: d.date,
          type: d.record_type || "general",
          doctor: d.doctor_name || "",
          diagnosis: d.diagnosis || "",
          notes: d.notes || "",
        }));
      });
    }
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_MEDICAL_RECORDS);
  },

  async getConditions(): Promise<PatientCondition[]> {
    if (USE_SUPABASE) {
      return sbRead("conditions", async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("patients")
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
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_PATIENT_CONDITIONS);
  },

  async getAllergies(): Promise<string[]> {
    if (USE_SUPABASE) {
      return sbRead("allergies", async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("patients")
          .select("conditions")
          .eq("id", userId)
          .single();
        if (error) throw error;
        return data?.conditions || [];
      });
    }
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_PATIENT_ALLERGIES);
  },

  async getCareHistory(): Promise<CareHistoryEntry[]> {
    if (USE_SUPABASE) {
      return sbRead("care-history", async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("shifts")
          .select("id, date, start_time, end_time, status, notes, caregiver_id")
          .eq("patient_id", userId)
          .eq("status", "completed")
          .order("date", { ascending: false })
          .limit(20);
        if (error) throw error;
        const rows = data || [];
        const cgIds = [...new Set(rows.map((r: { caregiver_id?: string }) => r.caregiver_id).filter(Boolean))] as string[];
        const nameByCg = new Map<string, string>();
        if (cgIds.length > 0) {
          const { data: profs } = await sbData().from("caregiver_profiles").select("id, name").in("id", cgIds);
          for (const p of profs || []) nameByCg.set(String((p as { id: string }).id), String((p as { name: string }).name));
        }
        return rows.map((d: any) => ({
          id: d.id,
          date: d.date,
          caregiver: nameByCg.get(String(d.caregiver_id)) || "Unknown",
          type: "shift",
          duration: `${d.start_time} - ${d.end_time}`,
          rating: 0,
          tasks: [],
          notes: d.notes || "",
        }));
      });
    }
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_CARE_HISTORY);
  },

  async getProfile(): Promise<PatientProfile> {
    if (USE_SUPABASE) {
      return sbRead("patient-profile", async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("patients")
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
    const emptyProf: PatientProfile = {
      name: "",
      age: 0,
      gender: "",
      phone: "",
      email: "",
      address: "",
      bloodType: "",
      emergencyContact: { name: "", relation: "", phone: "" },
      guardian: { name: "", role: "", since: "" },
    };
    return demoOfflineDelayAndPick(200, emptyProf, (m) => m.MOCK_PATIENT_PROFILE);
  },

  async getEmergencyData(): Promise<EmergencyData> {
    if (USE_SUPABASE) {
      return sbRead("emergency-data", async () => {
        const userId = await currentUserId();
        const { data: patient, error: pErr } = await sbData().from("patients")
          .select("blood_group, conditions")
          .eq("id", userId)
          .single();
        if (pErr) throw pErr;
        const { data: profile } = await sb().from("profiles")
          .select("emergency_contact_name, emergency_contact_phone, emergency_contact_relation")
          .eq("id", userId)
          .single();
        const contact = profile?.emergency_contact_name
          ? [{ name: profile.emergency_contact_name, role: profile.emergency_contact_relation || "", phone: profile.emergency_contact_phone || "", color: "#E91E63" }]
          : [];
        return {
          contacts: contact,
          medical: {
            bloodGroup: patient?.blood_group || "",
            allergies: (patient?.conditions || []).join(", "),
            chronic: "",
          },
          location: "",
        };
      });
    }
    const emptyEm: EmergencyData = {
      contacts: [],
      medical: { bloodGroup: "", allergies: "", chronic: "" },
      location: "",
    };
    return demoOfflineDelayAndPick(200, emptyEm, (m) => m.MOCK_EMERGENCY_DATA);
  },

  /** Log an SOS event (local mock ring buffer or Supabase sos_events). */
  async triggerSos(payload?: { note?: string; lat?: number; lng?: number }): Promise<{ id: string }> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("sos_events").insert({
          user_id: userId,
          note: payload?.note || null,
          client_lat: payload?.lat ?? null,
          client_lng: payload?.lng ?? null,
        }).select("id").single();
        if (error) throw error;
        return { id: data.id };
      });
    }
    if (!useInAppMockDataset()) {
      throw new Error("[CareNet] Connect Supabase or use Demo Access for SOS.");
    }
    await delay(150);
    const id = `sos-${Date.now()}`;
    try {
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem("carenet-sos-log") : null;
      const arr = raw ? (JSON.parse(raw) as unknown[]) : [];
      arr.push({ id, at: new Date().toISOString(), ...payload });
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("carenet-sos-log", JSON.stringify(arr.slice(-20)));
      }
    } catch {
      /* ignore */
    }
    return { id };
  },

  async getPrivacyData(): Promise<PrivacyData> {
    if (USE_SUPABASE) {
      return { authorized: [], accessLogs: [] };
    }
    return demoOfflineDelayAndPick(200, { authorized: [], accessLogs: [] } as PrivacyData, (m) => m.MOCK_PRIVACY_DATA);
  },

  async getOperationalDashboard(): Promise<OperationalDashboardData> {
    const [vitals, medications, appointments] = await Promise.all([
      patientService.getDashboardVitals(),
      patientService.getDashboardMedications(),
      patientService.getAppointments(),
    ]);
    return mapPatientOperationalDashboard({ vitals, medications, appointments });
  },
};

