/**
 * Billing Domain Models
 * Types for the manual payment verification flow:
 *   Admin verifies via platform escrow — funds credited to provider wallet on approval
 */

// ─── Payment Methods ───
export type ManualPaymentMethod = "bkash" | "nagad" | "rocket" | "bank_transfer" | "cash";

// ─── Payment Proof (submitted by payer) ───
export interface PaymentProof {
  id: string;
  invoiceId: string;
  submittedBy: { id: string; name: string; role: string };
  receivedBy: { id: string; name: string; role: string };
  amount: number;
  method: ManualPaymentMethod;
  referenceNumber: string;
  screenshotUrl: string | null;
  notes: string;
  status: "pending" | "verified" | "rejected" | "expired";
  submittedAt: string;
  verifiedAt: string | null;
  verifiedByName: string | null;
  rejectionReason: string | null;
}

// ─── Billing Invoice (unified view for both payer and receiver) ───
export interface BillingInvoice {
  id: string;
  type: "service" | "product" | "subscription";
  fromParty: { id: string; name: string; role: string };
  toParty: { id: string; name: string; role: string };
  description: string;
  amount: number;
  platformFee: number;
  total: number;
  status: "unpaid" | "proof_submitted" | "verified" | "disputed" | "overdue" | "paid" | "partial";
  issuedDate: string;
  dueDate: string;
  placementId?: string;
  careContractId?: string;
  lineItems: BillingLineItem[];
  paymentProofs: PaymentProof[];
}

export interface BillingLineItem {
  desc: string;
  qty: string;
  rate: number;
  total: number;
}

// ─── Billing Overview Stats ───
export interface BillingStats {
  totalOutstanding: number;
  totalPaid: number;
  pendingVerification: number;
  overdueCount: number;
}

// ─── Billing Overview Data ───
export interface BillingOverviewData {
  stats: BillingStats;
  invoices: BillingInvoice[];
  recentProofs: PaymentProof[];
}
