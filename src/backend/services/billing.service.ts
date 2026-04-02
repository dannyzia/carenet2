/**
 * Billing Service — manual payment verification flow
 *
 * Flow: Payer submits proof → Receiver verifies → Status updates
 */
import type {
  BillingOverviewData, BillingInvoice, PaymentProof, BillingLineItem,
} from "@/backend/models";
import {
  MOCK_BILLING_OVERVIEW, MOCK_BILLING_INVOICES, MOCK_PAYMENT_PROOFS,
} from "@/backend/api/mock";
import { notificationService } from "./notification.service";
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
    if (shouldUseSupabase()) {
      return sbRead("billing:overview", async () => {
        const userId = await currentUserId();
        // Fetch invoices for this user (as sender or receiver)
        const { data: invData, error: invErr } = await sb().from("invoices")
          .select("*")
          .or(`from_party_id.eq.${userId},to_party_id.eq.${userId}`)
          .order("issued_date", { ascending: false });
        if (invErr) throw invErr;

        const invIds = (invData || []).map((i: any) => i.id);
        let lineItems: any[] = [];
        let proofs: PaymentProof[] = [];

        if (invIds.length > 0) {
          const [liRes, prRes] = await Promise.all([
            sb().from("invoice_line_items").select("*").in("invoice_id", invIds),
            sb().from("payment_proofs").select("*").in("invoice_id", invIds),
          ]);
          lineItems = liRes.data || [];
          proofs = (prRes.data || []).map(mapProof);
        }

        const invoices = (invData || []).map((d: any) =>
          mapInvoice(d, lineItems.filter((li: any) => li.invoice_id === d.id), proofs)
        );

        const stats = {
          totalOutstanding: invoices.filter((i) => i.status === "unpaid" || i.status === "overdue").reduce((s, i) => s + i.total, 0),
          totalPaid: invoices.filter((i) => i.status === "verified").reduce((s, i) => s + i.total, 0),
          pendingVerification: invoices.filter((i) => i.status === "proof_submitted").length,
          overdueCount: invoices.filter((i) => i.status === "overdue").length,
        };

        return { stats, invoices, recentProofs: proofs.slice(0, 5) };
      });
    }
    await delay();
    return MOCK_BILLING_OVERVIEW;
  },

  async getInvoices(): Promise<BillingInvoice[]> {
    if (shouldUseSupabase()) {
      const overview = await this.getOverview();
      return overview.invoices;
    }
    await delay();
    return MOCK_BILLING_INVOICES;
  },

  async getInvoiceById(id: string): Promise<BillingInvoice | undefined> {
    if (shouldUseSupabase()) {
      return sbRead(`invoice:${id}`, async () => {
        const { data, error } = await sb().from("invoices").select("*").eq("id", id).single();
        if (error) return undefined;
        const [liRes, prRes] = await Promise.all([
          sb().from("invoice_line_items").select("*").eq("invoice_id", id),
          sb().from("payment_proofs").select("*").eq("invoice_id", id),
        ]);
        const proofs = (prRes.data || []).map(mapProof);
        return mapInvoice(data, liRes.data || [], proofs);
      });
    }
    await delay();
    return MOCK_BILLING_INVOICES.find((i) => i.id === id);
  },

  async getPaymentProofs(): Promise<PaymentProof[]> {
    if (shouldUseSupabase()) {
      return sbRead("proofs:mine", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("payment_proofs")
          .select("*")
          .or(`submitted_by_id.eq.${userId},received_by_id.eq.${userId}`)
          .order("submitted_at", { ascending: false });
        if (error) throw error;
        return (data || []).map(mapProof);
      });
    }
    await delay();
    return MOCK_PAYMENT_PROOFS;
  },

  async getProofById(id: string): Promise<PaymentProof | undefined> {
    if (shouldUseSupabase()) {
      return sbRead(`proof:${id}`, async () => {
        const { data, error } = await sb().from("payment_proofs").select("*").eq("id", id).single();
        if (error) return undefined;
        return mapProof(data);
      });
    }
    await delay();
    return MOCK_PAYMENT_PROOFS.find((p) => p.id === id);
  },

  async getProofsForInvoice(invoiceId: string): Promise<PaymentProof[]> {
    if (shouldUseSupabase()) {
      return sbRead(`proofs:inv:${invoiceId}`, async () => {
        const { data, error } = await sb().from("payment_proofs")
          .select("*")
          .eq("invoice_id", invoiceId)
          .order("submitted_at", { ascending: false });
        if (error) throw error;
        return (data || []).map(mapProof);
      });
    }
    await delay();
    return MOCK_PAYMENT_PROOFS.filter((p) => p.invoiceId === invoiceId);
  },

  async submitPaymentProof(data: {
    invoiceId: string;
    amount: number;
    method: string;
    referenceNumber: string;
    notes: string;
    screenshotFile?: File | null;
  }): Promise<{ success: boolean; proofId: string }> {
    if (shouldUseSupabase()) {
      return sbWrite(async () => {
        const userId = await currentUserId();
        // Get invoice info
        const { data: inv } = await sb().from("invoices").select("*").eq("id", data.invoiceId).single();
        if (!inv) throw new Error("Invoice not found");
        const { data: profile } = await sb().from("profiles").select("name, role").eq("id", userId).single();

        const { data: proof, error } = await sb().from("payment_proofs").insert({
          invoice_id: data.invoiceId,
          submitted_by_id: userId,
          submitted_by_name: profile?.name || "",
          submitted_by_role: profile?.role || "guardian",
          received_by_id: inv.from_party_id,
          received_by_name: inv.from_party_name,
          received_by_role: inv.from_party_role,
          amount: data.amount,
          method: data.method,
          reference_number: data.referenceNumber,
          notes: data.notes,
          status: "pending",
          submitted_at: new Date().toISOString(),
        }).select("id").single();
        if (error) throw error;

        // Update invoice status
        await sb().from("invoices").update({ status: "proof_submitted" }).eq("id", data.invoiceId);

        // Push notification
        notificationService.triggerBillingProofSubmitted({
          proofId: proof.id,
          invoiceId: data.invoiceId,
          submitterName: profile?.name || "",
          receiverId: inv.from_party_id,
          amount: data.amount,
          method: data.method,
        });

        return { success: true, proofId: proof.id };
      });
    }

    await delay(400);
    const proofId = `PP-${Date.now().toString(36).toUpperCase()}`;
    console.log("[billing.service] Payment proof submitted:", data);

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
    if (shouldUseSupabase()) {
      return sbWrite(async () => {
        const userId = await currentUserId();
        const { data: profile } = await sb().from("profiles").select("name").eq("id", userId).single();
        const { data: proof } = await sb().from("payment_proofs").select("*").eq("id", proofId).single();
        if (!proof) throw new Error("Proof not found");

        await sb().from("payment_proofs").update({
          status: "verified",
          verified_at: new Date().toISOString(),
          verified_by_name: profile?.name || "",
        }).eq("id", proofId);

        // Update invoice to paid
        await sb().from("invoices").update({ status: "paid", paid_date: new Date().toISOString().split("T")[0], paid_via: proof.method }).eq("id", proof.invoice_id);

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

    await delay(300);
    console.log("[billing.service] Payment proof verified:", proofId);
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
    if (shouldUseSupabase()) {
      return sbWrite(async () => {
        const userId = await currentUserId();
        const { data: profile } = await sb().from("profiles").select("name").eq("id", userId).single();
        const { data: proof } = await sb().from("payment_proofs").select("*").eq("id", proofId).single();
        if (!proof) throw new Error("Proof not found");

        await sb().from("payment_proofs").update({
          status: "rejected",
          verified_at: new Date().toISOString(),
          verified_by_name: profile?.name || "",
          rejection_reason: reason,
        }).eq("id", proofId);

        // Revert invoice status
        await sb().from("invoices").update({ status: "unpaid" }).eq("id", proof.invoice_id);

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

    await delay(300);
    console.log("[billing.service] Payment proof rejected:", proofId, reason);
    const proof = MOCK_PAYMENT_PROOFS.find((p) => p.id === proofId);
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
};

