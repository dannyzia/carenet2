/**
 * Package procurement (client↔agency) and staffing (caregiver↔agency) engagements.
 */
import type {
  PackageCaregiverEngagement,
  PackageCaregiverEngagementEvent,
  PackageClientEngagement,
  PackageClientEngagementEvent,
  PackageEngagementEventKind,
  PackageEngagementEventPayload,
} from "@/backend/models/packageEngagement.model";
import { loadMockBarrel } from "@/backend/api/mock/loadMockBarrel";
import {
  USE_SUPABASE,
  sbRead,
  sbWrite,
  sbData,
  currentUserId,
  useInAppMockDataset,
  dataCacheScope,
  withDemoExpiry,
} from "./_sb";
import { agentDebugLog } from "@/debug/agentDebugLog";
import { isMissingRestRelation } from "@/backend/utils/supabasePostgrestErrors";

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

async function mockDelay() {
  await delay();
}

function mapClientRow(r: Record<string, unknown>): PackageClientEngagement {
  return {
    id: String(r.id),
    package_contract_id: String(r.package_contract_id),
    client_user_id: String(r.client_user_id),
    agency_user_id: String(r.agency_user_id),
    status: r.status as PackageClientEngagement["status"],
    contract_id: r.contract_id != null ? String(r.contract_id) : null,
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  };
}

function mapClientEventRow(r: Record<string, unknown>): PackageClientEngagementEvent {
  return {
    id: String(r.id),
    engagement_id: String(r.engagement_id),
    author_user_id: String(r.author_user_id),
    author_role: r.author_role as PackageClientEngagementEvent["author_role"],
    event_kind: r.event_kind as PackageClientEngagementEvent["event_kind"],
    payload: (r.payload as PackageEngagementEventPayload) || {},
    created_at: String(r.created_at),
  };
}

function mapCgRow(r: Record<string, unknown>): PackageCaregiverEngagement {
  return {
    id: String(r.id),
    package_contract_id: String(r.package_contract_id),
    caregiver_user_id: String(r.caregiver_user_id),
    agency_user_id: String(r.agency_user_id),
    status: r.status as PackageCaregiverEngagement["status"],
    contract_id: r.contract_id != null ? String(r.contract_id) : null,
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  };
}

function mapCgEventRow(r: Record<string, unknown>): PackageCaregiverEngagementEvent {
  return {
    id: String(r.id),
    engagement_id: String(r.engagement_id),
    author_user_id: String(r.author_user_id),
    author_role: r.author_role as PackageCaregiverEngagementEvent["author_role"],
    event_kind: r.event_kind as PackageCaregiverEngagementEvent["event_kind"],
    payload: (r.payload as PackageEngagementEventPayload) || {},
    created_at: String(r.created_at),
  };
}

async function agencyUserIdForPackage(packageId: string): Promise<string> {
  const { data, error } = await sbData()
    .from("care_contracts")
    .select("agency_id, owner_id, type, status")
    .eq("id", packageId)
    .single();
  if (error || !data) throw new Error("Package not found");
  const row = data as { agency_id?: string | null; owner_id?: string; type?: string; status?: string };
  if (row.type !== "offer" || row.status !== "published") {
    throw new Error("Package not available");
  }
  const aid = row.agency_id ?? row.owner_id;
  if (!aid) throw new Error("Package has no agency");
  return String(aid);
}

