/**
 * Billing Service — manual payment verification flow
 *
 * Flow: Payer submits proof → Receiver verifies → Status updates
 */
import type {
  BillingOverviewData,
  BillingInvoice,
  PaymentProof,
  BillingLineItem,
} from "@/backend/models";
import { loadMockBarrel } from "@/backend/api/mock/loadMockBarrel";
import { notificationService } from "./notification.service";
import { getSupabaseClient } from "./supabase";
import { USE_SUPABASE, sbRead, sbWrite, sbData, currentUserId, dataCacheScope, withDemoExpiry, useInAppMockDataset } from "./_sb";
import { demoOfflineDelayAndPick } from "./demoOfflineMock";

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

const EMPTY_BILLING_OVERVIEW: BillingOverviewData = {
  stats: {
    totalOutstanding: 0,
    totalPaid: 0,
    pendingVerification: 0,
    overdueCount: 0,
  },
  invoices: [],
  recentProofs: [],
};

function mapProof(d: any): PaymentProof {
  return {
    id: d.id,
    invoiceId: d.invoice_id,
    submittedBy: { id: d.submitted_by_id, name: d.submitted_by_name, role: d.submitted_by_role },
    receivedBy: { id: d.received_by_id, name: d.received_by_name, role: d.received_by_role },
    amount: d.amount,
    method: d.method,
    referenceNumber: d.reference_number,
    screenshotUrl: d.screenshot_url,
    notes: d.notes || "",
    status: d.status,
    submittedAt: d.submitted_at,
    verifiedAt: d.verified_at,
    verifiedByName: d.verified_by_name,
    rejectionReason: d.rejection_reason,
  };
}

function mapInvoice(d: any, lineItems: any[], proofs: PaymentProof[]): BillingInvoice {
  return {
    id: d.id,
    type: d.type,
    fromParty: { id: d.from_party_id, name: d.from_party_name, role: d.from_party_role },
    toParty: { id: d.to_party_id, name: d.to_party_name, role: d.to_party_role },
    description: d.description,
    amount: d.subtotal,
    platformFee: d.platform_fee,
    total: d.total,
    status: d.status,
    issuedDate: d.issued_date,
    dueDate: d.due_date,
    placementId: d.placement_id,
    lineItems: lineItems.map((li: any) => ({
      desc: li.description, qty: String(li.qty), rate: li.rate, total: li.total,
    })),
    paymentProofs: proofs.filter((p) => p.invoiceId === d.id),
  };
}

