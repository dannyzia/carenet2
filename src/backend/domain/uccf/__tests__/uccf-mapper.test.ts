import { describe, it, expect } from "vitest";
import { careContractToSupabaseRow } from "../careContractToSupabaseRow";
import { mapSupabaseContractRow } from "../mapSupabaseContractRow";
import type { CareContract, UCCFPricingOffer, UCCFPricingRequest } from "@/backend/models";

describe("UCCF care_contracts row mapping", () => {
  it("round-trips a request: flat columns, JSONB, preferred_model", () => {
    const partial: Partial<CareContract> = {
      meta: {
        type: "request",
        title: "Test request",
        category: ["post_surgery"],
        location: { city: "Chattogram", area: "Agrabad", address_optional: "Rd 1" },
        duration_type: "short",
        start_date: "2026-05-01",
      },
      party: {
        role: "patient",
        name: "Ada",
        contact_phone: "+8801",
        contact_whatsapp: "+8802",
      },
      care_subject: {
        age: 72,
        gender: "female",
        condition_summary: "post hip",
        mobility: "assisted",
        cognitive: "normal",
        risk_level: "medium",
      },
      medical: {
        diagnosis: "OA",
        comorbidities: ["htn"],
        devices: ["oxygen"],
        procedures_required: ["wound_care"],
        medication_complexity: "medium",
      },
      care_needs: { companionship: true, ADL: { bathing: true } },
      staffing: { required_level: "L3", caregiver_count: 2, nurse_count: 1 },
      schedule: { hours_per_day: 12, shift_type: "day", staff_pattern: "double" },
      services: { personal_care: ["bathing"] },
      logistics: { location_type: "home", food_provided: true },
      equipment: { required: ["hospital_bed"], provider: "mixed" },
      pricing: { budget_min: 10000, budget_max: 20000, preferred_model: "daily" },
      exclusions: ["heavy_household_work"],
      add_ons: ["physiotherapy"],
    };

    const row = careContractToSupabaseRow(partial, {
      kind: "request",
      ownerId: "00000000-0000-0000-0000-000000000001",
      createdAtIso: "2026-01-01T00:00:00.000Z",
      expiresAtIso: "2026-01-16T00:00:00.000Z",
    });

    const hydrated = mapSupabaseContractRow({ ...row, id: "00000000-0000-0000-0000-000000000099" });

    expect(hydrated.meta.category).toEqual(["post_surgery"]);
    expect(hydrated.meta.duration_type).toBe("short");
    expect(hydrated.meta.location.city).toBe("Chattogram");
    expect(hydrated.party.contact_whatsapp).toBe("+8802");
    const pr = hydrated.pricing as UCCFPricingRequest;
    expect(pr.preferred_model).toBe("daily");
    expect(pr.budget_min).toBe(10000);
    expect(pr.budget_max).toBe(20000);
    expect(hydrated.care_subject?.condition_summary).toBe("post hip");
    expect(hydrated.schedule?.staff_pattern).toBe("double");
    expect(hydrated.equipment?.required).toEqual(["hospital_bed"]);
    expect(hydrated.medical?.diagnosis).toBe("OA");
    expect(hydrated.care_needs?.companionship).toBe(true);
  });

  it("round-trips an offer: agency columns and offer pricing", () => {
    const partial: Partial<CareContract> = {
      meta: {
        type: "offer",
        title: "Premium package",
        category: ["elderly"],
        location: { city: "Dhaka" },
        duration_type: "monthly",
      },
      party: { role: "agency", name: "Acme Care", contact_phone: "+8801700000000" },
      staffing: { required_level: "L2", caregiver_count: 1 },
      pricing: {
        base_price: 50000,
        pricing_model: "monthly",
        included_hours: 160,
        overtime_rate: 500,
        extra_charges: ["doctor_visit"],
      },
    };

    const row = careContractToSupabaseRow(partial, {
      kind: "offer",
      ownerId: "00000000-0000-0000-0000-000000000002",
      createdAtIso: "2026-01-01T00:00:00.000Z",
      agency: {
        id: "00000000-0000-0000-0000-000000000003",
        name: "Acme Care",
        rating: 4.5,
        verified: true,
        subscribers: 12,
        featured: true,
      },
    });

    expect(row.agency_id).toBe("00000000-0000-0000-0000-000000000003");
    expect(row.owner_id).toBe("00000000-0000-0000-0000-000000000002");

    const hydrated = mapSupabaseContractRow({ ...row, id: "00000000-0000-0000-0000-0000000000aa" });
    const po = hydrated.pricing as UCCFPricingOffer;
    expect(po.base_price).toBe(50000);
    expect(po.pricing_model).toBe("monthly");
    expect(po.included_hours).toBe(160);
    expect(po.overtime_rate).toBe(500);
    expect(po.extra_charges).toContain("doctor_visit");
  });
});
