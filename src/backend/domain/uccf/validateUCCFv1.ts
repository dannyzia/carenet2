/**
 * UCCF v1.0 structural validation aligned with `src/imports/packages-1.md`
 * (YAML + JSON schema sections). Throws before persistence so nothing invalid is stored.
 */
import type { CareContract, CareCategory } from "@/backend/models";
import { VALID_CARE_CATEGORIES, isCareCategory } from "./constants";

export class UCCFValidationError extends Error {
  constructor(public readonly issues: readonly string[]) {
    super(`UCCF v1 validation failed: ${issues.join("; ")}`);
    this.name = "UCCFValidationError";
  }
}

const DURATION: readonly string[] = ["short", "monthly", "long_term"];
const STAFF_LEVELS = new Set(["L1", "L2", "L3", "L4"]);
const HOURS = new Set([8, 12, 24]);
const SHIFT = new Set(["day", "night", "rotational"]);
const PATTERN = new Set(["single", "double", "rotational_team"]);
const PRICING_MODEL = new Set(["monthly", "daily", "hourly"]);
const REQUEST_PRICING_MODEL = new Set(["monthly", "daily"]);
const GENDER_PREF = new Set(["male", "female", "none"]);
const MOBILITY = new Set(["independent", "assisted", "bedridden"]);
const COGNITIVE = new Set(["normal", "impaired", "unconscious"]);
const RISK = new Set(["low", "medium", "high"]);
const SUBJECT_GENDER = new Set(["male", "female", "other"]);
const REPORTING = new Set(["daily", "weekly"]);

function nonEmpty(s: unknown): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

function minTitleLen(title: string): boolean {
  return title.trim().length >= 5;
}

/** Request (guardian/patient posting a care need). */
export function validateUCCFRequest(data: Partial<CareContract>): string[] {
  const issues: string[] = [];
  const meta = data.meta;
  if (!meta) {
    issues.push("meta is required");
    return issues;
  }
  if (meta.type !== "request") issues.push('meta.type must be "request"');
  if (!nonEmpty(meta.title) || !minTitleLen(String(meta.title))) {
    issues.push("meta.title is required (min length 5 per UCCF JSON schema)");
  }
  if (!Array.isArray(meta.category) || meta.category.length === 0) {
    issues.push("meta.category must be a non-empty array");
  } else {
    const bad = meta.category.filter((c) => !isCareCategory(String(c)));
    if (bad.length) issues.push(`meta.category contains invalid values: ${bad.join(", ")}`);
  }
  if (!meta.location || !nonEmpty(meta.location.city)) {
    issues.push("meta.location.city is required");
  }
  if (!meta.duration_type || !DURATION.includes(meta.duration_type)) {
    issues.push(`meta.duration_type must be one of: ${DURATION.join(", ")}`);
  }

  const party = data.party;
  if (!party) {
    issues.push("party is required");
  } else {
    if (party.role !== "patient") issues.push('party.role must be "patient" for requests');
    if (!nonEmpty(party.contact_phone)) issues.push("party.contact_phone is required");
    if (!nonEmpty(party.name)) issues.push("party.name is required");
  }

  const cs = data.care_subject;
  if (!cs) {
    issues.push("care_subject is required");
  } else {
    if (typeof cs.age !== "number" || cs.age < 0 || !Number.isFinite(cs.age)) {
      issues.push("care_subject.age must be a non-negative number");
    }
    if (!cs.mobility || !MOBILITY.has(cs.mobility)) {
      issues.push(`care_subject.mobility is required and must be one of: ${[...MOBILITY].join(", ")}`);
    }
    if (cs.gender != null && cs.gender !== "" && !SUBJECT_GENDER.has(cs.gender)) {
      issues.push("care_subject.gender must be male | female | other when set");
    }
    if (cs.cognitive != null && cs.cognitive !== "" && !COGNITIVE.has(cs.cognitive)) {
      issues.push("care_subject.cognitive must be normal | impaired | unconscious when set");
    }
    if (cs.risk_level != null && cs.risk_level !== "" && !RISK.has(cs.risk_level)) {
      issues.push("care_subject.risk_level must be low | medium | high when set");
    }
  }

  if (data.care_needs == null || typeof data.care_needs !== "object" || Array.isArray(data.care_needs)) {
    issues.push("care_needs must be an object (may be empty {})");
  }

  const st = data.staffing;
  if (!st) {
    issues.push("staffing is required");
  } else {
    if (!st.required_level || !STAFF_LEVELS.has(st.required_level)) {
      issues.push("staffing.required_level must be L1 | L2 | L3 | L4");
    }
    if (st.caregiver_count != null && (typeof st.caregiver_count !== "number" || st.caregiver_count < 0)) {
      issues.push("staffing.caregiver_count must be a non-negative integer when set");
    }
    if (st.nurse_count != null && (typeof st.nurse_count !== "number" || st.nurse_count < 0)) {
      issues.push("staffing.nurse_count must be a non-negative integer when set");
    }
    if (st.gender_preference != null && st.gender_preference !== "" && !GENDER_PREF.has(st.gender_preference)) {
      issues.push("staffing.gender_preference must be male | female | none when set");
    }
  }

  const sched = data.schedule;
  if (!sched) {
    issues.push("schedule is required");
  } else {
    if (sched.hours_per_day == null || !HOURS.has(sched.hours_per_day as 8 | 12 | 24)) {
      issues.push("schedule.hours_per_day must be 8 | 12 | 24");
    }
    if (!sched.shift_type || !SHIFT.has(sched.shift_type)) {
      issues.push("schedule.shift_type must be day | night | rotational");
    }
    if (!sched.staff_pattern || !PATTERN.has(sched.staff_pattern)) {
      issues.push("schedule.staff_pattern must be single | double | rotational_team");
    }
  }

  const pr = data.pricing as { budget_min?: number; budget_max?: number; preferred_model?: string } | undefined;
  if (pr == null || typeof pr !== "object") {
    issues.push("pricing is required");
  } else {
    if (!pr.preferred_model || !REQUEST_PRICING_MODEL.has(pr.preferred_model)) {
      issues.push("pricing.preferred_model must be monthly | daily");
    }
    if (pr.budget_min != null && (typeof pr.budget_min !== "number" || pr.budget_min < 0)) {
      issues.push("pricing.budget_min must be a non-negative number when set");
    }
    if (pr.budget_max != null && (typeof pr.budget_max !== "number" || pr.budget_max < 0)) {
      issues.push("pricing.budget_max must be a non-negative number when set");
    }
    if (
      pr.budget_min != null &&
      pr.budget_max != null &&
      pr.budget_min > pr.budget_max
    ) {
      issues.push("pricing.budget_min must be <= pricing.budget_max");
    }
  }

  return issues;
}

