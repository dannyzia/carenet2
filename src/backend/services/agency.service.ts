/**
 * Agency Service — business logic layer
 */
import type {
  Agency, AgencyCaregiver, AgencyJob,
  AgencyPlacement, DirectoryAgency, PlacementShift,
  CaregiverPayout, PayoutHistoryItem, SettlementPeriod,
  AgencyTransaction, AgencyClient, AgencyMonthlyData, AgencyPerformanceData,
  ActiveShift, ShiftAlert, AgencyRevenuePoint, AgencyDashboardSummary, JobApplication, RosterCaregiver,
  RequirementInboxItem, AgencySettings, StorefrontData, Branch,
  ClientCarePlanData, StaffAttendanceData, StaffHiringData,
  AgencyIncident,
  DocumentVerificationItem,
} from "@/backend/models";
import { loadMockBarrel } from "@/backend/api/mock/loadMockBarrel";
import { USE_SUPABASE, sbRead, sbWrite, sb, sbData, currentUserId, useInAppMockDataset } from "./_sb";
import {
  EMPTY_STOREFRONT,
  EMPTY_AGENCY_SETTINGS_CARD,
  EMPTY_BRANCHES,
  EMPTY_STAFF_ATTENDANCE,
  EMPTY_STAFF_HIRING,
} from "./liveEmptyDefaults";
import { marketplaceService } from "./marketplace.service";
import { demoOfflineDelayAndPick } from "./demoOfflineMock";

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

const emptyClientCarePlan: ClientCarePlanData = {
  client: { name: "", age: 0, condition: "" },
  plan: { goals: [], schedule: [], medications: [] },
};

