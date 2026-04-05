/**
 * Guardian Service — business logic layer
 */
import type {
  Patient, SpendingDataPoint, FamilyMember,
  GuardianPlacement,
  GuardianDashboardPatient, CareRequirementMessage, WizardAgency,
  GuardianTransaction, GuardianInvoice, GuardianAppointment,
  GuardianTodayEvent, PastCaregiverReview, ReceivedReview,
  PlacementShiftHistory, CaregiverTimelineEntry, GuardianActivity,
  AgencyPublicProfile, CaregiverPublicProfile, ComparisonCaregiver,
  GuardianProfile, InvoiceDetail,
} from "@/backend/models";
import {
  MOCK_INCIDENT_HISTORY,
  MOCK_GUARDIAN_PATIENTS,
  MOCK_GUARDIAN_SPENDING,
  MOCK_FAMILY_MEMBERS,
  MOCK_GUARDIAN_PLACEMENTS,
  MOCK_GUARDIAN_DASHBOARD_PATIENTS,
  MOCK_CARE_REQUIREMENT_MESSAGES,
  MOCK_WIZARD_AGENCIES,
  MOCK_GUARDIAN_TRANSACTIONS,
  MOCK_GUARDIAN_INVOICES,
  MOCK_GUARDIAN_APPOINTMENTS,
  MOCK_GUARDIAN_TODAY_EVENTS,
  MOCK_PAST_CAREGIVERS,
  MOCK_RECEIVED_REVIEWS,
  MOCK_PLACEMENT_SHIFT_HISTORY,
  MOCK_CAREGIVER_TIMELINE,
  MOCK_GUARDIAN_RECENT_ACTIVITY,
  MOCK_AGENCY_PUBLIC_PROFILE,
  MOCK_CAREGIVER_PUBLIC_PROFILE,
  MOCK_COMPARISON_CAREGIVERS,
  MOCK_GUARDIAN_PROFILE,
  MOCK_INVOICE_DETAIL,
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

export const guardianService = {
  async getPatients(): Promise<Patient[]> {
    if (shouldUseSupabase()) {
      return sbRead("gd:patients", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("patients")
          .select("*")
          .eq("guardian_id", userId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id, name: d.name, age: d.age, gender: d.gender,
          relation: d.relation, bloodGroup: d.blood_group, dob: d.dob,
          location: d.location, phone: d.phone, conditions: d.conditions || [],
          status: d.status, avatar: d.avatar, color: d.color,
        }));
      });
    }
    await delay();
    return MOCK_GUARDIAN_PATIENTS;
  },

  async getSpendingData(): Promise<SpendingDataPoint[]> {
    if (shouldUseSupabase()) {
      return sbRead("gd:spending", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("invoices")
          .select("issued_date, total, status")
          .eq("to_party_id", userId)
          .order("issued_date", { ascending: true });
        if (error) throw error;
        // Group by month for spending chart
        const monthMap = new Map<string, number>();
        (data || []).forEach((inv: any) => {
          if (inv.issued_date) {
            const month = inv.issued_date.slice(0, 7); // YYYY-MM
            monthMap.set(month, (monthMap.get(month) || 0) + (inv.total || 0));
          }
        });
        return Array.from(monthMap.entries()).map(([month, amount]) => ({
          month,
          amount,
        }));
      });
    }
    await delay();
    return MOCK_GUARDIAN_SPENDING;
  },

  async getFamilyMembers(): Promise<FamilyMember[]> {
    if (shouldUseSupabase()) {
      return sbRead("gd:family", async () => {
        // No dedicated family_members table yet — return empty for real users
        return [];
      });
    }
    await delay();
    return MOCK_FAMILY_MEMBERS;
  },

  async getPlacements(): Promise<GuardianPlacement[]> {
    if (shouldUseSupabase()) {
      return sbRead("gd:placements", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("placements")
          .select("*")
          .eq("guardian_id", userId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id, patientName: d.patient_name, caregiverName: d.caregiver_name,
          agencyName: d.agency_name, careType: d.care_type, startDate: d.start_date,
          schedule: d.schedule, status: d.status, compliance: d.compliance,
          rating: d.rating, shiftsCompleted: d.shifts_completed, shiftsTotal: d.shifts_total,
        }));
      });
    }
    await delay();
    return MOCK_GUARDIAN_PLACEMENTS;
  },

  async getDashboardPatients(): Promise<GuardianDashboardPatient[]> {
    if (shouldUseSupabase()) {
      return sbRead("gd:dashboard-patients", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("patients")
          .select("id, name, age, conditions, status")
          .eq("guardian_id", userId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id,
          name: d.name,
          age: d.age,
          condition: (d.conditions || []).join(", ") || "No conditions listed",
          caregiver: "",
          status: d.status || "Active",
          statusColor: d.status === "stable" ? "var(--cn-purple)" : "var(--cn-green)",
        }));
      });
    }
    await delay();
    return MOCK_GUARDIAN_DASHBOARD_PATIENTS;
  },

  async getCareRequirementMessages(_reqId: string): Promise<CareRequirementMessage[]> {
    if (shouldUseSupabase()) {
      return sbRead(`gd:care-req-msgs:${_reqId}`, async () => {
        // Care requirement messages are a messaging feature not yet in the schema
        return [];
      });
    }
    await delay();
    return MOCK_CARE_REQUIREMENT_MESSAGES;
  },

  async getWizardAgencies(): Promise<WizardAgency[]> {
    if (shouldUseSupabase()) {
      return sbRead("gd:wizard-agencies", async () => {
        const { data, error } = await sb().from("agencies")
          .select("id, name, rating, reviews, location, specialties, verified")
          .eq("verified", true)
          .order("rating", { ascending: false })
          .limit(10);
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id,
          name: d.name,
          rating: Number(d.rating) || 0,
          reviews: d.reviews || 0,
          location: d.location || "",
          specialties: d.specialties || [],
          verified: d.verified || false,
        }));
      });
    }
    await delay();
    return MOCK_WIZARD_AGENCIES;
  },

  async getPaymentTransactions(): Promise<GuardianTransaction[]> {
    if (shouldUseSupabase()) {
      return sbRead("gd:transactions", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("invoices")
          .select("id, description, issued_date, total, status, from_party_name, to_party_id")
          .eq("to_party_id", userId)
          .order("issued_date", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id,
          desc: d.description || `Payment to ${d.from_party_name || "provider"}`,
          patient: "",
          date: d.issued_date || "",
          amount: d.total || 0,
          type: "debit" as const,
          status: d.status === "paid" ? "completed" as const : "pending" as const,
        }));
      });
    }
    await delay();
    return MOCK_GUARDIAN_TRANSACTIONS;
  },

  async getInvoices(): Promise<GuardianInvoice[]> {
    if (shouldUseSupabase()) {
      return sbRead("gd:invoices", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("invoices")
          .select("id, type, description, subtotal, total, status, issued_date, due_date, from_party_name, from_party_role")
          .eq("to_party_id", userId)
          .order("issued_date", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id,
          type: d.type || "service",
          description: d.description || "",
          amount: d.subtotal || 0,
          platformFee: 0,
          total: d.total || 0,
          status: d.status || "unpaid",
          issuedDate: d.issued_date || "",
          dueDate: d.due_date || "",
          from: { name: d.from_party_name || "", role: d.from_party_role || "" },
        }));
      });
    }
    await delay();
    return MOCK_GUARDIAN_INVOICES;
  },

  async getScheduleAppointments(): Promise<GuardianAppointment[]> {
    if (shouldUseSupabase()) {
      return sbRead("gd:schedule-appointments", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("placements")
          .select("id, patient_name, caregiver_name, care_type, schedule, status")
          .eq("guardian_id", userId)
          .eq("status", "active");
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id,
          patientName: d.patient_name || "",
          caregiverName: d.caregiver_name || "",
          careType: d.care_type || "",
          schedule: d.schedule || "",
          status: d.status || "active",
        }));
      });
    }
    await delay();
    return MOCK_GUARDIAN_APPOINTMENTS;
  },

  async getScheduleTodayEvents(): Promise<GuardianTodayEvent[]> {
    if (shouldUseSupabase()) {
      return sbRead("gd:today-events", async () => {
        const userId = await currentUserId();
        const today = new Date().toISOString().slice(0, 10);
        const { data, error } = await sb().from("shifts")
          .select("id, date, start_time, end_time, status, caregiver_id, patient_id")
          .eq("date", today);
        if (error) throw error;
        // Filter to shifts where the patient belongs to this guardian
        const patientIds = (data || []).map((s: any) => s.patient_id).filter(Boolean);
        if (patientIds.length === 0) return [];
        const { data: patients } = await sb().from("patients")
          .select("id, name")
          .in("id", patientIds)
          .eq("guardian_id", userId);
        const guardianPatientIds = new Set((patients || []).map((p: any) => p.id));
        return (data || [])
          .filter((s: any) => guardianPatientIds.has(s.patient_id))
          .map((s: any) => ({
            id: s.id,
            title: `Shift ${s.start_time || ""}–${s.end_time || ""}`,
            time: `${s.start_time || ""} - ${s.end_time || ""}`,
            status: s.status || "scheduled",
          }));
      });
    }
    await delay();
    return MOCK_GUARDIAN_TODAY_EVENTS;
  },

  async getReviewsData(): Promise<{ pastCaregivers: PastCaregiverReview[]; receivedReviews: ReceivedReview[] }> {
    if (shouldUseSupabase()) {
      return sbRead("gd:reviews", async () => {
        const userId = await currentUserId();
        // Reviews given by this guardian
        const { data: given, error: err1 } = await sb().from("caregiver_reviews")
          .select("id, caregiver_id, rating, text, created_at")
          .eq("reviewer_id", userId)
          .order("created_at", { ascending: false });
        if (err1) throw err1;
        // Reviews received (as guardian) — currently no guardian_reviews table
        return {
          pastCaregivers: (given || []).map((r: any) => ({
            id: r.id,
            caregiverId: r.caregiver_id,
            rating: r.rating,
            review: r.text || "",
            date: r.created_at || "",
          })),
          receivedReviews: [],
        };
      });
    }
    await delay();
    return { pastCaregivers: MOCK_PAST_CAREGIVERS, receivedReviews: MOCK_RECEIVED_REVIEWS };
  },

  async getPlacementDetail(_placementId: string): Promise<{ shiftHistory: PlacementShiftHistory[]; caregiverTimeline: CaregiverTimelineEntry[] }> {
    if (shouldUseSupabase()) {
      return sbRead(`gd:placement-detail:${_placementId}`, async () => {
        const { data: shifts, error } = await sb().from("shifts")
          .select("id, date, start_time, end_time, status, check_in_time, check_out_time")
          .eq("placement_id", _placementId)
          .order("date", { ascending: false })
          .limit(30);
        if (error) throw error;
        return {
          shiftHistory: (shifts || []).map((s: any) => ({
            id: s.id,
            date: s.date || "",
            time: `${s.start_time || ""} - ${s.end_time || ""}`,
            status: s.status || "scheduled",
            checkIn: s.check_in_time || "",
            checkOut: s.check_out_time || "",
          })),
          caregiverTimeline: [],
        };
      });
    }
    await delay();
    return { shiftHistory: MOCK_PLACEMENT_SHIFT_HISTORY, caregiverTimeline: MOCK_CAREGIVER_TIMELINE };
  },

  async getRecentActivity(): Promise<GuardianActivity[]> {
    if (shouldUseSupabase()) {
      return sbRead("gd:recent-activity", async () => {
        // Aggregate recent activity from shifts and invoices
        const userId = await currentUserId();
        const { data: recentShifts } = await sb().from("shifts")
          .select("id, date, status, check_in_time")
          .order("updated_at", { ascending: false })
          .limit(5);
        return (recentShifts || []).map((s: any) => ({
          id: s.id,
          text: `Shift on ${s.date || "today"} — ${s.status}`,
          time: s.check_in_time || s.date || "",
          iconType: "calendar" as const,
          color: "var(--cn-purple)",
        }));
      });
    }
    await delay();
    return MOCK_GUARDIAN_RECENT_ACTIVITY;
  },

  async getAgencyPublicProfile(id: string): Promise<AgencyPublicProfile> {
    if (shouldUseSupabase()) {
      return sbRead(`gd:agency-profile:${id}`, async () => {
        const { data, error } = await sb().from("agencies")
          .select("*")
          .eq("id", id)
          .single();
        if (error) throw error;
        const d = data as any;
        return {
          id: d.id,
          name: d.name || "",
          tagline: d.tagline || "",
          rating: Number(d.rating) || 0,
          reviews: d.reviews || 0,
          location: d.location || "",
          specialties: d.specialties || [],
          caregiverCount: d.caregiver_count || 0,
          verified: d.verified || false,
          responseTime: d.response_time || "",
          image: d.image || "",
        };
      });
    }
    await delay();
    return { ...MOCK_AGENCY_PUBLIC_PROFILE, id };
  },

  async getCaregiverPublicProfile(id: string): Promise<CaregiverPublicProfile> {
    if (shouldUseSupabase()) {
      return sbRead(`gd:caregiver-profile:${id}`, async () => {
        const { data, error } = await sb().from("caregiver_profiles")
          .select("*")
          .eq("id", id)
          .single();
        if (error) throw error;
        const d = data as any;
        return {
          id: d.id,
          name: d.name || "",
          title: d.title || "",
          bio: d.bio || "",
          rating: Number(d.rating) || 0,
          reviews: d.reviews || 0,
          location: d.location || "",
          experience: d.experience || "",
          rate: d.rate || "",
          verified: d.verified || false,
          specialties: d.specialties || [],
          skills: d.skills || [],
          languages: d.languages || [],
          image: d.image || "",
        };
      });
    }
    await delay();
    return MOCK_CAREGIVER_PUBLIC_PROFILE;
  },

  async getCaregiverComparison(): Promise<ComparisonCaregiver[]> {
    if (shouldUseSupabase()) {
      return sbRead("gd:caregiver-comparison", async () => {
        // Return empty — comparison requires specific context (e.g. a bid)
        return [];
      });
    }
    await delay();
    return MOCK_COMPARISON_CAREGIVERS;
  },

  async getGuardianProfile(): Promise<GuardianProfile> {
    if (shouldUseSupabase()) {
      return sbRead("gd:profile", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("guardian_profiles")
          .select("*")
          .eq("id", userId)
          .single();
        if (error) throw error;
        const d = data as any;
        return {
          name: d.name, phone: d.phone, email: d.email,
          location: d.location, relation: d.relation, bio: d.bio,
          emergencyContact: d.emergency_contact,
        };
      });
    }
    await delay();
    return MOCK_GUARDIAN_PROFILE;
  },

  async getInvoiceDetail(id: string): Promise<InvoiceDetail> {
    if (shouldUseSupabase()) {
      return sbRead(`gd:invoice:${id}`, async () => {
        const { data, error } = await sb().from("invoices")
          .select("*")
          .eq("id", id)
          .single();
        if (error) throw error;
        const { data: lineItems } = await sb().from("invoice_line_items")
          .select("*")
          .eq("invoice_id", id);
        const d = data as any;
        return {
          id: d.id, type: d.type, description: d.description,
          amount: d.subtotal, platformFee: d.platform_fee, total: d.total,
          status: d.status, issuedDate: d.issued_date, dueDate: d.due_date,
          fromParty: { id: d.from_party_id, name: d.from_party_name, role: d.from_party_role },
          toParty: { id: d.to_party_id, name: d.to_party_name, role: d.to_party_role },
          lineItems: (lineItems || []).map((li: any) => ({
            desc: li.description, qty: String(li.qty), rate: li.rate, total: li.total,
          })),
        };
      });
    }
    await delay();
    return { ...MOCK_INVOICE_DETAIL, id: id || MOCK_INVOICE_DETAIL.id };
  },

  async reportIncident(data: {
    type: string;
    severity: string;
    patientId: string;
    shiftId?: string;
    description: string;
    immediateAction: string;
    photos: string[];
  }): Promise<{ id: string }> {
    if (shouldUseSupabase()) {
      return sbWrite(async () => {
        const userId = await currentUserId();
        const { data: row, error } = await sb().from("incident_reports").insert({
          reported_by: userId,
          reporter_role: "guardian",
          type: data.type,
          severity: data.severity,
          patient_id: data.patientId,
          shift_id: data.shiftId || null,
          description: data.description,
          immediate_action: data.immediateAction,
          photos: data.photos,
          status: "open",
        }).select("id").single();
        if (error) throw error;
        return { id: row.id };
      });
    }
    await delay(400);
    return { id: `inc-${crypto.randomUUID().slice(0, 8)}` };
  },

  async getIncidentHistory(): Promise<
    Array<{ id: string; type: string; severity: string; date: string; status: string; patient: string }>
  > {
    if (shouldUseSupabase()) {
      return sbRead("gd:incidents", async () => {
        const { data, error } = await sb().from("incident_reports")
          .select("*, patients!incident_reports_patient_id_fkey(name)")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id,
          type: d.type,
          severity: d.severity,
          date: d.created_at,
          status: d.status,
          patient: d.patients?.name || "",
        }));
      });
    }
    await delay();
    return MOCK_INCIDENT_HISTORY;
  },
};
