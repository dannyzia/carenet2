/**
 * Map UCCF CareContract (partial) → Supabase `care_contracts` row shape.
 * Matches columns in supabase/migrations/20260318_full_domain_schema.sql
 */
import type {
  CareContract,
  DurationType,
  UCCFPricingOffer,
  UCCFPricingRequest,
} from "@/backend/models";
import { isCareCategory } from "./constants";
import { normalizeCareSubject, type CareSubjectInput } from "./normalizeCareSubject";

export type ContractKind = "request" | "offer";

export interface BuildSupabaseRowOptions {
  kind: ContractKind;
  ownerId: string;
  createdAtIso: string;
  expiresAtIso?: string | null;
  bidCount?: number;
  status?: string;
  agency?: {
    id: string;
    name: string;
    rating?: number;
    verified?: boolean;
    subscribers?: number;
    featured?: boolean;
  };
}

function resolveStaffPattern(sched?: { staff_pattern?: string; pattern?: string }): "single" | "double" | "rotational_team" {
  const sp = sched?.staff_pattern;
  if (sp === "double" || sp === "rotational_team" || sp === "single") return sp;
  const patternKey = String(sched?.pattern ?? "daily");
  const map: Record<string, "single" | "double" | "rotational_team"> = {
    daily: "single",
    weekly: "single",
    "live-in": "single",
    "as-needed": "single",
  };
  return map[patternKey] ?? "single";
}

function hoursPerDay(v?: number): 8 | 12 | 24 {
  if (v === 12 || v === 24) return v;
  return 8;
}

function shiftType(sched?: { shift_type?: string }, scheduleTypeFallback?: string): "day" | "night" | "rotational" {
  if (sched?.shift_type === "night" || sched?.shift_type === "rotational" || sched?.shift_type === "day") {
    return sched.shift_type;
  }
  return scheduleTypeFallback === "night" ? "night" : "day";
}

