/**
 * Caregiver Service — business logic layer (framework-agnostic)
 *
 * In dev mode, resolves from mock data.
 * When Supabase is connected, swap implementation to use apiClient.
 */
import type {
  CaregiverProfile, CareNote, AssignedPatient, Prescription, JobDetail,
  Job, ShiftPlan,
  DashboardEarningsPoint, RecentJob, UpcomingScheduleItem, CaregiverDashboardSummary,
  MonthlyEarningsPoint, CaregiverTransaction, CaregiverPaymentMethod,
  CaregiverDocument, RequiredDocument, ScheduleBlock, UpcomingBooking,
  MedScheduleItem, CaregiverProfileData, RecentCareLog, PastPatient,
  TaxChartDataPoint, CaregiverReview,
  DailyEarningsDetail, JobApplicationDetail, PayoutSettings,
  CaregiverPortfolio, CaregiverReference, ShiftDetailData,
  SkillsAssessment, TrainingModule,
} from "@/backend/models";
import { loadMockBarrel } from "@/backend/api/mock/loadMockBarrel";
import {
  USE_SUPABASE,
  sbRead,
  sbWrite,
  sb,
  sbData,
  currentUserId,
  useInAppMockDataset,
} from "./_sb";
import { EMPTY_CAREGIVER_DASHBOARD_SUMMARY } from "./liveEmptyDefaults";

/** Simulates async API latency for realistic dev experience */
const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

type MockApi = typeof import("@/backend/api/mock");
let mockApi: MockApi | null = null;
async function mockData(): Promise<MockApi> {
  if (!mockApi) mockApi = await loadMockBarrel();
  return mockApi;
}

async function offlineMockFallback<T>(empty: T, pick: (m: MockApi) => T): Promise<T> {
  await delay();
  if (!useInAppMockDataset()) return empty;
  return pick(await mockData());
}

function mapDbShiftToShiftPlan(d: any): ShiftPlan {
  const patientName =
    d.patients?.name ?? d.patient?.name ?? d.patient_name ?? "";
  const st = String(d.status || "scheduled");
  let status: ShiftPlan["status"] = "upcoming";
  if (st === "completed" || st === "checked-out") status = "completed";
  else if (st === "scheduled") status = "upcoming";
  else status = "active";
  return {
    id: d.id,
    patientName,
    date: d.date,
    shiftTime: `${d.start_time} - ${d.end_time}`,
    status,
    tasks: [],
    dbStatus: st,
  };
}

