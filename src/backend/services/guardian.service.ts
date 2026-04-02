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
import { USE_SUPABASE, sbRead, sb, currentUserId } from "./_sb";

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
    await delay();
    return MOCK_GUARDIAN_SPENDING;
  },

  async getFamilyMembers(): Promise<FamilyMember[]> {
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
    await delay();
    return MOCK_GUARDIAN_DASHBOARD_PATIENTS;
  },

  async getCareRequirementMessages(_reqId: string): Promise<CareRequirementMessage[]> {
    await delay();
    return MOCK_CARE_REQUIREMENT_MESSAGES;
  },

  async getWizardAgencies(): Promise<WizardAgency[]> {
    await delay();
    return MOCK_WIZARD_AGENCIES;
  },

  async getPaymentTransactions(): Promise<GuardianTransaction[]> {
    await delay();
    return MOCK_GUARDIAN_TRANSACTIONS;
  },

  async getInvoices(): Promise<GuardianInvoice[]> {
    await delay();
    return MOCK_GUARDIAN_INVOICES;
  },

  async getScheduleAppointments(): Promise<GuardianAppointment[]> {
    await delay();
    return MOCK_GUARDIAN_APPOINTMENTS;
  },

  async getScheduleTodayEvents(): Promise<GuardianTodayEvent[]> {
    await delay();
    return MOCK_GUARDIAN_TODAY_EVENTS;
  },

  async getReviewsData(): Promise<{ pastCaregivers: PastCaregiverReview[]; receivedReviews: ReceivedReview[] }> {
    await delay();
    return { pastCaregivers: MOCK_PAST_CAREGIVERS, receivedReviews: MOCK_RECEIVED_REVIEWS };
  },

  async getPlacementDetail(_placementId: string): Promise<{ shiftHistory: PlacementShiftHistory[]; caregiverTimeline: CaregiverTimelineEntry[] }> {
    await delay();
    return { shiftHistory: MOCK_PLACEMENT_SHIFT_HISTORY, caregiverTimeline: MOCK_CAREGIVER_TIMELINE };
  },

  async getRecentActivity(): Promise<GuardianActivity[]> {
    await delay();
    return MOCK_GUARDIAN_RECENT_ACTIVITY;
  },

  async getAgencyPublicProfile(id: string): Promise<AgencyPublicProfile> {
    await delay();
    return { ...MOCK_AGENCY_PUBLIC_PROFILE, id };
  },

  async getCaregiverPublicProfile(id: string): Promise<CaregiverPublicProfile> {
    await delay();
    return MOCK_CAREGIVER_PUBLIC_PROFILE;
  },

  async getCaregiverComparison(): Promise<ComparisonCaregiver[]> {
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
};