export function careContractToSupabaseRow(
  data: Partial<CareContract>,
  opts: BuildSupabaseRowOptions,
): Record<string, unknown> {
  const meta = data.meta;
  const rawCats = Array.isArray(meta?.category) ? meta!.category!.map(String) : [];
  const categories = rawCats.filter(isCareCategory);
  const titleRaw = (meta?.title && String(meta.title).trim()) || "";
  const title = titleRaw.length > 0 ? titleRaw : opts.kind === "offer" ? "Care package" : "Care request";

  const durationType: DurationType = meta?.duration_type ?? "monthly";

  const careNorm = normalizeCareSubject(data.care_subject as CareSubjectInput | undefined);

  const staff = data.staffing;
  const sched = data.schedule as
    | {
        hours_per_day?: number;
        shift_type?: string;
        staff_pattern?: string;
        pattern?: string;
        start_date?: string;
      }
    | undefined;

  const party = data.party;

  const medical = data.medical;
  const careNeeds = data.care_needs && typeof data.care_needs === "object" ? data.care_needs : {};
  const services = data.services && typeof data.services === "object" ? data.services : undefined;
  const logistics = data.logistics;
  const equipment = data.equipment;
  const sla = data.sla;
  const compliance = data.compliance;

  const exclusions = Array.isArray(data.exclusions) ? data.exclusions.map(String) : [];
  const addOns = Array.isArray(data.add_ons) ? data.add_ons.map(String) : [];

  const row: Record<string, unknown> = {
    owner_id: opts.ownerId,
    type: opts.kind,
    status: opts.status ?? "draft",
    created_at: opts.createdAtIso,
    bid_count: opts.bidCount ?? 0,
    title,
    categories: categories.length > 0 ? categories : ["elderly"],
    city: meta?.location?.city ?? null,
    area: meta?.location?.area ?? null,
    address: meta?.location?.address_optional ?? null,
    start_date: meta?.start_date ?? (sched?.start_date ?? null),
    duration_type: durationType,

    party_role: party?.role ?? (opts.kind === "offer" ? "agency" : "patient"),
    party_name: party?.name ?? "",
    party_phone: party?.contact_phone ?? null,
    party_whatsapp: party?.contact_whatsapp ?? null,
    organization: party?.organization_name ?? null,
    service_areas: Array.isArray(party?.service_area) ? party!.service_area! : [],

    subject_age: careNorm.age > 0 ? careNorm.age : null,
    subject_gender: careNorm.gender ?? null,
    condition_summary: careNorm.condition_summary ?? null,
    mobility: careNorm.mobility,
    cognitive: careNorm.cognitive ?? null,
    risk_level: careNorm.risk_level ?? null,

    diagnosis: medical?.diagnosis ?? null,
    comorbidities: Array.isArray(medical?.comorbidities) ? medical!.comorbidities! : [],
    devices: Array.isArray(medical?.devices) ? medical!.devices!.map(String) : [],
    procedures_required: Array.isArray(medical?.procedures_required)
      ? medical!.procedures_required!.map(String)
      : [],
    medication_complexity: medical?.medication_complexity ?? null,

    care_needs: careNeeds,

    caregiver_count: staff?.caregiver_count ?? 1,
    nurse_count: staff?.nurse_count ?? 0,
    required_level: staff?.required_level ?? "L2",
    gender_preference: staff?.gender_preference ?? "none",
    experience_years: staff?.experience_years ?? null,
    certifications_required: Array.isArray(staff?.certifications_required) ? staff!.certifications_required! : [],

    hours_per_day: hoursPerDay(sched?.hours_per_day),
    shift_type: shiftType(sched),
    staff_pattern: resolveStaffPattern(sched),

    services: services ?? {},

    location_type: logistics?.location_type ?? null,
    accommodation_provided: logistics?.accommodation_provided ?? null,
    food_provided: logistics?.food_provided ?? null,
    travel_distance_km: logistics?.travel_distance_km ?? null,

    equipment_required: Array.isArray(equipment?.required) ? equipment!.required!.map(String) : [],
    equipment_provider: equipment?.provider ?? null,

    replacement_time_hours: sla?.replacement_time_hours ?? null,
    emergency_response_minutes: sla?.emergency_response_minutes ?? null,
    attendance_guarantee_percent: sla?.attendance_guarantee_percent ?? null,
    reporting_frequency: sla?.reporting_frequency ?? null,

    background_verified: compliance?.background_verified ?? null,
    medical_fit: compliance?.medical_fit ?? null,
    contract_required: compliance?.contract_required ?? null,
    trial_available: compliance?.trial_available ?? null,

    exclusions,
    add_ons: addOns,
  };

  if (opts.expiresAtIso) {
    row.expires_at = opts.expiresAtIso;
  }

  const preq = data.pricing as UCCFPricingRequest & { pricing_model?: string } | undefined;
  const poff = data.pricing as UCCFPricingOffer | undefined;

  if (opts.kind === "request") {
    const bm = preq?.budget_min != null ? Number(preq.budget_min) : null;
    const bx = preq?.budget_max != null ? Number(preq.budget_max) : null;
    const pref =
      preq?.preferred_model === "daily" || preq?.preferred_model === "hourly"
        ? preq.preferred_model
        : preq?.pricing_model === "daily" || preq?.pricing_model === "hourly"
          ? preq.pricing_model
          : "monthly";
    row.budget_min = bm != null && !Number.isNaN(bm) ? bm : null;
    row.budget_max = bx != null && !Number.isNaN(bx) ? bx : null;
    row.preferred_pricing_model = pref;
    row.base_price = null;
    row.pricing_model = null;
    row.included_hours = null;
    row.overtime_rate = null;
    row.extra_charges = [];
  } else {
    row.budget_min = null;
    row.budget_max = null;
    row.preferred_pricing_model = null;
    row.base_price = poff?.base_price != null ? Number(poff.base_price) : null;
    row.pricing_model =
      poff?.pricing_model === "daily" || poff?.pricing_model === "hourly" || poff?.pricing_model === "monthly"
        ? poff.pricing_model
        : "monthly";
    row.included_hours = poff?.included_hours ?? null;
    row.overtime_rate = poff?.overtime_rate != null ? Number(poff.overtime_rate) : null;
    row.extra_charges = Array.isArray(poff?.extra_charges) ? poff!.extra_charges!.map(String) : [];
  }

  if (opts.kind === "offer" && opts.agency) {
    row.agency_id = opts.agency.id;
    row.agency_name = opts.agency.name;
    row.agency_rating = opts.agency.rating ?? null;
    row.agency_verified = opts.agency.verified ?? false;
    row.subscribers = opts.agency.subscribers ?? 0;
    row.featured = opts.agency.featured ?? false;
  }

  return row;
}