/** Offer (agency package). care_subject may be omitted or partial per §2.3 when describing a target cohort. */
export function validateUCCFOffer(data: Partial<CareContract>): string[] {
  const issues: string[] = [];
  const meta = data.meta;
  if (!meta) {
    issues.push("meta is required");
    return issues;
  }
  if (meta.type !== "offer") issues.push('meta.type must be "offer"');
  if (!nonEmpty(meta.title) || !minTitleLen(String(meta.title))) {
    issues.push("meta.title is required (min length 5 per UCCF JSON schema)");
  }
  if (!Array.isArray(meta.category) || meta.category.length === 0) {
    issues.push("meta.category must be a non-empty array");
  } else {
    const bad = meta.category.filter((c) => !isCareCategory(String(c)));
    if (bad.length) issues.push(`meta.category contains invalid values: ${bad.join(", ")}`);
  }
  if (!meta.location || !nonEmpty(meta.location.city)) {
    issues.push("meta.location.city is required");
  }
  if (!meta.duration_type || !DURATION.includes(meta.duration_type)) {
    issues.push(`meta.duration_type must be one of: ${DURATION.join(", ")}`);
  }

  const party = data.party;
  if (!party) {
    issues.push("party is required");
  } else {
    if (party.role !== "agency") issues.push('party.role must be "agency" for offers');
    if (!nonEmpty(party.contact_phone)) issues.push("party.contact_phone is required");
    if (!nonEmpty(party.name)) issues.push("party.name is required");
    if (!Array.isArray(party.service_area) || party.service_area.length === 0) {
      issues.push("party.service_area must be a non-empty array for agency offers");
    }
  }

  if (data.care_needs == null || typeof data.care_needs !== "object" || Array.isArray(data.care_needs)) {
    issues.push("care_needs must be an object (may be empty {})");
  }

  const st = data.staffing;
  if (!st) {
    issues.push("staffing is required");
  } else {
    if (!st.required_level || !STAFF_LEVELS.has(st.required_level)) {
      issues.push("staffing.required_level must be L1 | L2 | L3 | L4");
    }
    if (st.gender_preference != null && st.gender_preference !== "" && !GENDER_PREF.has(st.gender_preference)) {
      issues.push("staffing.gender_preference must be male | female | none when set");
    }
  }

  const sched = data.schedule;
  if (!sched) {
    issues.push("schedule is required");
  } else {
    if (sched.hours_per_day == null || !HOURS.has(sched.hours_per_day as 8 | 12 | 24)) {
      issues.push("schedule.hours_per_day must be 8 | 12 | 24");
    }
    if (!sched.shift_type || !SHIFT.has(sched.shift_type)) {
      issues.push("schedule.shift_type must be day | night | rotational");
    }
    if (!sched.staff_pattern || !PATTERN.has(sched.staff_pattern)) {
      issues.push("schedule.staff_pattern must be single | double | rotational_team");
    }
  }

  const po = data.pricing as {
    base_price?: number;
    pricing_model?: string;
    included_hours?: number;
    overtime_rate?: number;
  };
  if (po == null || typeof po !== "object") {
    issues.push("pricing is required");
  } else {
    if (po.base_price == null || typeof po.base_price !== "number" || po.base_price < 0) {
      issues.push("pricing.base_price must be a non-negative number for offers");
    }
    if (!po.pricing_model || !PRICING_MODEL.has(po.pricing_model)) {
      issues.push("pricing.pricing_model must be monthly | daily | hourly");
    }
  }

  if (data.care_subject != null) {
    const cs = data.care_subject;
    if (typeof cs.age === "number" && (cs.age < 0 || !Number.isFinite(cs.age))) {
      issues.push("care_subject.age must be a non-negative number when set");
    }
    if (cs.mobility != null && !MOBILITY.has(cs.mobility)) {
      issues.push("care_subject.mobility must be independent | assisted | bedridden when set");
    }
  }

  const sla = data.sla;
  if (sla?.reporting_frequency != null && sla.reporting_frequency !== "" && !REPORTING.has(sla.reporting_frequency)) {
    issues.push("sla.reporting_frequency must be daily | weekly when set");
  }

  return issues;
}

export function assertUCCFRequest(data: Partial<CareContract>): void {
  const issues = validateUCCFRequest(data);
  if (issues.length) throw new UCCFValidationError(issues);
}

export function assertUCCFOffer(data: Partial<CareContract>): void {
  const issues = validateUCCFOffer(data);
  if (issues.length) throw new UCCFValidationError(issues);
}
