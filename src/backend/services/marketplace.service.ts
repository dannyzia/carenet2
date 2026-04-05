/**
 * Marketplace Service — UCCF-based dual marketplace
 * Guardian posts requests → agencies bid
 * Agencies publish packages → guardians browse & pick
 */
import type {
  CareContract,
  AgencyPackage,
  CareContractBid,
  MarketplaceFilters,
  UCCFPricingOffer,
  UCCFStaffing,
  UCCFSchedule,
  UCCFServices,
  UCCFSLA,
  BidComplianceSummary,
  BidComplianceItem,
  Job,
} from "@/backend/models";
import {
  MOCK_MARKETPLACE_JOBS,
  MOCK_CARE_REQUESTS,
  MOCK_AGENCY_PACKAGES,
  MOCK_BIDS,
} from "@/backend/api/mock";
import { USE_SUPABASE, sbRead, sbWrite, sb, currentUserId } from "./_sb";

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

/** Default max expiry for care requests: 15 days from publish */
const MAX_EXPIRY_DAYS = 15;
const MAX_EXPIRY_MS = MAX_EXPIRY_DAYS * 24 * 3600 * 1000;

/** Statuses that mean "taken" — hide from public marketplace but keep in guardian's module */
const TAKEN_STATUSES = ["locked", "booked", "active", "completed", "rated", "cancelled"];

// In-memory stores
let careRequests = [...MOCK_CARE_REQUESTS];
let agencyPackages = [...MOCK_AGENCY_PACKAGES];
let bids = [...MOCK_BIDS];

/** Enforce expiry on requests — mutates in place, returns true if expired */
function enforceExpiry(req: CareContract): boolean {
  if (TAKEN_STATUSES.includes(req.status)) return false;
  const publishedAt = req.published_at || req.created_at;
  // Auto-assign expires_at if missing (15 days from publish)
  if (!req.expires_at) {
    req.expires_at = new Date(new Date(publishedAt).getTime() + MAX_EXPIRY_MS).toISOString();
  }
  // Clamp expires_at to max 15 days from publish
  const maxExpiry = new Date(publishedAt).getTime() + MAX_EXPIRY_MS;
  if (new Date(req.expires_at).getTime() > maxExpiry) {
    req.expires_at = new Date(maxExpiry).toISOString();
  }
  // Check if expired
  if (Date.now() > new Date(req.expires_at).getTime()) {
    req.status = "cancelled";
    // Expire all pending bids for this request
    bids.filter(b => b.contract_id === req.id && b.status === "pending")
      .forEach(b => { b.status = "expired"; });
    return true;
  }
  return false;
}

/** Enforce bid expiry — mutates in place */
function enforceBidExpiry(bid: CareContractBid): boolean {
  if (bid.status !== "pending" && bid.status !== "countered") return false;
  if (Date.now() > new Date(bid.expires_at).getTime()) {
    bid.status = "expired";
    return true;
  }
  return false;
}

// Subscription notification callbacks (simulated)
const subscriptionListeners: Array<(agencyId: string, packageTitle: string) => void> = [];

/** Map Supabase `jobs` row → `Job` with arrays/strings UI code can assume exist. */
function mapSupabaseJobRow(d: Record<string, unknown>): Job {
  const skillsRaw = d.skills;
  const skills = Array.isArray(skillsRaw)
    ? (skillsRaw as string[])
    : typeof skillsRaw === "string"
      ? [skillsRaw]
      : [];
  const agency =
    d.agency && typeof d.agency === "object"
      ? (d.agency as Job["agency"])
      : undefined;
  return {
    id: String(d.id ?? ""),
    title: (d.title as string) ?? "",
    location: (d.location as string) ?? "",
    salary: (d.salary as string) ?? undefined,
    type: d.type as string | undefined,
    posted: (d.posted as string) ?? (d.created_at as string) ?? "",
    urgent: d.urgent as boolean | undefined,
    status: d.status as string | undefined,
    description: (d.description as string) ?? undefined,
    experience: (d.experience as string) ?? "",
    skills,
    agency,
  };
}

