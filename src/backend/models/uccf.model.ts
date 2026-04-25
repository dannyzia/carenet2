/**
 * Unified Care Contract Format (UCCF v1.0)
 * ──────────────────────────────────────────
 * Source of truth for marketplace: requests (guardian) and offers/packages (agency).
 * Bids bridge the two with field-level compliance tracking + remarks.
 */

// ─── Enums / Unions ───

export type UCCFType = "request" | "offer";

export type CareCategory = "elderly" | "post_surgery" | "chronic" | "critical" | "baby" | "disability";

export type DurationType = "short" | "monthly" | "long_term";

export type Mobility = "independent" | "assisted" | "bedridden";
export type Cognitive = "normal" | "impaired" | "unconscious";
export type RiskLevel = "low" | "medium" | "high";

export type MedicalDevice = "oxygen" | "catheter" | "feeding_tube" | "ventilator";
export type MedicalProcedure = "injection" | "IV" | "suction" | "wound_care";
export type MedicationComplexity = "low" | "medium" | "high";

export type FeedingType = "oral" | "tube";
export type ToiletingLevel = "assisted" | "full";

export type StaffLevel = "L1" | "L2" | "L3" | "L4";
export type GenderPreference = "male" | "female" | "none";

export type HoursPerDay = 8 | 12 | 24;
export type ShiftType = "day" | "night" | "rotational";
export type StaffPattern = "single" | "double" | "rotational_team";

export type PricingModel = "monthly" | "daily" | "hourly";

export type LocationType = "home" | "hospital";
export type EquipmentProvider = "patient" | "agency" | "mixed";

export type ReportingFrequency = "daily" | "weekly";

export type ContractStatus =
  | "draft"
  | "published"
  | "matched"
  | "bidding"
  | "locked"
  | "booked"
  | "active"
  | "completed"
  | "rated"
  | "cancelled"
  /** Operational anomalies (DB + lifecycle; see contractLifecycle.ts) */
  | "no_show"
  | "replacement_required"
  | "escalated"
  | "refunded";

export type BidStatus = "pending" | "accepted" | "rejected" | "countered" | "expired" | "withdrawn";

// ─── UCCF Sections ───

export interface UCCFMeta {
  type: UCCFType;
  title: string;
  category: CareCategory[];
  location: {
    city: string;
    area?: string;
    address_optional?: string;
  };
  start_date?: string;
  duration_type: DurationType;
}

export interface UCCFParty {
  role: "patient" | "agency";
  name: string;
  contact_phone: string;
  contact_whatsapp?: string;
  organization_name?: string;
  service_area?: string[];
}

export interface UCCFCareSubject {
  age: number;
  gender?: "male" | "female" | "other";
  condition_summary?: string;
  mobility: Mobility;
  cognitive?: Cognitive;
  risk_level?: RiskLevel;
}

export interface UCCFMedical {
  diagnosis?: string;
  comorbidities?: string[];
  devices?: MedicalDevice[];
  procedures_required?: MedicalProcedure[];
  medication_complexity?: MedicationComplexity;
}

export interface UCCFCareNeeds {
  ADL?: {
    bathing?: boolean;
    feeding?: FeedingType;
    toileting?: ToiletingLevel;
    mobility_support?: boolean;
  };
  monitoring?: {
    vitals?: boolean;
    continuous_supervision?: boolean;
  };
  companionship?: boolean;
}

export interface UCCFStaffing {
  caregiver_count?: number;
  nurse_count?: number;
  required_level: StaffLevel;
  gender_preference?: GenderPreference;
  experience_years?: number;
  certifications_required?: string[];
}

export interface UCCFSchedule {
  hours_per_day?: HoursPerDay;
  shift_type?: ShiftType;
  staff_pattern?: StaffPattern;
  /** Preferred shift start time as HH:MM (24-hour). Only applicable for 8h/12h shifts. */
  shift_start_time?: string;
}

export interface UCCFServices {
  personal_care?: string[];
  medical_support?: string[];
  household_support?: string[];
  advanced_care?: string[];
  coordination?: string[];
}

export interface UCCFLogistics {
  location_type?: LocationType;
  accommodation_provided?: boolean;
  food_provided?: boolean;
  travel_distance_km?: number;
}

