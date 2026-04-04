import { describe, it, expect } from "vitest";
import { computeSyncBackoffMs } from "../syncEngine";

describe("computeSyncBackoffMs", () => {
  it("returns 0 for first attempt", () => {
    expect(computeSyncBackoffMs(0)).toBe(0);
  });

  it("doubles each retry with 1s base", () => {
    expect(computeSyncBackoffMs(1)).toBe(1000);
    expect(computeSyncBackoffMs(2)).toBe(2000);
    expect(computeSyncBackoffMs(3)).toBe(4000);
  });

  it("caps at 30s", () => {
    expect(computeSyncBackoffMs(20)).toBe(30000);
  });
});