/** Map Supabase `care_contracts` row → `CareContract` */
function mapSupabaseContractRow(d: Record<string, unknown>): CareContract {
  const parseJson = (key: string) => {
    const v = d[key];
    if (v == null) return undefined;
    if (typeof v === "object") return v;
    try { return JSON.parse(String(v)); } catch { return undefined; }
  };
  const parseStringArray = (key: string): string[] => {
    const v = d[key];
    if (Array.isArray(v)) return v as string[];
    if (typeof v === "string") {
      try { return JSON.parse(v); } catch { return [v]; }
    }
    return [];
  };
  return {
    id: String(d.id ?? ""),
    meta: {
      type: (d.type as any) ?? "request",
      title: (d.title as string) ?? "",
      category: parseStringArray("categories") as any,
      location: {
        city: (d.city as string) ?? "",
        area: (d.area as string) ?? "",
        address_optional: (d.address as string) ?? undefined,
      },
      duration_type: (d.duration_type as any) ?? "long_term",
    },
    party: {
      role: (d.party_role as any) ?? "patient",
      name: (d.party_name as string) ?? "",
      contact_phone: (d.party_phone as string) ?? "",
    },
    care_subject: parseJson("care_subject"),
    medical: parseJson("medical"),
    care_needs: parseJson("care_needs"),
    staffing: (parseJson("staffing") ?? { required_level: "L1" }) as any,
    schedule: parseJson("schedule"),
    services: parseJson("services"),
    logistics: parseJson("logistics"),
    equipment: parseJson("equipment"),
    pricing: (parseJson("pricing") ?? { budget_max: 0 }) as any,
    sla: parseJson("sla"),
    compliance: parseJson("compliance"),
    exclusions: parseStringArray("exclusions"),
    add_ons: parseStringArray("add_ons"),
    status: (d.status as any) ?? "draft",
    created_at: (d.created_at as string) ?? new Date().toISOString(),
    updated_at: (d.updated_at as string) ?? undefined,
    published_at: (d.published_at as string) ?? undefined,
    expires_at: (d.expires_at as string) ?? undefined,
    bid_count: (d.bid_count as number) ?? 0,
    match_score: (d.match_score as number) ?? undefined,
  };
}

/** Map Supabase `care_contracts` row → `AgencyPackage` */
function mapSupabasePackageRow(d: Record<string, unknown>): AgencyPackage {
  const base = mapSupabaseContractRow(d) as AgencyPackage;
  base.agency_id = (d.agency_id as string) ?? "";
  base.agency_name = (d.agency_name as string) ?? "";
  base.agency_rating = (d.agency_rating as number) ?? undefined;
  base.agency_verified = (d.agency_verified as boolean) ?? undefined;
  base.subscribers = (d.subscribers as number) ?? undefined;
  base.featured = (d.featured as boolean) ?? undefined;
  return base;
}

/** Map Supabase `care_contract_bids` row → `CareContractBid` */
function mapSupabaseBidRow(d: Record<string, unknown>): CareContractBid {
  const parseJson = (key: string) => {
    const v = d[key];
    if (v == null) return undefined;
    if (typeof v === "object") return v;
    try { return JSON.parse(String(v)); } catch { return undefined; }
  };
  return {
    id: String(d.id ?? ""),
    contract_id: String(d.contract_id ?? ""),
    agency_id: String(d.agency_id ?? ""),
    agency_name: (d.agency_name as string) ?? "",
    agency_rating: (d.agency_rating as number) ?? undefined,
    agency_verified: (d.agency_verified as boolean) ?? undefined,
    proposed_pricing: (parseJson("proposed_pricing") ?? {}) as any,
    proposed_staffing: parseJson("proposed_staffing"),
    proposed_schedule: parseJson("proposed_schedule"),
    proposed_services: parseJson("proposed_services"),
    proposed_sla: parseJson("proposed_sla"),
    compliance: (parseJson("compliance") ?? { overall_score: 0, met_count: 0, partial_count: 0, unmet_count: 0, total_count: 0, sections: [] }) as any,
    status: (d.status as any) ?? "pending",
    message: (d.message as string) ?? undefined,
    remarks: (d.remarks as string) ?? undefined,
    created_at: (d.created_at as string) ?? new Date().toISOString(),
    expires_at: (d.expires_at as string) ?? new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    counter_offer: parseJson("counter_offer"),
  };
}

