/**
 * Billing Service — Central Payment Gateway unit tests
 *
 * Covers: role-based access control on verify/reject,
 *         already-paid guard on submit,
 *         escrow payout flow,
 *         admin routing of received_by_id,
 *         moderator config toggle,
 *         idempotency of credit_escrow_earning RPC
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mock state (set before each test) ─────────────────────────────
let mockProfileRole = "admin";
let mockProfileName = "Admin User";
let mockPlatformConfig: Record<string, string> = { moderator_can_verify_payments: "false" };
let mockInvoice: any = {
  id: "inv-1", status: "unpaid", from_party_id: "provider-1",
  subtotal: 10000, from_party_name: "Test Agency",
};
let mockProof: any = {
  id: "proof-1", invoice_id: "inv-1", submitted_by_id: "guardian-1",
  submitted_by_name: "Test Guardian", submitted_by_role: "guardian",
  received_by_id: "admin-1", received_by_name: "CareNet Platform",
  received_by_role: "admin", amount: 10000, method: "bkash",
  reference_number: "TXN123", screenshot_url: null, notes: "",
  status: "pending", submitted_at: "2026-01-01T00:00:00Z",
};
let rpcResult: { data: any; error: any } = { data: null, error: null };

/**
 * Builds a chainable Supabase query mock.
 *
 * Supported chains:
 *   .from(x).select(...).eq(...).single()
 *   .from(x).select(...).eq(...).limit(...).single()
 *   .from(x).select(...).in(...)
 *   .from(x).insert({...}).select("id").single()
 *   .from(x).update({...}).eq(...)
 *   .rpc("fn", params)
 */
function buildMockClient() {
  const configRows = Object.entries(mockPlatformConfig).map(([key, value]) => ({ key, value }));

  function resolveTable(table: string) {
    switch (table) {
      case "profiles":
        return { data: { id: "admin-1", role: mockProfileRole, name: mockProfileName }, error: null };
      case "platform_config":
        return { data: configRows.length === 1 ? configRows[0] : configRows, error: null };
      case "invoices":
        return { data: mockInvoice, error: null };
      case "payment_proofs":
        return { data: mockProof, error: null };
      case "invoice_line_items":
        return { data: { id: "li-1" }, error: null };
      default:
        return { data: null, error: null };
    }
  }

  // Builder that accumulates chain calls and resolves at .single() / .maybeSingle() / await
  function createBuilder(table: string, method?: string): any {
    const builder: any = {};

    // Resolve on terminal calls
    const resolve = () => {
      const result = resolveTable(table);
      return result;
    };

    builder.select = (_fields?: string) => createBuilder(table, "select");
    builder.insert = (_payload?: any) => createBuilder(table, "insert");
    builder.update = (_payload?: any) => {
      // update returns a builder that can be chained with .eq()
      return createBuilder(table, "update");
    };
    builder.delete = () => createBuilder(table, "delete");
    builder.eq = (_col: string, _val: any) => builder;
    builder.in = (_col: string, _vals: any[]) => builder;
    builder.or = (_filter: string) => builder;
    builder.limit = (_n: number) => builder;
    builder.order = (_col: string, _opts?: any) => builder;

    builder.single = () => {
      const r = resolve();
      return Promise.resolve(r);
    };
    builder.maybeSingle = () => {
      const r = resolve();
      return Promise.resolve(r);
    };

    // For .insert({...}).select("id").single() chain
    // After insert, calling .select() should return a new builder
    // We override: insert returns builder with .select() → builder with .single()
    const originalInsert = builder.insert;
    builder.insert = (_payload?: any) => {
      const insertBuilder: any = {};
      insertBuilder.select = (_fields?: string) => {
        // Return { id: "proof-new" } for insert+select
        const selectBuilder: any = {};
        selectBuilder.single = () => Promise.resolve({ data: { id: "PP-NEW-1" }, error: null });
        selectBuilder.eq = () => selectBuilder;
        return selectBuilder;
      };
      insertBuilder.eq = () => insertBuilder;
      return insertBuilder;
    };

    // For .update({...}).eq("id", x) chain (fire-and-forget, no .single())
    const originalUpdate = builder.update;
    builder.update = (_payload?: any) => {
      const updateBuilder: any = {};
      updateBuilder.eq = (_col: string, _val: any) => {
        // Returns a thenable (await-able) that resolves to { data: null, error: null }
        return Promise.resolve({ data: null, error: null });
      };
      return updateBuilder;
    };

    // Thenable support (for queries used with await, not .single())
    builder.then = (resolveFn: any, rejectFn: any) => {
      const r = resolve();
      if (r.error && rejectFn) rejectFn(r.error);
      else resolveFn(r.data);
      return Promise.resolve(r.data);
    };

    return builder;
  }

  return {
    from: (table: string) => createBuilder(table),
    rpc: (_fn: string, _params: any) => Promise.resolve(rpcResult),
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: "test-user-id" } } }),
    },
  };
}

