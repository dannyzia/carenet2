import { describe, it, expect, vi, beforeEach } from "vitest";
import { withDashboardFallback, EMPTY_OPERATIONAL_DASHBOARD } from "../dashboardFallback";

// Mock dependencies
vi.mock("../_sb", () => ({
  useInAppMockDataset: vi.fn(),
}));

vi.mock("@/backend/api/mock/loadMockBarrel", () => ({
  loadMockBarrel: vi.fn(),
}));

import { useInAppMockDataset } from "../_sb";
import { loadMockBarrel } from "@/backend/api/mock/loadMockBarrel";

describe("dashboardFallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("withDashboardFallback", () => {
    it("returns result when inner function succeeds", async () => {
      const mockResult = { data: "test" };
      const fn = vi.fn().mockResolvedValue(mockResult);

      const result = await withDashboardFallback(fn, EMPTY_OPERATIONAL_DASHBOARD);

      expect(result).toEqual(mockResult);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("returns empty fallback when inner function throws and session is not demo", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("Supabase error"));
      vi.mocked(useInAppMockDataset).mockReturnValue(false);

      const result = await withDashboardFallback(fn, EMPTY_OPERATIONAL_DASHBOARD);

      expect(result).toEqual(EMPTY_OPERATIONAL_DASHBOARD);
      expect(useInAppMockDataset).toHaveBeenCalled();
      expect(loadMockBarrel).not.toHaveBeenCalled();
    });

    it("returns mock data when inner function throws, session is demo, and mock picker is provided", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("Supabase error"));
      const mockData = { mock: "data" };
      const mockBarrel = { test: "barrel" } as any;
      vi.mocked(useInAppMockDataset).mockReturnValue(true);
      vi.mocked(loadMockBarrel).mockResolvedValue(mockBarrel);

      const mockPicker = vi.fn().mockReturnValue(mockData);

      const result = await withDashboardFallback(fn, EMPTY_OPERATIONAL_DASHBOARD, mockPicker);

      expect(result).toEqual(mockData);
      expect(useInAppMockDataset).toHaveBeenCalled();
      expect(loadMockBarrel).toHaveBeenCalled();
      expect(mockPicker).toHaveBeenCalledWith(mockBarrel);
    });

    it("returns empty fallback when inner function throws, session is demo, but no mock picker provided", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("Supabase error"));
      vi.mocked(useInAppMockDataset).mockReturnValue(true);

      const result = await withDashboardFallback(fn, EMPTY_OPERATIONAL_DASHBOARD);

      expect(result).toEqual(EMPTY_OPERATIONAL_DASHBOARD);
      expect(useInAppMockDataset).toHaveBeenCalled();
      expect(loadMockBarrel).not.toHaveBeenCalled();
    });

    it("returns empty fallback when inner function throws, session is demo, but mock picker is not provided", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("Supabase error"));
      vi.mocked(useInAppMockDataset).mockReturnValue(true);

      const result = await withDashboardFallback(fn, EMPTY_OPERATIONAL_DASHBOARD, undefined);

      expect(result).toEqual(EMPTY_OPERATIONAL_DASHBOARD);
      expect(useInAppMockDataset).toHaveBeenCalled();
      expect(loadMockBarrel).not.toHaveBeenCalled();
    });
  });

  describe("EMPTY_OPERATIONAL_DASHBOARD", () => {
    it("has the expected structure", () => {
      expect(EMPTY_OPERATIONAL_DASHBOARD).toEqual({
        actions: [],
        queue: [],
        kpis: [],
      });
    });
  });
});
