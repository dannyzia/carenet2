/**
 * Map Supabase `care_contracts` row → UCCF CareContract (hydrate flat columns + JSONB).
 */
import type {
  CareCategory,
  CareContract,
  ContractStatus,
  UCCFCompliance,
  UCCFCareNeeds,
  UCCFCareSubject,
  UCCFEquipment,
  UCCFLogistics,
  UCCFMedical,
  UCCFMeta,
  UCCFParty,
  UCCFPricingOffer,
  UCCFPricingRequest,
  UCCFSchedule,
  UCCFServices,
  UCCFSLA,
  UCCFStaffing,
  UCCFType,
} from "@/backend/models";
import { isCareCategory } from "./constants";

function parseJsonField(d: Record<string, unknown>, key: string): unknown {
  const v = d[key];
  if (v == null) return undefined;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(String(v));
  } catch {
    return undefined;
  }
}

function parseStringArray(key: string, d: Record<string, unknown>): string[] {
  const v = d[key];
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p.map(String) : [v];
    } catch {
      return [v];
    }
  }
  return [];
}

function parseCategories(d: Record<string, unknown>): CareCategory[] {
  const raw = parseStringArray("categories", d);
  const filtered = raw.filter(isCareCategory);
  return filtered.length > 0 ? filtered : ["elderly"];
}