export const billingService = {
  async getOverview(): Promise<BillingOverviewData> {
    if (USE_SUPABASE) {
      return sbRead(`billing:overview:${dataCacheScope()}`, async () => {
        const userId = await currentUserId();
        // Fetch invoices for this user (as sender or receiver)
        const { data: invData, error: invErr } = await sbData().from("invoices")
          .select("*")
          .or(`from_party_id.eq.${userId},to_party_id.eq.${userId}`)
          .order("issued_date", { ascending: false });
        if (invErr) throw invErr;

        const invIds = (invData || []).map((i: any) => i.id);
        let lineItems: any[] = [];
        let proofs: PaymentProof[] = [];

        if (invIds.length > 0) {
          const [liRes, prRes] = await Promise.all([
            sbData().from("invoice_line_items").select("*").in("invoice_id", invIds),
            sbData().from("payment_proofs").select("*").in("invoice_id", invIds),
          ]);
          lineItems = liRes.data || [];
          proofs = (prRes.data || []).map(mapProof);
        }

        const invoices = (invData || []).map((d: any) =>
          mapInvoice(d, lineItems.filter((li: any) => li.invoice_id === d.id), proofs)
        );

        const stats = {
          totalOutstanding: invoices.filter((i) => i.status === "unpaid" || i.status === "overdue").reduce((s, i) => s + i.total, 0),
          totalPaid: invoices.filter((i) => i.status === "paid" || i.status === "verified").reduce((s, i) => s + i.total, 0),
          pendingVerification: invoices.filter((i) => i.status === "proof_submitted").length,
          overdueCount: invoices.filter((i) => i.status === "overdue").length,
        };

        return { stats, invoices, recentProofs: proofs.slice(0, 5) };
      });
    }
    return demoOfflineDelayAndPick(200, EMPTY_BILLING_OVERVIEW, (m) => m.MOCK_BILLING_OVERVIEW);
  },

  async getInvoices(): Promise<BillingInvoice[]> {
    if (USE_SUPABASE) {
      const overview = await this.getOverview();
      return overview.invoices;
    }
    return demoOfflineDelayAndPick(200, [] as BillingInvoice[], (m) => m.MOCK_BILLING_INVOICES);
  },

  async getInvoiceById(id: string): Promise<BillingInvoice | undefined> {
    if (USE_SUPABASE) {
      return sbRead(`invoice:${dataCacheScope()}:${id}`, async () => {
        const { data, error } = await sbData().from("invoices").select("*").eq("id", id).single();
        if (error) return undefined;
        const [liRes, prRes] = await Promise.all([
          sbData().from("invoice_line_items").select("*").eq("invoice_id", id),
          sbData().from("payment_proofs").select("*").eq("invoice_id", id),
        ]);
        const proofs = (prRes.data || []).map(mapProof);
        return mapInvoice(data, liRes.data || [], proofs);
      });
    }
    return demoOfflineDelayAndPick(200, undefined as BillingInvoice | undefined, (m) =>
      m.MOCK_BILLING_INVOICES.find((i) => i.id === id),
    );
  },

  async getPaymentProofs(): Promise<PaymentProof[]> {
    if (USE_SUPABASE) {
      return sbRead(`proofs:mine:${dataCacheScope()}`, async () => {
        const userId = await currentUserId();
        const { data, error } = await sbData().from("payment_proofs")
          .select("*")
          .or(`submitted_by_id.eq.${userId},received_by_id.eq.${userId}`)
          .order("submitted_at", { ascending: false });
        if (error) throw error;
        return (data || []).map(mapProof);
      });
    }
    return demoOfflineDelayAndPick(200, [] as PaymentProof[], (m) => m.MOCK_PAYMENT_PROOFS);
  },

  async getProofById(id: string): Promise<PaymentProof | undefined> {
    if (USE_SUPABASE) {
      return sbRead(`proof:${dataCacheScope()}:${id}`, async () => {
        const { data, error } = await sbData().from("payment_proofs").select("*").eq("id", id).single();
        if (error) return undefined;
        return mapProof(data);
      });
    }
    return demoOfflineDelayAndPick(200, undefined as PaymentProof | undefined, (m) =>
      m.MOCK_PAYMENT_PROOFS.find((p) => p.id === id),
    );
  },

  async getProofsForInvoice(invoiceId: string): Promise<PaymentProof[]> {
    if (USE_SUPABASE) {
      return sbRead(`proofs:inv:${dataCacheScope()}:${invoiceId}`, async () => {
        const { data, error } = await sbData().from("payment_proofs")
          .select("*")
          .eq("invoice_id", invoiceId)
          .order("submitted_at", { ascending: false });
        if (error) throw error;
        return (data || []).map(mapProof);
      });
    }
    return demoOfflineDelayAndPick(200, [] as PaymentProof[], (m) =>
      m.MOCK_PAYMENT_PROOFS.filter((p) => p.invoiceId === invoiceId),
    );
  },

  async submitPaymentProof(data: {
    invoiceId: string;
    amount: number;
    method: string;
    referenceNumber: string;
    notes: string;
    screenshotFile?: File | null;
  }): Promise<{ success: boolean; proofId: string }> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const userId = await currentUserId();
        // Get invoice info
        const { data: inv } = await sbData().from("invoices").select("*").eq("id", data.invoiceId).single();
        if (!inv) throw new Error("Invoice not found");
        const { data: profile } = await getSupabaseClient().from("profiles").select("name, role").eq("id", userId).single();

        const receiverId =
          userId === inv.to_party_id ? inv.from_party_id : inv.to_party_id;
        const receiverName =
          userId === inv.to_party_id ? inv.from_party_name : inv.to_party_name;
        const receiverRole =
          userId === inv.to_party_id ? inv.from_party_role : inv.to_party_role;

        const { data: proof, error } = await sbData().from("payment_proofs").insert(withDemoExpiry({
          invoice_id: data.invoiceId,
          submitted_by_id: userId,
          submitted_by_name: profile?.name || "",
          submitted_by_role: profile?.role || "guardian",
          received_by_id: receiverId,
          received_by_name: receiverName,
          received_by_role: receiverRole,
          amount: data.amount,
          method: data.method,
          reference_number: data.referenceNumber,
          notes: data.notes,
          status: "pending",
          submitted_at: new Date().toISOString(),
        })).select("id").single();
        if (error) throw error;

        // Update invoice status
        await sbData().from("invoices").update({ status: "proof_submitted" }).eq("id", data.invoiceId);

        // Push notification
        notificationService.triggerBillingProofSubmitted({
          proofId: proof.id,
          invoiceId: data.invoiceId,
          submitterName: profile?.name || "",
          receiverId,
          amount: data.amount,
          method: data.method,
        });

        return { success: true, proofId: proof.id };
      });
    }

    if (!useInAppMockDataset()) {
      throw new Error("[CareNet] Connect Supabase or use Demo Access to submit payment proof.");
    }
    await delay(400);
    const proofId = `PP-${Date.now().toString(36).toUpperCase()}`;
    console.log("[billing.service] Payment proof submitted:", data);

    const { MOCK_BILLING_INVOICES } = await loadMockBarrel();
    const invoice = MOCK_BILLING_INVOICES.find((i) => i.id === data.invoiceId);
    if (invoice) {
      notificationService.triggerBillingProofSubmitted({
        proofId,
        invoiceId: data.invoiceId,
        submitterName: invoice.toParty.name,
        receiverId: invoice.fromParty.id,
        amount: data.amount,
        method: data.method,
      });
    }

    return { success: true, proofId };
  },

  async verifyPaymentProof(proofId: string): Promise<{ success: boolean }> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const userId = await currentUserId();
        const { data: profile } = await getSupabaseClient().from("profiles").select("name").eq("id", userId).single();
        const { data: proof } = await sbData().from("payment_proofs").select("*").eq("id", proofId).single();
        if (!proof) throw new Error("Proof not found");

        await sbData().from("payment_proofs").update({
          status: "verified",
          verified_at: new Date().toISOString(),
          verified_by_name: profile?.name || "",
        }).eq("id", proofId);

        // Update invoice to paid
        await sbData().from("invoices").update({ status: "paid", paid_date: new Date().toISOString().split("T")[0], paid_via: proof.method }).eq("id", proof.invoice_id);

        notificationService.triggerBillingProofVerified({
          proofId,
          invoiceId: proof.invoice_id,
          verifierName: profile?.name || "",
          submitterId: proof.submitted_by_id,
          amount: proof.amount,
        });
        return { success: true };
      });
    }

    if (!useInAppMockDataset()) {
      throw new Error("[CareNet] Connect Supabase or use Demo Access to verify payment proof.");
    }
    await delay(300);
    console.log("[billing.service] Payment proof verified:", proofId);
    const { MOCK_PAYMENT_PROOFS } = await loadMockBarrel();
    const proof = MOCK_PAYMENT_PROOFS.find((p) => p.id === proofId);
    if (proof) {
      notificationService.triggerBillingProofVerified({
        proofId,
        invoiceId: proof.invoiceId,
        verifierName: proof.receivedBy.name,
        submitterId: proof.submittedBy.id,
        amount: proof.amount,
      });
    }
    return { success: true };
  },

  async rejectPaymentProof(proofId: string, reason: string): Promise<{ success: boolean }> {
    if (USE_SUPABASE) {
      return sbWrite(async () => {
        const userId = await currentUserId();
        const { data: profile } = await getSupabaseClient().from("profiles").select("name").eq("id", userId).single();
        const { data: proof } = await sbData().from("payment_proofs").select("*").eq("id", proofId).single();
        if (!proof) throw new Error("Proof not found");

        await sbData().from("payment_proofs").update({
          status: "rejected",
          verified_at: new Date().toISOString(),
          verified_by_name: profile?.name || "",
          rejection_reason: reason,
        }).eq("id", proofId);

        // Revert invoice status
        await sbData().from("invoices").update({ status: "unpaid" }).eq("id", proof.invoice_id);

        notificationService.triggerBillingProofRejected({
          proofId,
          invoiceId: proof.invoice_id,
          verifierName: profile?.name || "",
          submitterId: proof.submitted_by_id,
          amount: proof.amount,
          reason,
        });
        return { success: true };
      });
    }

    if (!useInAppMockDataset()) {
      throw new Error("[CareNet] Connect Supabase or use Demo Access to reject payment proof.");
    }
    await delay(300);
    console.log("[billing.service] Payment proof rejected:", proofId, reason);
    const { MOCK_PAYMENT_PROOFS: proofsReject } = await loadMockBarrel();
    const proof = proofsReject.find((p) => p.id === proofId);
    if (proof) {
      notificationService.triggerBillingProofRejected({
        proofId,
        invoiceId: proof.invoiceId,
        verifierName: proof.receivedBy.name,
        submitterId: proof.submittedBy.id,
        amount: proof.amount,
        reason,
      });
    }
    return { success: true };
  },

  /**
   * Create a service invoice when a care contract is marked completed (guardian or agency).
   * Idempotent: skips if an invoice with this care_contract_id already exists.
   */
  async ensureInvoiceForCompletedCareContract(careContractId: string): Promise<string | null> {
    if (!USE_SUPABASE) return null;
    return sbWrite(async () => {
      const userId = await currentUserId();
      const { data: existing } = await sbData()
        .from("invoices")
        .select("id")
        .eq("care_contract_id", careContractId)
        .maybeSingle();
      if (existing?.id) return existing.id as string;

      const { data: cc, error: ccErr } = await sbData().from("care_contracts").select("*").eq("id", careContractId).single();
      if (ccErr || !cc) throw new Error("Care contract not found");
      if (cc.status !== "completed") throw new Error("Contract must be completed before invoicing");
      const agencyId = cc.agency_id as string | null;
      const ownerId = cc.owner_id as string;
      if (!agencyId) throw new Error("Contract has no agency — cannot create invoice");
      if (userId !== ownerId && userId !== agencyId) throw new Error("Not authorized to create this invoice");

      const pricingRaw = cc.pricing;
      const pricing =
        typeof pricingRaw === "string"
          ? (JSON.parse(pricingRaw) as Record<string, unknown>)
          : (pricingRaw as Record<string, unknown>) || {};
      let subtotal = 0;
      if (typeof pricing.base_price === "number") subtotal = Math.round(pricing.base_price);
      else if (typeof pricing.budget_max === "number") subtotal = Math.round(pricing.budget_max);
      else if (typeof pricing.budget_min === "number") subtotal = Math.round(pricing.budget_min);
      if (subtotal <= 0) subtotal = 1;

      // Platform fee: read from wallets config or default to 5%
      let platformFeeRate = 0.05;
      try {
        const { data: walletConfig } = await getSupabaseClient()
          .from("wallets")
          .select("fee_percent")
          .eq("role", "platform")
          .maybeSingle();
        if (walletConfig?.fee_percent && typeof walletConfig.fee_percent === "number") {
          platformFeeRate = walletConfig.fee_percent / 100;
        }
      } catch {
        // use default 5%
      }
      const platformFee = Math.round(subtotal * platformFeeRate);
      const total = subtotal + platformFee;

      const [{ data: fromProf }, { data: toProf }] = await Promise.all([
        getSupabaseClient().from("profiles").select("name, role").eq("id", agencyId).maybeSingle(),
        getSupabaseClient().from("profiles").select("name, role").eq("id", ownerId).maybeSingle(),
      ]);
      const title = (cc.title as string) || "Care services";
      const due = new Date();
      due.setDate(due.getDate() + 14);

      const { data: inv, error: invErr } = await sbData()
        .from("invoices")
        .insert(withDemoExpiry({
          from_party_id: agencyId,
          from_party_name: (cc.agency_name as string) || fromProf?.name || "Agency",
          from_party_role: "agency",
          to_party_id: ownerId,
          to_party_name: toProf?.name || "Guardian",
          to_party_role: "guardian",
          care_contract_id: careContractId,
          type: "service",
          description: `Final bill — ${title}`,
          subtotal,
          platform_fee: platformFee,
          total,
          status: "unpaid",
          issued_date: new Date().toISOString().slice(0, 10),
          due_date: due.toISOString().slice(0, 10),
        }))
        .select("id")
        .single();
      if (invErr) throw invErr;

      const invId = inv!.id as string;
      await sbData().from("invoice_line_items").insert(withDemoExpiry({
        invoice_id: invId,
        description: "Care services (completed)",
        qty: "1",
        rate: subtotal,
        total: subtotal,
      }));

      return invId;
    });
  },
};

