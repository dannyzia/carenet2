import { describe, expect, it } from "vitest";
import { assertCompatiblePair } from "../assertCompatible";

describe("assertCompatiblePair", () => {
  it("accepts package_gac + package_caregiver", () => {
    expect(() =>
      assertCompatiblePair(
        { contract_party_scope: "guardian_agency", gac_kind: "package_gac", staffing_channel: null },
        { contract_party_scope: "caregiver_agency", gac_kind: null, staffing_channel: "package_caregiver" },
      ),
    ).not.toThrow();
  });

  it("accepts request_gac + forwarded_requirement", () => {
    expect(() =>
      assertCompatiblePair(
        { contract_party_scope: "guardian_agency", gac_kind: "request_gac", staffing_channel: null },
        { contract_party_scope: "caregiver_agency", gac_kind: null, staffing_channel: "forwarded_requirement" },
      ),
    ).not.toThrow();
  });

  it("rejects package_gac with forwarded_requirement", () => {
    expect(() =>
      assertCompatiblePair(
        { contract_party_scope: "guardian_agency", gac_kind: "package_gac", staffing_channel: null },
        { contract_party_scope: "caregiver_agency", gac_kind: null, staffing_channel: "forwarded_requirement" },
      ),
    ).toThrow(/Package-GAC requires package_caregiver/);
  });

  it("rejects request_gac with package_caregiver", () => {
    expect(() =>
      assertCompatiblePair(
        { contract_party_scope: "guardian_agency", gac_kind: "request_gac", staffing_channel: null },
        { contract_party_scope: "caregiver_agency", gac_kind: null, staffing_channel: "package_caregiver" },
      ),
    ).toThrow(/Request-GAC requires forwarded_requirement/);
  });
});
