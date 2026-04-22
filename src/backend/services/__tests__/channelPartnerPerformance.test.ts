import { describe, expect, it, vi, beforeEach } from "vitest";
import { performance } from "perf_hooks";

vi.mock("../_sb", () => ({
  USE_SUPABASE: false,
  sbRead: vi.fn(),
  sbWrite: vi.fn(),
  sb: vi.fn(),
  sbData: vi.fn(),
  currentUserId: vi.fn(),
  useInAppMockDataset: () => true,
}));

import {
  getMyChanPProfile,
  getMyRates,
  getMyLeads,
  getMyCommissions,
  adminGetChanPDetail,
  adminGetExpiringChanPRates,
  adminGetCommissionReports,
} from "../channelPartnerService";

describe("Channel Partner Performance Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("CP Profile Retrieval Performance", () => {
    it("should retrieve CP profile within 500ms (mock mode)", async () => {
      const start = performance.now();
      await getMyChanPProfile();
      const end = performance.now();
      const duration = end - start;

      expect(duration).toBeLessThan(500);
    });
  });

  describe("CP Data Retrieval Performance", () => {
    it("should retrieve CP rates within 500ms", async () => {
      const start = performance.now();
      await getMyRates();
      const end = performance.now();
      const duration = end - start;

      expect(duration).toBeLessThan(500);
    });

    it("should retrieve CP leads within 500ms", async () => {
      const start = performance.now();
      await getMyLeads();
      const end = performance.now();
      const duration = end - start;

      expect(duration).toBeLessThan(500);
    });

    it("should retrieve CP commissions within 500ms", async () => {
      const start = performance.now();
      await getMyCommissions();
      const end = performance.now();
      const duration = end - start;

      expect(duration).toBeLessThan(500);
    });
  });

  describe("Admin CP Operations Performance", () => {
    it("should retrieve CP detail within 500ms", async () => {
      const start = performance.now();
      await adminGetChanPDetail("cp-1");
      const end = performance.now();
      const duration = end - start;

      expect(duration).toBeLessThan(500);
    });

    it("should retrieve expiring rates within 500ms", async () => {
      const start = performance.now();
      await adminGetExpiringChanPRates();
      const end = performance.now();
      const duration = end - start;

      expect(duration).toBeLessThan(500);
    });

    it("should retrieve commission reports within 500ms", async () => {
      const start = performance.now();
      await adminGetCommissionReports();
      const end = performance.now();
      const duration = end - start;

      expect(duration).toBeLessThan(500);
    });
  });

  describe("Memory Efficiency", () => {
    it("should not leak memory on repeated CP profile fetches", async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform 100 fetches
      for (let i = 0; i < 100; i++) {
        await getMyChanPProfile();
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal (< 10MB for 100 operations)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe("Concurrent Request Handling", () => {
    it("should handle concurrent CP data fetches efficiently", async () => {
      const start = performance.now();

      const promises = [
        getMyChanPProfile(),
        getMyRates(),
        getMyLeads(),
        getMyCommissions(),
      ];

      await Promise.all(promises);

      const end = performance.now();
      const duration = end - start;

      // Concurrent fetches should complete faster than sequential
      expect(duration).toBeLessThan(500);
    });
  });
});
