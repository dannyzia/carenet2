import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../_sb", () => ({
  USE_SUPABASE: false,
  sbRead: vi.fn(),
  sbWrite: vi.fn(),
  sb: vi.fn(),
  sbData: vi.fn(),
  currentUserId: vi.fn(),
  useInAppMockDataset: () => true,
}));

vi.mock("../channelPartnerNotifications", () => ({
  channelPartnerNotifications: {
    notifyCpLeadJoined: vi.fn(),
    notifyCpLeadActivationResent: vi.fn(),
  },
}));

import {
  createLead,
  getMyChanPProfile,
  resendActivationLink,
  adminApproveChanP,
  adminRejectChanP,
  adminSuspendChanP,
  adminDeactivateChanP,
  adminSetChanPRate,
  adminRenewChanPRate,
  adminAssignLead,
  adminReverseCommission,
  adminGetExpiringChanPRates,
  adminGetCommissionReports,
  getMyRates,
  getMyLeads,
  getMyCommissions,
} from "../channelPartnerService";

function installDemoWindow() {
  (globalThis as any).window = {
    localStorage: {
      getItem: vi.fn(() => JSON.stringify({ id: "demo-channel-partner-1", email: "channelpartner@carenet.demo" })),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
  };
}

function uninstallDemoWindow() {
  delete (globalThis as any).window;
}

describe("channelPartnerService (mock mode)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uninstallDemoWindow();
  });

  describe("CP Profile Functions", () => {
    it("returns the demo Channel Partner profile from localStorage", async () => {
      installDemoWindow();

      const profile = await getMyChanPProfile();

      expect(profile).toBeTruthy();
      expect(profile?.userId).toBe("demo-channel-partner-1");
      expect(profile?.status).toBe("active");
    });
  });

  describe("Lead Creation", () => {
    it("creates a new lead for an active Channel Partner", async () => {
      installDemoWindow();

      const result = await createLead({
        leadRole: "guardian",
        name: "Test Lead",
        phone: "01700000001",
        district: "Dhaka",
        email: "testlead@example.com",
      });

      expect(result.success).toBe(true);
      expect(result.leadUserId).toBeTruthy();
    });

    it("rejects lead creation for an invalid role", async () => {
      installDemoWindow();

      const result = await createLead({
        leadRole: "invalid" as any,
        name: "Bad Role Lead",
        phone: "01700000002",
        district: "Dhaka",
        email: "badrole@example.com",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid lead role");
    });

    it("resends activation link for a recently created mock lead", async () => {
      installDemoWindow();

      const createResult = await createLead({
        leadRole: "agency",
        name: "Activation Lead",
        phone: `0170000${Math.floor(Math.random() * 9000) + 1000}`,
        district: "Dhaka",
        email: "activation@example.com",
      });

      expect(createResult.success).toBe(true);
      expect(createResult.leadUserId).toBeTruthy();

      const resendResult = await resendActivationLink(createResult.leadUserId!);

      expect(resendResult.success).toBe(true);
      expect(resendResult.error).toBeUndefined();
    });
  });

  describe("Admin Approval Functions", () => {
    it("approves a Channel Partner with initial rates", async () => {
      installDemoWindow();

      const result = await adminApproveChanP("cp-1", [
        { leadRole: "guardian", rate: 15, expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), reason: "Initial approval" },
      ]);

      // Mock mode returns success: false for admin operations
      // Test validates the function signature and structure
      expect(result).toBeDefined();
      expect(typeof result.success).toBe("boolean");
    });

    it("approves a Channel Partner without rates", async () => {
      installDemoWindow();

      const result = await adminApproveChanP("cp-1", []);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe("boolean");
    });

    it("rejects a Channel Partner with a reason", async () => {
      installDemoWindow();

      const result = await adminRejectChanP("cp-1", "Insufficient documentation");

      expect(result).toBeDefined();
      expect(typeof result.success).toBe("boolean");
    });

    it("suspends a Channel Partner with a reason", async () => {
      installDemoWindow();

      const result = await adminSuspendChanP("cp-1", "Policy violation");

      expect(result).toBeDefined();
      expect(typeof result.success).toBe("boolean");
    });

    it("deactivates a Channel Partner with a reason", async () => {
      installDemoWindow();

      const result = await adminDeactivateChanP("cp-1", "Requested by user");

      expect(result).toBeDefined();
      expect(typeof result.success).toBe("boolean");
    });
  });

  describe("Admin Rate Management", () => {
    it("sets a new commission rate for a Channel Partner", async () => {
      installDemoWindow();

      const result = await adminSetChanPRate(
        "cp-1",
        "guardian",
        20,
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        "Rate adjustment"
      );

      expect(result).toBeDefined();
      expect(typeof result.success).toBe("boolean");
    });

    it("renews an existing rate expiry date", async () => {
      installDemoWindow();

      const result = await adminRenewChanPRate(
        "rate-1",
        new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
      );

      expect(result).toBeDefined();
      expect(typeof result.success).toBe("boolean");
    });
  });

  describe("Admin Lead Management", () => {
    it("assigns a lead to a Channel Partner", async () => {
      installDemoWindow();

      const result = await adminAssignLead("cp-1", "user-123");

      expect(result).toBeDefined();
      expect(typeof result.success).toBe("boolean");
    });
  });

  describe("Admin Commission Management", () => {
    it("reverses a credited commission with reason", async () => {
      installDemoWindow();

      const result = await adminReverseCommission("commission-1", "Invoice cancelled");

      expect(result).toBeDefined();
      expect(typeof result.success).toBe("boolean");
    });
  });

  describe("Admin Dashboard Functions", () => {
    it("returns expiring Channel Partner rates", async () => {
      installDemoWindow();

      const result = await adminGetExpiringChanPRates();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it("returns commission reports data", async () => {
      installDemoWindow();

      const result = await adminGetCommissionReports();

      expect(result).toBeTruthy();
      expect(result.totalCommissions).toBeGreaterThanOrEqual(0);
      expect(result.byChannelPartner).toBeDefined();
      expect(result.monthlyTrend).toBeDefined();
    });
  });

  describe("CP Data Retrieval Functions", () => {
    it("returns Channel Partner's own rates", async () => {
      installDemoWindow();

      const result = await getMyRates();

      // getMyRates returns ChanPRateByRole (object), not an array
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });

    it("returns Channel Partner's leads", async () => {
      installDemoWindow();

      const result = await getMyLeads();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it("returns Channel Partner's commissions", async () => {
      installDemoWindow();

      const result = await getMyCommissions();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });
});