export const packageEngagementService = {
  async listClientEngagementsForMe(): Promise<PackageClientEngagement[]> {
    if (USE_SUPABASE) {
      return sbRead(`pkgEng:client:me:${dataCacheScope()}`, async () => {
        const uid = await currentUserId();
        const { data, error } = await sbData()
          .from("package_client_engagements")
          .select("*")
          .eq("client_user_id", uid)
          .order("updated_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((r) => mapClientRow(r as Record<string, unknown>));
      });
    }
    if (!useInAppMockDataset()) return [];
    await mockDelay();
    const m = await loadMockBarrel();
    const uid = await currentUserId().catch(() => "demo-guardian");
    return m.MOCK_PACKAGE_CLIENT_ENGAGEMENTS.filter((e) => e.client_user_id === uid);
  },

  async listCaregiverEngagementsForMe(): Promise<PackageCaregiverEngagement[]> {
    if (USE_SUPABASE) {
      return sbRead(`pkgEng:cg:me:${dataCacheScope()}`, async () => {
        const uid = await currentUserId();
        const { data, error } = await sbData()
          .from("package_caregiver_engagements")
          .select("*")
          .eq("caregiver_user_id", uid)
          .order("updated_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((r) => mapCgRow(r as Record<string, unknown>));
      });
    }
    if (!useInAppMockDataset()) return [];
    await mockDelay();
    const m = await loadMockBarrel();
    const uid = await currentUserId().catch(() => "demo-caregiver");
    return m.MOCK_PACKAGE_CAREGIVER_ENGAGEMENTS.filter((e) => e.caregiver_user_id === uid);
  },

  async getClientEngagementForPackage(packageId: string): Promise<PackageClientEngagement | null> {
    if (USE_SUPABASE) {
      const uid = await currentUserId();
      const { data, error } = await sbData()
        .from("package_client_engagements")
        .select("*")
        .eq("package_contract_id", packageId)
        .eq("client_user_id", uid)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ? mapClientRow(data as Record<string, unknown>) : null;
    }
    if (!useInAppMockDataset()) return null;
    await mockDelay();
    const m = await loadMockBarrel();
    const uid = await currentUserId().catch(() => "demo-guardian");
    const hit = m.MOCK_PACKAGE_CLIENT_ENGAGEMENTS.find(
      (e) => e.package_contract_id === packageId && e.client_user_id === uid,
    );
    return hit ?? null;
  },

  async getCaregiverEngagementForPackage(packageId: string): Promise<PackageCaregiverEngagement | null> {
    if (USE_SUPABASE) {
      const uid = await currentUserId();
      const { data, error } = await sbData()
        .from("package_caregiver_engagements")
        .select("*")
        .eq("package_contract_id", packageId)
        .eq("caregiver_user_id", uid)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ? mapCgRow(data as Record<string, unknown>) : null;
    }
    if (!useInAppMockDataset()) return null;
    await mockDelay();
    const m = await loadMockBarrel();
    const uid = await currentUserId().catch(() => "demo-caregiver");
    const hit = m.MOCK_PACKAGE_CAREGIVER_ENGAGEMENTS.find(
      (e) => e.package_contract_id === packageId && e.caregiver_user_id === uid,
    );
    return hit ?? null;
  },

  async listClientEngagementEvents(engagementId: string): Promise<PackageClientEngagementEvent[]> {
    if (USE_SUPABASE) {
      return sbRead(`pkgEng:client:ev:${engagementId}:${dataCacheScope()}`, async () => {
        const { data, error } = await sbData()
          .from("package_client_engagement_events")
          .select("*")
          .eq("engagement_id", engagementId)
          .order("created_at", { ascending: true });
        if (error) throw error;
        return (data || []).map((r) => mapClientEventRow(r as Record<string, unknown>));
      });
    }
    if (!useInAppMockDataset()) return [];
    await mockDelay();
    const m = await loadMockBarrel();
    return m.MOCK_PACKAGE_CLIENT_ENGAGEMENT_EVENTS.filter((e) => e.engagement_id === engagementId);
  },

  async listCaregiverEngagementEvents(engagementId: string): Promise<PackageCaregiverEngagementEvent[]> {
    if (USE_SUPABASE) {
      return sbRead(`pkgEng:cg:ev:${engagementId}:${dataCacheScope()}`, async () => {
        const { data, error } = await sbData()
          .from("package_caregiver_engagement_events")
          .select("*")
          .eq("engagement_id", engagementId)
          .order("created_at", { ascending: true });
        if (error) throw error;
        return (data || []).map((r) => mapCgEventRow(r as Record<string, unknown>));
      });
    }
    if (!useInAppMockDataset()) return [];
    await mockDelay();
    const m = await loadMockBarrel();
    return m.MOCK_PACKAGE_CAREGIVER_ENGAGEMENT_EVENTS.filter((e) => e.engagement_id === engagementId);
  },

  async createClientInterest(
    packageId: string,
    payload?: PackageEngagementEventPayload,
  ): Promise<PackageClientEngagement> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const uid = await currentUserId();
        const agencyId = await agencyUserIdForPackage(packageId);
        const row = withDemoExpiry({
          package_contract_id: packageId,
          client_user_id: uid,
          agency_user_id: agencyId,
          status: "interested",
        });
        const { data: ins, error } = await sbData()
          .from("package_client_engagements")
          .insert(row)
          .select()
          .single();
        if (error) throw error;
        const eng = mapClientRow(ins as Record<string, unknown>);
        await sbData().from("package_client_engagement_events").insert(
          withDemoExpiry({
            engagement_id: eng.id,
            author_user_id: uid,
            author_role: "client",
            event_kind: "created",
            payload: payload || {},
          }),
        );
        return eng;
      });
    }
    if (!useInAppMockDataset()) {
      throw new Error("[CareNet] Connect Supabase or use Demo Access for package interest.");
    }
    await mockDelay();
    const m = await loadMockBarrel();
    const uid = await currentUserId().catch(() => "demo-guardian");
    const pkg = m.MOCK_AGENCY_PACKAGES.find((p) => p.id === packageId);
    if (!pkg || pkg.status !== "published") throw new Error("Package not available");
    const now = new Date().toISOString();
    const eng: PackageClientEngagement = {
      id: `pce-${crypto.randomUUID().slice(0, 8)}`,
      package_contract_id: packageId,
      client_user_id: uid,
      agency_user_id: pkg.agency_id,
      status: "interested",
      created_at: now,
      updated_at: now,
    };
    m.MOCK_PACKAGE_CLIENT_ENGAGEMENTS.push(eng);
    m.MOCK_PACKAGE_CLIENT_ENGAGEMENT_EVENTS.push({
      id: `pcee-${crypto.randomUUID().slice(0, 8)}`,
      engagement_id: eng.id,
      author_user_id: uid,
      author_role: "client",
      event_kind: "created",
      payload: payload || {},
      created_at: now,
    });
    return eng;
  },

  async appendClientEngagementMessage(
    engagementId: string,
    eventKind: PackageEngagementEventKind,
    payload: PackageEngagementEventPayload,
    authorRole: "client" | "agency",
  ): Promise<void> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const uid = await currentUserId();
        await sbData()
          .from("package_client_engagement_events")
          .insert(
            withDemoExpiry({
              engagement_id: engagementId,
              author_user_id: uid,
              author_role: authorRole,
              event_kind: eventKind,
              payload,
            }),
          );
        const nextStatus =
          authorRole === "agency" && eventKind === "counter_offer"
            ? "negotiating"
            : authorRole === "client" && eventKind === "counter_offer"
              ? "negotiating"
              : undefined;
        if (nextStatus) {
          await sbData()
            .from("package_client_engagements")
            .update({ status: nextStatus, updated_at: new Date().toISOString() })
            .eq("id", engagementId);
        }
      });
    }
    if (!useInAppMockDataset()) {
      throw new Error("[CareNet] Connect Supabase or use Demo Access.");
    }
    await mockDelay();
    const m = await loadMockBarrel();
    const uid = await currentUserId().catch(() => "demo-user");
    const now = new Date().toISOString();
    m.MOCK_PACKAGE_CLIENT_ENGAGEMENT_EVENTS.push({
      id: `pcee-${crypto.randomUUID().slice(0, 8)}`,
      engagement_id: engagementId,
      author_user_id: uid,
      author_role: authorRole,
      event_kind: eventKind,
      payload,
      created_at: now,
    });
    const eng = m.MOCK_PACKAGE_CLIENT_ENGAGEMENTS.find((e) => e.id === engagementId);
    if (eng && eventKind === "counter_offer") {
      eng.status = "negotiating";
      eng.updated_at = now;
    }
  },

  async setClientEngagementStatus(
    engagementId: string,
    status: PackageClientEngagement["status"],
  ): Promise<void> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const { error } = await sbData().rpc("accept_client_engagement", {
          p_engagement_id: engagementId,
          p_new_status: status,
        });
        if (error) throw error;
      });
    }
    if (!useInAppMockDataset()) return;
    await mockDelay();
    const m = await loadMockBarrel();
    const eng = m.MOCK_PACKAGE_CLIENT_ENGAGEMENTS.find((e) => e.id === engagementId);
    if (eng) {
      eng.status = status;
      eng.updated_at = new Date().toISOString();
    }
  },

  async applyToPackage(
    packageId: string,
    payload?: PackageEngagementEventPayload,
  ): Promise<PackageCaregiverEngagement> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const uid = await currentUserId();
        const agencyId = await agencyUserIdForPackage(packageId);
        const row = withDemoExpiry({
          package_contract_id: packageId,
          caregiver_user_id: uid,
          agency_user_id: agencyId,
          status: "applied",
        });
        const { data: ins, error } = await sbData()
          .from("package_caregiver_engagements")
          .insert(row)
          .select()
          .single();
        if (error) throw error;
        const eng = mapCgRow(ins as Record<string, unknown>);
        await sbData().from("package_caregiver_engagement_events").insert(
          withDemoExpiry({
            engagement_id: eng.id,
            author_user_id: uid,
            author_role: "caregiver",
            event_kind: "created",
            payload: payload || {},
          }),
        );
        return eng;
      });
    }
    if (!useInAppMockDataset()) {
      throw new Error("[CareNet] Connect Supabase or use Demo Access to apply to packages.");
    }
    await mockDelay();
    const m = await loadMockBarrel();
    const uid = await currentUserId().catch(() => "demo-caregiver");
    const pkg = m.MOCK_AGENCY_PACKAGES.find((p) => p.id === packageId);
    if (!pkg || pkg.status !== "published") throw new Error("Package not available");
    const now = new Date().toISOString();
    const eng: PackageCaregiverEngagement = {
      id: `pcge-${crypto.randomUUID().slice(0, 8)}`,
      package_contract_id: packageId,
      caregiver_user_id: uid,
      agency_user_id: pkg.agency_id,
      status: "applied",
      created_at: now,
      updated_at: now,
    };
    m.MOCK_PACKAGE_CAREGIVER_ENGAGEMENTS.push(eng);
    m.MOCK_PACKAGE_CAREGIVER_ENGAGEMENT_EVENTS.push({
      id: `pcgee-${crypto.randomUUID().slice(0, 8)}`,
      engagement_id: eng.id,
      author_user_id: uid,
      author_role: "caregiver",
      event_kind: "created",
      payload: payload || {},
      created_at: now,
    });
    return eng;
  },

  async appendCaregiverEngagementMessage(
    engagementId: string,
    eventKind: PackageEngagementEventKind,
    payload: PackageEngagementEventPayload,
    authorRole: "caregiver" | "agency",
  ): Promise<void> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const uid = await currentUserId();
        await sbData()
          .from("package_caregiver_engagement_events")
          .insert(
            withDemoExpiry({
              engagement_id: engagementId,
              author_user_id: uid,
              author_role: authorRole,
              event_kind: eventKind,
              payload,
            }),
          );
        if (eventKind === "counter_offer") {
          await sbData()
            .from("package_caregiver_engagements")
            .update({ status: "negotiating", updated_at: new Date().toISOString() })
            .eq("id", engagementId);
        }
      });
    }
    if (!useInAppMockDataset()) {
      throw new Error("[CareNet] Connect Supabase or use Demo Access.");
    }
    await mockDelay();
    const m = await loadMockBarrel();
    const uid = await currentUserId().catch(() => "demo-user");
    const now = new Date().toISOString();
    m.MOCK_PACKAGE_CAREGIVER_ENGAGEMENT_EVENTS.push({
      id: `pcgee-${crypto.randomUUID().slice(0, 8)}`,
      engagement_id: engagementId,
      author_user_id: uid,
      author_role: authorRole,
      event_kind: eventKind,
      payload,
      created_at: now,
    });
    const eng = m.MOCK_PACKAGE_CAREGIVER_ENGAGEMENTS.find((e) => e.id === engagementId);
    if (eng && eventKind === "counter_offer") {
      eng.status = "negotiating";
      eng.updated_at = now;
    }
  },

  async setCaregiverEngagementStatus(
    engagementId: string,
    status: PackageCaregiverEngagement["status"],
  ): Promise<void> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const { error } = await sbData().rpc("accept_caregiver_engagement", {
          p_engagement_id: engagementId,
          p_new_status: status,
        });
        if (error) throw error;
      });
    }
    if (!useInAppMockDataset()) return;
    await mockDelay();
    const m = await loadMockBarrel();
    const eng = m.MOCK_PACKAGE_CAREGIVER_ENGAGEMENTS.find((e) => e.id === engagementId);
    if (eng) {
      eng.status = status;
      eng.updated_at = new Date().toISOString();
    }
  },

  /** Agency: all client leads (optionally filter by package) */
  async listAgencyClientEngagements(packageId?: string): Promise<PackageClientEngagement[]> {
    if (USE_SUPABASE) {
      return sbRead(`pkgEng:agency:client:${packageId ?? "all"}:${dataCacheScope()}`, async () => {
        const uid = await currentUserId();
        let q = sbData().from("package_client_engagements").select("*").eq("agency_user_id", uid);
        if (packageId) q = q.eq("package_contract_id", packageId);
        const { data, error } = await q.order("updated_at", { ascending: false });
        if (error) {
          // #region agent log
          agentDebugLog({
            hypothesisId: "H1",
            location: "packageEngagement.service.ts:listAgencyClientEngagements",
            message: "package_client_engagements query error",
            data: { code: error.code, message: error.message },
          });
          // #endregion
          if (isMissingRestRelation(error)) return [];
          throw error;
        }
        return (data || []).map((r) => mapClientRow(r as Record<string, unknown>));
      });
    }
    if (!useInAppMockDataset()) return [];
    await mockDelay();
    const m = await loadMockBarrel();
    const uid = await currentUserId().catch(() => "agency-001");
    return m.MOCK_PACKAGE_CLIENT_ENGAGEMENTS.filter(
      (e) => e.agency_user_id === uid && (!packageId || e.package_contract_id === packageId),
    );
  },

  /** Agency: all caregiver applications */
  async listAgencyCaregiverEngagements(packageId?: string): Promise<PackageCaregiverEngagement[]> {
    if (USE_SUPABASE) {
      return sbRead(`pkgEng:agency:cg:${packageId ?? "all"}:${dataCacheScope()}`, async () => {
        const uid = await currentUserId();
        let q = sbData().from("package_caregiver_engagements").select("*").eq("agency_user_id", uid);
        if (packageId) q = q.eq("package_contract_id", packageId);
        const { data, error } = await q.order("updated_at", { ascending: false });
        if (error) {
          // #region agent log
          agentDebugLog({
            hypothesisId: "H1",
            location: "packageEngagement.service.ts:listAgencyCaregiverEngagements",
            message: "package_caregiver_engagements query error",
            data: { code: error.code, message: error.message },
          });
          // #endregion
          if (isMissingRestRelation(error)) return [];
          throw error;
        }
        return (data || []).map((r) => mapCgRow(r as Record<string, unknown>));
      });
    }
    if (!useInAppMockDataset()) return [];
    await mockDelay();
    const m = await loadMockBarrel();
    const uid = await currentUserId().catch(() => "agency-001");
    return m.MOCK_PACKAGE_CAREGIVER_ENGAGEMENTS.filter(
      (e) => e.agency_user_id === uid && (!packageId || e.package_contract_id === packageId),
    );
  },
};
