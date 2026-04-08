/**
 * UCCF v1.0 option lists aligned with src/imports/packages-1.md
 */
import type { CareCategory, MedicalDevice, MedicalProcedure } from "@/backend/models";

export const VALID_CARE_CATEGORIES: readonly CareCategory[] = [
  "elderly",
  "post_surgery",
  "chronic",
  "critical",
  "baby",
  "disability",
] as const;

export function isCareCategory(v: string): v is CareCategory {
  return (VALID_CARE_CATEGORIES as readonly string[]).includes(v);
}

/** Service checklist buckets → allowed slugs (packages-1.md §2.8) */
export const UCCF_SERVICE_OPTIONS: Record<string, readonly string[]> = {
  personal_care: ["bathing", "grooming", "toileting"],
  medical_support: ["medication", "vitals", "wound_care"],
  household_support: ["patient_laundry", "meal_prep"],
  advanced_care: ["NG_tube", "suction", "oxygen"],
  coordination: ["doctor_visit", "hospital_support"],
} as const;

export const UCCF_EXCLUSION_OPTIONS = [
  "heavy_household_work",
  "non_patient_tasks",
  "high_risk_procedures",
] as const;

export const UCCF_ADD_ON_OPTIONS = [
  "doctor_visit",
  "physiotherapy",
  "ambulance",
  "diagnostics",
] as const;

export const UCCF_EQUIPMENT_SLUGS = [
  "hospital_bed",
  "oxygen",
  "monitor",
] as const;

export const UCCF_MEDICAL_DEVICES: readonly MedicalDevice[] = [
  "oxygen",
  "catheter",
  "feeding_tube",
  "ventilator",
] as const;

export const UCCF_MEDICAL_PROCEDURES: readonly MedicalProcedure[] = [
  "injection",
  "IV",
  "suction",
  "wound_care",
] as const;
