import { describe, it, expect } from "vitest";
import { packageEngagementStatusTransitionOk } from "./packageEngagementStatus";

describe("packageEngagementStatusTransitionOk", () => {
  it("allows no-op transitions", () => {
    expect(packageEngagementStatusTransitionOk("negotiating", "negotiating")).toBe(true);
  });

  it("allows draft → interested", () => {
    expect(packageEngagementStatusTransitionOk("draft", "interested")).toBe(true);
  });

  it("allows draft → applied (caregiver lane)", () => {
    expect(packageEngagementStatusTransitionOk("draft", "applied")).toBe(true);
  });

  it("rejects draft → negotiating when terminal shortcut disabled", () => {
    expect(packageEngagementStatusTransitionOk("draft", "negotiating", false)).toBe(false);
  });

  it("allows interested → negotiating", () => {
    expect(packageEngagementStatusTransitionOk("interested", "negotiating")).toBe(true);
  });

  it("allows negotiating → accepted (terminal shortcut)", () => {
    expect(packageEngagementStatusTransitionOk("negotiating", "accepted")).toBe(true);
  });
});
