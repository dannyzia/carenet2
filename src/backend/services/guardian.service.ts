/**
 * Guardian Service — business logic layer
 */
import type {
  Patient, SpendingDataPoint, FamilyMember,
  GuardianPlacement,
  GuardianDashboardPatient, CareRequirementMessage, WizardAgency,
  CareRequirement,
  GuardianTransaction, GuardianInvoice, GuardianAppointment,
  GuardianTodayEvent, PastCaregiverReview, ReceivedReview,
  PlacementShiftHistory, CaregiverTimelineEntry, GuardianActivity,
  GuardianDashboardAlert, GuardianDashboardSummary,
  AgencyPublicProfile, CaregiverPublicProfile, ComparisonCaregiver,
  GuardianProfile,
  InvoiceDetail,
  CareContract,
} from "@/backend/models";
import type { OperationalDashboardData } from "@/backend/models/operationalDashboard.model";
import { mapGuardianOperationalDashboard } from "./guardianOperationalMapper";
import {
  USE_SUPABASE,
  sbRead,
  sbWrite,
  sb,
  sbData,
  currentUserId,
  dataCacheScope,
  withDemoExpiry,
  useInAppMockDataset,
} from "./_sb";
import { marketplaceService } from "./marketplace.service";
import { loadMockBarrel } from "@/backend/api/mock/loadMockBarrel";
import { demoOfflineDelayAndPick } from "./demoOfflineMock";

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

function normalizeStoredMockPatient(raw: unknown): Patient | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  const id = p.id != null ? String(p.id) : null;
  const name = typeof p.name === "string" ? p.name : "";
  if (!id || !name.trim()) return null;
  const g =
    p.gender === "Male" || p.gender === "Female" || p.gender === "Other"
      ? p.gender
      : "Other";
  const st = String(p.status ?? "active").toLowerCase();
  const status: Patient["status"] =
    st === "inactive" || st === "discharged" ? st : "active";
  return {
    id,
    name,
    age: typeof p.age === "number" ? p.age : parseInt(String(p.age), 10) || 0,
    gender: g,
    relation: typeof p.relation === "string" ? p.relation : undefined,
    bloodGroup: typeof p.bloodGroup === "string" ? p.bloodGroup : undefined,
    dob: typeof p.dob === "string" ? p.dob : undefined,
    location: typeof p.location === "string" ? p.location : "",
    phone: typeof p.phone === "string" ? p.phone : undefined,
    emergencyContactName:
      typeof p.emergencyContactName === "string" ? p.emergencyContactName : undefined,
    conditions: Array.isArray(p.conditions)
      ? p.conditions.filter((c): c is string => typeof c === "string")
      : [],
    status,
    avatar: typeof p.avatar === "string" ? p.avatar : undefined,
    color: typeof p.color === "string" ? p.color : undefined,
  };
}

