import { isDemoSession } from "@/backend/services/_sb";

/**
 * Dynamic import of mock barrel — code-split from the main bundle.
 * In the browser, only a demo session may load fabricated rows. Callers should still gate with
 * `useInAppMockDataset()` before using results. Node (no `window`) allows import for tests.
 */
export function loadMockBarrel() {
  if (typeof window !== "undefined" && !isDemoSession()) {
    throw new Error(
      "[CareNet] loadMockBarrel() is only allowed for demo sessions. Use empty defaults for non-demo users.",
    );
  }
  return import("@/backend/api/mock");
}