export const marketplaceService = {
  // ─── Legacy (caregiver job board) ───
  async getJobs(): Promise<Job[]> {
    if (USE_SUPABASE) {
      return sbRead("marketplace:jobs", async () => {
        const { data, error } = await sb().from("jobs")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => mapSupabaseJobRow(d));
      });
    }
    await delay();
    return MOCK_MARKETPLACE_JOBS;
  },
  async searchJobs(query: string): Promise<Job[]> {
    if (USE_SUPABASE) {
      if (!query.trim()) return this.getJobs();
      return sbRead(`marketplace:jobs:${query}`, async () => {
        const pattern = `%${query}%`;
        const { data, error } = await sb().from("jobs")
          .select("*")
          .or(`title.ilike.${pattern},location.ilike.${pattern}`)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => mapSupabaseJobRow(d));
      });
    }
    await delay(300);
    if (!query.trim()) return MOCK_MARKETPLACE_JOBS;
    const q = query.toLowerCase();
    return MOCK_MARKETPLACE_JOBS.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q)
    );
  },

  // ─── Care Requests (Guardian side) ───
  /**
   * Get care requests visible on the PUBLIC marketplace (for agencies to bid).
   * Filters out taken/expired requests. Enforces expiry on access.
   */
  async getCareRequests(filters?: MarketplaceFilters): Promise<CareContract[]> {
    if (USE_SUPABASE) {
      return sbRead("marketplace:care-requests", async () => {
        let q = sb().from("care_contracts").select("*").in("status", ["published", "bidding", "matched"]).eq("type", "request");
        if (filters?.categories?.length) {
          q = q.overlaps("categories", filters.categories);
        }
        if (filters?.city) {
          q = q.ilike("city", `%${filters.city}%`);
        }
        q = q.order("created_at", { ascending: false });
        const { data, error } = await q;
        if (error) throw error;
        return (data || []).map(mapSupabaseContractRow);
      });
    }
    await delay();
    // Enforce expiry on all requests
    careRequests.forEach(enforceExpiry);
    // Only show published/bidding (not taken, not expired, not draft)
    let results = careRequests.filter(
      (r) => r.meta.type === "request" && !TAKEN_STATUSES.includes(r.status) && r.status !== "draft"
    );
    if (filters?.categories?.length) {
      results = results.filter((r) =>
        r.meta.category.some((c) => filters.categories!.includes(c))
      );
    }
    if (filters?.city) {
      results = results.filter((r) =>
        r.meta.location.city.toLowerCase().includes(filters.city!.toLowerCase())
      );
    }
    if (filters?.staff_level) {
      results = results.filter((r) => r.staffing.required_level === filters.staff_level);
    }
    if (filters?.sort_by === "newest") {
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    if (filters?.sort_by === "budget_high") {
      results.sort((a, b) => ((b.pricing as any).budget_max || 0) - ((a.pricing as any).budget_max || 0));
    }
    return results;
  },

  async getCareRequestById(id: string): Promise<CareContract | null> {
    if (USE_SUPABASE) {
      return sbRead(`marketplace:care-request:${id}`, async () => {
        const { data, error } = await sb().from("care_contracts").select("*").eq("id", id).single();
        if (error) {
          if ((error as any).code === "PGRST116") return null;
          throw error;
        }
        return data ? mapSupabaseContractRow(data as Record<string, unknown>) : null;
      });
    }
    await delay();
    return careRequests.find((r) => r.id === id) || null;
  },

  /**
   * Get ALL of a guardian's requests (including taken/expired).
   * Guardian can see everything they posted — for re-posting or reference.
   */
  async getMyRequests(userId: string): Promise<CareContract[]> {
    if (USE_SUPABASE) {
      return sbRead(`marketplace:my-requests:${userId}`, async () => {
        const { data, error } = await sb().from("care_contracts").select("*").eq("owner_id", userId).eq("type", "request").order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map(mapSupabaseContractRow);
      });
    }
    await delay();
    // Enforce expiry but still return all
    careRequests.forEach(enforceExpiry);
    return careRequests.filter((r) => r.meta.type === "request");
  },

  async createCareRequest(data: Partial<CareContract>): Promise<CareContract> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const now = new Date().toISOString();
        const expiresAt = data.expires_at
          ? new Date(Math.min(new Date(data.expires_at).getTime(), Date.now() + MAX_EXPIRY_MS)).toISOString()
          : new Date(Date.now() + MAX_EXPIRY_MS).toISOString();
        const payload: Record<string, unknown> = {
          type: "request",
          status: "draft",
          created_at: now,
          expires_at: expiresAt,
          bid_count: 0,
          title: data.meta?.title,
          categories: data.meta?.category,
          city: data.meta?.location?.city,
          area: data.meta?.location?.area,
          address: data.meta?.location?.address_optional,
          party_role: data.party?.role,
          party_name: data.party?.name,
          party_phone: data.party?.contact_phone,
          staffing: data.staffing ? JSON.stringify(data.staffing) : undefined,
          schedule: data.schedule ? JSON.stringify(data.schedule) : undefined,
          services: data.services ? JSON.stringify(data.services) : undefined,
          logistics: data.logistics ? JSON.stringify(data.logistics) : undefined,
          equipment: data.equipment ? JSON.stringify(data.equipment) : undefined,
          pricing: data.pricing ? JSON.stringify(data.pricing) : undefined,
          sla: data.sla ? JSON.stringify(data.sla) : undefined,
          compliance: data.compliance ? JSON.stringify(data.compliance) : undefined,
          care_subject: data.care_subject ? JSON.stringify(data.care_subject) : undefined,
          medical: data.medical ? JSON.stringify(data.medical) : undefined,
          care_needs: data.care_needs ? JSON.stringify(data.care_needs) : undefined,
          exclusions: data.exclusions ? JSON.stringify(data.exclusions) : undefined,
          add_ons: data.add_ons ? JSON.stringify(data.add_ons) : undefined,
        };
        const { data: inserted, error } = await sb().from("care_contracts").insert(payload).select().single();
        if (error) throw error;
        return mapSupabaseContractRow(inserted as Record<string, unknown>);
      });
    }
    await delay(400);
    const now = new Date();
    const expiresAt = data.expires_at
      ? new Date(Math.min(new Date(data.expires_at).getTime(), now.getTime() + MAX_EXPIRY_MS)).toISOString()
      : new Date(now.getTime() + MAX_EXPIRY_MS).toISOString();
    const newReq: CareContract = {
      ...data as CareContract,
      id: `req-${Date.now()}`,
      status: "draft",
      created_at: now.toISOString(),
      expires_at: expiresAt,
      bid_count: 0,
    };
    careRequests.push(newReq);
    return newReq;
  },

  async publishCareRequest(id: string): Promise<CareContract> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const now = new Date().toISOString();
        const { data, error } = await sb().from("care_contracts")
          .update({ status: "published", published_at: now, expires_at: new Date(Date.now() + MAX_EXPIRY_MS).toISOString() })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return mapSupabaseContractRow(data as Record<string, unknown>);
      });
    }
    await delay(300);
    const req = careRequests.find((r) => r.id === id);
    if (req) {
      req.status = "published";
      req.published_at = new Date().toISOString();
      // Enforce max expiry from publish time
      if (!req.expires_at) {
        req.expires_at = new Date(Date.now() + MAX_EXPIRY_MS).toISOString();
      }
      const maxExpiry = Date.now() + MAX_EXPIRY_MS;
      if (new Date(req.expires_at).getTime() > maxExpiry) {
        req.expires_at = new Date(maxExpiry).toISOString();
      }
    }
    return req!;
  },

  /** Re-post a previously taken/expired/cancelled request back to marketplace */
  async repostCareRequest(id: string): Promise<CareContract> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const now = new Date().toISOString();
        const { data, error } = await sb().from("care_contracts")
          .update({ status: "published", published_at: now, expires_at: new Date(Date.now() + MAX_EXPIRY_MS).toISOString(), bid_count: 0 })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return mapSupabaseContractRow(data as Record<string, unknown>);
      });
    }
    await delay(400);
    const req = careRequests.find((r) => r.id === id);
    if (!req) throw new Error("Request not found");
    req.status = "published";
    req.published_at = new Date().toISOString();
    req.expires_at = new Date(Date.now() + MAX_EXPIRY_MS).toISOString();
    req.bid_count = 0;
    return req;
  },

  // ─── Agency Packages ───
  async getAgencyPackages(filters?: MarketplaceFilters): Promise<AgencyPackage[]> {
    if (USE_SUPABASE) {
      return sbRead("marketplace:agency-packages", async () => {
        let q = sb().from("care_contracts").select("*").eq("type", "offer").eq("status", "published");
        if (filters?.categories?.length) {
          q = q.overlaps("categories", filters.categories);
        }
        if (filters?.city) {
          q = q.ilike("city", `%${filters.city}%`);
        }
        q = q.order("created_at", { ascending: false });
        const { data, error } = await q;
        if (error) throw error;
        return (data || []).map(mapSupabasePackageRow);
      });
    }
    await delay();
    let results = [...agencyPackages];
    if (filters?.categories?.length) {
      results = results.filter((p) =>
        p.meta.category.some((c) => filters.categories!.includes(c))
      );
    }
    if (filters?.city) {
      results = results.filter((p) =>
        p.meta.location.city.toLowerCase().includes(filters.city!.toLowerCase())
      );
    }
    if (filters?.sort_by === "budget_low") {
      results.sort((a, b) => (a.pricing.base_price || 0) - (b.pricing.base_price || 0));
    }
    if (filters?.sort_by === "budget_high") {
      results.sort((a, b) => (b.pricing.base_price || 0) - (a.pricing.base_price || 0));
    }
    return results;
  },

  async getAgencyPackageById(id: string): Promise<AgencyPackage | null> {
    if (USE_SUPABASE) {
      return sbRead(`marketplace:agency-package:${id}`, async () => {
        const { data, error } = await sb().from("care_contracts").select("*").eq("id", id).eq("type", "offer").single();
        if (error) {
          if ((error as any).code === "PGRST116") return null;
          throw error;
        }
        return data ? mapSupabasePackageRow(data as Record<string, unknown>) : null;
      });
    }
    await delay();
    return agencyPackages.find((p) => p.id === id) || null;
  },

  async getMyPackages(agencyId: string): Promise<AgencyPackage[]> {
    if (USE_SUPABASE) {
      return sbRead(`marketplace:my-packages:${agencyId}`, async () => {
        const { data, error } = await sb().from("care_contracts").select("*").eq("agency_id", agencyId).eq("type", "offer").order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map(mapSupabasePackageRow);
      });
    }
    await delay();
    return agencyPackages.filter((p) => p.agency_id === agencyId);
  },

  async createAgencyPackage(data: Partial<AgencyPackage>): Promise<AgencyPackage> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const now = new Date().toISOString();
        const payload: Record<string, unknown> = {
          type: "offer",
          status: "draft",
          created_at: now,
          title: data.meta?.title,
          categories: data.meta?.category,
          city: data.meta?.location?.city,
          area: data.meta?.location?.area,
          address: data.meta?.location?.address_optional,
          party_role: data.party?.role,
          party_name: data.party?.name,
          party_phone: data.party?.contact_phone,
          agency_id: data.agency_id,
          agency_name: data.agency_name,
          agency_rating: data.agency_rating,
          agency_verified: data.agency_verified,
          subscribers: data.subscribers,
          featured: data.featured,
          staffing: data.staffing ? JSON.stringify(data.staffing) : undefined,
          schedule: data.schedule ? JSON.stringify(data.schedule) : undefined,
          services: data.services ? JSON.stringify(data.services) : undefined,
          logistics: data.logistics ? JSON.stringify(data.logistics) : undefined,
          equipment: data.equipment ? JSON.stringify(data.equipment) : undefined,
          pricing: data.pricing ? JSON.stringify(data.pricing) : undefined,
          sla: data.sla ? JSON.stringify(data.sla) : undefined,
          compliance: data.compliance ? JSON.stringify(data.compliance) : undefined,
        };
        const { data: inserted, error } = await sb().from("care_contracts").insert(payload).select().single();
        if (error) throw error;
        return mapSupabasePackageRow(inserted as Record<string, unknown>);
      });
    }
    await delay(400);
    const pkg: AgencyPackage = {
      ...data as AgencyPackage,
      id: `pkg-${Date.now()}`,
      status: "draft",
      created_at: new Date().toISOString(),
    };
    agencyPackages.push(pkg);
    return pkg;
  },

  async publishPackage(id: string): Promise<AgencyPackage> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const now = new Date().toISOString();
        const { data, error } = await sb().from("care_contracts")
          .update({ status: "published", published_at: now })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return mapSupabasePackageRow(data as Record<string, unknown>);
      });
    }
    await delay(300);
    const pkg = agencyPackages.find((p) => p.id === id);
    if (pkg) {
      pkg.status = "published";
      pkg.published_at = new Date().toISOString();
    }
    return pkg!;
  },

  // ─── Bids ───
  async getBidsForRequest(requestId: string): Promise<CareContractBid[]> {
    if (USE_SUPABASE) {
      return sbRead(`marketplace:bids:${requestId}`, async () => {
        const { data, error } = await sb().from("care_contract_bids").select("*").eq("contract_id", requestId).order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map(mapSupabaseBidRow);
      });
    }
    await delay();
    const requestBids = bids.filter((b) => b.contract_id === requestId);
    // Enforce expiry on access
    requestBids.forEach(enforceBidExpiry);
    return requestBids;
  },

  async getBidById(bidId: string): Promise<CareContractBid | null> {
    if (USE_SUPABASE) {
      return sbRead(`marketplace:bid:${bidId}`, async () => {
        const { data, error } = await sb().from("care_contract_bids").select("*").eq("id", bidId).single();
        if (error) {
          if ((error as any).code === "PGRST116") return null;
          throw error;
        }
        return data ? mapSupabaseBidRow(data as Record<string, unknown>) : null;
      });
    }
    await delay();
    const bid = bids.find((b) => b.id === bidId);
    if (bid) enforceBidExpiry(bid);
    return bid || null;
  },

  async getMyBids(agencyId: string): Promise<CareContractBid[]> {
    if (USE_SUPABASE) {
      return sbRead(`marketplace:my-bids:${agencyId}`, async () => {
        const { data, error } = await sb().from("care_contract_bids").select("*").eq("agency_id", agencyId).order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map(mapSupabaseBidRow);
      });
    }
    await delay();
    const agencyBids = bids.filter((b) => b.agency_id === agencyId);
    agencyBids.forEach(enforceBidExpiry);
    return agencyBids;
  },

  async submitBid(data: {
    contract_id: string;
    agency_id: string;
    agency_name: string;
    proposed_pricing: UCCFPricingOffer;
    proposed_staffing?: UCCFStaffing;
    proposed_schedule?: UCCFSchedule;
    proposed_services?: UCCFServices;
    proposed_sla?: UCCFSLA;
    message?: string;
    remarks?: string;
  }): Promise<CareContractBid> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const now = new Date().toISOString();
        const expiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
        const payload: Record<string, unknown> = {
          contract_id: data.contract_id,
          agency_id: data.agency_id,
          agency_name: data.agency_name,
          proposed_pricing: JSON.stringify(data.proposed_pricing),
          proposed_staffing: data.proposed_staffing ? JSON.stringify(data.proposed_staffing) : undefined,
          proposed_schedule: data.proposed_schedule ? JSON.stringify(data.proposed_schedule) : undefined,
          proposed_services: data.proposed_services ? JSON.stringify(data.proposed_services) : undefined,
          proposed_sla: data.proposed_sla ? JSON.stringify(data.proposed_sla) : undefined,
          compliance: JSON.stringify({ overall_score: 0, met_count: 0, partial_count: 0, unmet_count: 0, total_count: 0, sections: [] }),
          status: "pending",
          message: data.message,
          remarks: data.remarks,
          created_at: now,
          expires_at: expiresAt,
        };
        const { data: inserted, error } = await sb().from("care_contract_bids").insert(payload).select().single();
        if (error) throw error;
        return mapSupabaseBidRow(inserted as Record<string, unknown>);
      });
    }
    await delay(500);
    const request = careRequests.find((r) => r.id === data.contract_id);
    const compliance = this.calculateCompliance(request!, data);

    const bid: CareContractBid = {
      id: `bid-${Date.now()}`,
      ...data,
      agency_rating: 4.5,
      agency_verified: true,
      compliance,
      status: "pending",
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    };
    bids.push(bid);

    // Update request bid count
    if (request) {
      request.bid_count = (request.bid_count || 0) + 1;
      if (request.status === "published") request.status = "bidding";
    }
    return bid;
  },

  async acceptBid(bidId: string): Promise<CareContractBid> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const { data: bid, error: bidErr } = await sb().from("care_contract_bids").select("*").eq("id", bidId).single();
        if (bidErr) throw bidErr;
        const bidRow = bid as Record<string, unknown>;
        const contractId = String(bidRow.contract_id ?? "");
        await sb().from("care_contract_bids").update({ status: "rejected" }).eq("contract_id", contractId).neq("id", bidId);
        await sb().from("care_contract_bids").update({ status: "accepted" }).eq("id", bidId);
        await sb().from("care_contracts").update({ status: "locked" }).eq("id", contractId);
        const { data: updated, error: updateErr } = await sb().from("care_contract_bids").select("*").eq("id", bidId).single();
        if (updateErr) throw updateErr;
        return mapSupabaseBidRow(updated as Record<string, unknown>);
      });
    }
    await delay(300);
    const bid = bids.find((b) => b.id === bidId);
    if (bid) {
      bid.status = "accepted";
      // Reject other bids for same request
      bids.filter((b) => b.contract_id === bid.contract_id && b.id !== bidId)
        .forEach((b) => { b.status = "rejected"; });
      // Lock contract
      const req = careRequests.find((r) => r.id === bid.contract_id);
      if (req) req.status = "locked";
    }
    return bid!;
  },

  async rejectBid(bidId: string): Promise<CareContractBid> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const { data, error } = await sb().from("care_contract_bids").update({ status: "rejected" }).eq("id", bidId).select().single();
        if (error) throw error;
        return mapSupabaseBidRow(data as Record<string, unknown>);
      });
    }
    await delay(200);
    const bid = bids.find((b) => b.id === bidId);
    if (bid) bid.status = "rejected";
    return bid!;
  },

  async withdrawBid(bidId: string): Promise<CareContractBid> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const { data: bid, error: fetchErr } = await sb().from("care_contract_bids").select("*").eq("id", bidId).single();
        if (fetchErr) throw fetchErr;
        const status = (bid as Record<string, unknown>).status as string;
        if (status !== "pending" && status !== "countered") {
          throw new Error("Only pending or countered bids can be withdrawn");
        }
        const { data, error } = await sb().from("care_contract_bids").update({ status: "withdrawn" }).eq("id", bidId).select().single();
        if (error) throw error;
        return mapSupabaseBidRow(data as Record<string, unknown>);
      });
    }
    await delay(200);
    const bid = bids.find((b) => b.id === bidId);
    if (!bid) throw new Error("Bid not found");
    if (bid.status !== "pending" && bid.status !== "countered") {
      throw new Error("Only pending or countered bids can be withdrawn");
    }
    bid.status = "withdrawn";
    // Decrement bid count on the parent request
    const req = careRequests.find((r) => r.id === bid.contract_id);
    if (req && req.bid_count && req.bid_count > 0) {
      req.bid_count -= 1;
    }
    return bid;
  },

  async counterBid(bidId: string, message: string, pricing?: UCCFPricingOffer): Promise<CareContractBid> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const counterOffer = JSON.stringify({
          from: "patient",
          message,
          pricing,
          created_at: new Date().toISOString(),
        });
        const { data, error } = await sb().from("care_contract_bids")
          .update({ status: "countered", counter_offer: counterOffer })
          .eq("id", bidId)
          .select()
          .single();
        if (error) throw error;
        return mapSupabaseBidRow(data as Record<string, unknown>);
      });
    }
    await delay(300);
    const bid = bids.find((b) => b.id === bidId);
    if (bid) {
      bid.status = "countered";
      bid.counter_offer = {
        from: "patient",
        message,
        pricing,
        created_at: new Date().toISOString(),
      };
    }
    return bid!;
  },

  /** Agency responds to a patient's counter-offer */
  async respondToCounter(
    bidId: string,
    action: "accept" | "reject" | "counter",
    data?: { message?: string; pricing?: UCCFPricingOffer }
  ): Promise<CareContractBid> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const { data: bid, error: fetchErr } = await sb().from("care_contract_bids").select("*").eq("id", bidId).single();
        if (fetchErr) throw new Error("Bid not found");
        const bidRow = bid as Record<string, unknown>;
        const contractId = String(bidRow.contract_id ?? "");

        if (action === "accept") {
          await sb().from("care_contract_bids").update({ status: "accepted" }).eq("id", bidId);
          await sb().from("care_contract_bids").update({ status: "rejected" }).eq("contract_id", contractId).neq("id", bidId);
          await sb().from("care_contracts").update({ status: "locked" }).eq("id", contractId);
        } else if (action === "reject") {
          await sb().from("care_contract_bids").update({ status: "withdrawn" }).eq("id", bidId);
        } else if (action === "counter") {
          const counterOffer = JSON.stringify({
            from: "agency",
            message: data?.message || "",
            pricing: data?.pricing,
            created_at: new Date().toISOString(),
          });
          await sb().from("care_contract_bids").update({ status: "countered", counter_offer: counterOffer }).eq("id", bidId);
        }

        const { data: updated, error } = await sb().from("care_contract_bids").select("*").eq("id", bidId).single();
        if (error) throw error;
        return mapSupabaseBidRow(updated as Record<string, unknown>);
      });
    }
    await delay(300);
    const bid = bids.find((b) => b.id === bidId);
    if (!bid) throw new Error("Bid not found");

    if (action === "accept") {
      // Agency accepts the patient's counter — use patient's pricing
      bid.status = "accepted";
      if (bid.counter_offer?.pricing) {
        bid.proposed_pricing = bid.counter_offer.pricing;
      }
      // Reject other bids for same request
      bids
        .filter((b) => b.contract_id === bid.contract_id && b.id !== bidId)
        .forEach((b) => { b.status = "rejected"; });
      // Lock the contract
      const req = careRequests.find((r) => r.id === bid.contract_id);
      if (req) req.status = "locked";
    } else if (action === "reject") {
      // Agency rejects the counter — bid is withdrawn
      bid.status = "withdrawn";
    } else if (action === "counter") {
      // Agency sends their own counter back
      bid.status = "countered";
      bid.counter_offer = {
        from: "agency",
        message: data?.message || "",
        pricing: data?.pricing,
        created_at: new Date().toISOString(),
      };
    }

    return bid;
  },

  /** Guardian subscribes to an agency package — creates a locked contract */
  async subscribeToPackage(
    packageId: string,
    guardianId: string,
    patientId?: string
  ): Promise<CareContract> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const { data: pkg, error: pkgErr } = await sb().from("care_contracts").select("*").eq("id", packageId).eq("type", "offer").single();
        if (pkgErr) throw new Error("Package not found");
        const pkgRow = pkg as Record<string, unknown>;
        const now = new Date().toISOString();
        const payload: Record<string, unknown> = {
          type: "request",
          status: "booked",
          created_at: now,
          published_at: now,
          owner_id: guardianId,
          title: pkgRow.title,
          categories: pkgRow.categories,
          city: pkgRow.city,
          area: pkgRow.area,
          address: pkgRow.address,
          party_role: "patient",
          party_name: "Guardian User",
          party_phone: "+880-1700-000000",
          agency_id: pkgRow.agency_id,
          agency_name: pkgRow.agency_name,
          staffing: pkgRow.staffing,
          schedule: pkgRow.schedule,
          services: pkgRow.services,
          logistics: pkgRow.logistics,
          equipment: pkgRow.equipment,
          pricing: pkgRow.pricing,
          sla: pkgRow.sla,
          compliance: pkgRow.compliance,
        };
        const { data: inserted, error } = await sb().from("care_contracts").insert(payload).select().single();
        if (error) throw error;
        // Increment subscribers
        const subs = ((pkgRow.subscribers as number) ?? 0) + 1;
        await sb().from("care_contracts").update({ subscribers: subs }).eq("id", packageId);
        return mapSupabaseContractRow(inserted as Record<string, unknown>);
      });
    }
    await delay(500);
    const pkg = agencyPackages.find((p) => p.id === packageId);
    if (!pkg) throw new Error("Package not found");

    const contract: CareContract = {
      id: `contract-${Date.now()}`,
      meta: { ...pkg.meta, type: "request" },
      party: {
        role: "patient",
        name: "Guardian User",
        contact_phone: "+880-1700-000000",
      },
      care_subject: undefined,
      staffing: pkg.staffing,
      schedule: pkg.schedule,
      services: pkg.services,
      logistics: pkg.logistics,
      equipment: pkg.equipment,
      pricing: pkg.pricing,
      sla: pkg.sla,
      compliance: pkg.compliance,
      status: "booked",
      created_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
    };

    careRequests.push(contract);

    // Increment subscribers on the package
    if (pkg.subscribers != null) {
      pkg.subscribers += 1;
    } else {
      pkg.subscribers = 1;
    }

    // Notify agency (fire subscription listeners)
    subscriptionListeners.forEach(cb => cb(pkg.agency_id, pkg.meta.title));

    return contract;
  },

  /** Register a callback for when a guardian subscribes to any package */
  onPackageSubscription(callback: (agencyId: string, packageTitle: string) => void): () => void {
    subscriptionListeners.push(callback);
    return () => {
      const idx = subscriptionListeners.indexOf(callback);
      if (idx >= 0) subscriptionListeners.splice(idx, 1);
    };
  },

  /** Get remaining time info for a request's expiry */
  getExpiryInfo(req: CareContract): { expired: boolean; remainingMs: number; remainingDays: number; expiresAt: string } {
    const expiresAt = req.expires_at || new Date(new Date(req.published_at || req.created_at).getTime() + MAX_EXPIRY_MS).toISOString();
    const remainingMs = Math.max(0, new Date(expiresAt).getTime() - Date.now());
    return {
      expired: remainingMs <= 0,
      remainingMs,
      remainingDays: Math.ceil(remainingMs / (24 * 3600 * 1000)),
      expiresAt,
    };
  },

  /** Get remaining time info for a bid's expiry */
  getBidExpiryInfo(bid: CareContractBid): { expired: boolean; remainingMs: number; remainingHours: number } {
    if (!bid.expires_at) {
      return { expired: false, remainingMs: Infinity, remainingHours: Infinity };
    }
    const expiresTime = new Date(bid.expires_at).getTime();
    if (isNaN(expiresTime)) {
      return { expired: false, remainingMs: Infinity, remainingHours: Infinity };
    }
    const remainingMs = Math.max(0, expiresTime - Date.now());
    return {
      expired: remainingMs <= 0,
      remainingMs,
      remainingHours: Math.ceil(remainingMs / 3600000),
    };
  },

  // ─── Compliance Calculator ───
  calculateCompliance(
    request: CareContract,
    bid: Partial<CareContractBid>
  ): BidComplianceSummary {
    const items: BidComplianceItem[] = [];

    // Staffing
    const reqLevel = request.staffing.required_level;
    const bidLevel = bid.proposed_staffing?.required_level || "L1";
    const levelOrder = ["L1", "L2", "L3", "L4"];
    const levelMatch = levelOrder.indexOf(bidLevel) >= levelOrder.indexOf(reqLevel)
      ? "met"
      : levelOrder.indexOf(bidLevel) >= levelOrder.indexOf(reqLevel) - 1
        ? "partial"
        : "unmet";
    items.push({
      field: "staffing.required_level",
      label: "Staff Level",
      required_value: reqLevel,
      offered_value: bidLevel,
      status: levelMatch as any,
    });

    if (request.staffing.caregiver_count) {
      const bidCg = bid.proposed_staffing?.caregiver_count || 0;
      items.push({
        field: "staffing.caregiver_count",
        label: "Caregiver Count",
        required_value: String(request.staffing.caregiver_count),
        offered_value: String(bidCg),
        status: bidCg >= request.staffing.caregiver_count ? "met" : "partial",
      });
    }

    // Schedule
    if (request.schedule?.hours_per_day) {
      const bidHrs = bid.proposed_schedule?.hours_per_day || 8;
      items.push({
        field: "schedule.hours_per_day",
        label: "Hours/Day",
        required_value: String(request.schedule.hours_per_day),
        offered_value: String(bidHrs),
        status: bidHrs >= request.schedule.hours_per_day ? "met" : "partial",
      });
    }

    const met = items.filter((i) => i.status === "met").length;
    const partial = items.filter((i) => i.status === "partial").length;
    const unmet = items.filter((i) => i.status === "unmet").length;
    const score = Math.round((met * 100 + partial * 70) / items.length);

    return {
      overall_score: score,
      met_count: met,
      partial_count: partial,
      unmet_count: unmet,
      total_count: items.length,
      sections: [
        {
          section: "auto",
          label: "Auto-calculated",
          section_score: score,
          items,
        },
      ],
    };
  },
};