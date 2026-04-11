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
import { loadMockBarrel } from "@/backend/api/mock/loadMockBarrel";
import { USE_SUPABASE, sbRead, sbWrite, sbData, currentUserId, dataCacheScope, withDemoExpiry, useInAppMockDataset } from "./_sb";
import {
  careContractToSupabaseRow,
  mapSupabaseContractRow,
  assertUCCFRequest,
  assertUCCFOffer,
} from "@/backend/domain/uccf";
import { getSubscriptionDefaultParty } from "@/config/bookingPresentation";
import { assertTransition, type LifecycleState } from "@/backend/domain/lifecycle/contractLifecycle";
import { billingService } from "./billing.service";

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

/** Row shape for UCCF care_contracts list (booked+ marketplace convergence). */
export type UccfContractListRow = {
  id: string;
  title: string;
  status: string;
  type: string;
  source_type: string | null;
  contract_party_scope: string | null;
  gac_kind: string | null;
  staffing_channel: string | null;
  financial_status: string | null;
  updated_at: string;
};

/** Demo / in-memory packages use ids like `pkg-001`. With Supabase enabled, these must never be loaded or subscribed as if they were DB rows. */
function isMockStylePackageId(id: string): boolean {
  return /^pkg-/i.test(String(id).trim());
}

/** Default max expiry for care requests: 15 days from publish */
const MAX_EXPIRY_DAYS = 15;
const MAX_EXPIRY_MS = MAX_EXPIRY_DAYS * 24 * 3600 * 1000;

/** Statuses that mean "taken" — hide from public marketplace but keep in guardian's module */
const TAKEN_STATUSES = ["locked", "booked", "active", "completed", "rated", "cancelled"];

// In-memory stores
let careRequests: CareContract[] | null = null;
let agencyPackages: AgencyPackage[] | null = null;
let bids: CareContractBid[] | null = null;

