import { loadMockBarrel } from "@/backend/api/mock/loadMockBarrel";
import { useInAppMockDataset } from "./_sb";

export type MockBarrel = Awaited<ReturnType<typeof loadMockBarrel>>;

/** After optional delay: empty for non-demo sessions; else pick from mock barrel. */
export async function demoOfflineDelayAndPick<T>(
  delayMs: number,
  empty: T,
  pick: (m: MockBarrel) => T,
): Promise<T> {
  await new Promise((r) => setTimeout(r, delayMs));
  if (!useInAppMockDataset()) return empty;
  const m = await loadMockBarrel();
  return pick(m);
}
