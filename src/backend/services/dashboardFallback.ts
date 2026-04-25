import { useInAppMockDataset } from "./_sb";
import { loadMockBarrel } from "@/backend/api/mock/loadMockBarrel";
import type { MockBarrel } from "./demoOfflineMock";
import { EMPTY_OPERATIONAL_DASHBOARD } from "./liveEmptyDefaults";

/**
 * Generic wrapper for service calls that need graceful fallback on error.
 * Encapsulates the pattern used by admin and moderator services:
 * - Try the Supabase call
 * - On error, log a warning
 * - If in demo mode and a mock picker is provided, return mock data
 * - Otherwise, return the empty fallback
 */
export async function withDashboardFallback<T>(
  fn: () => Promise<T>,
  emptyFallback: T,
  mockPicker?: (m: MockBarrel) => T,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.warn("[CareNet Service] Supabase call failed, falling back:", error);
    if (mockPicker && useInAppMockDataset()) {
      const m = await loadMockBarrel();
      return mockPicker(m);
    }
    return emptyFallback;
  }
}

export { EMPTY_OPERATIONAL_DASHBOARD };