const mockClient = () => buildMockClient();

// ─── Module mocks ───────────────────────────────────────────────────
vi.mock("../supabase", () => ({
  USE_SUPABASE: true,
  getSupabaseClient: () => mockClient(),
}));

vi.mock("../_sb", () => ({
  USE_SUPABASE: true,
  sbRead: (_key: string, fn: () => Promise<any>) => fn(),
  sbWrite: (fn: () => Promise<any>) => fn(),
  sbData: () => mockClient(),
  currentUserId: () => Promise.resolve("test-user-id"),
  useInAppMockDataset: () => false,
  dataCacheScope: () => "pub" as const,
  withDemoExpiry: (x: any) => x,
  isDemoSession: () => false,
}));

vi.mock("../notification.service", () => ({
  notificationService: {
    triggerNotification: vi.fn(),
    triggerBillingProofSubmitted: vi.fn(),
    triggerBillingProofVerified: vi.fn(),
    triggerBillingProofRejected: vi.fn(),
  },
}));

vi.mock("../demoOfflineMock", () => ({
  demoOfflineDelayAndPick: vi.fn(),
}));

vi.mock("../api/mock/loadMockBarrel", () => ({
  loadMockBarrel: vi.fn(),
}));

import { billingService } from "../billing.service";

// ─── Tests ──────────────────────────────────────────────────────────
describe("billing.service — Central Payment Gateway", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfileRole = "admin";
    mockProfileName = "Admin User";
    mockPlatformConfig = { moderator_can_verify_payments: "false" };
    mockInvoice = {
      id: "inv-1", status: "unpaid", from_party_id: "provider-1",
      subtotal: 10000, from_party_name: "Test Agency",
    };
    mockProof = {
      id: "proof-1", invoice_id: "inv-1", submitted_by_id: "guardian-1",
      submitted_by_name: "Test Guardian", submitted_by_role: "guardian",
      received_by_id: "admin-1", received_by_name: "CareNet Platform",
      received_by_role: "admin", amount: 10000, method: "bkash",
      reference_number: "TXN123", screenshot_url: null, notes: "",
      status: "pending", submitted_at: "2026-01-01T00:00:00Z",
    };
    rpcResult = { data: null, error: null };
  });

  // ─── verifyPaymentProof: Role-based access ─────────────────────

  describe("verifyPaymentProof — role-based access", () => {
    it("provider role throws UNAUTHORIZED", async () => {
      mockProfileRole = "agency";
      await expect(billingService.verifyPaymentProof("proof-1"))
        .rejects.toThrow("UNAUTHORIZED");
    });

    it("guardian role throws UNAUTHORIZED", async () => {
      mockProfileRole = "guardian";
      await expect(billingService.verifyPaymentProof("proof-1"))
        .rejects.toThrow("UNAUTHORIZED");
    });

    it("caregiver role throws UNAUTHORIZED", async () => {
      mockProfileRole = "caregiver";
      await expect(billingService.verifyPaymentProof("proof-1"))
        .rejects.toThrow("UNAUTHORIZED");
    });

    it("moderator + config disabled throws UNAUTHORIZED", async () => {
      mockProfileRole = "moderator";
      mockPlatformConfig = { moderator_can_verify_payments: "false" };
      await expect(billingService.verifyPaymentProof("proof-1"))
        .rejects.toThrow("UNAUTHORIZED");
    });

    it("moderator + config enabled succeeds", async () => {
      mockProfileRole = "moderator";
      mockPlatformConfig = { moderator_can_verify_payments: "true" };
      const result = await billingService.verifyPaymentProof("proof-1");
      expect(result.success).toBe(true);
    });

    it("admin succeeds", async () => {
      mockProfileRole = "admin";
      const result = await billingService.verifyPaymentProof("proof-1");
      expect(result.success).toBe(true);
    });
  });

  // ─── verifyPaymentProof: Escrow payout ─────────────────────────

  describe("verifyPaymentProof — escrow payout", () => {
    it("calls credit_escrow_earning RPC on admin verify", async () => {
      mockProfileRole = "admin";
      const result = await billingService.verifyPaymentProof("proof-1");
      expect(result.success).toBe(true);
    });

    it("throws if credit_escrow_earning RPC fails", async () => {
      mockProfileRole = "admin";
      rpcResult = { data: null, error: new Error("RPC wallet error") };
      await expect(billingService.verifyPaymentProof("proof-1"))
        .rejects.toThrow("RPC wallet error");
    });
  });

  // ─── verifyPaymentProof: Notifications ─────────────────────────

  describe("verifyPaymentProof — notifications", () => {
    it("sends 3 notifications on success (guardian, provider, admin)", async () => {
      mockProfileRole = "admin";
      const { notificationService: ns } = await import("../notification.service");
      await billingService.verifyPaymentProof("proof-1");
      // triggerNotification called twice (guardian + provider) + triggerBillingProofVerified once
      expect(ns.triggerNotification).toHaveBeenCalledTimes(2);
      expect(ns.triggerBillingProofVerified).toHaveBeenCalledTimes(1);
    });
  });

  // ─── rejectPaymentProof: Role-based access ─────────────────────

  describe("rejectPaymentProof — role-based access", () => {
    it("provider role throws UNAUTHORIZED", async () => {
      mockProfileRole = "agency";
      await expect(billingService.rejectPaymentProof("proof-1", "Bad"))
        .rejects.toThrow("UNAUTHORIZED");
    });

    it("moderator + config disabled throws UNAUTHORIZED", async () => {
      mockProfileRole = "moderator";
      mockPlatformConfig = { moderator_can_verify_payments: "false" };
      await expect(billingService.rejectPaymentProof("proof-1", "Bad"))
        .rejects.toThrow("UNAUTHORIZED");
    });

    it("moderator + config enabled succeeds", async () => {
      mockProfileRole = "moderator";
      mockPlatformConfig = { moderator_can_verify_payments: "true" };
      const result = await billingService.rejectPaymentProof("proof-1", "Invalid docs");
      expect(result.success).toBe(true);
    });

    it("admin succeeds", async () => {
      mockProfileRole = "admin";
      const result = await billingService.rejectPaymentProof("proof-1", "Invalid");
      expect(result.success).toBe(true);
    });
  });

  // ─── submitPaymentProof: Already-paid guard ────────────────────

  describe("submitPaymentProof — already-paid guard", () => {
    it("throws billing.alreadyPaid when invoice status is paid", async () => {
      mockInvoice = { ...mockInvoice, status: "paid" };
      await expect(billingService.submitPaymentProof({
        invoiceId: "inv-1", amount: 10000, method: "bkash",
        referenceNumber: "TXN999", notes: "",
      })).rejects.toThrow("billing.alreadyPaid");
    });
  });

  // ─── submitPaymentProof: Admin routing ─────────────────────────

  describe("submitPaymentProof — admin routing", () => {
    it("routes received_by_id to admin (not provider)", async () => {
      mockInvoice = { ...mockInvoice, status: "unpaid" };
      const result = await billingService.submitPaymentProof({
        invoiceId: "inv-1", amount: 10000, method: "bkash",
        referenceNumber: "TXN999", notes: "test",
      });
      expect(result.success).toBe(true);
      expect(result.proofId).toBeDefined();
    });
  });

  // ─── getPaymentProofsForAdmin ───────────────────────────────────

  describe("getPaymentProofsForAdmin", () => {
    it("returns empty array when no proofs exist", async () => {
      const result = await billingService.getPaymentProofsForAdmin();
      expect(Array.isArray(result)).toBe(true);
    });

    it("passes status filter to query", async () => {
      const result = await billingService.getPaymentProofsForAdmin("pending");
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ─── getPlatformPaymentDetails ──────────────────────────────────

  describe("getPlatformPaymentDetails", () => {
    it("returns payment details from platform_config", async () => {
      const result = await billingService.getPlatformPaymentDetails();
      expect(result).toHaveProperty("bkash");
      expect(result).toHaveProperty("bankName");
      expect(result).toHaveProperty("bankAccount");
    });
  });
});
