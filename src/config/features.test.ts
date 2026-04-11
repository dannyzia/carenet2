import { describe, it, expect } from "vitest";
import { features } from "./features";

describe("features", () => {
  it("exposes boolean careSeekerCaregiverContactEnabled", () => {
    expect(typeof features.careSeekerCaregiverContactEnabled).toBe("boolean");
  });
});