export function mapSupabaseContractRow(d: Record<string, unknown>): CareContract {
  const type = (d.type as UCCFType) ?? "request";

  const meta: UCCFMeta = {
    type,
    title: (d.title as string) ?? "",
    category: parseCategories(d),
    location: {
      city: (d.city as string) ?? "",
      area: (d.area as string) ?? undefined,
      address_optional: (d.address as string) ?? undefined,
    },
    start_date: (d.start_date as string) ?? undefined,
    duration_type: (d.duration_type as UCCFMeta["duration_type"]) ?? "monthly",
  };

  const party: UCCFParty = {
    role: (d.party_role as UCCFParty["role"]) ?? (type === "offer" ? "agency" : "patient"),
    name: (d.party_name as string) ?? "",
    contact_phone: (d.party_phone as string) ?? "",
    contact_whatsapp: (d.party_whatsapp as string) ?? undefined,
    organization_name: (d.organization as string) ?? undefined,
    service_area: parseStringArray("service_areas", d),
  };

  const care_subject: UCCFCareSubject | undefined = (() => {
    const j = parseJsonField(d, "care_subject") as UCCFCareSubject | undefined;
    if (j && typeof j === "object" && "age" in j) return j;
    if (
      d.subject_age != null ||
      d.condition_summary != null ||
      d.mobility != null ||
      d.subject_gender != null
    ) {
      const summary = d.condition_summary != null ? String(d.condition_summary) : undefined;
      const mobility = (d.mobility as UCCFCareSubject["mobility"]) ?? "assisted";
      return {
        age: d.subject_age != null ? Number(d.subject_age) : 0,
        gender: d.subject_gender as UCCFCareSubject["gender"] | undefined,
        condition_summary: summary,
        mobility,
        cognitive: d.cognitive as UCCFCareSubject["cognitive"] | undefined,
        risk_level: d.risk_level as UCCFCareSubject["risk_level"] | undefined,
      };
    }
    return undefined;
  })();

  const medical: UCCFMedical | undefined = (() => {
    const j = parseJsonField(d, "medical") as UCCFMedical | undefined;
    if (j && typeof j === "object") return j;
    if (
      d.diagnosis != null ||
      (Array.isArray(d.comorbidities) && (d.comorbidities as unknown[]).length > 0) ||
      (Array.isArray(d.devices) && (d.devices as unknown[]).length > 0)
    ) {
      return {
        diagnosis: d.diagnosis as string | undefined,
        comorbidities: parseStringArray("comorbidities", d),
        devices: parseStringArray("devices", d) as UCCFMedical["devices"],
        procedures_required: parseStringArray("procedures_required", d) as UCCFMedical["procedures_required"],
        medication_complexity: d.medication_complexity as UCCFMedical["medication_complexity"] | undefined,
      };
    }
    return undefined;
  })();

  const care_needs = (() => {
    const j = parseJsonField(d, "care_needs") as UCCFCareNeeds | undefined;
    if (j && typeof j === "object") return j;
    return {};
  })();

  const staffing: UCCFStaffing = (() => {
    const j = parseJsonField(d, "staffing") as UCCFStaffing | undefined;
    if (j && typeof j === "object" && j.required_level) return j;
    return {
      required_level: (d.required_level as UCCFStaffing["required_level"]) ?? "L2",
      caregiver_count: (d.caregiver_count as number) ?? 1,
      nurse_count: (d.nurse_count as number) ?? undefined,
      gender_preference: d.gender_preference as UCCFStaffing["gender_preference"] | undefined,
      experience_years: d.experience_years != null ? Number(d.experience_years) : undefined,
      certifications_required: parseStringArray("certifications_required", d),
    };
  })();

  const schedule: UCCFSchedule | undefined = (() => {
    const j = parseJsonField(d, "schedule") as UCCFSchedule | undefined;
    if (j && typeof j === "object") return j;
    if (d.hours_per_day != null || d.shift_type != null || d.staff_pattern != null) {
      const staff_pattern = d.staff_pattern as UCCFSchedule["staff_pattern"] | undefined;
      return {
        hours_per_day: d.hours_per_day as UCCFSchedule["hours_per_day"] | undefined,
        shift_type: d.shift_type as UCCFSchedule["shift_type"] | undefined,
        staff_pattern: staff_pattern ?? "single",
      };
    }
    return undefined;
  })();

  const services = (() => {
    const j = parseJsonField(d, "services") as UCCFServices | undefined;
    if (j && typeof j === "object") return j;
    return {} as UCCFServices;
  })();

  const logistics: UCCFLogistics | undefined = (() => {
    const j = parseJsonField(d, "logistics") as UCCFLogistics | undefined;
    if (j && typeof j === "object") return j;
    if (
      d.location_type != null ||
      d.accommodation_provided != null ||
      d.food_provided != null ||
      d.travel_distance_km != null
    ) {
      return {
        location_type: d.location_type as UCCFLogistics["location_type"] | undefined,
        accommodation_provided: d.accommodation_provided as boolean | undefined,
        food_provided: d.food_provided as boolean | undefined,
        travel_distance_km: d.travel_distance_km != null ? Number(d.travel_distance_km) : undefined,
      };
    }
    return undefined;
  })();

  const equipment: UCCFEquipment | undefined = (() => {
    const j = parseJsonField(d, "equipment") as UCCFEquipment | undefined;
    if (j && typeof j === "object") return j;
    const req = parseStringArray("equipment_required", d);
    if (req.length > 0 || d.equipment_provider != null) {
      return {
        required: req,
        provider: d.equipment_provider as UCCFEquipment["provider"] | undefined,
      };
    }
    return undefined;
  })();

  const pricing: UCCFPricingRequest | UCCFPricingOffer = (() => {
    const j = parseJsonField(d, "pricing");
    if (j && typeof j === "object") return j as UCCFPricingRequest | UCCFPricingOffer;
    if (type === "offer") {
      const off: UCCFPricingOffer = {
        base_price: d.base_price != null ? Number(d.base_price) : undefined,
        pricing_model: (d.pricing_model as UCCFPricingOffer["pricing_model"]) ?? "monthly",
        included_hours: d.included_hours != null ? Number(d.included_hours) : undefined,
        overtime_rate: d.overtime_rate != null ? Number(d.overtime_rate) : undefined,
        extra_charges: parseStringArray("extra_charges", d),
      };
      return off;
    }
    const req: UCCFPricingRequest = {
      budget_min: d.budget_min != null ? Number(d.budget_min) : undefined,
      budget_max: d.budget_max != null ? Number(d.budget_max) : undefined,
      preferred_model:
        (d.preferred_pricing_model as UCCFPricingRequest["preferred_model"]) ?? "monthly",
    };
    return req;
  })();

  const sla: UCCFSLA | undefined = (() => {
    const j = parseJsonField(d, "sla") as UCCFSLA | undefined;
    if (j && typeof j === "object") return j;
    if (
      d.replacement_time_hours != null ||
      d.emergency_response_minutes != null ||
      d.attendance_guarantee_percent != null ||
      d.reporting_frequency != null
    ) {
      return {
        replacement_time_hours:
          d.replacement_time_hours != null ? Number(d.replacement_time_hours) : undefined,
        emergency_response_minutes:
          d.emergency_response_minutes != null ? Number(d.emergency_response_minutes) : undefined,
        attendance_guarantee_percent:
          d.attendance_guarantee_percent != null ? Number(d.attendance_guarantee_percent) : undefined,
        reporting_frequency: d.reporting_frequency as UCCFSLA["reporting_frequency"] | undefined,
      };
    }
    return undefined;
  })();

  const compliance: UCCFCompliance | undefined = (() => {
    const j = parseJsonField(d, "compliance") as UCCFCompliance | undefined;
    if (j && typeof j === "object") return j;
    if (
      d.background_verified != null ||
      d.medical_fit != null ||
      d.contract_required != null ||
      d.trial_available != null
    ) {
      return {
        background_verified: d.background_verified as boolean | undefined,
        medical_fit: d.medical_fit as boolean | undefined,
        contract_required: d.contract_required as boolean | undefined,
        trial_available: d.trial_available as boolean | undefined,
      };
    }
    return undefined;
  })();

  return {
    id: String(d.id ?? ""),
    meta,
    party,
    care_subject,
    medical,
    care_needs,
    staffing,
    schedule,
    services,
    logistics,
    equipment,
    pricing,
    sla,
    compliance,
    exclusions: parseStringArray("exclusions", d),
    add_ons: parseStringArray("add_ons", d),
    status: (d.status as ContractStatus) ?? "draft",
    created_at: (d.created_at as string) ?? new Date().toISOString(),
    updated_at: (d.updated_at as string) ?? undefined,
    published_at: (d.published_at as string) ?? undefined,
    expires_at: (d.expires_at as string) ?? undefined,
    bid_count: (d.bid_count as number) ?? 0,
    match_score: d.match_score != null ? Number(d.match_score) : undefined,
  };
}
