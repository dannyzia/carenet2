import { describe, expect, it } from "vitest";
import {
  canTransition,
  nextPrimaryState,
  type PrimaryLifecycleState,
} from "../contractLifecycle";

describe("contractLifecycle", () => {
  it("allows draft → published and draft → cancelled", () => {
    expect(canTransition("draft", "published")).toBe(true);
    expect(canTransition("draft", "cancelled")).toBe(true);
    expect(canTransition("draft", "locked")).toBe(false);
  });

  it("steps primary chain", () => {
    const chain: PrimaryLifecycleState[] = [
      "draft",
      "published",
      "matched",
      "bidding",
      "locked",
      "booked",
      "active",
      "completed",
      "rated",
    ];
    for (let i = 0; i < chain.length - 1; i++) {
      expect(canTransition(chain[i], chain[i + 1])).toBe(true);
      expect(nextPrimaryState(chain[i])).toBe(chain[i + 1]);
    }
    expect(nextPrimaryState("rated")).toBeUndefined();
  });

  it("allows operational failures from active", () => {
    expect(canTransition("active", "completed")).toBe(true);
    expect(canTransition("active", "replacement_required")).toBe(true);
    expect(canTransition("active", "escalated")).toBe(true);
  });

  it("allows re-post to published from terminal-ish states", () => {
    expect(canTransition("cancelled", "published")).toBe(true);
    expect(canTransition("locked", "published")).toBe(true);
    expect(canTransition("rated", "published")).toBe(true);
  });
});
