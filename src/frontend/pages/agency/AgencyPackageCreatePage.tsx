/**
 * AgencyPackageCreatePage — Wizard for agencies to create UCCF type:"offer" packages
 *
 * Refactor summary (see docs/agency-package-form-refactor-plan.md):
 * - Removed demand-side (patient) fields: targetAge, targetGender, targetCondition.
 * - Removed duplicate ADL / monitoring toggles (same capabilities live in service checklists).
 * - Removed unenforced pricing fields: includedHours, overtimeRate.
 * - Cleared misleading defaults: city and serviceAreas are now empty by default.
 * - Added per-step validation on Next (title, categories, service areas).
 * - Step 3 now leads with service checklists before optional medical capability.
 * - Expanded Review step to show equipment, devices, procedures, exclusions, add-ons, compliance.
 * - Replaced hardcoded English labels with guardian i18n keys throughout.
 * - Fixed "Half Day" label for 12h → "Extended shift".
 */
import React, { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText, Users, Calendar, DollarSign, ClipboardCheck, CheckCircle2,
  ChevronLeft, ChevronRight, X, Star,
} from "lucide-react";
import { cn } from "@/frontend/theme/tokens";
import { marketplaceService } from "@/backend/services";
import { useAriaToast } from "@/frontend/hooks/useAriaToast";
import type {
  CareCategory,
  StaffLevel,
  ShiftType,
  PricingModel,
  HoursPerDay,
  UCCFEquipment,
  UCCFLogistics,
  UCCFMedical,
} from "@/backend/models";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@/frontend/hooks";
import { useAuth } from "@/frontend/auth/AuthContext";
import {
  UCCFValidationError,
  UCCF_SERVICE_OPTIONS,
  UCCF_EXCLUSION_OPTIONS,
  UCCF_ADD_ON_OPTIONS,
  UCCF_EQUIPMENT_SLUGS,
  UCCF_MEDICAL_DEVICES,
  UCCF_MEDICAL_PROCEDURES,
} from "@/backend/domain/uccf";

/** i18n keys under `guardian:` for UCCF service checklist buckets. */
const UCCF_SERVICE_BUCKET_I18N: Record<keyof typeof UCCF_SERVICE_OPTIONS, string> = {
  personal_care: "wizard.agencyServiceBucketPersonalCare",
  medical_support: "wizard.agencyServiceBucketMedicalSupport",
  household_support: "wizard.agencyServiceBucketHouseholdSupport",
  advanced_care: "wizard.agencyServiceBucketAdvancedCare",
  coordination: "wizard.agencyServiceBucketCoordination",
};

/** Each step's nameKey is a guardian i18n key shown in the step indicator. */
const steps = [
  { id: 1, nameKey: "wizard.agencyStepPackageInfo", icon: FileText },
  { id: 2, nameKey: "wizard.agencyStepStaffing",    icon: Users },
  { id: 3, nameKey: "wizard.agencyStepServices",    icon: ClipboardCheck },
  { id: 4, nameKey: "wizard.agencyStepSchedule",    icon: Calendar },
  { id: 5, nameKey: "wizard.agencyStepPricing",     icon: DollarSign },
  { id: 6, nameKey: "wizard.agencyStepReview",      icon: Star },
];

const categories: { id: CareCategory; label: string; emoji: string }[] = [
  { id: "elderly",      label: "Elderly Care",   emoji: "\u{1F9D3}" },
  { id: "post_surgery", label: "Post-Surgery",   emoji: "\u{1FA7A}" },
  { id: "chronic",      label: "Chronic Care",   emoji: "\u{1FA7A}" },
  { id: "critical",     label: "Critical/ICU",   emoji: "\u{1F6D1}" },
  { id: "baby",         label: "Baby Care",      emoji: "\u{1F476}" },
  { id: "disability",   label: "Disability",     emoji: "\u267F"    },
];

/** Module-scope: prevents inline-defined render functions from remounting controlled inputs. */
function PackageWizardInputField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm mb-1.5" style={{ color: cn.text }}>{label}</label>
      {children}
    </div>
  );
}