export const caregiverService = {
  /** Search caregiver profiles by keyword */
  async searchCaregivers(query: string): Promise<CaregiverProfile[]> {
    if (USE_SUPABASE) {
      return sbRead(`cg:search:${query}`, async () => {
        let q = sbData().from("caregiver_profiles").select("*");
        if (query) q = q.ilike("name", `%${query}%`);
        const { data, error } = await q.limit(50);
        if (error) throw error;
        return (data || []).map(mapCgProfile);
      });
    }
    await delay();
    if (!useInAppMockDataset()) return [];
    if (!query) return (await mockData()).MOCK_CAREGIVER_PROFILES;
    const q = query.toLowerCase();
    return (await mockData()).MOCK_CAREGIVER_PROFILES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.specialties.some((s) => s.toLowerCase().includes(q)) ||
        c.location.toLowerCase().includes(q)
    );
  },

  /** Get a single caregiver by ID */
  async getCaregiverById(id: string): Promise<CaregiverProfile | undefined> {
    if (USE_SUPABASE) {
      return sbRead(`cg:${id}`, async () => {
        const { data, error } = await sbData().from("caregiver_profiles").select("*").eq("id", id).single();
        if (error) return undefined;
        return mapCgProfile(data);
      });
    }
    return offlineMockFallback<CaregiverProfile | undefined>(undefined, (m) =>
      m.MOCK_CAREGIVER_PROFILES.find((c) => c.id === id),
    );
  },

  /** Get patients assigned to the current caregiver */
  async getAssignedPatients(): Promise<AssignedPatient[]> {
    if (USE_SUPABASE) {
      return sbRead("cg:patients", async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("placements")
          .select("*, patients!placements_patient_id_fkey(id, name, age, gender, conditions, location, avatar, color)")
          .eq("caregiver_id", userId)
          .eq("status", "active");
        if (error) throw error;
        return (data || []).map((d: any) => {
          const p = d.patients || {};
          return {
            id: p.id || d.patient_id,
            name: p.name || d.patient_name,
            age: p.age || 0,
            condition: (p.conditions || [])[0] || d.care_type || "",
            nextShift: "",
            status: "active",
            color: p.color,
            avatar: p.avatar,
          };
        });
      });
    }
    return offlineMockFallback([], (m) => m.MOCK_ASSIGNED_PATIENTS);
  },

  /** Get jobs visible to the current caregiver */
  async getAvailableJobs(): Promise<Job[]> {
    if (USE_SUPABASE) {
      return sbRead("cg:jobs", async () => {
        const { data, error } = await sbData().from("jobs")
          .select("*")
          .in("status", ["open", "applications"])
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id, title: d.title, location: d.location, salary: d.salary,
          type: d.type, posted: d.posted || d.created_at, urgent: d.urgent,
          applicants: d.applicants, status: d.status,
        }));
      });
    }
    return offlineMockFallback([], (m) => m.MOCK_CAREGIVER_JOBS);
  },

  /** Get care notes for the current caregiver */
  async getCareNotes(): Promise<CareNote[]> {
    if (USE_SUPABASE) {
      return sbRead("cg:notes", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("care_notes")
          .select("*")
          .eq("caregiver_id", userId)
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id, patientName: d.patient_name, date: d.date, time: d.time,
          category: d.category, title: d.title, content: d.content,
          mood: d.mood, pinned: d.pinned, tags: d.tags || [], attachments: d.attachments || 0,
        }));
      });
    }
    return offlineMockFallback([], (m) => m.MOCK_CARE_NOTES);
  },

  /** Get shift plans for the current caregiver */
  async getShiftPlans(): Promise<ShiftPlan[]> {
    if (USE_SUPABASE) {
      return sbRead("cg:shifts", async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("shifts")
          .select("*, patients(name)")
          .eq("caregiver_id", userId)
          .order("date", { ascending: true })
          .limit(30);
        if (error) throw error;
        return (data || []).map(mapDbShiftToShiftPlan);
      });
    }
    return offlineMockFallback([], (m) => m.MOCK_SHIFT_PLANS);
  },

  /** Single shift plan by id (caregiver must own the shift) */
  async getShiftPlanById(id: string): Promise<ShiftPlan | undefined> {
    if (USE_SUPABASE) {
      return sbRead(`cg:shift:${id}`, async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("shifts")
          .select("*, patients(name)")
          .eq("id", id)
          .eq("caregiver_id", userId)
          .maybeSingle();
        if (error) throw error;
        if (!data) return undefined;
        return mapDbShiftToShiftPlan(data);
      });
    }
    return offlineMockFallback<ShiftPlan | undefined>(undefined, (m) => m.MOCK_SHIFT_PLANS.find((p) => p.id === id));
  },

  /** Get prescriptions managed by the current caregiver */
  async getPrescriptions(): Promise<Prescription[]> {
    if (USE_SUPABASE) {
      return sbRead("cg:prescriptions", async () => {
        const userId = await currentUserId();
        // Get patients assigned to this caregiver
        const { data: placements } = await sbData().from("placements")
          .select("patient_id")
          .eq("caregiver_id", userId)
          .eq("status", "active");
        const patientIds = (placements || []).map((p: any) => p.patient_id);
        if (patientIds.length === 0) return [];
        const { data, error } = await sb().from("prescriptions")
          .select("*")
          .in("patient_id", patientIds)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id, patientName: d.patient_name, medicineName: d.medicine_name,
          dosage: d.dosage, frequency: d.frequency, timing: d.timing || [],
          duration: d.duration, prescribedBy: d.prescribed_by,
          startDate: d.start_date, endDate: d.end_date || "",
          instructions: d.instructions, status: d.status, refillDate: d.refill_date,
        }));
      });
    }
    return offlineMockFallback([], (m) => m.MOCK_PRESCRIPTIONS);
  },

  /** Get a job detail by ID */
  async getJobDetailById(id: string): Promise<JobDetail | undefined> {
    if (USE_SUPABASE) {
      return sbRead(`cg:job-detail:${id}`, async () => {
        const { data, error } = await sbData().from("jobs")
          .select("*")
          .eq("id", id)
          .single();
        if (error) throw error;
        const d = data as any;
        if (!d) return undefined;
        return {
          id: d.id, title: d.title, patientName: d.patient_name || "",
          location: d.location || "", description: d.description || "",
          salary: d.salary || "", type: d.type || "", budget: d.budget || "",
          duration: d.duration || "", experience: d.experience || "",
          skills: d.skills || [], requirements: d.requirements || [],
          careType: d.care_type || "", shiftType: d.shift_type || "",
          agencyName: d.agency_name || "", agencyRating: d.agency_rating || 0,
          agencyVerified: d.agency_verified || false, posted: d.posted || "",
          urgent: d.urgent || false, applicants: d.applicants || 0,
          status: d.status || "open",
        };
      });
    }
    return offlineMockFallback<JobDetail | undefined>(undefined, (m) => m.MOCK_JOB_DETAILS[id]);
  },

  /** Get reviews for the current caregiver */
  async getReviews(): Promise<CaregiverReview[]> {
    if (USE_SUPABASE) {
      return sbRead("cg:reviews", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("caregiver_reviews")
          .select("*")
          .eq("caregiver_id", userId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id, rating: d.rating, text: d.text,
          reviewer: d.reviewer_name, date: d.created_at, role: d.reviewer_role,
        }));
      });
    }
    return offlineMockFallback([], (m) => m.MOCK_CAREGIVER_REVIEWS);
  },

  async getTaxReportData(): Promise<TaxChartDataPoint[]> {
    if (USE_SUPABASE) {
      return sbRead("cg:tax", async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().rpc("get_caregiver_earnings", { p_caregiver_id: userId });
        if (error) throw error;
        return (data?.taxReport || []).map((d: any) => ({
          month: d.month, income: Number(d.income),
        }));
      });
    }
    return offlineMockFallback([], (m) => m.MOCK_TAX_REPORT_DATA);
  },

  async getMedSchedule(): Promise<MedScheduleItem[]> {
    if (USE_SUPABASE) {
      return sbRead("cg:med-schedule", async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("placements")
          .select("patient_id")
          .eq("caregiver_id", userId)
          .eq("status", "active");
        if (error) throw error;
        if (!data || data.length === 0) return [];
        const patientIds = data.map((p: any) => p.patient_id);
        const { data: meds, error: err2 } = await sb().from("prescriptions")
          .select("id, medicine_name, dosage, frequency, timing, start_date, end_date, status")
          .in("patient_id", patientIds)
          .eq("status", "active");
        if (err2) throw error;
        return (meds || []).map((m: any) => ({
          id: m.id, medicine: m.medicine_name, dosage: m.dosage,
          frequency: m.frequency, timing: m.timing || [],
          startDate: m.start_date, endDate: m.end_date,
          status: m.status,
        }));
      });
    }
    return offlineMockFallback([], (m) => m.MOCK_MED_SCHEDULE);
  },

  async getProfileData(): Promise<CaregiverProfileData> {
    if (USE_SUPABASE) {
      return sbRead("cg:profile", async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("caregiver_profiles")
          .select("*")
          .eq("id", userId)
          .single();
        if (error) throw error;
        const d = data as any;
        return {
          name: d.name, title: d.title || "", bio: d.bio || "",
          rating: d.rating, reviews: d.reviews, experience: d.experience,
          location: d.location, specialties: d.specialties || [],
          skills: d.skills || [], languages: d.languages || [],
          verified: d.verified, image: d.image,
        };
      });
    }
    return offlineMockFallback(
      {
        name: "",
        title: "",
        bio: "",
        rating: 0,
        reviews: 0,
        experience: "",
        location: "",
        specialties: [],
        skills: [],
        languages: [],
        verified: false,
        image: "",
      } satisfies CaregiverProfileData,
      (m) => m.MOCK_CAREGIVER_PROFILE_DATA,
    );
  },

  async getRecentCareLogs(): Promise<RecentCareLog[]> {
    if (USE_SUPABASE) {
      return sbRead("cg:care-logs", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("care_notes")
          .select("id, patient_name, category, title, content, date, time")
          .eq("caregiver_id", userId)
          .order("created_at", { ascending: false })
          .limit(20);
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id, patientName: d.patient_name || "",
          category: d.category || "", title: d.title || "",
          content: d.content || "", date: d.date || "", time: d.time || "",
        }));
      });
    }
    return offlineMockFallback([], (m) => m.MOCK_RECENT_CARE_LOGS);
  },

  async getPastPatients(): Promise<PastPatient[]> {
    if (USE_SUPABASE) {
      return sbRead("cg:past-patients", async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("placements")
          .select("id, patient_name, care_type, start_date, status")
          .eq("caregiver_id", userId)
          .in("status", ["completed", "cancelled"])
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id, name: d.patient_name || "",
          type: d.care_type || "", period: d.start_date || "",
        }));
      });
    }
    return offlineMockFallback([], (m) => m.MOCK_PAST_PATIENTS);
  },

  async getDailyEarningsDetail(): Promise<DailyEarningsDetail> {
    if (USE_SUPABASE) {
      return sbRead("cg:daily-earnings", async () => {
        // No dedicated daily earnings table — return empty default
        return { today: 0, thisWeek: 0, thisMonth: 0, lastPayout: "", nextPayout: "" };
      });
    }
    return offlineMockFallback(
      { today: 0, thisWeek: 0, thisMonth: 0, lastPayout: "", nextPayout: "" },
      (m) => m.MOCK_DAILY_EARNINGS_DETAIL,
    );
  },

  async getJobApplicationDetail(id: string): Promise<JobApplicationDetail> {
    if (USE_SUPABASE) {
      return sbRead(`cg:job-app:${id}`, async () => {
        const { data, error } = await sb().from("job_applications")
          .select("*")
          .eq("id", id)
          .single();
        if (error) throw error;
        const d = data as any;
        return {
          id: d.id, name: d.name || "", rating: d.rating || 0,
          experience: d.experience || "", specialties: d.specialties || [],
          skills: d.skills || [], gender: d.gender || "", location: d.location || "",
          matchScore: d.match_score || 0, appliedDate: d.applied_date || "",
          status: d.status || "new",
          certifications: d.certifications || [],
          previousJobs: d.previous_jobs || 0,
          completionRate: d.completion_rate || 0,
        };
      });
    }
    return offlineMockFallback(
      {
        id,
        name: "",
        rating: 0,
        experience: "",
        specialties: [],
        skills: [],
        gender: "",
        location: "",
        matchScore: 0,
        appliedDate: "",
        status: "new" as const,
        certifications: [],
        previousJobs: 0,
        completionRate: 0,
      },
      (m) => ({ ...m.MOCK_JOB_APPLICATION_DETAIL, id }),
    );
  },

  async getPayoutSettings(): Promise<PayoutSettings> {
    if (USE_SUPABASE) {
      return { method: "bkash", account: "", verified: false } as PayoutSettings;
    }
    return offlineMockFallback({ method: "bkash", account: "", verified: false } as PayoutSettings, (m) => m.MOCK_PAYOUT_SETTINGS);
  },

  async getPortfolio(): Promise<CaregiverPortfolio> {
    if (USE_SUPABASE) {
      return sbRead("cg:portfolio", async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("caregiver_profiles")
          .select("name, specialties, skills, bio, image")
          .eq("id", userId)
          .single();
        if (error) throw error;
        const d = data as any;
        return { bio: d.bio || "", specialties: d.specialties || [], skills: d.skills || [], image: d.image || "" } as CaregiverPortfolio;
      });
    }
    return offlineMockFallback({ bio: "", specialties: [], skills: [], image: "" } as CaregiverPortfolio, (m) => m.MOCK_CAREGIVER_PORTFOLIO);
  },

  async getReferences(): Promise<CaregiverReference[]> {
    if (USE_SUPABASE) {
      return []; // No dedicated references table yet
    }
    return offlineMockFallback([], (m) => m.MOCK_CAREGIVER_REFERENCES);
  },

  async getShiftDetail(id: string): Promise<ShiftDetailData> {
    if (USE_SUPABASE) {
      return sbRead(`cg:shift-detail:${id}`, async () => {
        const { data, error } = await sbData().from("shifts")
          .select("*, patients(name)")
          .eq("id", id)
          .single();
        if (error) throw error;
        const d = data as any;
        return {
          id: d.id, date: d.date || "", startTime: d.start_time || "",
          endTime: d.end_time || "", status: d.status || "scheduled",
          notes: d.notes || "", patientName: d.patients?.name || d.patient_name || "",
        } as ShiftDetailData;
      });
    }
    return offlineMockFallback(
      {
        id,
        date: "",
        startTime: "",
        endTime: "",
        status: "scheduled",
        notes: "",
        patientName: "",
      } as ShiftDetailData,
      (m) => ({ ...m.MOCK_SHIFT_DETAIL, id }),
    );
  },

  async getSkillsAssessment(): Promise<SkillsAssessment> {
    if (USE_SUPABASE) {
      return { levels: [], categories: [] } as SkillsAssessment;
    }
    return offlineMockFallback({ levels: [], categories: [] } as SkillsAssessment, (m) => m.MOCK_SKILLS_ASSESSMENT);
  },

  async getTrainingModules(): Promise<TrainingModule[]> {
    if (USE_SUPABASE) {
      return sbRead("cg:training-modules", async () => {
        const userId = await currentUserId();
        const { data: courses, error: cErr } = await sbData()
          .from("training_courses")
          .select("id, title, category, duration_minutes, description, xp_reward, thumbnail_url, sort_order")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });
        if (cErr || !courses?.length) {
          return useInAppMockDataset() ? (await mockData()).MOCK_TRAINING_MODULES : [];
        }
        const { data: progressRows } = await sbData()
          .from("caregiver_training_progress")
          .select("course_id, progress, status")
          .eq("caregiver_id", userId);
        const byCourse = new Map(
          (progressRows || []).map((p) => [p.course_id, { progress: p.progress, status: p.status }]),
        );
        const fmtDuration = (mins: number) =>
          mins >= 60 ? `${Math.round(mins / 60)} hrs` : `${mins} min`;
        return courses.map((c) => {
          const p = byCourse.get(c.id);
          const progress = p?.progress ?? 0;
          const status = (p?.status as TrainingModule["status"]) || "not_started";
          return {
            id: c.id,
            title: c.title,
            category: c.category || "General",
            duration: fmtDuration(Number(c.duration_minutes ?? 60)),
            progress,
            status: status === "completed" || status === "in_progress" || status === "not_started"
              ? status
              : "not_started",
            xpReward: c.xp_reward ?? 25,
            thumbnailUrl: c.thumbnail_url ?? undefined,
            description: c.description ?? undefined,
          };
        });
      });
    }
    return offlineMockFallback([], (m) => m.MOCK_TRAINING_MODULES);
  },

  // ─── Missing methods used by pages ───
  async getDashboardEarnings(): Promise<DashboardEarningsPoint[]> {
    if (USE_SUPABASE) {
      return sbRead("cg:earnings-chart", async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().rpc("get_caregiver_earnings", { p_caregiver_id: userId });
        if (error) throw error;
        return (data?.earningsChart || []).map((d: any) => ({
          month: d.month, amount: Number(d.earned),
        }));
      });
    }
    return offlineMockFallback([], (m) => m.MOCK_CAREGIVER_EARNINGS_CHART);
  },

  async getDashboardSummary(): Promise<CaregiverDashboardSummary> {
    if (USE_SUPABASE) {
      return sbRead("cg:dashboard-summary", async () => {
        const earnings = await caregiverService.getDashboardEarnings();
        const last = earnings[earnings.length - 1];
        if (useInAppMockDataset()) {
          const base = (await mockData()).MOCK_CAREGIVER_DASHBOARD_SUMMARY;
          return {
            ...base,
            thisMonthBdt: last?.amount ?? base.thisMonthBdt,
          };
        }
        return {
          ...EMPTY_CAREGIVER_DASHBOARD_SUMMARY,
          thisMonthBdt: last?.amount ?? 0,
        };
      });
    }
    await delay();
    const earnings = await caregiverService.getDashboardEarnings();
    const last = earnings[earnings.length - 1];
    if (!useInAppMockDataset()) {
      return { ...EMPTY_CAREGIVER_DASHBOARD_SUMMARY, thisMonthBdt: last?.amount ?? 0 };
    }
    const m = await mockData();
    const base = m.MOCK_CAREGIVER_DASHBOARD_SUMMARY;
    return { ...base, thisMonthBdt: last?.amount ?? base.thisMonthBdt };
  },

  async getDocuments(): Promise<CaregiverDocument[]> {
    if (USE_SUPABASE) {
      return sbRead("cg:documents", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("caregiver_documents")
          .select("*")
          .eq("caregiver_id", userId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id, name: d.name, type: d.type, status: d.status,
          uploaded: d.uploaded, expiry: d.expiry, file: d.file_url,
          size: d.file_size, category: d.category, captureMethod: d.capture_method,
        }));
      });
    }
    return offlineMockFallback([], (m) => m.MOCK_CAREGIVER_DOCUMENTS);
  },

  async getMonthlyEarnings(): Promise<MonthlyEarningsPoint[]> {
    if (USE_SUPABASE) {
      return sbRead("cg:monthly-earnings", async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().rpc("get_caregiver_earnings", { p_caregiver_id: userId });
        if (error) throw error;
        return (data?.earningsChart || []).map((d: any) => ({
          month: d.month, earned: Number(d.earned), withdrawn: Number(d.withdrawn),
        }));
      });
    }
    return offlineMockFallback([], (m) => m.MOCK_MONTHLY_EARNINGS);
  },

  async getPaymentMethods(): Promise<CaregiverPaymentMethod[]> {
    if (USE_SUPABASE) {
      return []; // No payment_methods table yet
    }
    return offlineMockFallback([], (m) => m.MOCK_PAYMENT_METHODS);
  },

  async getRecentJobs(): Promise<RecentJob[]> {
    if (USE_SUPABASE) {
      return sbRead("cg:recent-jobs", async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("jobs")
          .select("id, title, location, status, created_at")
          .eq("status", "open")
          .order("created_at", { ascending: false })
          .limit(10);
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id,
          patient: d.title || d.patient_name || "—",
          type: d.type || "Job",
          date: d.created_at || "",
          status: (d.status === "open" ? "active" : d.status) as RecentJob["status"],
          amount: "",
        }));
      });
    }
    return offlineMockFallback([], (m) => m.MOCK_RECENT_JOBS);
  },

  async getRequiredDocuments(): Promise<RequiredDocument[]> {
    if (USE_SUPABASE) {
      return []; // No required_documents table
    }
    return offlineMockFallback([], (m) => m.MOCK_REQUIRED_DOCUMENTS);
  },

  async getScheduleData(): Promise<Record<string, ScheduleBlock[]>> {
    if (USE_SUPABASE) {
      return sbRead("cg:schedule", async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("shifts")
          .select("id, date, start_time, end_time, status, patient_name")
          .eq("caregiver_id", userId)
          .gte("date", new Date().toISOString().split("T")[0])
          .order("date", { ascending: true })
          .limit(30);
        if (error) throw error;
        const result: Record<string, ScheduleBlock[]> = {};
        for (const d of data || []) {
          const key = d.date;
          if (!result[key]) result[key] = [];
          result[key].push({
            id: d.id,
            time: `${d.start_time} - ${d.end_time}`,
            patient: d.patient_name || "",
            status: d.status || "scheduled",
          });
        }
        return result;
      });
    }
    return offlineMockFallback([], (m) => m.MOCK_SCHEDULE_DATA);
  },

  async getTransactions(): Promise<CaregiverTransaction[]> {
    if (USE_SUPABASE) {
      return sbRead("cg:transactions", async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("invoices")
          .select("*")
          .eq("from_party_id", userId)
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id, date: d.created_at || "", description: d.description || "",
          amount: Number(d.amount || 0), status: d.status || "pending",
          type: d.type || "payment",
        }));
      });
    }
    return offlineMockFallback([], (m) => m.MOCK_TRANSACTIONS);
  },

  async getUpcomingBookings(): Promise<UpcomingBooking[]> {
    if (USE_SUPABASE) {
      return sbRead("cg:bookings", async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("placements")
          .select("*, patients!placements_patient_id_fkey(name)")
          .eq("caregiver_id", userId)
          .eq("status", "active");
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id, patientName: d.patients?.name || d.patient_name || "",
          startDate: d.start_date || "", endDate: d.end_date || "",
          status: d.status, careType: d.care_type || "",
        }));
      });
    }
    return offlineMockFallback([], (m) => m.MOCK_UPCOMING_BOOKINGS);
  },

  async getUpcomingSchedule(): Promise<UpcomingScheduleItem[]> {
    if (USE_SUPABASE) {
      return sbRead("cg:upcoming-schedule", async () => {
        const userId = await currentUserId();
        const today = new Date().toISOString().split("T")[0];
        const { data, error } = await sbData().from("shifts")
          .select("id, date, start_time, end_time, status, patient_name")
          .eq("caregiver_id", userId)
          .gte("date", today)
          .order("date", { ascending: true })
          .limit(14);
        if (error) throw error;
        return (data || []).map((d: any) => ({
          shiftId: String(d.id),
          time: d.start_time && d.end_time ? `${d.start_time} – ${d.end_time}` : String(d.start_time || ""),
          patient: d.patient_name || "",
          type: "Shift",
          duration: "",
        }));
      });
    }
    return offlineMockFallback([], (m) => m.MOCK_UPCOMING_SCHEDULE);
  },

  // ─── Upload methods (Phase 2) ───

  async uploadProfilePhoto(file: File): Promise<string> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const userId = await currentUserId();
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${userId}/profile.${ext}`;
        const { error: uploadError } = await sbData().storage
          .from("avatars")
          .upload(path, file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data } = sbData().storage.from("avatars").getPublicUrl(path);
        return data.publicUrl;
      });
    }
    if (!useInAppMockDataset()) {
      throw new Error("[CareNet] Connect Supabase or use Demo Access to upload a profile photo.");
    }
    await delay(600);
    // In real impl: uploadService.uploadFile → Supabase Storage
    const url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    return url;
  },

  async uploadDocument(file: File, category: string): Promise<CaregiverDocument> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const userId = await currentUserId();
        const ext = file.name.split(".").pop() || "pdf";
        const path = `${userId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await sbData().storage
          .from("documents")
          .upload(path, file, { upsert: false });
        if (uploadError) throw uploadError;
        const { data: urlData } = sbData().storage.from("documents").getPublicUrl(path);
        const { data: row, error } = await sb().from("caregiver_documents")
          .insert({
            caregiver_id: userId,
            name: file.name,
            category,
            type: file.type.includes("pdf") ? "PDF" : "Image",
            file_url: urlData.publicUrl,
            file_size: `${(file.size / 1024).toFixed(0)} KB`,
            status: "pending",
            uploaded: new Date().toISOString().split("T")[0],
          })
          .select()
          .single();
        if (error) throw error;
        return {
          id: row.id, name: row.name, type: row.type, status: row.status,
          uploaded: row.uploaded, expiry: row.expiry, file: row.file_url,
          size: row.file_size, category: row.category, captureMethod: row.capture_method,
        };
      });
    }
    if (!useInAppMockDataset()) {
      throw new Error("[CareNet] Connect Supabase or use Demo Access to upload documents.");
    }
    await delay(800);
    return {
      id: Date.now(),
      name: file.name,
      type: file.type.includes("pdf") ? "PDF" : "Image",
      status: "pending",
      uploaded: new Date().toISOString().split("T")[0],
      expiry: null,
      file: file.name,
      size: `${(file.size / 1024).toFixed(0)} KB`,
      category: category as any,
      captureMethod: "file",
    };
  },

  // ─── Incident methods (Phase 7) ───

  async reportIncident(data: {
    type: string; severity: string; patientId: string; shiftId?: string;
    description: string; immediateAction: string; photos: string[];
  }): Promise<{ id: string }> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const userId = await currentUserId();
        const { data: row, error } = await sb().from("incident_reports").insert({
          reported_by: userId,
          reporter_role: "caregiver",
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
    if (!useInAppMockDataset()) {
      throw new Error("[CareNet] Connect Supabase or use Demo Access to report incidents.");
    }
    await delay(400);
    return { id: `inc-${crypto.randomUUID().slice(0, 8)}` };
  },

  async getIncidentHistory(): Promise<Array<{
    id: string; type: string; severity: string; date: string; status: string; patient: string;
  }>> {
    if (USE_SUPABASE) {
      return sbRead("cg:incidents", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("incident_reports")
          .select("*, patients!incident_reports_patient_id_fkey(name)")
          .eq("reported_by", userId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id, type: d.type, severity: d.severity,
          date: d.created_at, status: d.status,
          patient: d.patients?.name || "",
        }));
      });
    }
    return offlineMockFallback([], (m) => m.MOCK_INCIDENT_HISTORY);
  },

  // ─── Shift check-in methods (Phase 5) ───

  async startShift(id: string, _selfieUrl: string, _gps: { lat: number; lng: number }): Promise<void> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const { error } = await sbData().from("shifts").update({
          status: "checked-in",
          check_in_time: new Date().toISOString(),
          check_in_gps_lat: _gps.lat,
          check_in_gps_lng: _gps.lng,
          check_in_selfie_url: _selfieUrl,
        }).eq("id", id);
        if (error) throw error;
      });
    }
    if (!useInAppMockDataset()) {
      throw new Error("[CareNet] Connect Supabase or use Demo Access to check in.");
    }
    await delay(400);
  },

  async endShift(id: string, _selfieUrl: string, _gps: { lat: number; lng: number }): Promise<void> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const { error } = await sbData().from("shifts").update({
          status: "completed",
          check_out_time: new Date().toISOString(),
          check_out_gps_lat: _gps.lat,
          check_out_gps_lng: _gps.lng,
          check_out_selfie_url: _selfieUrl,
        }).eq("id", id);
        if (error) throw error;
      });
    }
    if (!useInAppMockDataset()) {
      throw new Error("[CareNet] Connect Supabase or use Demo Access to check out.");
    }
    await delay(400);
  },

  // ─── Handoff / Rating methods (Phase 9) ───

  async createHandoffNote(data: {
    shiftId: string; toCaregiverId: string; patientId: string;
    notes: string; flaggedItems: string[];
  }): Promise<{ id: string }> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const userId = await currentUserId();
        const { data: row, error } = await sb().from("handoff_notes").insert({
          shift_id: data.shiftId,
          from_caregiver_id: userId,
          to_caregiver_id: data.toCaregiverId,
          patient_id: data.patientId,
          notes: data.notes,
          flagged_items: data.flaggedItems,
        }).select("id").single();
        if (error) throw error;
        return { id: row.id };
      });
    }
    if (!useInAppMockDataset()) {
      throw new Error("[CareNet] Connect Supabase or use Demo Access to create handoff notes.");
    }
    await delay(300);
    return { id: `ho-${crypto.randomUUID().slice(0, 8)}` };
  },

  async getHandoffNotes(patientId: string): Promise<Array<{
    id: string; fromCaregiver: string; toCaregiver: string; notes: string;
    flaggedItems: string[]; createdAt: string;
  }>> {
    if (USE_SUPABASE) {
      return sbRead(`cg:handoff:${patientId}`, async () => {
        const { data, error } = await sb().from("handoff_notes")
          .select("*")
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id, fromCaregiver: d.from_caregiver_name || "",
          toCaregiver: d.to_caregiver_name || "", notes: d.notes || "",
          flaggedItems: d.flagged_items || [], createdAt: d.created_at || "",
        }));
      });
    }
    return offlineMockFallback([], (m) => m.MOCK_HANDOFF_NOTES);
  },

  async rateShift(_shiftId: string, _rating: number, _comment: string): Promise<void> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const userId = await currentUserId();
        const { error } = await sb().from("shift_ratings").insert({
          shift_id: _shiftId,
          rated_by: userId,
          rated_by_role: "caregiver",
          rating: _rating,
          comment: _comment,
        });
        if (error) throw error;
      });
    }
    if (!useInAppMockDataset()) {
      throw new Error("[CareNet] Connect Supabase or use Demo Access to submit ratings.");
    }
    await delay(300);
  },

  // ─── Document expiry (Phase 10) ───

  async getExpiringDocuments(daysAhead: number = 90): Promise<import("@/backend/models").DocumentExpiryAlert[]> {
    if (USE_SUPABASE) {
      return sbRead(`cg:expiring:${daysAhead}`, async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("caregiver_documents")
          .select("id, name, category, expiry")
          .eq("caregiver_id", userId)
          .not("expiry", "is", null);
        if (error) throw error;
        const now = Date.now();
        return (data || [])
          .map((d: any) => {
            const exp = new Date(d.expiry).getTime();
            const days = Math.ceil((exp - now) / 86400000);
            return {
              documentId: d.id, documentName: d.name, category: d.category,
              expiryDate: d.expiry, daysUntilExpiry: days,
              severity: days <= 0 ? "expired" : days <= 14 ? "critical" : days <= 30 ? "warning" : "info",
            } as import("@/backend/models").DocumentExpiryAlert;
          })
          .filter(a => a.daysUntilExpiry <= daysAhead);
      });
    }
    return offlineMockFallback([], (m) =>
      m.MOCK_DOCUMENT_EXPIRY_ALERTS.filter((a) => a.daysUntilExpiry <= daysAhead),
    );
  },
};

function mapCgProfile(d: any): CaregiverProfile {
  return {
    id: d.id, name: d.name, type: d.type, rating: d.rating, reviews: d.reviews,
    location: d.location, experience: d.experience, verified: d.verified,
    specialties: d.specialties || [], agency: d.agency_id, image: d.image,
  };
}

