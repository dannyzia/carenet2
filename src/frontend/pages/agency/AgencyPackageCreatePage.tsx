/**
 * AgencyPackageCreatePage — Wizard for agencies to create UCCF type:"offer" packages
 */
import React, { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText, Users, Calendar, DollarSign, Shield, ClipboardCheck, CheckCircle2,
  ChevronLeft, ChevronRight, Plus, X, Star,
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
  UCCFCareNeeds,
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

const steps = [
  { id: 1, name: "Package Info", icon: FileText },
  { id: 2, name: "Staffing", icon: Users },
  { id: 3, name: "Services", icon: ClipboardCheck },
  { id: 4, name: "Schedule", icon: Calendar },
  { id: 5, name: "Pricing & SLA", icon: DollarSign },
  { id: 6, name: "Review", icon: Star },
];

const categories: { id: CareCategory; label: string; emoji: string }[] = [
  { id: "elderly", label: "Elderly Care", emoji: "\u{1F9D3}" },
  { id: "post_surgery", label: "Post-Surgery", emoji: "\u{1FA7A}" },
  { id: "chronic", label: "Chronic Care", emoji: "\u{1FA7A}" },
  { id: "critical", label: "Critical/ICU", emoji: "\u{1F6D1}" },
  { id: "baby", label: "Baby Care", emoji: "\u{1F476}" },
  { id: "disability", label: "Disability", emoji: "\u267F" },
];

export default function AgencyPackageCreatePage() {
  const { t: tDocTitle } = useTranslation("common");
  const { t: tg } = useTranslation("guardian");
  useDocumentTitle(tDocTitle("pageTitles.agencyPackageCreate", "Agency Package Create"));

  const toast = useAriaToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    title: "",
    categories: [] as CareCategory[],
    city: "Dhaka",
    serviceAreas: ["Gulshan"] as string[],
    newArea: "",
    durationType: "monthly" as "short" | "monthly" | "long_term",
    targetAge: "",
    targetGender: "" as "" | "male" | "female" | "other",
    targetCondition: "",
    locationType: "" as "" | "home" | "hospital",
    accommodationProvided: false,
    foodProvided: false,
    travelDistanceKm: "",
    adlBathing: false,
    feedingOral: false,
    feedingTube: false,
    toiletingAssisted: false,
    toiletingFull: false,
    adlMobility: false,
    monitorVitals: false,
    monitorSupervision: false,
    companionship: false,
    diagnosis: "",
    medicationComplexity: "" as "" | "low" | "medium" | "high",
    devices: [] as string[],
    procedures: [] as string[],
    equipmentSlugs: [] as string[],
    equipmentProvider: "" as "" | "patient" | "agency" | "mixed",
    // Staffing
    caregiverCount: 1,
    nurseCount: 0,
    staffLevel: "L2" as StaffLevel,
    genderPref: "none" as "male" | "female" | "none",
    experienceYears: 2,
    certifications: [] as string[],
    // Services
    personal_care: [] as string[],
    medical_support: [] as string[],
    household_support: [] as string[],
    advanced_care: [] as string[],
    coordination: [] as string[],
    exclusions: [] as string[],
    addOns: [] as string[],
    // Schedule
    hoursPerDay: 12 as HoursPerDay,
    shiftType: "day" as ShiftType,
    staffPattern: "single" as "single" | "double" | "rotational_team",
    // Pricing
    basePrice: 0,
    pricingModel: "monthly" as PricingModel,
    includedHours: 0,
    overtimeRate: 0,
    extraCharges: [] as string[],
    // SLA
    replacementHours: 6,
    emergencyMinutes: 30,
    attendancePercent: 95,
    reportingFreq: "daily" as "daily" | "weekly",
    // Compliance
    backgroundVerified: true,
    medicalFit: false,
    contractRequired: true,
    trialAvailable: true,
  });

  const update = (partial: Partial<typeof form>) => setForm((f) => ({ ...f, ...partial }));
  const toggleArray = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((a) => a !== item) : [...arr, item];

  const toggleFormStringArray = (key: "devices" | "procedures" | "equipmentSlugs", item: string) => {
    setForm((f) => ({ ...f, [key]: toggleArray(f[key], item) }));
  };

  const next = () => setStep((s) => Math.min(s + 1, 6));
  const prev = () => setStep((s) => Math.max(s - 1, 1));

  const handlePublish = async () => {
    if (form.title.trim().length < 5) {
      toast.error(tg("wizard.agencyTitleTooShort"));
      return;
    }
    if (form.categories.length === 0) {
      toast.error(tg("wizard.agencyCategoriesRequired"));
      return;
    }
    const phone = user?.phone?.trim();
    if (!phone) {
      toast.error(tg("wizard.agencyPhoneRequired"));
      return;
    }
    const agencyName = user?.name?.trim() || "Agency";

    const adl: NonNullable<UCCFCareNeeds["ADL"]> = {};
    if (form.adlBathing) adl.bathing = true;
    if (form.feedingTube) adl.feeding = "tube";
    else if (form.feedingOral) adl.feeding = "oral";
    if (form.toiletingFull) adl.toileting = "full";
    else if (form.toiletingAssisted) adl.toileting = "assisted";
    if (form.adlMobility) adl.mobility_support = true;
    const monitoring: NonNullable<UCCFCareNeeds["monitoring"]> = {};
    if (form.monitorVitals) monitoring.vitals = true;
    if (form.monitorSupervision) monitoring.continuous_supervision = true;
    const care_needs: UCCFCareNeeds = {};
    if (Object.keys(adl).length) care_needs.ADL = adl;
    if (Object.keys(monitoring).length) care_needs.monitoring = monitoring;
    if (form.companionship) care_needs.companionship = true;

    const medical: UCCFMedical | undefined =
      form.diagnosis.trim() || form.medicationComplexity || form.devices.length || form.procedures.length
        ? {
            diagnosis: form.diagnosis.trim() || undefined,
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

    const targetAgeNum = parseInt(form.targetAge, 10);
    const care_subject =
      form.targetAge || form.targetGender || form.targetCondition.trim()
        ? {
            age: !Number.isNaN(targetAgeNum) && targetAgeNum > 0 ? targetAgeNum : 0,
            gender: form.targetGender || undefined,
            condition_summary: form.targetCondition.trim() || undefined,
            mobility: "assisted" as const,
          }
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
      care_subject,
      medical,
      care_needs,
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
        personal_care: form.personal_care,
        medical_support: form.medical_support,
        household_support: form.household_support,
        advanced_care: form.advanced_care,
        coordination: form.coordination,
      },
      pricing: {
        base_price: form.basePrice,
        pricing_model: form.pricingModel,
        included_hours: form.includedHours,
        overtime_rate: form.overtimeRate,
        extra_charges: form.extraCharges,
      },
      sla: {
        replacement_time_hours: form.replacementHours,
        emergency_response_minutes: form.emergencyMinutes,
        attendance_guarantee_percent: form.attendancePercent,
        reporting_frequency: form.reportingFreq,
      },
      compliance: {
        background_verified: form.backgroundVerified,
        medical_fit: form.medicalFit,
        contract_required: form.contractRequired,
        trial_available: form.trialAvailable,
      },
      exclusions: form.exclusions,
      add_ons: form.addOns,
      agency_name: agencyName,
      agency_verified: true,
    });

    await marketplaceService.publishPackage(pkg.id);
    toast.success("Package published to marketplace!");
    navigate("/agency/marketplace-browse");
    } catch (e) {
      if (e instanceof UCCFValidationError) {
        toast.error(e.issues.join(" "));
      } else {
        console.error(e);
        toast.error(tg("wizard.agencyPublishFailed"));
      }
    }
  };

  const InputField = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-sm mb-1.5" style={{ color: cn.text }}>{label}</label>
      {children}
    </div>
  );

  const inputStyle = { borderColor: cn.border, color: cn.text, background: cn.bgInput };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8 px-2">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isCompleted = step > s.id;
          return (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all" style={{ background: isActive ? "var(--cn-gradient-agency)" : isCompleted ? cn.tealBg : cn.bgInput, color: isActive ? "white" : isCompleted ? cn.teal : cn.textSecondary }}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className="text-[9px] hidden md:block" style={{ color: isActive ? cn.pink : cn.textSecondary }}>{s.name}</span>
              </div>
              {i < steps.length - 1 && <div className="flex-1 h-0.5 mx-1" style={{ background: step > s.id ? cn.teal : cn.borderLight }} />}
            </React.Fragment>
          );
        })}
      </div>

      <div className="finance-card p-6 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>

            {/* Step 1: Package Info */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl" style={{ color: cn.text }}>Package Information</h2>
                <InputField label="Package Title">
                  <input type="text" value={form.title} onChange={(e) => update({ title: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} placeholder="e.g. Premium Elderly Home Care Package" />
                </InputField>
                <InputField label="Care Categories">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {categories.map((c) => (
                      <button key={c.id} onClick={() => update({ categories: toggleArray(form.categories, c.id) as CareCategory[] })} className="p-3 rounded-xl border text-sm text-left transition-all cn-touch-target" style={{ borderColor: form.categories.includes(c.id) ? cn.pink : cn.border, background: form.categories.includes(c.id) ? cn.pinkBg : "transparent" }}>
                        <span className="text-lg mr-2">{c.emoji}</span>
                        <span style={{ color: cn.text }}>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </InputField>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="City">
                    <input type="text" value={form.city} onChange={(e) => update({ city: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
                  </InputField>
                  <InputField label="Duration Type">
                    <select value={form.durationType} onChange={(e) => update({ durationType: e.target.value as typeof form.durationType })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle}>
                      <option value="short">Short Term</option>
                      <option value="monthly">Monthly</option>
                      <option value="long_term">Long Term</option>
                    </select>
                  </InputField>
                </div>
                <InputField label="Service Areas">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.serviceAreas.map((a) => (
                      <span key={a} className="px-3 py-1 rounded-lg text-xs flex items-center gap-1" style={{ background: cn.tealBg, color: cn.teal }}>
                        {a}{" "}
                        <button type="button" onClick={() => update({ serviceAreas: form.serviceAreas.filter((x) => x !== a) })}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={form.newArea} onChange={(e) => update({ newArea: e.target.value })} className="flex-1 px-4 py-2.5 rounded-xl border text-sm" style={inputStyle} placeholder="Add area..." />
                    <button type="button" onClick={() => { if (form.newArea.trim()) { update({ serviceAreas: [...form.serviceAreas, form.newArea.trim()], newArea: "" }); } }} className="px-4 py-2.5 rounded-xl text-white text-sm" style={{ background: "var(--cn-gradient-agency)" }}>Add</button>
                  </div>
                </InputField>
                <div className="pt-2 space-y-3" style={{ borderTop: `1px solid ${cn.borderLight}` }}>
                  <p className="text-sm font-medium" style={{ color: cn.text }}>Typical client profile (optional)</p>
                  <div className="grid grid-cols-3 gap-3">
                    <InputField label={tg("wizard.age")}>
                      <input type="number" min={0} value={form.targetAge} onChange={(e) => update({ targetAge: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
                    </InputField>
                    <InputField label={tg("wizard.gender")}>
                      <select value={form.targetGender} onChange={(e) => update({ targetGender: e.target.value as typeof form.targetGender })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle}>
                        <option value="">{tg("wizard.preferNotSay")}</option>
                        <option value="male">{tg("wizard.genderMale")}</option>
                        <option value="female">{tg("wizard.genderFemale")}</option>
                        <option value="other">{tg("wizard.genderOther")}</option>
                      </select>
                    </InputField>
                    <InputField label={tg("wizard.medicalConditions")}>
                      <input type="text" value={form.targetCondition} onChange={(e) => update({ targetCondition: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} placeholder={tg("wizard.medicalConditionsPlaceholder")} />
                    </InputField>
                  </div>
                  <InputField label={tg("wizard.locationType")}>
                    <select value={form.locationType} onChange={(e) => update({ locationType: e.target.value as typeof form.locationType })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle}>
                      <option value="">{tg("wizard.preferNotSay")}</option>
                      <option value="home">{tg("wizard.locationHome")}</option>
                      <option value="hospital">{tg("wizard.locationHospital")}</option>
                    </select>
                  </InputField>
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
                  <InputField label={tg("wizard.travelDistanceKm")}>
                    <input type="number" min={0} value={form.travelDistanceKm} onChange={(e) => update({ travelDistanceKm: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
                  </InputField>
                </div>
              </div>
            )}

            {/* Step 2: Staffing */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl" style={{ color: cn.text }}>Staffing Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Caregivers">
                    <input type="number" min={0} value={form.caregiverCount} onChange={(e) => update({ caregiverCount: +e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
                  </InputField>
                  <InputField label="Nurses">
                    <input type="number" min={0} value={form.nurseCount} onChange={(e) => update({ nurseCount: +e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
                  </InputField>
                </div>
                <InputField label="Staff Level">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(["L1", "L2", "L3", "L4"] as StaffLevel[]).map((l) => (
                      <button key={l} onClick={() => update({ staffLevel: l })} className="p-3 rounded-xl border text-sm text-center cn-touch-target" style={{ borderColor: form.staffLevel === l ? cn.teal : cn.border, background: form.staffLevel === l ? cn.tealBg : "transparent", color: cn.text }}>
                        <strong>{l}</strong>
                        <span className="block text-xs" style={{ color: cn.textSecondary }}>
                          {l === "L1" ? "Caregiver" : l === "L2" ? "Trained" : l === "L3" ? "Nurse" : "ICU Nurse"}
                        </span>
                      </button>
                    ))}
                  </div>
                </InputField>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Gender Preference">
                    <select value={form.genderPref} onChange={(e) => update({ genderPref: e.target.value as any })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle}>
                      <option value="none">No Preference</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </InputField>
                  <InputField label="Min Experience (years)">
                    <input type="number" min={0} value={form.experienceYears} onChange={(e) => update({ experienceYears: +e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
                  </InputField>
                </div>
              </div>
            )}

            {/* Step 3: Services */}
            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-xl" style={{ color: cn.text }}>Services Included</h2>
                <div className="space-y-3 p-4 rounded-xl" style={{ background: cn.bgInput, border: `1px solid ${cn.borderLight}` }}>
                  <p className="text-sm font-medium" style={{ color: cn.text }}>{tg("wizard.dailyLiving")}</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "adlBathing" as const, label: tg("wizard.needBathing") },
                      { key: "feedingOral" as const, label: tg("wizard.needFeedingOral") },
                      { key: "feedingTube" as const, label: tg("wizard.needFeedingTube") },
                      { key: "toiletingAssisted" as const, label: tg("wizard.needToiletingAssisted") },
                      { key: "toiletingFull" as const, label: tg("wizard.needToiletingFull") },
                      { key: "adlMobility" as const, label: tg("wizard.needMobilitySupport") },
                    ].map(({ key, label }) => (
                      <button key={key} type="button" onClick={() => update({ [key]: !form[key] } as any)} className="px-3 py-2 rounded-xl border text-xs cn-touch-target" style={{ borderColor: form[key] ? cn.teal : cn.border, background: form[key] ? cn.tealBg : "transparent", color: form[key] ? cn.teal : cn.textSecondary }}>{label}</button>
                    ))}
                  </div>
                  <p className="text-sm font-medium pt-2" style={{ color: cn.text }}>{tg("wizard.monitoringCompanionship")}</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "monitorVitals" as const, label: tg("wizard.monitorVitals") },
                      { key: "monitorSupervision" as const, label: tg("wizard.continuousSupervision") },
                      { key: "companionship" as const, label: tg("wizard.companionship") },
                    ].map(({ key, label }) => (
                      <button key={key} type="button" onClick={() => update({ [key]: !form[key] } as any)} className="px-3 py-2 rounded-xl border text-xs cn-touch-target" style={{ borderColor: form[key] ? cn.teal : cn.border, background: form[key] ? cn.tealBg : "transparent", color: form[key] ? cn.teal : cn.textSecondary }}>{label}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3 p-4 rounded-xl" style={{ background: cn.bgInput, border: `1px solid ${cn.borderLight}` }}>
                  <p className="text-sm font-medium" style={{ color: cn.text }}>{tg("wizard.medicalOptional")}</p>
                  <InputField label={tg("wizard.diagnosis")}>
                    <input type="text" value={form.diagnosis} onChange={(e) => update({ diagnosis: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
                  </InputField>
                  <InputField label={tg("wizard.medicationComplexity")}>
                    <select value={form.medicationComplexity} onChange={(e) => update({ medicationComplexity: e.target.value as typeof form.medicationComplexity })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle}>
                      <option value="">{tg("wizard.preferNotSay")}</option>
                      <option value="low">{tg("wizard.medLow")}</option>
                      <option value="medium">{tg("wizard.medMedium")}</option>
                      <option value="high">{tg("wizard.medHigh")}</option>
                    </select>
                  </InputField>
                  <p className="text-xs" style={{ color: cn.textSecondary }}>{tg("wizard.devices")}</p>
                  <div className="flex flex-wrap gap-2">
                    {UCCF_MEDICAL_DEVICES.map((d) => {
                      const selected = form.devices.includes(d);
                      return (
                        <button key={d} type="button" onClick={() => toggleFormStringArray("devices", d)} className="px-3 py-2 rounded-xl border text-xs cn-touch-target" style={{ borderColor: selected ? cn.teal : cn.border, background: selected ? cn.tealBg : "transparent", color: selected ? cn.teal : cn.textSecondary }}>{d}</button>
                      );
                    })}
                  </div>
                  <p className="text-xs" style={{ color: cn.textSecondary }}>{tg("wizard.procedures")}</p>
                  <div className="flex flex-wrap gap-2">
                    {UCCF_MEDICAL_PROCEDURES.map((p) => {
                      const selected = form.procedures.includes(p);
                      return (
                        <button key={p} type="button" onClick={() => toggleFormStringArray("procedures", p)} className="px-3 py-2 rounded-xl border text-xs cn-touch-target" style={{ borderColor: selected ? cn.teal : cn.border, background: selected ? cn.tealBg : "transparent", color: selected ? cn.teal : cn.textSecondary }}>{p.replace(/_/g, " ")}</button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium" style={{ color: cn.text }}>{tg("wizard.equipment")}</p>
                  <div className="flex flex-wrap gap-2">
                    {UCCF_EQUIPMENT_SLUGS.map((slug) => {
                      const selected = form.equipmentSlugs.includes(slug);
                      return (
                        <button key={slug} type="button" onClick={() => toggleFormStringArray("equipmentSlugs", slug)} className="px-3 py-2 rounded-xl border text-xs cn-touch-target" style={{ borderColor: selected ? cn.pink : cn.border, background: selected ? cn.pinkBg : "transparent", color: selected ? cn.pink : cn.textSecondary }}>{slug.replace(/_/g, " ")}</button>
                      );
                    })}
                  </div>
                  <InputField label={tg("wizard.equipmentProvider")}>
                    <select value={form.equipmentProvider} onChange={(e) => update({ equipmentProvider: e.target.value as typeof form.equipmentProvider })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle}>
                      <option value="">{tg("wizard.preferNotSay")}</option>
                      <option value="patient">{tg("wizard.providerPatient")}</option>
                      <option value="agency">{tg("wizard.providerAgency")}</option>
                      <option value="mixed">{tg("wizard.providerMixed")}</option>
                    </select>
                  </InputField>
                </div>
                {(Object.keys(UCCF_SERVICE_OPTIONS) as Array<keyof typeof UCCF_SERVICE_OPTIONS>).map((key) => {
                  const options = UCCF_SERVICE_OPTIONS[key];
                  const list = form[key];
                  return (
                    <InputField key={key} label={key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}>
                      <div className="flex flex-wrap gap-2">
                        {options.map((opt) => {
                          const selected = list.includes(opt);
                          return (
                            <button key={opt} type="button" onClick={() => update({ [key]: toggleArray(list, opt) })} className="px-3 py-2 rounded-xl border text-sm cn-touch-target" style={{ borderColor: selected ? cn.teal : cn.border, background: selected ? cn.tealBg : "transparent", color: selected ? cn.teal : cn.textSecondary }}>
                              {selected && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                              {opt.replace(/_/g, " ")}
                            </button>
                          );
                        })}
                      </div>
                    </InputField>
                  );
                })}
                <InputField label="Exclusions">
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
                </InputField>
                <InputField label="Add-Ons">
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
                </InputField>
              </div>
            )}

            {/* Step 4: Schedule */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl" style={{ color: cn.text }}>Schedule</h2>
                <InputField label="Hours Per Day">
                  <div className="grid grid-cols-3 gap-3">
                    {([8, 12, 24] as HoursPerDay[]).map((h) => (
                      <button key={h} onClick={() => update({ hoursPerDay: h })} className="p-4 rounded-xl border text-center cn-touch-target" style={{ borderColor: form.hoursPerDay === h ? cn.teal : cn.border, background: form.hoursPerDay === h ? cn.tealBg : "transparent" }}>
                        <span className="text-lg block" style={{ color: cn.text }}>{h}h</span>
                        <span className="text-xs" style={{ color: cn.textSecondary }}>{h === 8 ? "Day Shift" : h === 12 ? "Half Day" : "24/7 Care"}</span>
                      </button>
                    ))}
                  </div>
                </InputField>
                <InputField label="Shift Type">
                  <div className="grid grid-cols-3 gap-3">
                    {(["day", "night", "rotational"] as ShiftType[]).map((t) => (
                      <button key={t} onClick={() => update({ shiftType: t })} className="p-3 rounded-xl border text-sm text-center cn-touch-target" style={{ borderColor: form.shiftType === t ? cn.teal : cn.border, background: form.shiftType === t ? cn.tealBg : "transparent", color: cn.text }}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </InputField>
                <InputField label="Staff Pattern">
                  <select value={form.staffPattern} onChange={(e) => update({ staffPattern: e.target.value as any })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle}>
                    <option value="single">Single Staff</option>
                    <option value="double">Double Staff</option>
                    <option value="rotational_team">Rotational Team</option>
                  </select>
                </InputField>
              </div>
            )}

            {/* Step 5: Pricing & SLA */}
            {step === 5 && (
              <div className="space-y-4">
                <h2 className="text-xl" style={{ color: cn.text }}>Pricing & SLA</h2>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Base Price (BDT)">
                    <input type="number" min={0} value={form.basePrice} onChange={(e) => update({ basePrice: +e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
                  </InputField>
                  <InputField label="Pricing Model">
                    <select value={form.pricingModel} onChange={(e) => update({ pricingModel: e.target.value as PricingModel })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle}>
                      <option value="monthly">Monthly</option>
                      <option value="daily">Daily</option>
                      <option value="hourly">Hourly</option>
                    </select>
                  </InputField>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Included Hours">
                    <input type="number" min={0} value={form.includedHours} onChange={(e) => update({ includedHours: +e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
                  </InputField>
                  <InputField label="Overtime Rate (BDT/hr)">
                    <input type="number" min={0} value={form.overtimeRate} onChange={(e) => update({ overtimeRate: +e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
                  </InputField>
                </div>

                <h3 className="text-sm pt-4" style={{ color: cn.text, borderTop: `1px solid ${cn.border}` }}>Service Level Agreement</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Replacement Time (hours)">
                    <input type="number" min={1} value={form.replacementHours} onChange={(e) => update({ replacementHours: +e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
                  </InputField>
                  <InputField label="Emergency Response (min)">
                    <input type="number" min={5} value={form.emergencyMinutes} onChange={(e) => update({ emergencyMinutes: +e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
                  </InputField>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Attendance Guarantee (%)">
                    <input type="number" min={80} max={100} value={form.attendancePercent} onChange={(e) => update({ attendancePercent: +e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
                  </InputField>
                  <InputField label="Reporting Frequency">
                    <select value={form.reportingFreq} onChange={(e) => update({ reportingFreq: e.target.value as any })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle}>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </InputField>
                </div>

                <h3 className="text-sm pt-4" style={{ color: cn.text, borderTop: `1px solid ${cn.border}` }}>Compliance & Trust</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "backgroundVerified", label: "Background Verified" },
                    { key: "medicalFit", label: "Medical Fitness Certified" },
                    { key: "contractRequired", label: "Contract Required" },
                    { key: "trialAvailable", label: "Trial Period Available" },
                  ].map((c) => (
                    <button key={c.key} onClick={() => update({ [c.key]: !(form as any)[c.key] } as any)} className="flex items-center gap-2 p-3 rounded-xl border text-sm cn-touch-target" style={{ borderColor: (form as any)[c.key] ? cn.teal : cn.border, background: (form as any)[c.key] ? cn.tealBg : "transparent" }}>
                      <CheckCircle2 className="w-4 h-4" style={{ color: (form as any)[c.key] ? cn.teal : cn.borderLight }} />
                      <span style={{ color: cn.text }}>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 6: Review */}
            {step === 6 && (
              <div className="space-y-4">
                <h2 className="text-xl" style={{ color: cn.text }}>Review & Publish</h2>
                <div className="space-y-3">
                  {[
                    { label: "Title", value: form.title || "—" },
                    { label: "Categories", value: form.categories.map((c) => c.replace(/_/g, " ")).join(", ") || "—" },
                    { label: "Service Areas", value: form.serviceAreas.join(", ") || "—" },
                    { label: "Staff", value: `${form.caregiverCount} caregiver(s), ${form.nurseCount} nurse(s) — ${form.staffLevel}` },
                    { label: "Schedule", value: `${form.hoursPerDay}h/day, ${form.shiftType}, ${form.staffPattern}` },
                    { label: "Base Price", value: `৳${form.basePrice.toLocaleString()}/${form.pricingModel}` },
                    { label: "SLA", value: `${form.replacementHours}h replacement, ${form.emergencyMinutes}min response, ${form.attendancePercent}% attendance` },
                    { label: "Services", value: [...form.personal_care, ...form.medical_support, ...form.advanced_care, ...form.coordination].join(", ") || "—" },
                  ].map((r) => (
                    <div key={r.label} className="flex justify-between p-3 rounded-xl" style={{ background: cn.bgInput }}>
                      <span className="text-sm" style={{ color: cn.textSecondary }}>{r.label}</span>
                      <span className="text-sm text-right max-w-[60%]" style={{ color: cn.text }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Nav Buttons */}
      <div className="flex justify-between mt-6">
        <button onClick={prev} disabled={step === 1} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm disabled:opacity-30" style={{ borderColor: cn.border, color: cn.textSecondary }}>
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        {step < 6 ? (
          <button onClick={next} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm" style={{ background: "var(--cn-gradient-agency)" }}>
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handlePublish} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm" style={{ background: "var(--cn-gradient-agency)" }}>
            <Star className="w-4 h-4" /> Publish Package
          </button>
        )}
      </div>
    </div>
  );
}