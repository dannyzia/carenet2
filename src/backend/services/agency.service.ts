/**
 * Agency Service — business logic layer
 */
import type {
  Agency, AgencyCaregiver, AgencyJob,
  AgencyPlacement, DirectoryAgency, PlacementShift,
  CaregiverPayout, PayoutHistoryItem, SettlementPeriod,
  AgencyTransaction, AgencyClient, AgencyMonthlyData, AgencyPerformanceData,
  ActiveShift, ShiftAlert, AgencyRevenuePoint, JobApplication, RosterCaregiver,
  RequirementInboxItem, AgencySettings, StorefrontData, Branch,
  ClientCarePlanData, StaffAttendanceData, StaffHiringData,
  AgencyIncident,
} from "@/backend/models";
import {
  MOCK_AGENCIES,
  MOCK_AGENCY_CAREGIVERS,
  MOCK_AGENCY_JOBS,
  MOCK_AGENCY_PLACEMENTS,
  MOCK_DIRECTORY_AGENCIES,
  MOCK_PLACEMENT_SHIFTS,
  MOCK_CAREGIVER_PAYOUTS,
  MOCK_PAYOUT_HISTORY,
  MOCK_SETTLEMENT_PERIODS,
  MOCK_AGENCY_TRANSACTIONS,
  MOCK_AGENCY_CLIENTS,
  MOCK_AGENCY_MONTHLY_DATA,
  MOCK_AGENCY_PERFORMANCE_DATA,
  MOCK_ACTIVE_SHIFTS,
  MOCK_SHIFT_ALERTS,
  MOCK_AGENCY_REVENUE_DATA,
  MOCK_JOB_APPLICATIONS,
  MOCK_CAREGIVER_ROSTER,
  MOCK_REQUIREMENTS_INBOX,
  MOCK_AGENCY_SETTINGS,
  MOCK_STOREFRONT_DATA,
  MOCK_BRANCHES,
  MOCK_CLIENT_CARE_PLAN,
  MOCK_STAFF_ATTENDANCE,
  MOCK_STAFF_HIRING,
  MOCK_AGENCY_INCIDENTS,
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

export const agencyService = {
  /** Search agencies by keyword */
  async searchAgencies(query?: string): Promise<Agency[]> {
    if (shouldUseSupabase()) {
      return sbRead(`ag:search:${query || "all"}`, async () => {
        let q = sb().from("agencies").select("*");
        if (query) q = q.ilike("name", `%${query}%`);
        const { data, error } = await q.limit(50);
        if (error) throw error;
        return (data || []).map(mapAgency);
      });
    }
    await delay();
    if (!query) return MOCK_AGENCIES;
    const q = query.toLowerCase();
    return MOCK_AGENCIES.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.specialties.some((s) => s.toLowerCase().includes(q)) ||
        a.location.toLowerCase().includes(q)
    );
  },

  /** Get agency by ID */
  async getAgencyById(id: string): Promise<Agency | undefined> {
    if (shouldUseSupabase()) {
      return sbRead(`ag:${id}`, async () => {
        const { data, error } = await sb().from("agencies").select("*").eq("id", id).single();
        if (error) return undefined;
        return mapAgency(data);
      });
    }
    await delay();
    return MOCK_AGENCIES.find((a) => a.id === id);
  },

  /** Get caregivers in the agency roster */
  async getCaregivers(): Promise<AgencyCaregiver[]> {
    if (shouldUseSupabase()) {
      return sbRead("ag:caregivers", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("caregiver_profiles")
          .select("*")
          .eq("agency_id", userId)
          .order("name", { ascending: true });
        if (error) throw error;
        return (data || []).map((d: any, i: number) => ({
          id: i + 1, name: d.name, specialty: d.type || "",
          location: d.location, phone: "", rating: d.rating,
          jobs: d.reviews || 0, joined: d.created_at,
          status: "active" as const, verified: d.verified,
        }));
      });
    }
    await delay();
    return MOCK_AGENCY_CAREGIVERS;
  },

  /** Get jobs managed by the agency */
  async getJobs(): Promise<AgencyJob[]> {
    if (shouldUseSupabase()) {
      return sbRead("ag:jobs", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("jobs")
          .select("*")
          .eq("posted_by", userId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id, title: d.title, location: d.location,
          type: d.type, applicants: d.applicants || 0,
          status: d.status, posted: d.posted || d.created_at,
        }));
      });
    }
    await delay();
    return MOCK_AGENCY_JOBS;
  },

  /** Get placements managed by the agency */
  async getPlacements(): Promise<AgencyPlacement[]> {
    if (shouldUseSupabase()) {
      return sbRead("ag:placements", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("placements")
          .select("*")
          .eq("agency_id", userId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id, patient: d.patient_name, guardian: d.guardian_name,
          careType: d.care_type, caregiver: d.caregiver_name,
          startDate: d.start_date, status: d.status,
        }));
      });
    }
    await delay();
    return MOCK_AGENCY_PLACEMENTS;
  },

  /** Get agency directory listings for public page */
  async getDirectoryAgencies(): Promise<DirectoryAgency[]> {
    if (shouldUseSupabase()) {
      return sbRead("ag:directory", async () => {
        const { data, error } = await sb().from("agencies")
          .select("*")
          .eq("verified", true)
          .order("rating", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          ...mapAgency(d),
          license: d.license, established: d.established,
        }));
      });
    }
    await delay();
    return MOCK_DIRECTORY_AGENCIES;
  },

  /** Get shifts for a specific placement */
  async getPlacementShifts(_placementId: string): Promise<PlacementShift[]> {
    await delay();
    return MOCK_PLACEMENT_SHIFTS;
  },

  async getPayrollData(): Promise<{ payouts: CaregiverPayout[]; history: PayoutHistoryItem[]; settlements: SettlementPeriod[] }> {
    await delay();
    return { payouts: MOCK_CAREGIVER_PAYOUTS, history: MOCK_PAYOUT_HISTORY, settlements: MOCK_SETTLEMENT_PERIODS };
  },

  async getTransactions(): Promise<AgencyTransaction[]> {
    await delay();
    return MOCK_AGENCY_TRANSACTIONS;
  },

  async getClients(): Promise<AgencyClient[]> {
    await delay();
    return MOCK_AGENCY_CLIENTS;
  },

  async getReportsData(): Promise<{ monthly: AgencyMonthlyData[]; performance: AgencyPerformanceData[] }> {
    if (shouldUseSupabase()) {
      return sbRead("ag:reports", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("agency_monthly_overview")
          .select("*")
          .eq("agency_id", userId)
          .order("month_start", { ascending: true });
        if (error) throw error;
        return {
          monthly: (data || []).map((d: any) => ({
            month: d.month, clients: d.clients, caregivers: d.caregivers, revenue: Number(d.revenue),
          })),
          performance: [],
        };
      });
    }
    await delay();
    return { monthly: MOCK_AGENCY_MONTHLY_DATA, performance: MOCK_AGENCY_PERFORMANCE_DATA };
  },

  async getShiftMonitoringData(): Promise<{ shifts: ActiveShift[]; alerts: ShiftAlert[] }> {
    if (shouldUseSupabase()) {
      return sbRead("ag:monitoring", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("shift_monitoring_live")
          .select("*")
          .eq("agency_id", userId);
        if (error) throw error;
        const shifts = (data || []).map((d: any) => ({
          caregiver: d.caregiver_name, patient: d.patient_name,
          time: `${d.start_time} - ${d.end_time}`,
          checkedIn: d.check_in_time || "—",
          status: d.status, lastLog: d.notes || "",
          placement: d.placement_id,
        }));
        const alerts = (data || [])
          .filter((d: any) => d.is_late)
          .map((d: any) => ({
            type: "late_checkin",
            text: `${d.caregiver_name} has not checked in for ${d.patient_name}`,
            time: d.start_time,
          }));
        return { shifts, alerts };
      });
    }
    await delay();
    return { shifts: MOCK_ACTIVE_SHIFTS, alerts: MOCK_SHIFT_ALERTS };
  },

  async getRevenueChartData(): Promise<AgencyRevenuePoint[]> {
    if (shouldUseSupabase()) {
      return sbRead("ag:revenue", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("agency_revenue_monthly")
          .select("*")
          .eq("agency_id", userId)
          .order("month_start", { ascending: true });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          month: d.month, amount: Number(d.revenue),
        }));
      });
    }
    await delay();
    return MOCK_AGENCY_REVENUE_DATA;
  },

  async getJobApplications(_jobId?: string): Promise<JobApplication[]> {
    if (USE_SUPABASE && _jobId) {
      return sbRead(`ag:applications:${_jobId}`, async () => {
        const { data, error } = await sb().from("job_applications")
          .select("*")
          .eq("job_id", _jobId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id, name: d.name, rating: d.rating,
          experience: d.experience, specialties: d.specialties || [],
          matchScore: d.match_score, status: d.status,
          appliedDate: d.applied_date, gender: d.gender, location: d.location,
        }));
      });
    }
    await delay();
    return MOCK_JOB_APPLICATIONS;
  },

  async getCaregiverRoster(): Promise<RosterCaregiver[]> {
    await delay();
    return MOCK_CAREGIVER_ROSTER;
  },

  async getRequirementsInbox(): Promise<RequirementInboxItem[]> {
    await delay();
    return MOCK_REQUIREMENTS_INBOX;
  },

  async getAgencySettings(): Promise<AgencySettings> {
    await delay();
    return MOCK_AGENCY_SETTINGS;
  },

  async getStorefrontData(): Promise<StorefrontData> {
    await delay();
    return MOCK_STOREFRONT_DATA;
  },

  async getBranches(): Promise<Branch[]> {
    await delay();
    return MOCK_BRANCHES;
  },

  async getClientCarePlan(clientId: string): Promise<ClientCarePlanData> {
    await delay();
    return MOCK_CLIENT_CARE_PLAN;
  },

  async getStaffAttendance(): Promise<StaffAttendanceData> {
    await delay();
    return MOCK_STAFF_ATTENDANCE;
  },

  async getStaffHiringData(): Promise<StaffHiringData> {
    await delay();
    return MOCK_STAFF_HIRING;
  },

  // ─── Document Verification ───

  async getVerificationQueue(): Promise<import("@/backend/models").DocumentVerificationItem[]> {
    const { MOCK_VERIFICATION_QUEUE } = await import("@/backend/api/mock");
    await delay();
    return MOCK_VERIFICATION_QUEUE;
  },

  async verifyDocument(docId: string, note: string): Promise<void> {
    if (shouldUseSupabase()) {
      return sbWrite(async () => {
        const { error } = await sb().from("caregiver_documents").update({
          status: "approved", review_note: note, reviewed_at: new Date().toISOString(),
        }).eq("id", docId);
        if (error) throw error;
      });
    }
    await delay(300);
  },

  async rejectDocument(docId: string, note: string): Promise<void> {
    if (shouldUseSupabase()) {
      return sbWrite(async () => {
        const { error } = await sb().from("caregiver_documents").update({
          status: "rejected", review_note: note, reviewed_at: new Date().toISOString(),
        }).eq("id", docId);
        if (error) throw error;
      });
    }
    await delay(300);
  },

  // ─── Care Plan Templates ───

  async getCareTemplates(): Promise<import("@/backend/models").CarePlanTemplate[]> {
    const { MOCK_CARE_TEMPLATES } = await import("@/backend/api/mock");
    await delay();
    return MOCK_CARE_TEMPLATES;
  },

  async applyTemplate(templateId: string, placementId: string): Promise<void> {
    await delay(400);
  },

  // ─── Incidents (W09 — Agency Incidents Management) ───

  async getIncidents(): Promise<AgencyIncident[]> {
    if (shouldUseSupabase()) {
      return sbRead("ag:incidents", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("incident_reports")
          .select("*")
          .eq("agency_id", userId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id,
          title: d.title,
          description: d.description,
          severity: d.severity,
          status: d.status,
          reportedBy: d.reported_by_name,
          patientName: d.patient_name,
          placementId: d.placement_id,
          reportedAt: d.created_at,
          resolvedAt: d.resolved_at,
          resolutionNote: d.resolution_note,
        }));
      });
    }
    await delay();
    return MOCK_AGENCY_INCIDENTS;
  },

  async resolveIncident(id: string, note: string): Promise<void> {
    if (shouldUseSupabase()) {
      return sbWrite(async () => {
        const { error } = await sb().from("incident_reports").update({
          status: "resolved",
          resolution_note: note,
          resolved_at: new Date().toISOString(),
        }).eq("id", id);
        if (error) throw error;
      });
    }
    await delay(300);
  },

  async escalateIncident(id: string): Promise<void> {
    if (shouldUseSupabase()) {
      return sbWrite(async () => {
        const { error } = await sb().from("incident_reports")
          .update({ status: "escalated" })
          .eq("id", id);
        if (error) throw error;
      });
    }
    await delay(300);
  },
};

function mapAgency(d: any): Agency {
  return {
    id: d.id, name: d.name, tagline: d.tagline, rating: d.rating, reviews: d.reviews,
    location: d.location, serviceAreas: d.service_areas || [], specialties: d.specialties || [],
    caregiverCount: d.caregiver_count, verified: d.verified, responseTime: d.response_time, image: d.image,
  };
}