export default function AgencyPackageCreatePage() {
  const { t: tDocTitle } = useTranslation("common");
  const { t: tg } = useTranslation("guardian");
  useDocumentTitle(tDocTitle("pageTitles.agencyPackageCreate", "Agency Package Create"));

  const toast = useAriaToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    // ── Package info ─────────────────────────────────────────────────────────
    title: "",
    categories: [] as CareCategory[],
    city: "",                          // no default — agency must fill in
    serviceAreas: [] as string[],      // no default — agency must fill in
    newArea: "",
    durationType: "monthly" as "short" | "monthly" | "long_term",

    // ── Service scope (supply-side logistics) ─────────────────────────────────
    locationType: "" as "" | "home" | "hospital",
    accommodationProvided: false,
    foodProvided: false,
    travelDistanceKm: "",

    // ── Medical capability (what complexity this team can handle) ─────────────
    // Note: diagnosis is a demand-side (patient) field and is not collected here.
    medicationComplexity: "" as "" | "low" | "medium" | "high",
    devices: [] as string[],
    procedures: [] as string[],

    // ── Equipment ─────────────────────────────────────────────────────────────
    equipmentSlugs: [] as string[],
    equipmentProvider: "" as "" | "patient" | "agency" | "mixed",

    // ── Staffing ─────────────────────────────────────────────────────────────
    caregiverCount: 1,
    nurseCount: 0,
    staffLevel: "L2" as StaffLevel,
    genderPref: "none" as "male" | "female" | "none",
    experienceYears: 2,
    certifications: [] as string[],

    // ── Services (structured task checklists — single source of truth) ───────
    // ADL / monitoring toggles were removed; these checklists replace them.
    personal_care:     [] as string[],
    medical_support:   [] as string[],
    household_support: [] as string[],
    advanced_care:     [] as string[],
    coordination:      [] as string[],
    exclusions:        [] as string[],
    addOns:            [] as string[],

    // ── Schedule ─────────────────────────────────────────────────────────────
    hoursPerDay: 12 as HoursPerDay,
    shiftType: "day" as ShiftType,
    staffPattern: "single" as "single" | "double" | "rotational_team",

    // ── Pricing ──────────────────────────────────────────────────────────────
    // includedHours and overtimeRate removed: no timesheet / billing enforcement exists yet.
    basePrice: 0,
    pricingModel: "monthly" as PricingModel,
    extraCharges: [] as string[],

    // ── SLA ──────────────────────────────────────────────────────────────────
    replacementHours: 6,
    emergencyMinutes: 30,
    attendancePercent: 95,
    reportingFreq: "daily" as "daily" | "weekly",

    // ── Compliance ───────────────────────────────────────────────────────────
    backgroundVerified: true,
    medicalFit: false,
    contractRequired: true,
    trialAvailable: true,
  });

  const update = (partial: Partial<typeof form>) => setForm((f) => ({ ...f, ...partial }));
  const toggleArray = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((a) => a !== item) : [...arr, item];
  const toggleFormStringArray = (key: "devices" | "procedures" | "equipmentSlugs", item: string) =>
    setForm((f) => ({ ...f, [key]: toggleArray(f[key], item) }));

  /** Validate required fields per step before advancing. */
  const next = () => {
    if (step === 1) {
      if (form.title.trim().length < 5) {
        toast.error(tg("wizard.agencyTitleTooShort"));
        return;
      }
      if (form.categories.length === 0) {
        toast.error(tg("wizard.agencyCategoriesRequired"));
        return;
      }
      if (form.serviceAreas.length === 0) {
        toast.error(tg("wizard.agencyServiceAreasRequired"));
        return;
      }
      if (!form.city.trim()) {
        toast.error(tg("wizard.agencyCityRequired"));
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 6));
  };
  const prev = () => setStep((s) => Math.max(s - 1, 1));

  const handlePublish = async () => {
    // Re-validate required fields (user might navigate directly to step 6 via browser).
    if (form.title.trim().length < 5) { toast.error(tg("wizard.agencyTitleTooShort")); return; }
    if (form.categories.length === 0)  { toast.error(tg("wizard.agencyCategoriesRequired")); return; }
    if (form.serviceAreas.length === 0) { toast.error(tg("wizard.agencyServiceAreasRequired")); return; }
    if (!form.city.trim()) { toast.error(tg("wizard.agencyCityRequired")); return; }

    const phone = user?.phone?.trim();
    if (!phone) { toast.error(tg("wizard.agencyPhoneRequired")); return; }

    const agencyName = user?.name?.trim() || "Agency";

    // Supply-side medical capability (no patient diagnosis here).
    const medical: UCCFMedical | undefined =
      form.medicationComplexity || form.devices.length || form.procedures.length
        ? {
            medication_complexity: form.medicationComplexity || undefined,
            devices: form.devices.length ? (form.devices as UCCFMedical["devices"]) : undefined,
            procedures_required: form.procedures.length
              ? (form.procedures as UCCFMedical["procedures_required"])
              : undefined,
          }
        : undefined;

    const logistics: UCCFLogistics | undefined =
      form.locationType || form.accommodationProvided || form.foodProvided || form.travelDistanceKm
        ? {
            location_type: form.locationType || undefined,
            accommodation_provided: form.accommodationProvided || undefined,
            food_provided: form.foodProvided || undefined,
            travel_distance_km: form.travelDistanceKm ? parseInt(form.travelDistanceKm, 10) : undefined,
          }
        : undefined;

    const equipment: UCCFEquipment | undefined =
      form.equipmentSlugs.length > 0 || form.equipmentProvider
        ? { required: form.equipmentSlugs, provider: form.equipmentProvider || undefined }
        : undefined;

    try {
      const pkg = await marketplaceService.createAgencyPackage({
        meta: {
          type: "offer",
          title: form.title.trim(),
          category: form.categories,
          location: { city: form.city },
          duration_type: form.durationType,
        },
        party: {
          role: "agency",
          name: agencyName,
          contact_phone: phone,
          organization_name: agencyName,
          service_area: form.serviceAreas,
        },
        // care_subject intentionally omitted: demand-side field.
        // care_needs is required as an object (may be empty) by the UCCF offer validator.
        care_needs: {},
        medical,
        logistics,
        equipment,
        staffing: {
          caregiver_count: form.caregiverCount,
          nurse_count: form.nurseCount,
          required_level: form.staffLevel,
          gender_preference: form.genderPref,
          experience_years: form.experienceYears,
          certifications_required: form.certifications,
        },
        schedule: {
          hours_per_day: form.hoursPerDay,
          shift_type: form.shiftType,
          staff_pattern: form.staffPattern,
        },
        services: {
          personal_care:     form.personal_care,
          medical_support:   form.medical_support,
          household_support: form.household_support,
          advanced_care:     form.advanced_care,
          coordination:      form.coordination,
        },
        pricing: {
          base_price:    form.basePrice,
          pricing_model: form.pricingModel,
          extra_charges: form.extraCharges,
          // included_hours / overtime_rate omitted until billing enforcement is implemented.
        },
        sla: {
          replacement_time_hours:        form.replacementHours,
          emergency_response_minutes:    form.emergencyMinutes,
          attendance_guarantee_percent:  form.attendancePercent,
          reporting_frequency:           form.reportingFreq,
        },
        compliance: {
          background_verified: form.backgroundVerified,
          medical_fit:         form.medicalFit,
          contract_required:   form.contractRequired,
          trial_available:     form.trialAvailable,
        },
        exclusions: form.exclusions,
        add_ons:    form.addOns,
        agency_name:     agencyName,
        agency_verified: true,
      });

      await marketplaceService.publishPackage(pkg.id);
      toast.success(tg("wizard.agencyPublishSuccess"));
      navigate("/agency/care-packages");
    } catch (e) {
      if (e instanceof UCCFValidationError) {
        toast.error(e.issues.join(" "));
      } else {
        console.error(e);
        toast.error(tg("wizard.agencyPublishFailed"));
      }
    }
  };

  const inputStyle = { borderColor: cn.border, color: cn.text, background: cn.bgInput };

  // ── Shared review row ──────────────────────────────────────────────────────
  function ReviewRow({ label, value }: { label: string; value: string }) {
    return (
      <div
        className="flex flex-col gap-1.5 p-3 rounded-xl sm:flex-row sm:justify-between sm:items-start"
        style={{ background: cn.bgInput }}
      >
        <span className="text-sm shrink-0" style={{ color: cn.textSecondary }}>{label}</span>
        <span className="text-sm break-words sm:text-right sm:max-w-[min(100%,28rem)]" style={{ color: cn.text }}>
          {value}
        </span>
      </div>
    );
  }

  function ReviewSectionHeading({ children }: { children: React.ReactNode }) {
    return (
      <p className="text-xs font-semibold uppercase tracking-wide px-1 pt-3" style={{ color: cn.textSecondary }}>
        {children}
      </p>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-20">

      {/* ── Step indicator ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8 px-2">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive    = step === s.id;
          const isCompleted = step > s.id;
          return (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                  style={{
                    background: isActive ? "var(--cn-gradient-agency)" : isCompleted ? cn.tealBg : cn.bgInput,
                    color: isActive ? "white" : isCompleted ? cn.teal : cn.textSecondary,
                  }}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className="text-[9px] hidden md:block" style={{ color: isActive ? cn.pink : cn.textSecondary }}>
                  {tg(s.nameKey)}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-1" style={{ background: step > s.id ? cn.teal : cn.borderLight }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Step content card ──────────────────────────────────────────────── */}
      <div className="finance-card p-6 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >

            {/* ── Step 1: Package Info ───────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl" style={{ color: cn.text }}>{tg("wizard.agencyPackageInfoTitle")}</h2>

                <PackageWizardInputField label={tg("wizard.agencyPackageTitleLabel")}>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => update({ title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border text-sm"
                    style={inputStyle}
                    placeholder="e.g. Premium Elderly Home Care Package"
                  />
                </PackageWizardInputField>

                <PackageWizardInputField label={tg("wizard.agencyCareCategories")}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => update({ categories: toggleArray(form.categories, c.id) as CareCategory[] })}
                        className="p-3 rounded-xl border text-sm text-left transition-all cn-touch-target"
                        style={{
                          borderColor: form.categories.includes(c.id) ? cn.pink : cn.border,
                          background:  form.categories.includes(c.id) ? cn.pinkBg : "transparent",
                        }}
                      >
                        <span className="text-lg mr-2">{c.emoji}</span>
                        <span style={{ color: cn.text }}>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </PackageWizardInputField>

                <div className="grid grid-cols-2 gap-4">
                  <PackageWizardInputField label={tg("wizard.city")}>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => update({ city: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border text-sm"
                      style={inputStyle}
                      placeholder="e.g. Dhaka"
                    />
                  </PackageWizardInputField>
                  <PackageWizardInputField label={tg("wizard.durationType")}>
                    <select
                      value={form.durationType}
                      onChange={(e) => update({ durationType: e.target.value as typeof form.durationType })}
                      className="w-full px-4 py-3 rounded-xl border text-sm"
                      style={inputStyle}
                    >
                      <option value="short">{tg("wizard.durationShort")}</option>
                      <option value="monthly">{tg("wizard.durationMonthly")}</option>
                      <option value="long_term">{tg("wizard.durationLongTerm")}</option>
                    </select>
                  </PackageWizardInputField>
                </div>

                <PackageWizardInputField label={tg("wizard.agencyServiceAreasLabel")}>
                  <p className="text-xs mb-2 leading-relaxed" style={{ color: cn.textSecondary }}>
                    {tg("wizard.agencyServiceAreasHelp")}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.serviceAreas.map((a) => (
                      <span key={a} className="px-3 py-1 rounded-lg text-xs flex items-center gap-1" style={{ background: cn.tealBg, color: cn.teal }}>
                        {a}{" "}
                        <button
                          type="button"
                          aria-label={tg("wizard.removeServiceArea", { area: a })}
                          onClick={() => update({ serviceAreas: form.serviceAreas.filter((x) => x !== a) })}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                    <input
                      type="text"
                      value={form.newArea}
                      onChange={(e) => update({ newArea: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && form.newArea.trim()) {
                          e.preventDefault();
                          update({ serviceAreas: [...form.serviceAreas, form.newArea.trim()], newArea: "" });
                        }
                      }}
                      className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border text-sm"
                      style={inputStyle}
                      placeholder={tg("wizard.agencyServiceAreaPlaceholder")}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (form.newArea.trim()) {
                          update({ serviceAreas: [...form.serviceAreas, form.newArea.trim()], newArea: "" });
                        }
                      }}
                      className="shrink-0 px-4 py-2.5 rounded-xl text-white text-sm cn-touch-target"
                      style={{ background: "var(--cn-gradient-agency)" }}
                    >
                      {tg("wizard.addServiceArea")}
                    </button>
                  </div>
                </PackageWizardInputField>

                {/* Service scope — where and how the agency operates (supply-side) */}
                <div className="pt-2 space-y-3" style={{ borderTop: `1px solid ${cn.borderLight}` }}>
                  <p className="text-sm font-medium" style={{ color: cn.text }}>{tg("wizard.agencyServiceDetailsTitle")}</p>
                  <PackageWizardInputField label={tg("wizard.locationType")}>
                    <select
                      value={form.locationType}
                      onChange={(e) => update({ locationType: e.target.value as typeof form.locationType })}
                      className="w-full px-4 py-3 rounded-xl border text-sm"
                      style={inputStyle}
                    >
                      <option value="">{tg("wizard.preferNotSay")}</option>
                      <option value="home">{tg("wizard.locationHome")}</option>
                      <option value="hospital">{tg("wizard.locationHospital")}</option>
                    </select>
                  </PackageWizardInputField>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: cn.text }}>
                      <input type="checkbox" checked={form.accommodationProvided} onChange={(e) => update({ accommodationProvided: e.target.checked })} className="rounded" />
                      {tg("wizard.accommodationProvided")}
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: cn.text }}>
                      <input type="checkbox" checked={form.foodProvided} onChange={(e) => update({ foodProvided: e.target.checked })} className="rounded" />
                      {tg("wizard.foodProvided")}
                    </label>
                  </div>
                  <PackageWizardInputField label={tg("wizard.travelDistanceKm")}>
                    <input
                      type="number"
                      min={0}
                      value={form.travelDistanceKm}
                      onChange={(e) => update({ travelDistanceKm: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border text-sm"
                      style={inputStyle}
                    />
                  </PackageWizardInputField>
                </div>
              </div>
            )}

            {/* ── Step 2: Staffing ───────────────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl" style={{ color: cn.text }}>{tg("wizard.agencyCareTeamHeadline")}</h2>
                <div className="grid grid-cols-2 gap-4">
                  <PackageWizardInputField label={tg("wizard.caregiverCount")}>
                    <input type="number" min={0} value={form.caregiverCount} onChange={(e) => update({ caregiverCount: +e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
                  </PackageWizardInputField>
                  <PackageWizardInputField label={tg("wizard.nurseCount")}>
                    <input type="number" min={0} value={form.nurseCount} onChange={(e) => update({ nurseCount: +e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
                  </PackageWizardInputField>
                </div>

                <PackageWizardInputField label={tg("wizard.agencyProfessionalLevel")}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(["L1", "L2", "L3", "L4"] as StaffLevel[]).map((l) => (
                      <button
                        key={l}
                        onClick={() => update({ staffLevel: l })}
                        className="p-3 rounded-xl border text-sm text-center cn-touch-target"
                        style={{
                          borderColor: form.staffLevel === l ? cn.teal : cn.border,
                          background:  form.staffLevel === l ? cn.tealBg : "transparent",
                          color: cn.text,
                        }}
                      >
                        <strong>{l}</strong>
                        <span className="block text-xs" style={{ color: cn.textSecondary }}>
                          {tg(`packageDetail.staffLevels.${l}`)}
                        </span>
                      </button>
                    ))}
                  </div>
                </PackageWizardInputField>

                <div className="grid grid-cols-2 gap-4">
                  <PackageWizardInputField label={tg("wizard.agencyGenderPref")}>
                    <select
                      value={form.genderPref}
                      onChange={(e) => update({ genderPref: e.target.value as typeof form.genderPref })}
                      className="w-full px-4 py-3 rounded-xl border text-sm"
                      style={inputStyle}
                    >
                      <option value="none">{tg("wizard.agencyGenderPrefNone")}</option>
                      <option value="male">{tg("wizard.genderMale")}</option>
                      <option value="female">{tg("wizard.genderFemale")}</option>
                    </select>
                  </PackageWizardInputField>
                  <PackageWizardInputField label={tg("wizard.agencyMinExperience")}>
                    <input type="number" min={0} value={form.experienceYears} onChange={(e) => update({ experienceYears: +e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
                  </PackageWizardInputField>
                </div>
              </div>
            )}

            {/* ── Step 3: Services ───────────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-xl" style={{ color: cn.text }}>{tg("wizard.agencyPackageServicesStepTitle")}</h2>
                <p className="text-sm leading-relaxed -mt-2" style={{ color: cn.textSecondary }}>
                  {tg("wizard.agencyPackageServicesIntro")}
                </p>

                {/* Service checklists — primary capability declaration */}
                <p className="text-sm font-medium" style={{ color: cn.text }}>{tg("wizard.agencyPackageServiceChecklistsHeading")}</p>
                <p className="text-xs leading-relaxed" style={{ color: cn.textSecondary }}>{tg("wizard.agencyPackageServiceBucketsIntro")}</p>
                {(Object.keys(UCCF_SERVICE_OPTIONS) as Array<keyof typeof UCCF_SERVICE_OPTIONS>).map((key) => {
                  const options = UCCF_SERVICE_OPTIONS[key];
                  const list = form[key];
                  return (
                    <PackageWizardInputField key={key} label={tg(UCCF_SERVICE_BUCKET_I18N[key])}>
                      <div className="flex flex-wrap gap-2">
                        {options.map((opt) => {
                          const selected = list.includes(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => update({ [key]: toggleArray(list, opt) })}
                              className="px-3 py-2 rounded-xl border text-sm cn-touch-target"
                              style={{
                                borderColor: selected ? cn.teal : cn.border,
                                background:  selected ? cn.tealBg : "transparent",
                                color:       selected ? cn.teal : cn.textSecondary,
                              }}
                            >
                              {selected && <CheckCircle2 className="w-3 h-3 inline mr-1" aria-hidden />}
                              {opt.replace(/_/g, " ")}
                            </button>
                          );
                        })}
                      </div>
                    </PackageWizardInputField>
                  );
                })}

                {/* Medical capability — optional */}
                <div className="space-y-3 p-4 rounded-xl" style={{ background: cn.bgInput, border: `1px solid ${cn.borderLight}` }}>
                  <p className="text-sm font-medium" style={{ color: cn.text }}>{tg("wizard.agencyMedicalTitle")}</p>
                  <PackageWizardInputField label={tg("wizard.medicationComplexity")}>
                    <select
                      value={form.medicationComplexity}
                      onChange={(e) => update({ medicationComplexity: e.target.value as typeof form.medicationComplexity })}
                      className="w-full px-4 py-3 rounded-xl border text-sm"
                      style={inputStyle}
                    >
                      <option value="">{tg("wizard.preferNotSay")}</option>
                      <option value="low">{tg("wizard.medLow")}</option>
                      <option value="medium">{tg("wizard.medMedium")}</option>
                      <option value="high">{tg("wizard.medHigh")}</option>
                    </select>
                  </PackageWizardInputField>
                  <p className="text-xs" style={{ color: cn.textSecondary }}>{tg("wizard.devices")}</p>
                  <div className="flex flex-wrap gap-2">
                    {UCCF_MEDICAL_DEVICES.map((d) => {
                      const selected = form.devices.includes(d);
                      return (
                        <button key={d} type="button" onClick={() => toggleFormStringArray("devices", d)} className="px-3 py-2 rounded-xl border text-xs cn-touch-target" style={{ borderColor: selected ? cn.teal : cn.border, background: selected ? cn.tealBg : "transparent", color: selected ? cn.teal : cn.textSecondary }}>
                          {d.replace(/_/g, " ")}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs" style={{ color: cn.textSecondary }}>{tg("wizard.procedures")}</p>
                  <div className="flex flex-wrap gap-2">
                    {UCCF_MEDICAL_PROCEDURES.map((p) => {
                      const selected = form.procedures.includes(p);
                      return (
                        <button key={p} type="button" onClick={() => toggleFormStringArray("procedures", p)} className="px-3 py-2 rounded-xl border text-xs cn-touch-target" style={{ borderColor: selected ? cn.teal : cn.border, background: selected ? cn.tealBg : "transparent", color: selected ? cn.teal : cn.textSecondary }}>
                          {p.replace(/_/g, " ")}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Equipment */}
                <div className="space-y-2">
                  <p className="text-sm font-medium" style={{ color: cn.text }}>{tg("wizard.agencyEquipmentTitle")}</p>
                  <div className="flex flex-wrap gap-2">
                    {UCCF_EQUIPMENT_SLUGS.map((slug) => {
                      const selected = form.equipmentSlugs.includes(slug);
                      return (
                        <button key={slug} type="button" onClick={() => toggleFormStringArray("equipmentSlugs", slug)} className="px-3 py-2 rounded-xl border text-xs cn-touch-target" style={{ borderColor: selected ? cn.pink : cn.border, background: selected ? cn.pinkBg : "transparent", color: selected ? cn.pink : cn.textSecondary }}>
                          {slug.replace(/_/g, " ")}
                        </button>
                      );
                    })}
                  </div>
                  <PackageWizardInputField label={tg("wizard.equipmentProvider")}>
                    <select value={form.equipmentProvider} onChange={(e) => update({ equipmentProvider: e.target.value as typeof form.equipmentProvider })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle}>
                      <option value="">{tg("wizard.preferNotSay")}</option>
                      <option value="patient">{tg("wizard.providerPatient")}</option>
                      <option value="agency">{tg("wizard.providerAgency")}</option>
                      <option value="mixed">{tg("wizard.providerMixed")}</option>
                    </select>
                  </PackageWizardInputField>
                </div>

                {/* Exclusions */}
                <PackageWizardInputField label={tg("wizard.exclusions")}>
                  <div className="flex flex-wrap gap-2">
                    {UCCF_EXCLUSION_OPTIONS.map((opt) => {
                      const selected = form.exclusions.includes(opt);
                      return (
                        <button key={opt} type="button" onClick={() => update({ exclusions: toggleArray(form.exclusions, opt) })} className="px-3 py-2 rounded-xl border text-sm cn-touch-target" style={{ borderColor: selected ? "#EF4444" : cn.border, background: selected ? "rgba(239,68,68,0.08)" : "transparent", color: selected ? "#EF4444" : cn.textSecondary }}>
                          {opt.replace(/_/g, " ")}
                        </button>
                      );
                    })}
                  </div>
                </PackageWizardInputField>

                {/* Add-ons */}
                <PackageWizardInputField label={tg("wizard.addOns")}>
                  <div className="flex flex-wrap gap-2">
                    {UCCF_ADD_ON_OPTIONS.map((opt) => {
                      const selected = form.addOns.includes(opt);
                      return (
                        <button key={opt} type="button" onClick={() => update({ addOns: toggleArray(form.addOns, opt) })} className="px-3 py-2 rounded-xl border text-sm cn-touch-target" style={{ borderColor: selected ? cn.amber : cn.border, background: selected ? cn.amberBg : "transparent", color: selected ? cn.amber : cn.textSecondary }}>
                          {opt.replace(/_/g, " ")}
                        </button>
                      );
                    })}
                  </div>
                </PackageWizardInputField>
              </div>
            )}

            {/* ── Step 4: Schedule ───────────────────────────────────────── */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl" style={{ color: cn.text }}>{tg("wizard.agencyScheduleTitle")}</h2>

                <PackageWizardInputField label={tg("wizard.hoursPerDay")}>
                  <div className="grid grid-cols-3 gap-3">
                    {([8, 12, 24] as HoursPerDay[]).map((h) => (
                      <button
                        key={h}
                        onClick={() => update({ hoursPerDay: h })}
                        className="p-4 rounded-xl border text-center cn-touch-target"
                        style={{
                          borderColor: form.hoursPerDay === h ? cn.teal : cn.border,
                          background:  form.hoursPerDay === h ? cn.tealBg : "transparent",
                        }}
                      >
                        <span className="text-lg block" style={{ color: cn.text }}>{h}h</span>
                        <span className="text-xs" style={{ color: cn.textSecondary }}>
                          {h === 8
                            ? tg("wizard.hours8Label")
                            : h === 12
                            ? tg("wizard.hours12Label")
                            : tg("wizard.hours24Label")}
                        </span>
                      </button>
                    ))}
                  </div>
                </PackageWizardInputField>

                <PackageWizardInputField label={tg("wizard.shiftType")}>
                  <div className="grid grid-cols-3 gap-3">
                    {(["day", "night", "rotational"] as ShiftType[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => update({ shiftType: t })}
                        className="p-3 rounded-xl border text-sm text-center cn-touch-target"
                        style={{
                          borderColor: form.shiftType === t ? cn.teal : cn.border,
                          background:  form.shiftType === t ? cn.tealBg : "transparent",
                          color: cn.text,
                        }}
                      >
                        {tg(`wizard.shiftType_${t}`)}
                      </button>
                    ))}
                  </div>
                </PackageWizardInputField>

                <PackageWizardInputField label={tg("wizard.staffPattern")}>
                  <select value={form.staffPattern} onChange={(e) => update({ staffPattern: e.target.value as typeof form.staffPattern })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle}>
                    <option value="single">{tg("wizard.staffPattern_single")}</option>
                    <option value="double">{tg("wizard.staffPattern_double")}</option>
                    <option value="rotational_team">{tg("wizard.staffPattern_rotational_team")}</option>
                  </select>
                </PackageWizardInputField>
              </div>
            )}

            {/* ── Step 5: Pricing & SLA ──────────────────────────────────── */}
            {step === 5 && (
              <div className="space-y-4">
                <h2 className="text-xl" style={{ color: cn.text }}>{tg("wizard.agencyPricingSlaTitle")}</h2>

                <div className="grid grid-cols-2 gap-4">
                  <PackageWizardInputField label={tg("wizard.agencyBasePrice")}>
                    <input type="number" min={0} value={form.basePrice} onChange={(e) => update({ basePrice: +e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
                  </PackageWizardInputField>
                  <PackageWizardInputField label={tg("wizard.agencyPricingModel")}>
                    <select value={form.pricingModel} onChange={(e) => update({ pricingModel: e.target.value as PricingModel })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle}>
                      <option value="monthly">{tg("wizard.modelMonthly")}</option>
                      <option value="daily">{tg("wizard.modelDaily")}</option>
                      <option value="hourly">{tg("wizard.modelHourly")}</option>
                    </select>
                  </PackageWizardInputField>
                </div>

                <h3 className="text-sm pt-4" style={{ color: cn.text, borderTop: `1px solid ${cn.border}` }}>
                  {tg("wizard.agencySlaTitle")}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <PackageWizardInputField label={tg("wizard.agencyReplacementHours")}>
                    <input type="number" min={1} value={form.replacementHours} onChange={(e) => update({ replacementHours: +e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
                  </PackageWizardInputField>
                  <PackageWizardInputField label={tg("wizard.agencyEmergencyMinutes")}>
                    <input type="number" min={5} value={form.emergencyMinutes} onChange={(e) => update({ emergencyMinutes: +e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
                  </PackageWizardInputField>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <PackageWizardInputField label={tg("wizard.agencyAttendancePercent")}>
                    <input type="number" min={80} max={100} value={form.attendancePercent} onChange={(e) => update({ attendancePercent: +e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
                  </PackageWizardInputField>
                  <PackageWizardInputField label={tg("wizard.agencyReportingFreq")}>
                    <select value={form.reportingFreq} onChange={(e) => update({ reportingFreq: e.target.value as typeof form.reportingFreq })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle}>
                      <option value="daily">{tg("wizard.agencyReportingDaily")}</option>
                      <option value="weekly">{tg("wizard.agencyReportingWeekly")}</option>
                    </select>
                  </PackageWizardInputField>
                </div>

                <h3 className="text-sm pt-4" style={{ color: cn.text, borderTop: `1px solid ${cn.border}` }}>
                  {tg("wizard.agencyComplianceTitle")}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { key: "backgroundVerified" as const, labelKey: "wizard.agencyBgVerified" },
                    { key: "medicalFit"          as const, labelKey: "wizard.agencyMedFit" },
                    { key: "contractRequired"    as const, labelKey: "wizard.agencyContractRequired" },
                    { key: "trialAvailable"      as const, labelKey: "wizard.agencyTrialAvailable" },
                  ] as const).map((c) => (
                    <button
                      key={c.key}
                      onClick={() => update({ [c.key]: !form[c.key] } as Partial<typeof form>)}
                      className="flex items-center gap-2 p-3 rounded-xl border text-sm cn-touch-target"
                      style={{ borderColor: form[c.key] ? cn.teal : cn.border, background: form[c.key] ? cn.tealBg : "transparent" }}
                    >
                      <CheckCircle2 className="w-4 h-4" style={{ color: form[c.key] ? cn.teal : cn.borderLight }} aria-hidden />
                      <span style={{ color: cn.text }}>{tg(c.labelKey)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Step 6: Review ─────────────────────────────────────────── */}
            {step === 6 && (
              <div className="space-y-3">
                <h2 className="text-xl" style={{ color: cn.text }}>{tg("wizard.agencyReviewPublishTitle")}</h2>

                {form.serviceAreas.length === 0 && (
                  <div className="p-4 rounded-xl border text-sm space-y-3" style={{ borderColor: cn.amber, background: cn.amberBg, color: cn.text }}>
                    <p className="leading-relaxed">{tg("wizard.agencyReviewServiceAreasBanner")}</p>
                    <button type="button" onClick={() => setStep(1)} className="px-4 py-2.5 rounded-xl text-sm cn-touch-target text-white" style={{ background: "var(--cn-gradient-agency)" }}>
                      {tg("wizard.agencyReviewFixServiceAreas")}
                    </button>
                  </div>
                )}

                {/* Core package details */}
                <ReviewRow label={tg("wizard.agencyReviewPackageTitle")} value={form.title || "—"} />
                <ReviewRow label={tg("wizard.agencyReviewCategories")} value={form.categories.map((c) => c.replace(/_/g, " ")).join(", ") || "—"} />
                <ReviewRow
                  label={tg("wizard.agencyReviewServiceAreas")}
                  value={form.serviceAreas.length ? form.serviceAreas.join(", ") : tg("wizard.agencyReviewServiceAreasEmpty")}
                />
                <ReviewRow
                  label={tg("wizard.agencyReviewCareTeam")}
                  value={tg("wizard.agencyReviewCareTeamSummary", { caregivers: form.caregiverCount, nurses: form.nurseCount, level: form.staffLevel })}
                />
                <ReviewRow label={tg("wizard.agencyReviewSchedule")} value={`${form.hoursPerDay}h/day · ${tg(`wizard.shiftType_${form.shiftType}`)} · ${tg(`wizard.staffPattern_${form.staffPattern}`)}`} />
                <ReviewRow label={tg("wizard.agencyReviewBasePrice")} value={`৳${form.basePrice.toLocaleString()}/${form.pricingModel}`} />
                <ReviewRow
                  label={tg("wizard.agencyReviewSla")}
                  value={`${form.replacementHours}h replacement · ${form.emergencyMinutes}min response · ${form.attendancePercent}% attendance`}
                />

                {/* Services by category */}
                <ReviewSectionHeading>{tg("wizard.agencyReviewServicesHeading")}</ReviewSectionHeading>
                {(Object.keys(UCCF_SERVICE_OPTIONS) as Array<keyof typeof UCCF_SERVICE_OPTIONS>).map((key) => (
                  <ReviewRow
                    key={key}
                    label={tg(UCCF_SERVICE_BUCKET_I18N[key])}
                    value={(form[key].join(", ") || "—").replace(/_/g, " ")}
                  />
                ))}

                {/* Medical capability (shown only if any field set) */}
                {(form.medicationComplexity || form.devices.length > 0 || form.procedures.length > 0) && (
                  <>
                    <ReviewSectionHeading>{tg("wizard.agencyReviewMedication")}</ReviewSectionHeading>
                    {form.medicationComplexity && (
                      <ReviewRow label={tg("wizard.medicationComplexity")} value={form.medicationComplexity} />
                    )}
                    {form.devices.length > 0 && (
                      <ReviewRow label={tg("wizard.agencyReviewDevices")} value={form.devices.join(", ").replace(/_/g, " ")} />
                    )}
                    {form.procedures.length > 0 && (
                      <ReviewRow label={tg("wizard.agencyReviewProcedures")} value={form.procedures.join(", ").replace(/_/g, " ")} />
                    )}
                  </>
                )}

                {/* Equipment (shown only if any field set) */}
                {(form.equipmentSlugs.length > 0 || !!form.equipmentProvider) && (
                  <>
                    <ReviewSectionHeading>{tg("wizard.agencyReviewEquipment")}</ReviewSectionHeading>
                    {form.equipmentSlugs.length > 0 && (
                      <ReviewRow label={tg("wizard.equipment")} value={form.equipmentSlugs.join(", ").replace(/_/g, " ")} />
                    )}
                    {form.equipmentProvider && (
                      <ReviewRow label={tg("wizard.equipmentProvider")} value={form.equipmentProvider} />
                    )}
                  </>
                )}

                {/* Exclusions & add-ons (shown only if any set) */}
                {(form.exclusions.length > 0 || form.addOns.length > 0) && (
                  <>
                    <ReviewSectionHeading>{tg("wizard.exclusionsAddOnsEquip")}</ReviewSectionHeading>
                    {form.exclusions.length > 0 && (
                      <ReviewRow label={tg("wizard.agencyReviewExclusions")} value={form.exclusions.join(", ").replace(/_/g, " ")} />
                    )}
                    {form.addOns.length > 0 && (
                      <ReviewRow label={tg("wizard.agencyReviewAddOns")} value={form.addOns.join(", ").replace(/_/g, " ")} />
                    )}
                  </>
                )}

                {/* Compliance badges */}
                <ReviewSectionHeading>{tg("wizard.agencyReviewCompliance")}</ReviewSectionHeading>
                <div className="flex flex-wrap gap-2">
                  {([
                    { key: "backgroundVerified" as const, labelKey: "wizard.agencyBgVerified" },
                    { key: "medicalFit"          as const, labelKey: "wizard.agencyMedFit" },
                    { key: "contractRequired"    as const, labelKey: "wizard.agencyContractRequired" },
                    { key: "trialAvailable"      as const, labelKey: "wizard.agencyTrialAvailable" },
                  ] as const)
                    .filter((c) => form[c.key])
                    .map((c) => (
                      <span key={c.key} className="px-3 py-1 rounded-lg text-xs flex items-center gap-1" style={{ background: cn.tealBg, color: cn.teal }}>
                        <CheckCircle2 className="w-3 h-3" aria-hidden />
                        {tg(c.labelKey)}
                      </span>
                    ))}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <div className="flex justify-between mt-6">
        <button
          onClick={prev}
          disabled={step === 1}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm disabled:opacity-30"
          style={{ borderColor: cn.border, color: cn.textSecondary }}
        >
          <ChevronLeft className="w-4 h-4" aria-hidden /> {tg("wizard.back")}
        </button>
        {step < 6 ? (
          <button
            onClick={next}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm"
            style={{ background: "var(--cn-gradient-agency)" }}
          >
            {tg("wizard.next")} <ChevronRight className="w-4 h-4" aria-hidden />
          </button>
        ) : (
          <button
            onClick={handlePublish}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm"
            style={{ background: "var(--cn-gradient-agency)" }}
          >
            <Star className="w-4 h-4" aria-hidden /> {tg("wizard.agencyPublishPackage")}
          </button>
        )}
      </div>
    </div>
  );
}