/** Map marketplace care_contract row shape → Care Requirements list card (guardian UI). */
function mapCareContractToCareRequirement(c: CareContract): CareRequirement {
  const listStatus = ((): CareRequirement["status"] => {
    switch (c.status) {
      case "draft": return "draft";
      case "published":
      case "bidding": return "submitted";
      case "matched": return "reviewing";
      case "locked":
      case "booked": return "job-created";
      case "active": return "active";
      case "completed":
      case "rated": return "completed";
      case "cancelled": return "cancelled";
      default: return "submitted";
    }
  })();
  const cats = Array.isArray(c.meta?.category) ? c.meta!.category!.filter(Boolean).map(String) : [];
  const careType = cats.length > 0 ? cats.join(", ") : (c.meta?.title ? String(c.meta.title).slice(0, 80) : "Care request");
  const sched = c.schedule as { start_date?: string; pattern?: string; shift_type?: string } | undefined;
  const scheduleParts: string[] = [];
  if (sched?.start_date) scheduleParts.push(String(sched.start_date));
  if (sched?.pattern) scheduleParts.push(String(sched.pattern));
  if (sched?.shift_type) scheduleParts.push(`${sched.shift_type} shift`);
  const schedule = scheduleParts.length > 0 ? scheduleParts.join(" · ") : "Schedule TBD";
  const pr = c.pricing as { budget_min?: number; budget_max?: number; pricing_model?: string } | undefined;
  const bm = pr?.budget_min != null ? Number(pr.budget_min) : null;
  const bx = pr?.budget_max != null ? Number(pr.budget_max) : null;
  const budget =
    bm != null || bx != null
      ? `\u09F3 ${(bm ?? 0).toLocaleString()} – \u09F3 ${(bx ?? 0).toLocaleString()}${pr?.pricing_model === "daily" ? "/day" : pr?.pricing_model === "hourly" ? "/hr" : "/mo"}`
      : "Budget TBD";
  const submitted = new Date(c.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const note =
    c.status === "published" || c.status === "bidding"
      ? "Posted to marketplace — agencies can bid"
      : c.status === "draft"
        ? "Draft — not yet published"
        : c.meta?.title
          ? String(c.meta.title).slice(0, 120)
          : "";
  return {
    id: c.id,
    patient: c.party?.name || "Patient",
    careType,
    agency: "Marketplace / agencies",
    schedule,
    budget,
    submitted,
    status: listStatus,
    note,
  };
}

export const guardianService = {
  async getPatients(): Promise<Patient[]> {
    if (USE_SUPABASE) {
      return sbRead(`gd:patients:${dataCacheScope()}`, async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("patients")
          .select("*")
          .eq("guardian_id", userId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id, name: d.name, age: d.age, gender: d.gender,
          relation: d.relation, bloodGroup: d.blood_group, dob: d.dob,
          location: d.location, phone: d.phone,
          emergencyContactName: d.emergency_contact_name || undefined,
          conditions: d.conditions || [],
          status: d.status, avatar: d.avatar, color: d.color,
        }));
      });
    }
    if (!useInAppMockDataset()) return [];
    // Mock mode — only patients this guardian added (localStorage); no global demo list
    let parsed: unknown[] = [];
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem("mock_patients");
      if (stored) {
        try {
          const raw = JSON.parse(stored) as unknown;
          parsed = Array.isArray(raw) ? raw : [];
        } catch {
          parsed = [];
        }
      }
    }
    await delay();
    return parsed
      .map(normalizeStoredMockPatient)
      .filter((x): x is Patient => x != null);
  },

  async getSpendingData(): Promise<SpendingDataPoint[]> {
    if (USE_SUPABASE) {
      return sbRead(`gd:spending:${dataCacheScope()}`, async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("invoices")
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
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_GUARDIAN_SPENDING);
  },

  async getFamilyMembers(): Promise<FamilyMember[]> {
    if (USE_SUPABASE) {
      return sbRead(`gd:family:${dataCacheScope()}`, async () => {
        // No dedicated family_members table yet — return empty for real users
        return [];
      });
    }
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_FAMILY_MEMBERS);
  },

  async getPlacements(): Promise<GuardianPlacement[]> {
    if (USE_SUPABASE) {
      return sbRead(`gd:placements:${dataCacheScope()}`, async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("placements")
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
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_GUARDIAN_PLACEMENTS);
  },

  async getDashboardPatients(): Promise<GuardianDashboardPatient[]> {
    if (USE_SUPABASE) {
      return sbRead(`gd:dashboard-patients:${dataCacheScope()}`, async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("patients")
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
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_GUARDIAN_DASHBOARD_PATIENTS);
  },

  async getDashboardAlerts(): Promise<GuardianDashboardAlert[]> {
    if (USE_SUPABASE) {
      return sbRead(`gd:dashboard-alerts:${dataCacheScope()}`, async () => []);
    }
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_GUARDIAN_DASHBOARD_ALERTS);
  },

  async getDashboardSummary(): Promise<GuardianDashboardSummary> {
    if (USE_SUPABASE) {
      return sbRead(`gd:dashboard-summary:${dataCacheScope()}`, async () => {
        const [placements, spending] = await Promise.all([
          guardianService.getPlacements(),
          guardianService.getSpendingData(),
        ]);
        const activePlacements = placements.filter((p) =>
          String(p.status).toLowerCase().includes("active")
        ).length;
        const lastSpend = spending[spending.length - 1]?.amount ?? 0;
        if (useInAppMockDataset()) {
          const base = (await loadMockBarrel()).MOCK_GUARDIAN_DASHBOARD_SUMMARY;
          return {
            activePlacements: activePlacements || placements.length || base.activePlacements,
            monthlySpendBdt: lastSpend || base.monthlySpendBdt,
            totalSessions: base.totalSessions,
          };
        }
        return {
          activePlacements: activePlacements || placements.length,
          monthlySpendBdt: lastSpend,
          totalSessions: 0,
        };
      });
    }
    await delay();
    const placements = await guardianService.getPlacements();
    const active = placements.filter((p) => String(p.status).toLowerCase().includes("active")).length;
    if (!useInAppMockDataset()) {
      return {
        activePlacements: active || placements.length,
        monthlySpendBdt: 0,
        totalSessions: 0,
      };
    }
    const base = (await loadMockBarrel()).MOCK_GUARDIAN_DASHBOARD_SUMMARY;
    return {
      ...base,
      activePlacements: active || base.activePlacements,
    };
  },

  async getCareRequirements(): Promise<CareRequirement[]> {
    if (USE_SUPABASE) {
      const contracts = await marketplaceService.getMyRequests();
      return contracts.map(mapCareContractToCareRequirement);
    }
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_CARE_REQUIREMENTS);
  },

  async getCareRequirementMessages(_reqId: string): Promise<CareRequirementMessage[]> {
    if (USE_SUPABASE) {
      return sbRead(`gd:care-req-msgs:${dataCacheScope()}:${_reqId}`, async () => {
        // Care requirement messages are a messaging feature not yet in the schema
        return [];
      });
    }
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_CARE_REQUIREMENT_MESSAGES);
  },

  async getWizardAgencies(): Promise<WizardAgency[]> {
    if (USE_SUPABASE) {
      return sbRead(`gd:wizard-agencies:${dataCacheScope()}`, async () => {
        const { data, error } = await sbData().from("agencies")
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
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_WIZARD_AGENCIES);
  },

  async getPaymentTransactions(): Promise<GuardianTransaction[]> {
    if (USE_SUPABASE) {
      return sbRead(`gd:transactions:${dataCacheScope()}`, async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("invoices")
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
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_GUARDIAN_TRANSACTIONS);
  },

  async getInvoices(): Promise<GuardianInvoice[]> {
    if (USE_SUPABASE) {
      return sbRead(`gd:invoices:${dataCacheScope()}`, async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("invoices")
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
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_GUARDIAN_INVOICES);
  },

  async getScheduleAppointments(): Promise<GuardianAppointment[]> {
    if (USE_SUPABASE) {
      return sbRead(`gd:schedule-appointments:${dataCacheScope()}`, async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("placements")
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
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_GUARDIAN_APPOINTMENTS);
  },

  async getScheduleTodayEvents(): Promise<GuardianTodayEvent[]> {
    if (USE_SUPABASE) {
      return sbRead(`gd:today-events:${dataCacheScope()}`, async () => {
        const userId = await currentUserId();
        const today = new Date().toISOString().slice(0, 10);
        const { data, error } = await sbData().from("shifts")
          .select("id, date, start_time, end_time, status, caregiver_id, patient_id")
          .eq("date", today);
        if (error) throw error;
        // Filter to shifts where the patient belongs to this guardian
        const patientIds = (data || []).map((s: any) => s.patient_id).filter(Boolean);
        if (patientIds.length === 0) return [];
        const { data: patients } = await sbData().from("patients")
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
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_GUARDIAN_TODAY_EVENTS);
  },

  async getReviewsData(): Promise<{ pastCaregivers: PastCaregiverReview[]; receivedReviews: ReceivedReview[] }> {
    if (USE_SUPABASE) {
      return sbRead(`gd:reviews:${dataCacheScope()}`, async () => {
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
    return demoOfflineDelayAndPick(
      200,
      { pastCaregivers: [], receivedReviews: [] },
      (m) => ({
        pastCaregivers: m.MOCK_PAST_CAREGIVERS,
        receivedReviews: m.MOCK_RECEIVED_REVIEWS,
      }),
    );
  },

  async getPlacementDetail(_placementId: string): Promise<{ shiftHistory: PlacementShiftHistory[]; caregiverTimeline: CaregiverTimelineEntry[] }> {
    if (USE_SUPABASE) {
      return sbRead(`gd:placement-detail:${dataCacheScope()}:${_placementId}`, async () => {
        const { data: shifts, error } = await sbData().from("shifts")
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
    return demoOfflineDelayAndPick(
      200,
      { shiftHistory: [], caregiverTimeline: [] },
      (m) => ({
        shiftHistory: m.MOCK_PLACEMENT_SHIFT_HISTORY,
        caregiverTimeline: m.MOCK_CAREGIVER_TIMELINE,
      }),
    );
  },

  async getRecentActivity(): Promise<GuardianActivity[]> {
    if (USE_SUPABASE) {
      return sbRead(`gd:recent-activity:${dataCacheScope()}`, async () => {
        // Aggregate recent activity from shifts and invoices
        const userId = await currentUserId();
        const { data: recentShifts } = await sbData().from("shifts")
          .select("id, date, status, check_in_time")
          .order("updated_at", { ascending: false })
          .limit(5);
        return (recentShifts || []).map((s: any) => ({
          text: `Shift on ${s.date || "today"} — ${s.status}`,
          time: s.check_in_time || s.date || "",
          iconType: "calendar" as const,
          color: "var(--cn-purple)",
          link: "/guardian/schedule",
        }));
      });
    }
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_GUARDIAN_RECENT_ACTIVITY);
  },

  async getAgencyPublicProfile(id: string): Promise<AgencyPublicProfile> {
    if (USE_SUPABASE) {
      return sbRead(`gd:agency-profile:${dataCacheScope()}:${id}`, async () => {
        const { data, error } = await sbData().from("agencies")
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
    return demoOfflineDelayAndPick(
      200,
      {
        id,
        name: "",
        tagline: "",
        established: 0,
        rating: 0,
        reviewCount: 0,
        location: "",
        phone: "",
        email: "",
        about: "",
        services: [],
        caregivers: [],
        reviews: [],
      } as AgencyPublicProfile,
      (m) => ({ ...m.MOCK_AGENCY_PUBLIC_PROFILE, id }),
    );
  },

  async getCaregiverPublicProfile(id: string): Promise<CaregiverPublicProfile> {
    if (USE_SUPABASE) {
      return sbRead(`gd:caregiver-profile:${dataCacheScope()}:${id}`, async () => {
        const { data, error } = await sbData().from("caregiver_profiles")
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
    return demoOfflineDelayAndPick(
      200,
      {
        name: "",
        type: "",
        rating: 0,
        reviews: 0,
        location: "",
        price: "",
        experience: "",
        verified: false,
        agency: { id: "", name: "" },
        bio: "",
        specialties: [],
        education: [],
        languages: [],
        image: "",
      } as CaregiverPublicProfile,
      (m) => m.MOCK_CAREGIVER_PUBLIC_PROFILE,
    );
  },

  async getCaregiverComparison(): Promise<ComparisonCaregiver[]> {
    if (USE_SUPABASE) {
      return sbRead(`gd:caregiver-comparison:${dataCacheScope()}`, async () => {
        // Return empty — comparison requires specific context (e.g. a bid)
        return [];
      });
    }
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_COMPARISON_CAREGIVERS);
  },

  async getGuardianProfile(): Promise<GuardianProfile> {
    if (USE_SUPABASE) {
      return sbRead(`gd:profile:${dataCacheScope()}`, async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("guardian_profiles")
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
    return demoOfflineDelayAndPick(
      200,
      {
        name: "",
        phone: "",
        email: "",
        location: "",
        relation: "",
        bio: "",
        emergencyContact: "",
      } as GuardianProfile,
      (m) => m.MOCK_GUARDIAN_PROFILE,
    );
  },

  async getInvoiceDetail(id: string): Promise<InvoiceDetail> {
    if (USE_SUPABASE) {
      return sbRead(`gd:invoice:${dataCacheScope()}:${id}`, async () => {
        const { data, error } = await sbData().from("invoices")
          .select("*")
          .eq("id", id)
          .single();
        if (error) throw error;
        const { data: lineItems } = await sbData().from("invoice_line_items")
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
    const emptyInv: InvoiceDetail = {
      id: id || "",
      status: "unpaid",
      billedTo: { name: "", guardianId: "" },
      agency: { name: "", agencyId: "", placementId: "" },
      period: { from: "", to: "" },
      issuedDate: "",
      dueDate: "",
      paidDate: "",
      paidVia: "",
      lineItems: [],
      subtotal: 0,
      platformFee: 0,
      platformFeeRate: 0,
      vat: 0,
      vatRate: 0,
      earlyDiscount: 0,
      total: 0,
    };
    return demoOfflineDelayAndPick(200, emptyInv, (m) => ({
      ...m.MOCK_INVOICE_DETAIL,
      id: id || m.MOCK_INVOICE_DETAIL.id,
    }));
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
    if (USE_SUPABASE) {
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
    if (!useInAppMockDataset()) {
      throw new Error("[CareNet] Connect Supabase or use Demo Access to report incidents.");
    }
    await delay(400);
    return { id: `inc-${crypto.randomUUID().slice(0, 8)}` };
  },

  async getIncidentHistory(): Promise<
    Array<{ id: string; type: string; severity: string; date: string; status: string; patient: string }>
  > {
    if (USE_SUPABASE) {
      return sbRead(`gd:incidents:${dataCacheScope()}`, async () => {
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
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_INCIDENT_HISTORY);
  },

  async getOperationalDashboard(): Promise<OperationalDashboardData> {
    const [alerts, activity] = await Promise.all([
      guardianService.getDashboardAlerts(),
      guardianService.getRecentActivity(),
    ]);
    return mapGuardianOperationalDashboard({ alerts, activity });
  },
};