export interface UCCFEquipment {
  required?: string[];
  provider?: EquipmentProvider;
}

/** Patient-side pricing (budget range) */
export interface UCCFPricingRequest {
  budget_min?: number;
  budget_max?: number;
  preferred_model?: PricingModel;
}

/** Agency-side pricing (fixed + extras) */
export interface UCCFPricingOffer {
  base_price?: number;
  pricing_model?: PricingModel;
  included_hours?: number;
  overtime_rate?: number;
  extra_charges?: string[];
}

export interface UCCFSLA {
  replacement_time_hours?: number;
  emergency_response_minutes?: number;
  attendance_guarantee_percent?: number;
  reporting_frequency?: ReportingFrequency;
}

export interface UCCFCompliance {
  background_verified?: boolean;
  medical_fit?: boolean;
  contract_required?: boolean;
  trial_available?: boolean;
}

// ─── Full Contract ───

export interface CareContract {
  id: string;
  meta: UCCFMeta;
  party: UCCFParty;
  care_subject?: UCCFCareSubject;
  medical?: UCCFMedical;
  care_needs?: UCCFCareNeeds;
  staffing: UCCFStaffing;
  schedule?: UCCFSchedule;
  services?: UCCFServices;
  logistics?: UCCFLogistics;
  equipment?: UCCFEquipment;
  pricing: UCCFPricingRequest | UCCFPricingOffer;
  sla?: UCCFSLA;
  compliance?: UCCFCompliance;
  exclusions?: string[];
  add_ons?: string[];

  // System fields
  status: ContractStatus;
  created_at: string;
  updated_at?: string;
  published_at?: string;
  expires_at?: string;          // Auto-enforced: max 15 days from published_at
  bid_count?: number;
  match_score?: number;
}

// ─── Agency Package (published offer template) ───

export interface AgencyPackage extends CareContract {
  meta: UCCFMeta & { type: "offer" };
  pricing: UCCFPricingOffer;
  agency_id: string;
  agency_name: string;
  agency_rating?: number;
  agency_verified?: boolean;
  subscribers?: number;
  featured?: boolean;
}

// ─── Bid System ───

/** Compliance status for a single UCCF field */
export type ComplianceStatus = "met" | "partial" | "unmet" | "not_applicable";

export interface BidComplianceItem {
  field: string;           // e.g. "staffing.required_level"
  label: string;           // e.g. "Staff Level"
  required_value: string;  // What the request asks for
  offered_value: string;   // What the bid offers
  status: ComplianceStatus;
  remark?: string;         // Agency's explanation if partial/unmet
}

export interface BidComplianceSection {
  section: string;         // e.g. "staffing", "care_needs", "schedule"
  label: string;
  items: BidComplianceItem[];
  section_score: number;   // 0-100
}

export interface BidComplianceSummary {
  overall_score: number;   // 0-100
  met_count: number;
  partial_count: number;
  unmet_count: number;
  total_count: number;
  sections: BidComplianceSection[];
}

/** A bid submitted by an agency against a guardian's care request */
export interface CareContractBid {
  id: string;
  contract_id: string;     // The request being bid on
  agency_id: string;
  agency_name: string;
  agency_rating?: number;
  agency_verified?: boolean;

  // Bid-specific offer data
  proposed_pricing: UCCFPricingOffer;
  proposed_staffing?: UCCFStaffing;
  proposed_schedule?: UCCFSchedule;
  proposed_services?: UCCFServices;
  proposed_sla?: UCCFSLA;

  // Compliance
  compliance: BidComplianceSummary;

  // Meta
  status: BidStatus;
  message?: string;        // Cover message from agency
  remarks?: string;        // General remarks about deviations
  created_at: string;
  expires_at: string;
  counter_offer?: {
    from: "patient" | "agency";
    message: string;
    pricing?: UCCFPricingOffer;
    created_at: string;
  };
}

/** Marketplace filter options */
export interface MarketplaceFilters {
  categories?: CareCategory[];
  city?: string;
  area?: string;
  duration_type?: DurationType;
  staff_level?: StaffLevel;
  budget_min?: number;
  budget_max?: number;
  sort_by?: "newest" | "budget_high" | "budget_low" | "match_score";
}