async function ensureMkMock() {
  if (careRequests !== null) return;
  if (!useInAppMockDataset()) {
    careRequests = [];
    agencyPackages = [];
    bids = [];
    return;
  }
  const m = await loadMockBarrel();
  careRequests = [...m.MOCK_CARE_REQUESTS];
  agencyPackages = [...m.MOCK_AGENCY_PACKAGES];
  bids = [...m.MOCK_BIDS];
}

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
    (bids ?? []).filter(b => b.contract_id === req.id && b.status === "pending")
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
      return sbRead(`marketplace:jobs:${dataCacheScope()}`, async () => {
        const { data, error } = await sbData().from("jobs")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => mapSupabaseJobRow(d));
      });
    }
    await delay();
    if (!useInAppMockDataset()) return [];
    return (await loadMockBarrel()).MOCK_MARKETPLACE_JOBS;
  },
  async searchJobs(query: string): Promise<Job[]> {
    if (USE_SUPABASE) {
      if (!query.trim()) return this.getJobs();
      return sbRead(`marketplace:jobs:${dataCacheScope()}:${query}`, async () => {
        const pattern = `%${query}%`;
        const { data, error } = await sbData().from("jobs")
          .select("*")
          .or(`title.ilike.${pattern},location.ilike.${pattern}`)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => mapSupabaseJobRow(d));
      });
    }
    await delay(300);
    if (!useInAppMockDataset()) return [];
    if (!query.trim()) return (await loadMockBarrel()).MOCK_MARKETPLACE_JOBS;
    const q = query.toLowerCase();
    return (await loadMockBarrel()).MOCK_MARKETPLACE_JOBS.filter(
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
      return sbRead(`marketplace:care-requests:${dataCacheScope()}`, async () => {
        let q = sbData().from("care_contracts").select("*").in("status", ["published", "bidding", "matched"]).eq("type", "request");
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
    await ensureMkMock();
    // Enforce expiry on all requests
    (careRequests!).forEach(enforceExpiry);
    // Only show published/bidding (not taken, not expired, not draft)
    let results = (careRequests!).filter(
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
      return sbRead(`marketplace:care-request:${dataCacheScope()}:${id}`, async () => {
        const { data, error } = await sbData().from("care_contracts").select("*").eq("id", id).single();
        if (error) {
          if ((error as any).code === "PGRST116") return null;
          throw error;
        }
        return data ? mapSupabaseContractRow(data as Record<string, unknown>) : null;
      });
    }
    await delay();
    await ensureMkMock();
    return (careRequests!).find((r) => r.id === id) || null;
  },

  /**
   * Get ALL of a guardian's requests (including taken/expired).
   * Guardian can see everything they posted — for re-posting or reference.
   */
  /** Pass `userId` only for tests; with Supabase the signed-in user is always used (RLS + real UUID). */
  async getMyRequests(userId?: string): Promise<CareContract[]> {
    if (USE_SUPABASE) {
      const uid = userId && !userId.endsWith("-current") ? userId : await currentUserId();
      return sbRead(`marketplace:my-requests:${dataCacheScope()}:${uid}`, async () => {
        const { data, error } = await sbData().from("care_contracts").select("*").eq("owner_id", uid).eq("type", "request").order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map(mapSupabaseContractRow);
      });
    }
    await delay();
    await ensureMkMock();
    // Enforce expiry but still return all
    (careRequests!).forEach(enforceExpiry);
    return (careRequests!).filter((r) => r.meta.type === "request");
  },

  async createCareRequest(data: Partial<CareContract>): Promise<CareContract> {
    assertUCCFRequest(data);
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const ownerId = await currentUserId();
        const now = new Date().toISOString();
        const expiresAt = data.expires_at
          ? new Date(Math.min(new Date(data.expires_at).getTime(), Date.now() + MAX_EXPIRY_MS)).toISOString()
          : new Date(Date.now() + MAX_EXPIRY_MS).toISOString();

        const payload = careContractToSupabaseRow(data, {
          kind: "request",
          ownerId,
          createdAtIso: now,
          expiresAtIso: expiresAt,
          status: "draft",
          bidCount: 0,
        });

        const { data: inserted, error } = await sbData().from("care_contracts")
          .insert(withDemoExpiry(payload as unknown as Record<string, unknown>) as typeof payload)
          .select()
          .single();
        if (error) throw error;
        return mapSupabaseContractRow(inserted as Record<string, unknown>);
      });
    }
    await delay(400);
    await ensureMkMock();
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
    (careRequests!).push(newReq);
    return newReq;
  },

  async publishCareRequest(id: string): Promise<CareContract> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const now = new Date().toISOString();
        const { data, error } = await sbData().from("care_contracts")
          .update({ status: "published", published_at: now, expires_at: new Date(Date.now() + MAX_EXPIRY_MS).toISOString() })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return mapSupabaseContractRow(data as Record<string, unknown>);
      });
    }
    await delay(300);
    await ensureMkMock();
    const req = (careRequests!).find((r) => r.id === id);
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
        const { data, error } = await sbData().from("care_contracts")
          .update({ status: "published", published_at: now, expires_at: new Date(Date.now() + MAX_EXPIRY_MS).toISOString(), bid_count: 0 })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return mapSupabaseContractRow(data as Record<string, unknown>);
      });
    }
    await delay(400);
    await ensureMkMock();
    const req = (careRequests!).find((r) => r.id === id);
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
      return sbRead(`marketplace:agency-packages:${dataCacheScope()}`, async () => {
        let q = sbData().from("care_contracts").select("*").eq("type", "offer").eq("status", "published");
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
    await ensureMkMock();
    let results = [...(agencyPackages!)];
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
      if (isMockStylePackageId(id)) return null;
      return sbRead(`marketplace:agency-package:${dataCacheScope()}:${id}`, async () => {
        const { data, error } = await sbData().from("care_contracts").select("*").eq("id", id).eq("type", "offer").single();
        if (error) {
          if ((error as any).code === "PGRST116") return null;
          throw error;
        }
        return data ? mapSupabasePackageRow(data as Record<string, unknown>) : null;
      });
    }
    await delay();
    await ensureMkMock();
    return (agencyPackages!).find((p) => p.id === id) || null;
  },

  async getMyPackages(agencyId: string): Promise<AgencyPackage[]> {
    if (USE_SUPABASE) {
      return sbRead(`marketplace:my-packages:${dataCacheScope()}:${agencyId}`, async () => {
        const { data, error } = await sbData().from("care_contracts").select("*").eq("agency_id", agencyId).eq("type", "offer").order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map(mapSupabasePackageRow);
      });
    }
    await delay();
    await ensureMkMock();
    return (agencyPackages!).filter((p) => p.agency_id === agencyId);
  },

  async createAgencyPackage(data: Partial<AgencyPackage>): Promise<AgencyPackage> {
    assertUCCFOffer(data);
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const ownerId = await currentUserId();
        const now = new Date().toISOString();
        const agencyId =
          data.agency_id && !String(data.agency_id).endsWith("-current")
            ? String(data.agency_id)
            : ownerId;
        const payload = careContractToSupabaseRow(data, {
          kind: "offer",
          ownerId,
          createdAtIso: now,
          status: "draft",
          bidCount: 0,
          agency: {
            id: agencyId,
            name: data.agency_name ?? data.party?.name ?? "",
            rating: data.agency_rating,
            verified: data.agency_verified,
            subscribers: data.subscribers,
            featured: data.featured,
          },
        });
        const { data: inserted, error } = await sbData().from("care_contracts")
          .insert(withDemoExpiry(payload as unknown as Record<string, unknown>) as typeof payload)
          .select()
          .single();
        if (error) throw error;
        return mapSupabasePackageRow(inserted as Record<string, unknown>);
      });
    }
    await delay(400);
    await ensureMkMock();
    const incoming = data as AgencyPackage;
    const pkg: AgencyPackage = {
      ...incoming,
      id: `pkg-${Date.now()}`,
      status: "draft",
      created_at: new Date().toISOString(),
      agency_id: incoming.agency_id || "agency-current",
    };
    (agencyPackages!).push(pkg);
    return pkg;
  },

  async publishPackage(id: string): Promise<AgencyPackage> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const now = new Date().toISOString();
        const { data, error } = await sbData().from("care_contracts")
          .update({ status: "published", published_at: now })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return mapSupabasePackageRow(data as Record<string, unknown>);
      });
    }
    await delay(300);
    await ensureMkMock();
    const pkg = (agencyPackages!).find((p) => p.id === id);
    if (pkg) {
      pkg.status = "published";
      pkg.published_at = new Date().toISOString();
    }
    return pkg!;
  },

  // ─── Bids ───
  async getBidsForRequest(requestId: string): Promise<CareContractBid[]> {
    if (USE_SUPABASE) {
      return sbRead(`marketplace:bids:${dataCacheScope()}:${requestId}`, async () => {
        const { data, error } = await sbData().from("care_contract_bids").select("*").eq("contract_id", requestId).order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map(mapSupabaseBidRow);
      });
    }
    await delay();
    await ensureMkMock();
    const requestBids = (bids ?? []).filter((b) => b.contract_id === requestId);
    // Enforce expiry on access
    requestBids.forEach(enforceBidExpiry);
    return requestBids;
  },

  async getBidById(bidId: string): Promise<CareContractBid | null> {
    if (USE_SUPABASE) {
      return sbRead(`marketplace:bid:${dataCacheScope()}:${bidId}`, async () => {
        const { data, error } = await sbData().from("care_contract_bids").select("*").eq("id", bidId).single();
        if (error) {
          if ((error as any).code === "PGRST116") return null;
          throw error;
        }
        return data ? mapSupabaseBidRow(data as Record<string, unknown>) : null;
      });
    }
    await delay();
    await ensureMkMock();
    const bid = (bids ?? []).find((b) => b.id === bidId);
    if (bid) enforceBidExpiry(bid);
    return bid || null;
  },

  async getMyBids(agencyId: string): Promise<CareContractBid[]> {
    if (USE_SUPABASE) {
      return sbRead(`marketplace:my-bids:${dataCacheScope()}:${agencyId}`, async () => {
        let aid = agencyId;
        if (agencyId === "agency-current") {
          aid = await currentUserId();
        }
        if (!aid) return [];
        const { data, error } = await sb()
          .from("care_contract_bids")
          .select("*")
          .eq("agency_id", aid)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map(mapSupabaseBidRow);
      });
    }
    await delay();
    await ensureMkMock();
    const agencyBids = (bids ?? []).filter((b) => b.agency_id === agencyId);
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
        const { data: inserted, error } = await sbData().from("care_contract_bids")
          .insert(withDemoExpiry(payload))
          .select()
          .single();
        if (error) throw error;
        return mapSupabaseBidRow(inserted as Record<string, unknown>);
      });
    }
    await delay(500);
    await ensureMkMock();
    const request = (careRequests!).find((r) => r.id === data.contract_id);
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
    (bids!).push(bid);

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
        const { data: bid, error: bidErr } = await sbData().from("care_contract_bids").select("*").eq("id", bidId).single();
        if (bidErr) throw bidErr;
        const bidRow = bid as Record<string, unknown>;
        const contractId = String(bidRow.contract_id ?? "");
        await sbData().from("care_contract_bids").update({ status: "rejected" }).eq("contract_id", contractId).neq("id", bidId);
        await sbData().from("care_contract_bids").update({ status: "accepted" }).eq("id", bidId);
        await sbData().from("care_contracts").update({ status: "locked" }).eq("id", contractId);
        const { data: updated, error: updateErr } = await sbData().from("care_contract_bids").select("*").eq("id", bidId).single();
        if (updateErr) throw updateErr;
        return mapSupabaseBidRow(updated as Record<string, unknown>);
      });
    }
    await delay(300);
    await ensureMkMock();
    const bid = (bids ?? []).find((b) => b.id === bidId);
    if (bid) {
      bid.status = "accepted";
      // Reject other bids for same request
      (bids ?? []).filter((b) => b.contract_id === bid.contract_id && b.id !== bidId)
        .forEach((b) => { b.status = "rejected"; });
      // Lock contract
      const req = (careRequests!).find((r) => r.id === bid.contract_id);
      if (req) req.status = "locked";
    }
    return bid!;
  },

  async rejectBid(bidId: string): Promise<CareContractBid> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const { data, error } = await sbData().from("care_contract_bids").update({ status: "rejected" }).eq("id", bidId).select().single();
        if (error) throw error;
        return mapSupabaseBidRow(data as Record<string, unknown>);
      });
    }
    await delay(200);
    await ensureMkMock();
    const bid = (bids ?? []).find((b) => b.id === bidId);
    if (bid) bid.status = "rejected";
    return bid!;
  },

  async withdrawBid(bidId: string): Promise<CareContractBid> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const { data: bid, error: fetchErr } = await sbData().from("care_contract_bids").select("*").eq("id", bidId).single();
        if (fetchErr) throw fetchErr;
        const status = (bid as Record<string, unknown>).status as string;
        if (status !== "pending" && status !== "countered") {
          throw new Error("Only pending or countered bids can be withdrawn");
        }
        const { data, error } = await sbData().from("care_contract_bids").update({ status: "withdrawn" }).eq("id", bidId).select().single();
        if (error) throw error;
        return mapSupabaseBidRow(data as Record<string, unknown>);
      });
    }
    await delay(200);
    await ensureMkMock();
    const bid = (bids ?? []).find((b) => b.id === bidId);
    if (!bid) throw new Error("Bid not found");
    if (bid.status !== "pending" && bid.status !== "countered") {
      throw new Error("Only pending or countered bids can be withdrawn");
    }
    bid.status = "withdrawn";
    // Decrement bid count on the parent request
    const req = (careRequests!).find((r) => r.id === bid.contract_id);
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
        const { data, error } = await sbData().from("care_contract_bids")
          .update({ status: "countered", counter_offer: counterOffer })
          .eq("id", bidId)
          .select()
          .single();
        if (error) throw error;
        return mapSupabaseBidRow(data as Record<string, unknown>);
      });
    }
    await delay(300);
    await ensureMkMock();
    const bid = (bids ?? []).find((b) => b.id === bidId);
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
        const { data: bid, error: fetchErr } = await sbData().from("care_contract_bids").select("*").eq("id", bidId).single();
        if (fetchErr) throw new Error("Bid not found");
        const bidRow = bid as Record<string, unknown>;
        const contractId = String(bidRow.contract_id ?? "");

        if (action === "accept") {
          await sbData().from("care_contract_bids").update({ status: "accepted" }).eq("id", bidId);
          await sbData().from("care_contract_bids").update({ status: "rejected" }).eq("contract_id", contractId).neq("id", bidId);
          await sbData().from("care_contracts").update({ status: "locked" }).eq("id", contractId);
        } else if (action === "reject") {
          await sbData().from("care_contract_bids").update({ status: "withdrawn" }).eq("id", bidId);
        } else if (action === "counter") {
          const counterOffer = JSON.stringify({
            from: "agency",
            message: data?.message || "",
            pricing: data?.pricing,
            created_at: new Date().toISOString(),
          });
          await sbData().from("care_contract_bids").update({ status: "countered", counter_offer: counterOffer }).eq("id", bidId);
        }

        const { data: updated, error } = await sbData().from("care_contract_bids").select("*").eq("id", bidId).single();
        if (error) throw error;
        return mapSupabaseBidRow(updated as Record<string, unknown>);
      });
    }
    await delay(300);
    await ensureMkMock();
    const bid = (bids ?? []).find((b) => b.id === bidId);
    if (!bid) throw new Error("Bid not found");

    if (action === "accept") {
      // Agency accepts the patient's counter — use patient's pricing
      bid.status = "accepted";
      if (bid.counter_offer?.pricing) {
        bid.proposed_pricing = bid.counter_offer.pricing;
      }
      // Reject other bids for same request
      (bids!)
        .filter((b) => b.contract_id === bid.contract_id && b.id !== bidId)
        .forEach((b) => { b.status = "rejected"; });
      // Lock the contract
      const req = (careRequests!).find((r) => r.id === bid.contract_id);
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
    _patientId?: string,
    party?: { name: string; phone?: string }
  ): Promise<CareContract> {
    if (USE_SUPABASE) {
      if (isMockStylePackageId(packageId)) throw new Error("Package not found");
      return sbWrite(async () => {
        const { data: pkg, error: pkgErr } = await sbData().from("care_contracts").select("*").eq("id", packageId).eq("type", "offer").single();
        if (pkgErr) throw new Error("Package not found");
        const pkgRow = pkg as Record<string, unknown>;
        const now = new Date().toISOString();
        const fallback = getSubscriptionDefaultParty();
        const partyName = party?.name?.trim() || fallback.name;
        const partyPhone = party?.phone?.trim() || fallback.phone;
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
          party_name: partyName,
          party_phone: partyPhone,
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
        const { data: inserted, error } = await sbData().from("care_contracts").insert(withDemoExpiry(payload)).select().single();
        if (error) throw error;
        // Increment subscribers
        const subs = ((pkgRow.subscribers as number) ?? 0) + 1;
        await sbData().from("care_contracts").update({ subscribers: subs }).eq("id", packageId);
        return mapSupabaseContractRow(inserted as Record<string, unknown>);
      });
    }
    await delay(500);
    await ensureMkMock();
    const pkg = (agencyPackages!).find((p) => p.id === packageId);
    if (!pkg) throw new Error("Package not found");

    const fallback = getSubscriptionDefaultParty();
    const partyName = party?.name?.trim() || fallback.name;
    const partyPhone = party?.phone?.trim() || fallback.phone;
    const contract: CareContract = {
      id: `contract-${Date.now()}`,
      meta: { ...pkg.meta, type: "request" },
      party: {
        role: "patient",
        name: partyName,
        contact_phone: partyPhone,
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

    (careRequests!).push(contract);

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

  /**
   * Mark an active care engagement complete (guardian or agency). Creates a final invoice when using Supabase.
   */
  async markCareContractCompleted(contractId: string): Promise<void> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const userId = await currentUserId();
        const { data: row, error } = await sbData().from("care_contracts").select("*").eq("id", contractId).maybeSingle();
        if (error) throw error;
        if (!row) throw new Error("Contract not found");
        const ownerId = row.owner_id as string;
        const agId = row.agency_id as string | null;
        if (userId !== ownerId && userId !== agId) throw new Error("Not authorized");
        const st = row.status as LifecycleState;
        assertTransition(st, "completed");
        const { error: upErr } = await sbData().from("care_contracts").update({ status: "completed" }).eq("id", contractId);
        if (upErr) throw upErr;
        await billingService.ensureInvoiceForCompletedCareContract(contractId);
      });
    }
    await delay(300);
    await ensureMkMock();
    const req = (careRequests!).find((r) => r.id === contractId);
    if (req) {
      assertTransition(req.status as LifecycleState, "completed");
      req.status = "completed";
    }
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

  /** Published agency offers (packages) — exact count for dashboards. */
  async countPublishedOffers(): Promise<number> {
    if (!USE_SUPABASE) {
      await ensureMkMock();
      return (agencyPackages ?? []).filter((p) => p.status === "published").length;
    }
    return sbRead(`marketplace:count-offers:${dataCacheScope()}`, async () => {
      const { count, error } = await sbData()
        .from("care_contracts")
        .select("*", { count: "exact", head: true })
        .eq("type", "offer")
        .eq("status", "published");
      if (error) throw error;
      return count ?? 0;
    });
  },

  /** Guardian: active requirements they still have on the board (published → locked). */
  async countMyActiveRequirements(): Promise<number> {
    if (!USE_SUPABASE) {
      await ensureMkMock();
      return (careRequests ?? []).filter(
        (r) =>
          r.meta?.type === "request" &&
          ["published", "bidding", "matched", "locked"].includes(r.status),
      ).length;
    }
    const uid = await currentUserId();
    return sbRead(`marketplace:count-my-req:${dataCacheScope()}:${uid}`, async () => {
      const { count, error } = await sbData()
        .from("care_contracts")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", uid)
        .eq("type", "request")
        .in("status", ["published", "bidding", "matched", "locked"]);
      if (error) throw error;
      return count ?? 0;
    });
  },

  /** Agency board: open guardian requirements agencies can bid on. */
  async countOpenBoardRequirements(): Promise<number> {
    if (!USE_SUPABASE) {
      await ensureMkMock();
      return (await this.getCareRequests()).length;
    }
    return sbRead(`marketplace:count-board-req:${dataCacheScope()}`, async () => {
      const { count, error } = await sbData()
        .from("care_contracts")
        .select("*", { count: "exact", head: true })
        .eq("type", "request")
        .in("status", ["published", "bidding", "matched"]);
      if (error) throw error;
      return count ?? 0;
    });
  },

  /** Current user: UCCF contracts at booked+ (marketplace + engagement outcomes). */
  async listMyUccfContractsBookedPlus(): Promise<UccfContractListRow[]> {
    if (!USE_SUPABASE) {
      return [];
    }
    const uid = await currentUserId();
    return sbRead(`marketplace:uccf-contracts-me:${dataCacheScope()}:${uid}`, async () => {
      const { data, error } = await sbData()
        .from("care_contracts")
        .select(
          "id, title, status, type, source_type, contract_party_scope, gac_kind, staffing_channel, financial_status, updated_at",
        )
        .in("status", ["booked", "active", "completed", "rated"])
        .or(`owner_id.eq.${uid},agency_id.eq.${uid}`)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((r) => {
        const row = r as Record<string, unknown>;
        return {
          id: String(row.id),
          title: String(row.title ?? ""),
          status: String(row.status ?? ""),
          type: String(row.type ?? ""),
          source_type: row.source_type != null ? String(row.source_type) : null,
          contract_party_scope: row.contract_party_scope != null ? String(row.contract_party_scope) : null,
          gac_kind: row.gac_kind != null ? String(row.gac_kind) : null,
          staffing_channel: row.staffing_channel != null ? String(row.staffing_channel) : null,
          financial_status: row.financial_status != null ? String(row.financial_status) : null,
          updated_at: String(row.updated_at ?? ""),
        };
      });
    });
  },
};