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
    applicants: d.applicants as number | undefined,
    status: d.status as string | undefined,
    description: (d.description as string) ?? undefined,
    experience: (d.experience as string) ?? "",
    skills,
    agency,
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
    await delay();
    return careRequests.find((r) => r.id === id) || null;
  },

  /**
   * Get ALL of a guardian's requests (including taken/expired).
   * Guardian can see everything they posted — for re-posting or reference.
   */
  async getMyRequests(userId: string): Promise<CareContract[]> {
    await delay();
    // Enforce expiry but still return all
    careRequests.forEach(enforceExpiry);
    return careRequests.filter((r) => r.meta.type === "request");
  },

  async createCareRequest(data: Partial<CareContract>): Promise<CareContract> {
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
    await delay();
    return agencyPackages.find((p) => p.id === id) || null;
  },

  async getMyPackages(agencyId: string): Promise<AgencyPackage[]> {
    await delay();
    return agencyPackages.filter((p) => p.agency_id === agencyId);
  },

  async createAgencyPackage(data: Partial<AgencyPackage>): Promise<AgencyPackage> {
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
    await delay();
    const requestBids = bids.filter((b) => b.contract_id === requestId);
    // Enforce expiry on access
    requestBids.forEach(enforceBidExpiry);
    return requestBids;
  },

  async getBidById(bidId: string): Promise<CareContractBid | null> {
    await delay();
    const bid = bids.find((b) => b.id === bidId);
    if (bid) enforceBidExpiry(bid);
    return bid || null;
  },

  async getMyBids(agencyId: string): Promise<CareContractBid[]> {
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
    await delay(200);
    const bid = bids.find((b) => b.id === bidId);
    if (bid) bid.status = "rejected";
    return bid!;
  },

  async withdrawBid(bidId: string): Promise<CareContractBid> {
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