/**
 * CareNet Contract Service
 * ────────────────────────
 * Provides contract and negotiation CRUD operations.
 * When USE_SUPABASE is false, returns mock data.
 * When true, calls Supabase.
 */

import { USE_SUPABASE, getSupabaseClient } from "./supabase";
import { MOCK_CONTRACTS } from "@/backend/utils/contracts";
import type { CareContract, NegotiationOffer, ContractStatus, ContractType } from "@/backend/utils/contracts";
import type { ContractDispute, DisputeMessage } from "@/backend/models";
import { MOCK_CONTRACT_DISPUTES } from "@/backend/api/mock";
import { withRetry } from "@/backend/utils/retry";
import { dedup } from "@/backend/utils/dedup";

// Retry config
const READ_RETRY = { maxRetries: 3, baseDelayMs: 800, onRetry: (_e: unknown, a: number, d: number) => console.log(`[Contract] Retry #${a} in ${d}ms`) };
const WRITE_RETRY = { maxRetries: 2, baseDelayMs: 500 };

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

// ─── Get contracts for current user ───
export async function getMyContracts(
  role: string,
  opts?: { status?: ContractStatus; type?: ContractType }
): Promise<CareContract[]> {
  if (!shouldUseSupabase()) {
    let contracts = MOCK_CONTRACTS;
    if (role === "guardian") contracts = contracts.filter((c) => c.type === "guardian_agency");
    if (role === "caregiver") contracts = contracts.filter((c) => c.type === "agency_caregiver");
    if (opts?.status) contracts = contracts.filter((c) => c.status === opts.status);
    if (opts?.type) contracts = contracts.filter((c) => c.type === opts.type);
    return contracts;
  }

  const dedupKey = `contracts:${role}:${opts?.status || "all"}:${opts?.type || "all"}`;
  return dedup(dedupKey, () => withRetry(async () => {
    const sb = getSupabaseClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return [];

    let query = sb.from("contracts")
      .select("*, contract_offers(*)")
      .or(`party_a_id.eq.${user.id},party_b_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (opts?.status) query = query.eq("status", opts.status);
    if (opts?.type) query = query.eq("type", opts.type);

    return new Promise<CareContract[]>((resolve, reject) => {
      query.then((result) => {
        if (result.error) return reject(result.error);
        if (!result.data) return resolve([]);
        resolve(result.data.map(mapContractFromDB));
      });
    });
  }, READ_RETRY));
}

// ─── Get single contract by ID ───
export async function getContract(id: string): Promise<CareContract | null> {
  if (!shouldUseSupabase()) {
    return MOCK_CONTRACTS.find((c) => c.id === id) || null;
  }

  return dedup(`contract:${id}`, () => withRetry(async () => {
    const sb = getSupabaseClient();
    const { data, error } = await sb.from("contracts")
      .select("*, contract_offers(*)")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) return null;
    return mapContractFromDB(data as Record<string, unknown>);
  }, READ_RETRY));
}

// ─── Create a new contract (draft) ───
export async function createContract(params: {
  type: ContractType;
  partyAId: string;
  partyAName: string;
  partyARole: "guardian" | "agency";
  partyBId: string;
  partyBName: string;
  partyBRole: "agency" | "caregiver";
  patientName?: string;
  serviceType: string;
  description: string;
  listedPrice: number;
  durationDays: number;
  startDate: string;
  endDate: string;
}): Promise<{ success: boolean; contractId?: string; error?: string }> {
  if (!shouldUseSupabase()) {
    console.log("[Mock] Creating contract:", params);
    return { success: true, contractId: `CTR-2026-${Math.floor(Math.random() * 9999).toString().padStart(4, "0")}` };
  }

  return withRetry(async () => {
    const sb = getSupabaseClient();
    const { data, error } = await sb.from("contracts")
      .insert({
        type: params.type,
        status: "draft",
        party_a_id: params.partyAId,
        party_a_name: params.partyAName,
        party_a_role: params.partyARole,
        party_b_id: params.partyBId,
        party_b_name: params.partyBName,
        party_b_role: params.partyBRole,
        patient_name: params.patientName,
        service_type: params.serviceType,
        description: params.description,
        listed_price: params.listedPrice,
        duration_days: params.durationDays,
        start_date: params.startDate,
        end_date: params.endDate,
      })
      .select("id")
      .single();

    if (error) return { success: false, error: (error as { message: string }).message };
    return { success: true, contractId: (data as { id: string }).id };
  }, WRITE_RETRY);
}

// ─── Submit a negotiation offer ───
export async function submitOffer(params: {
  contractId: string;
  pointsPerDay: number;
  durationDays: number;
  message: string;
}): Promise<{ success: boolean; offerId?: string; error?: string }> {
  if (!shouldUseSupabase()) {
    console.log("[Mock] Submitting offer:", params);
    return { success: true, offerId: `OFF-${Math.floor(Math.random() * 999).toString().padStart(3, "0")}` };
  }

  return withRetry(async () => {
    const sb = getSupabaseClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const totalPoints = params.pointsPerDay * params.durationDays;

    const { data, error } = await sb.from("contract_offers")
      .insert({
        contract_id: params.contractId,
        offered_by: user.id,
        offered_by_name: "",
        offered_by_role: "",
        points_per_day: params.pointsPerDay,
        total_points: totalPoints,
        duration_days: params.durationDays,
        message: params.message,
        status: "pending",
      })
      .select("id")
      .single();

    await sb.from("contracts")
      .update({ status: "negotiating" })
      .eq("id", params.contractId);

    if (error) return { success: false, error: (error as { message: string }).message };
    return { success: true, offerId: (data as { id: string }).id };
  }, WRITE_RETRY);
}

// ─── Accept an offer ───
export async function acceptOffer(
  offerId: string,
  responseMessage: string = ""
): Promise<{ success: boolean; error?: string }> {
  if (!shouldUseSupabase()) {
    console.log(`[Mock] Accepting offer ${offerId}: ${responseMessage}`);
    return { success: true };
  }

  return withRetry(async () => {
    const sb = getSupabaseClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { error } = await sb.rpc("accept_contract_offer", {
      p_offer_id: offerId,
      p_accepted_by: user.id,
      p_response_message: responseMessage,
    });

    if (error) return { success: false, error: (error as { message: string }).message };
    return { success: true };
  }, WRITE_RETRY);
}

// ─── Reject an offer ───
export async function rejectOffer(
  offerId: string,
  responseMessage: string = ""
): Promise<{ success: boolean; error?: string }> {
  if (!shouldUseSupabase()) {
    console.log(`[Mock] Rejecting offer ${offerId}: ${responseMessage}`);
    return { success: true };
  }

  return withRetry(async () => {
    const sb = getSupabaseClient();
    const { error } = await sb.from("contract_offers")
      .update({
        status: "rejected",
        responded_at: new Date().toISOString(),
        response_message: responseMessage,
      })
      .eq("id", offerId)
      .single();

    if (error) return { success: false, error: (error as { message: string }).message };
    return { success: true };
  }, WRITE_RETRY);
}

// ─── Admin: Get all contracts ───
export async function getAllContracts(
  opts?: { status?: ContractStatus; type?: ContractType; search?: string }
): Promise<CareContract[]> {
  if (!shouldUseSupabase()) {
    let contracts = [...MOCK_CONTRACTS];
    if (opts?.status) contracts = contracts.filter((c) => c.status === opts.status);
    if (opts?.type) contracts = contracts.filter((c) => c.type === opts.type);
    if (opts?.search) {
      const s = opts.search.toLowerCase();
      contracts = contracts.filter((c) =>
        c.id.toLowerCase().includes(s) ||
        c.partyA.name.toLowerCase().includes(s) ||
        c.partyB.name.toLowerCase().includes(s) ||
        (c.patientName || "").toLowerCase().includes(s)
      );
    }
    return contracts;
  }

  const dedupKey = `admin-contracts:${opts?.status || "all"}:${opts?.type || "all"}:${opts?.search || ""}`;
  return dedup(dedupKey, () => withRetry(async () => {
    const sb = getSupabaseClient();
    let query = sb.from("contracts")
      .select("*, contract_offers(*)")
      .order("created_at", { ascending: false });

    if (opts?.status) query = query.eq("status", opts.status);
    if (opts?.type) query = query.eq("type", opts.type);
    if (opts?.search) {
      query = query.or(
        `contract_number.ilike.%${opts.search}%,party_a_name.ilike.%${opts.search}%,party_b_name.ilike.%${opts.search}%,patient_name.ilike.%${opts.search}%`
      );
    }

    return new Promise<CareContract[]>((resolve, reject) => {
      query.then((result) => {
        if (result.error) return reject(result.error);
        if (!result.data) return resolve([]);
        resolve(result.data.map(mapContractFromDB));
      });
    });
  }, READ_RETRY));
}

// ─── Get disputes for a contract ───
export async function getContractDisputes(contractId: string): Promise<ContractDispute[]> {
  if (!shouldUseSupabase()) {
    return MOCK_CONTRACT_DISPUTES.filter((d) => d.contractId === contractId);
  }
  return dedup(`disputes:${contractId}`, () => withRetry(async () => {
    const sb = getSupabaseClient();
    const { data, error } = await sb.from("contract_disputes")
      .select("*, dispute_messages(*)")
      .eq("contract_id", contractId)
      .order("filed_at", { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as ContractDispute[];
  }, READ_RETRY));
}

// ─── Get single dispute by ID ───
export async function getDispute(id: string): Promise<ContractDispute | null> {
  if (!shouldUseSupabase()) {
    return MOCK_CONTRACT_DISPUTES.find((d) => d.id === id) || null;
  }
  return dedup(`dispute:${id}`, () => withRetry(async () => {
    const sb = getSupabaseClient();
    const { data, error } = await sb.from("contract_disputes")
      .select("*, dispute_messages(*)")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data as unknown as ContractDispute;
  }, READ_RETRY));
}

// ─── Get all disputes (for listing) ───
export async function getAllDisputes(): Promise<ContractDispute[]> {
  if (!shouldUseSupabase()) {
    return MOCK_CONTRACT_DISPUTES;
  }
  return dedup("disputes:all", () => withRetry(async () => {
    const sb = getSupabaseClient();
    const { data, error } = await sb.from("contract_disputes")
      .select("*, dispute_messages(*)")
      .order("filed_at", { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as ContractDispute[];
  }, READ_RETRY));
}

// ─── DB -> App model mapper ───
function mapContractFromDB(d: Record<string, unknown>): CareContract {
  const offers = (d.contract_offers as Record<string, unknown>[] || []).map((o) => ({
    id: o.id as string,
    contractId: o.contract_id as string,
    offeredBy: o.offered_by as string,
    offeredByName: o.offered_by_name as string,
    offeredByRole: o.offered_by_role as NegotiationOffer["offeredByRole"],
    pointsPerDay: o.points_per_day as number,
    totalPoints: o.total_points as number,
    durationDays: o.duration_days as number,
    message: o.message as string,
    status: o.status as NegotiationOffer["status"],
    createdAt: o.created_at as string,
    respondedAt: o.responded_at as string | undefined,
    responseMessage: o.response_message as string | undefined,
  }));

  return {
    id: (d.contract_number || d.id) as string,
    type: d.type as CareContract["type"],
    status: d.status as CareContract["status"],
    partyA: {
      id: d.party_a_id as string,
      name: d.party_a_name as string,
      role: d.party_a_role as "guardian" | "agency",
    },
    partyB: {
      id: d.party_b_id as string,
      name: d.party_b_name as string,
      role: d.party_b_role as "agency" | "caregiver",
    },
    patientName: d.patient_name as string | undefined,
    serviceType: d.service_type as string,
    description: d.description as string,
    listedPrice: d.listed_price as number,
    agreedPrice: d.agreed_price as number,
    durationDays: d.duration_days as number,
    totalValue: d.total_value as number,
    partyAFeePercent: d.party_a_fee_pct as number,
    partyBFeePercent: d.party_b_fee_pct as number,
    partyAFee: d.party_a_fee as number,
    partyBFee: d.party_b_fee as number,
    platformRevenue: d.platform_revenue as number,
    startDate: d.start_date as string,
    endDate: d.end_date as string,
    createdAt: d.created_at as string,
    acceptedAt: d.accepted_at as string | undefined,
    offers,
    currentOffer: offers.find((o) => o.status === "pending"),
  };
}