export const agencyService = {
  /** Search agencies by keyword */
  async searchAgencies(query?: string): Promise<Agency[]> {
    if (USE_SUPABASE) {
      return sbRead(`ag:search:${query || "all"}`, async () => {
        let q = sbData().from("agencies").select("*");
        if (query) q = q.ilike("name", `%${query}%`);
        const { data, error } = await q.limit(50);
        if (error) throw error;
        return (data || []).map(mapAgency);
      });
    }
    return demoOfflineDelayAndPick(200, [] as Agency[], (m) => {
      if (!query) return m.MOCK_AGENCIES;
      const q = query.toLowerCase();
      return m.MOCK_AGENCIES.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.specialties.some((s) => s.toLowerCase().includes(q)) ||
          a.location.toLowerCase().includes(q),
      );
    });
  },

  /** Get agency by ID */
  async getAgencyById(id: string): Promise<Agency | undefined> {
    if (USE_SUPABASE) {
      return sbRead(`ag:${id}`, async () => {
        const { data, error } = await sbData().from("agencies").select("*").eq("id", id).single();
        if (error) return undefined;
        return mapAgency(data);
      });
    }
    return demoOfflineDelayAndPick(200, undefined as Agency | undefined, (m) =>
      m.MOCK_AGENCIES.find((a) => a.id === id),
    );
  },

  /** Get caregivers in the agency roster */
  async getCaregivers(): Promise<AgencyCaregiver[]> {
    if (USE_SUPABASE) {
      return sbRead("ag:caregivers", async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("caregiver_profiles")
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
    return demoOfflineDelayAndPick(200, [] as AgencyCaregiver[], (m) => m.MOCK_AGENCY_CAREGIVERS);
  },

  /** Get jobs managed by the agency */
  async getJobs(): Promise<AgencyJob[]> {
    if (USE_SUPABASE) {
      return sbRead("ag:jobs", async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("jobs")
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
    return demoOfflineDelayAndPick(200, [] as AgencyJob[], (m) => m.MOCK_AGENCY_JOBS);
  },

  /** Get placements managed by the agency */
  async getPlacements(): Promise<AgencyPlacement[]> {
    if (USE_SUPABASE) {
      return sbRead("ag:placements", async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("placements")
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
    return demoOfflineDelayAndPick(200, [] as AgencyPlacement[], (m) => m.MOCK_AGENCY_PLACEMENTS);
  },

  /** Get agency directory listings for public page */
  async getDirectoryAgencies(): Promise<DirectoryAgency[]> {
    if (USE_SUPABASE) {
      return sbRead("ag:directory", async () => {
        const { data, error } = await sbData().from("agencies")
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
    return demoOfflineDelayAndPick(200, [] as DirectoryAgency[], (m) => m.MOCK_DIRECTORY_AGENCIES);
  },

  /** Get shifts for a specific placement */
  async getPlacementShifts(placementId: string): Promise<PlacementShift[]> {
    if (USE_SUPABASE) {
      return sbRead(`ag:shifts:${placementId}`, async () => {
        const { data, error } = await sbData().from("shifts")
          .select("*")
          .eq("placement_id", placementId)
          .order("date", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id, placementId: d.placement_id, caregiver: d.caregiver_name,
          patient: d.patient_name, date: d.date,
          startTime: d.start_time, endTime: d.end_time,
          status: d.status, notes: d.notes,
        }));
      });
    }
    return demoOfflineDelayAndPick(200, [] as PlacementShift[], (m) => m.MOCK_PLACEMENT_SHIFTS);
  },

  async getPayrollData(): Promise<{ payouts: CaregiverPayout[]; history: PayoutHistoryItem[]; settlements: SettlementPeriod[] }> {
    if (USE_SUPABASE) {
      return sbRead("ag:payroll", async () => {
        const userId = await currentUserId();
        const { data: shifts, error: shiftsError } = await sbData()
          .from("shifts")
          .select("*, caregiver_profiles(name, type, rating)")
          .in("placement_id", sbData().from("placements").select("id").eq("agency_id", userId))
          .eq("status", "completed")
          .order("date", { ascending: false });
        if (shiftsError) throw shiftsError;
        return {
          payouts: [],
          history: [],
          settlements: [],
        };
      });
    }
    return demoOfflineDelayAndPick(
      200,
      { payouts: [] as CaregiverPayout[], history: [] as PayoutHistoryItem[], settlements: [] as SettlementPeriod[] },
      (m) => ({
        payouts: m.MOCK_CAREGIVER_PAYOUTS,
        history: m.MOCK_PAYOUT_HISTORY,
        settlements: m.MOCK_SETTLEMENT_PERIODS,
      }),
    );
  },

  async getTransactions(): Promise<AgencyTransaction[]> {
    if (USE_SUPABASE) {
      return sbRead("ag:transactions", async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("invoices")
          .select("*")
          .eq("from_party_id", userId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id, date: d.created_at, description: d.description || d.notes,
          amount: Number(d.amount), type: d.type, status: d.status,
        }));
      });
    }
    return demoOfflineDelayAndPick(200, [] as AgencyTransaction[], (m) => m.MOCK_AGENCY_TRANSACTIONS);
  },

  async getPaymentsSummary(period = new Date()): Promise<{
    monthLabel: string;
    revenueBdt: number;
    payrollBdt: number;
    netProfitBdt: number;
  }> {
    const tx = await agencyService.getTransactions();
    const asNumber = (value: string | number): number => {
      if (typeof value === "number") return value;
      const parsed = Number(String(value).replace(/[^\d.-]/g, ""));
      return Number.isFinite(parsed) ? parsed : 0;
    };
    const revenueBdt = tx.reduce((sum, t) => {
      const n = asNumber(t.amount);
      return t.type === "credit" ? sum + Math.abs(n) : sum;
    }, 0);
    const payrollBdt = tx.reduce((sum, t) => {
      const n = asNumber(t.amount);
      return t.type === "debit" ? sum + Math.abs(n) : sum;
    }, 0);
    return {
      monthLabel: period.toLocaleString("en-US", { month: "short" }),
      revenueBdt,
      payrollBdt,
      netProfitBdt: revenueBdt - payrollBdt,
    };
  },

  async getClients(): Promise<AgencyClient[]> {
    if (USE_SUPABASE) {
      return sbRead("ag:clients", async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("placements")
          .select("guardian_id, guardian_name, patient_name, care_type, status")
          .eq("agency_id", userId);
        if (error) throw error;
        const seen = new Map<string, AgencyClient>();
        for (const d of data || []) {
          const key = d.guardian_id || d.guardian_name;
          if (!seen.has(key)) {
            seen.set(key, {
              id: d.guardian_id || `client-${d.guardian_name}`,
              name: d.guardian_name,
              patient: d.patient_name,
              careType: d.care_type,
              status: d.status,
            });
          }
        }
        return Array.from(seen.values());
      });
    }
    return demoOfflineDelayAndPick(200, [] as AgencyClient[], (m) => m.MOCK_AGENCY_CLIENTS);
  },

  async getReportsData(): Promise<{ monthly: AgencyMonthlyData[]; performance: AgencyPerformanceData[] }> {
    if (USE_SUPABASE) {
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
    return demoOfflineDelayAndPick(
      200,
      { monthly: [] as AgencyMonthlyData[], performance: [] as AgencyPerformanceData[] },
      (m) => ({ monthly: m.MOCK_AGENCY_MONTHLY_DATA, performance: m.MOCK_AGENCY_PERFORMANCE_DATA }),
    );
  },

  async getShiftMonitoringData(): Promise<{ shifts: ActiveShift[]; alerts: ShiftAlert[] }> {
    if (USE_SUPABASE) {
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
    return demoOfflineDelayAndPick(
      200,
      { shifts: [] as ActiveShift[], alerts: [] as ShiftAlert[] },
      (m) => ({ shifts: m.MOCK_ACTIVE_SHIFTS, alerts: m.MOCK_SHIFT_ALERTS }),
    );
  },

  async getRevenueChartData(): Promise<AgencyRevenuePoint[]> {
    if (USE_SUPABASE) {
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
    return demoOfflineDelayAndPick(200, [] as AgencyRevenuePoint[], (m) => m.MOCK_AGENCY_REVENUE_DATA);
  },

  async getDashboardSummary(): Promise<AgencyDashboardSummary> {
    const build = async (): Promise<AgencyDashboardSummary> => {
      const agencyOwnerId = USE_SUPABASE ? await currentUserId() : "agency-001";
      const [caregivers, clients, revenue, requirements, myPackages] = await Promise.all([
        agencyService.getCaregivers(),
        agencyService.getClients(),
        agencyService.getRevenueChartData(),
        agencyService.getRequirementsInbox(),
        marketplaceService.getMyPackages(agencyOwnerId),
      ]);
      const activeCaregivers = caregivers.filter((c) => c.status === "active").length;
      const activeClients = clients.length;
      const last = revenue[revenue.length - 1];
      const avgRating =
        caregivers.length === 0
          ? 0
          : caregivers.reduce((s, c) => s + (Number(c.rating) || 0), 0) / caregivers.length;
      const marketplacePackagesPublished = myPackages.filter((p) => p.status === "published").length;
      const marketplacePackagesDraft = myPackages.filter((p) => p.status === "draft").length;
      return {
        activeCaregivers,
        activeClients,
        revenueMonthLabel: last?.month ?? "—",
        revenueThisMonthBdt: last?.amount ?? 0,
        avgRating: Math.round(avgRating * 10) / 10,
        marketplacePackagesTotal: myPackages.length,
        marketplacePackagesPublished,
        marketplacePackagesDraft,
        openCareRequirementsCount: requirements.length,
      };
    };
    if (USE_SUPABASE) {
      return sbRead("ag:dashboard-summary", build);
    }
    await delay();
    return build();
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
    return demoOfflineDelayAndPick(200, [] as JobApplication[], (m) => m.MOCK_JOB_APPLICATIONS);
  },

  async getCaregiverRoster(): Promise<RosterCaregiver[]> {
    if (USE_SUPABASE) {
      return sbRead("ag:roster", async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("caregiver_profiles")
          .select("*")
          .eq("agency_id", userId)
          .order("name", { ascending: true });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id, name: d.name, specialty: d.type || "",
          location: d.location, phone: d.phone || "", rating: d.rating,
          jobs: d.reviews || 0, joined: d.created_at,
          status: d.status || "active", verified: d.verified,
        }));
      });
    }
    return demoOfflineDelayAndPick(200, [] as RosterCaregiver[], (m) => m.MOCK_CAREGIVER_ROSTER);
  },

  async getRequirementsInbox(): Promise<RequirementInboxItem[]> {
    if (USE_SUPABASE) {
      return sbRead("ag:requirements", async () => {
        try {
          const { data, error } = await sbData().from("care_contracts")
            .select("*")
            .eq("type", "request")
            .eq("status", "published")
            .order("created_at", { ascending: false });
          if (error) return [];
          return (data || []).map((d: any) => ({
            id: d.id, title: d.title, description: d.description,
            source: d.source, date: d.created_at, status: d.status,
          }));
        } catch {
          return [];
        }
      });
    }
    return demoOfflineDelayAndPick(200, [] as RequirementInboxItem[], (m) => m.MOCK_REQUIREMENTS_INBOX);
  },

  async getAgencySettings(): Promise<AgencySettings> {
    if (USE_SUPABASE) {
      return sbRead("ag:settings", async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("agencies")
          .select("*")
          .eq("id", userId)
          .single();
        if (error) {
          return (useInAppMockDataset()
            ? (await loadMockBarrel()).MOCK_AGENCY_SETTINGS
            : EMPTY_AGENCY_SETTINGS_CARD) as AgencySettings;
        }
        return {
          name: data.name,
          tagline: data.tagline,
          location: data.location,
          serviceAreas: data.service_areas || [],
          specialties: data.specialties || [],
          verified: data.verified,
          responseTime: data.response_time,
          image: data.image,
        };
      });
    }
    return demoOfflineDelayAndPick(
      200,
      EMPTY_AGENCY_SETTINGS_CARD as AgencySettings,
      (m) => m.MOCK_AGENCY_SETTINGS,
    );
  },

  async getStorefrontData(): Promise<StorefrontData> {
    if (USE_SUPABASE) {
      return sbRead("ag:storefront", async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("agencies")
          .select("*")
          .eq("id", userId)
          .single();
        if (error || !data) {
          return useInAppMockDataset() ? (await loadMockBarrel()).MOCK_STOREFRONT_DATA : EMPTY_STOREFRONT;
        }

        const specialties = (data.specialties as string[]) || [];
        const servicesFromSpecs = specialties.map((name, idx) => ({
          id: `spec-${idx}`,
          name,
          price: 0,
          description: "",
          popular: idx === 0,
        }));

        const { data: staffRows } = await sbData()
          .from("caregiver_profiles")
          .select("id, name, title, type, image, rating, storefront_featured_rank")
          .eq("agency_id", userId);

        const revRes = await sbData()
          .from("agency_reviews")
          .select("rating, text, reviewer_name, reviewer_role, created_at")
          .eq("agency_id", userId)
          .order("created_at", { ascending: false })
          .limit(10);
        const reviewRows = revRes.error ? [] : (revRes.data || []);

        const staffList = (staffRows || [])
          .slice()
          .sort((a, b) => {
            const ar = a.storefront_featured_rank ?? 999;
            const br = b.storefront_featured_rank ?? 999;
            if (ar !== br) return ar - br;
            return Number(b.rating ?? 0) - Number(a.rating ?? 0);
          })
          .slice(0, 8)
          .map((row) => ({
            id: row.id,
            name: row.name ?? "—",
            role: (row.title || row.type || "Caregiver") as string,
            imageUrl: row.image || "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=200&h=200",
          }));

        const reviewItems = (reviewRows || []).map((r) => ({
          rating: r.rating,
          text: r.text || "",
          authorName: r.reviewer_name || "—",
          authorRole: r.reviewer_role || "Guardian",
          createdAt: r.created_at || "",
        }));

        return {
          agency: {
            name: data.name || "",
            tagline: data.tagline || "",
            rating: Number(data.rating ?? 0),
            reviews: data.reviews ?? 0,
            established: data.established ?? undefined,
            responseTime: data.response_time ?? undefined,
            location: data.location || undefined,
            caregiverCount: data.caregiver_count ?? undefined,
          },
          services: servicesFromSpecs,
          staff: staffList,
          reviewItems,
        };
      });
    }
    return demoOfflineDelayAndPick(200, EMPTY_STOREFRONT, (m) => m.MOCK_STOREFRONT_DATA);
  },

  async getBranches(): Promise<Branch[]> {
    if (USE_SUPABASE) {
      return sbRead("ag:branches", async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData()
          .from("agency_branches")
          .select("id, name, address, city, staff_count, active")
          .eq("agency_id", userId);
        if (error || !data || data.length === 0) {
          return useInAppMockDataset() ? (await loadMockBarrel()).MOCK_BRANCHES : EMPTY_BRANCHES;
        }
        return data.map((b) => ({
          id: b.id,
          name: b.name ?? "Branch",
          address: b.address ?? "",
          city: b.city ?? "—",
          staff: b.staff_count ?? 0,
          active: b.active ?? true,
          performance: b.active ? "Active" : "Inactive",
        }));
      });
    }
    return demoOfflineDelayAndPick(200, EMPTY_BRANCHES, (m) => m.MOCK_BRANCHES);
  },

  async getClientCarePlan(clientId: string): Promise<ClientCarePlanData> {
    if (USE_SUPABASE) {
      return sbRead(`ag:careplan:${clientId}`, async () => {
        const userId = await currentUserId();
        const { data: placements, error: pErr } = await sbData()
          .from("placements")
          .select("id, patient_name, care_type, start_date, status")
          .eq("agency_id", userId)
          .eq("guardian_id", clientId)
          .single();
        if (pErr) return {
          id: clientId, patientName: "", careType: "",
          startDate: "", status: "", goals: [], tasks: [],
          schedule: [], notes: [],
        };
        const { data: patients } = await sbData()
          .from("patients")
          .select("*")
          .eq("placement_id", placements.id)
          .single();
        return {
          id: placements.id,
          patientName: patients?.name || placements.patient_name,
          careType: placements.care_type,
          startDate: placements.start_date,
          status: placements.status,
          goals: [],
          tasks: [],
          schedule: [],
          notes: [],
        };
      });
    }
    return demoOfflineDelayAndPick(200, emptyClientCarePlan, (m) => m.MOCK_CLIENT_CARE_PLAN);
  },

  async getStaffAttendance(): Promise<StaffAttendanceData> {
    if (USE_SUPABASE) {
      return sbRead("ag:attendance", async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData()
          .from("caregiver_profiles")
          .select("id, full_name, specialty, status")
          .eq("agency_id", userId)
          .limit(20);
        if (error || !data || data.length === 0) {
          return useInAppMockDataset()
            ? (await loadMockBarrel()).MOCK_STAFF_ATTENDANCE
            : EMPTY_STAFF_ATTENDANCE;
        }
        return {
          date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          staff: data.map((c) => ({
            id: c.id,
            name: c.full_name ?? "Unknown",
            role: c.specialty ?? "Caregiver",
            status: (c.status === "active" ? "present" : c.status === "suspended" ? "absent" : "late") as "present" | "absent" | "late",
            checkIn: c.status === "active" ? "8:00 AM" : null,
            checkOut: null,
          })),
        };
      });
    }
    return demoOfflineDelayAndPick(200, EMPTY_STAFF_ATTENDANCE, (m) => m.MOCK_STAFF_ATTENDANCE);
  },

  async getStaffHiringData(): Promise<StaffHiringData> {
    if (USE_SUPABASE) {
      return sbRead("ag:hiring", async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData()
          .from("job_postings")
          .select("id, title, location, applicant_count, posted_at")
          .eq("agency_id", userId)
          .order("posted_at", { ascending: false })
          .limit(10);
        if (error || !data || data.length === 0) {
          return useInAppMockDataset()
            ? (await loadMockBarrel()).MOCK_STAFF_HIRING
            : EMPTY_STAFF_HIRING;
        }
        return {
          openPositions: data.map((p) => ({
            id: p.id,
            title: p.title ?? "Open Role",
            location: p.location ?? "—",
            applicants: p.applicant_count ?? 0,
            posted: p.posted_at ? new Date(p.posted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—",
          })),
          recentApplicants: [],
        };
      });
    }
    return demoOfflineDelayAndPick(200, EMPTY_STAFF_HIRING, (m) => m.MOCK_STAFF_HIRING);
  },

  // ─── Document Verification ───

  async getVerificationQueue(): Promise<DocumentVerificationItem[]> {
    if (USE_SUPABASE) {
      return sbRead("ag:verification", async () => {
        const userId = await currentUserId();
        const { data: caregivers, error: cErr } = await sbData()
          .from("caregiver_profiles")
          .select("id")
          .eq("agency_id", userId);
        if (cErr) throw cErr;
        const caregiverIds = (caregivers || []).map((c: any) => c.id);
        if (caregiverIds.length === 0) return [];
        const { data, error } = await sb().from("caregiver_documents")
          .select("*")
          .in("caregiver_id", caregiverIds)
          .eq("status", "pending")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id, caregiverId: d.caregiver_id, caregiverName: d.caregiver_name,
          documentType: d.document_type, documentUrl: d.document_url,
          status: d.status, submittedAt: d.created_at, reviewNote: d.review_note,
        }));
      });
    }
    return demoOfflineDelayAndPick(200, [] as DocumentVerificationItem[], (m) => m.MOCK_VERIFICATION_QUEUE);
  },

  async verifyDocument(docId: string, note: string): Promise<void> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const { error } = await sb().from("caregiver_documents").update({
          status: "approved", review_note: note, reviewed_at: new Date().toISOString(),
        }).eq("id", docId);
        if (error) throw error;
      });
    }
    if (!useInAppMockDataset()) {
      throw new Error("[CareNet] Connect Supabase or use Demo Access for document verification.");
    }
    await delay(300);
  },

  async rejectDocument(docId: string, note: string): Promise<void> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const { error } = await sb().from("caregiver_documents").update({
          status: "rejected", review_note: note, reviewed_at: new Date().toISOString(),
        }).eq("id", docId);
        if (error) throw error;
      });
    }
    if (!useInAppMockDataset()) {
      throw new Error("[CareNet] Connect Supabase or use Demo Access for document verification.");
    }
    await delay(300);
  },

  // ─── Care Plan Templates ───

  async getCareTemplates(): Promise<import("@/backend/models").CarePlanTemplate[]> {
    await delay();
    return [];
  },

  async applyTemplate(_templateId: string, _placementId: string): Promise<void> {
    if (!useInAppMockDataset()) {
      throw new Error("[CareNet] Connect Supabase or use Demo Access to apply care plan templates.");
    }
    await delay(400);
  },

  // ─── Incidents (W09 — Agency Incidents Management) ───

  async getIncidents(): Promise<AgencyIncident[]> {
    if (USE_SUPABASE) {
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
    return demoOfflineDelayAndPick(200, [] as AgencyIncident[], (m) => m.MOCK_AGENCY_INCIDENTS);
  },

  async resolveIncident(id: string, note: string): Promise<void> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const { error } = await sb().from("incident_reports").update({
          status: "resolved",
          resolution_note: note,
          resolved_at: new Date().toISOString(),
        }).eq("id", id);
        if (error) throw error;
      });
    }
    if (!useInAppMockDataset()) {
      throw new Error("[CareNet] Connect Supabase or use Demo Access for incident actions.");
    }
    await delay(300);
  },

  async escalateIncident(id: string): Promise<void> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const { error } = await sb().from("incident_reports")
          .update({ status: "escalated" })
          .eq("id", id);
        if (error) throw error;
      });
    }
    if (!useInAppMockDataset()) {
      throw new Error("[CareNet] Connect Supabase or use Demo Access for incident actions.");
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

