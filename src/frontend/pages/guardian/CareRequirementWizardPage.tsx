import React, { useState, useEffect, useRef } from "react";
import { Building2, User, HeartPulse, Wallet, ClipboardCheck, CheckCircle2, ChevronLeft, ChevronRight, Calendar, Clock, Star, MapPin, Phone, Shield, Utensils, Dumbbell, Pill, Move, Scissors, MessageSquare, Search, Package, Megaphone, Globe, ToggleLeft, ToggleRight, Timer, AlertTriangle } from "lucide-react";
import { useNavigate, useSearchParams, Link, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle, useCareSeekerBasePath } from "@/frontend/hooks";
import { guardianService } from "@/backend/services";
import { marketplaceService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useAriaToast } from "@/frontend/hooks/useAriaToast";
import { useTranslation } from "react-i18next";
import {
  UCCFValidationError,
  VALID_CARE_CATEGORIES,
  UCCF_SERVICE_OPTIONS,
  UCCF_EXCLUSION_OPTIONS,
  UCCF_ADD_ON_OPTIONS,
  UCCF_EQUIPMENT_SLUGS,
  UCCF_MEDICAL_DEVICES,
  UCCF_MEDICAL_PROCEDURES,
} from "@/backend/domain/uccf";
import type {
  CareCategory,
  StaffLevel,
  ShiftType,
  StaffPattern,
  UCCFCareNeeds,
  UCCFEquipment,
  UCCFLogistics,
  UCCFMedical,
  UCCFServices,
} from "@/backend/models";
import { useAuth } from "@/frontend/auth/AuthContext";

const steps = [
  { id: 1, name: "Select Agency", icon: Building2 },
  { id: 2, name: "Patient", icon: User },
  { id: 3, name: "Care Needs", icon: HeartPulse },
  { id: 4, name: "Schedule", icon: Calendar },
  { id: 5, name: "Budget", icon: Wallet },
  { id: 6, name: "Review", icon: ClipboardCheck },
];

const CARE_TYPE_ICONS: Record<CareCategory, string> = {
  elderly: "\u{1F9D3}",
  post_surgery: "\u{1FA7A}",
  chronic: "\u{1FA7A}",
  critical: "\u{1F6D1}",
  baby: "\u{1F476}",
  disability: "\u267F",
};

export default function CareRequirementWizardPage() {
  const toast = useAriaToast();
  const navigate = useNavigate();
  const location = useLocation();
  const base = useCareSeekerBasePath();
  const { user } = useAuth();
  const { t } = useTranslation("guardian");
  const { t: tCommon } = useTranslation("common");
  useDocumentTitle(tCommon("pageTitles.newCareRequirement", "New Care Requirement"));
  const [searchParams, setSearchParams] = useSearchParams();
  const preselectedAgency = searchParams.get("agency");
  const skipChoice = searchParams.get("direct") === "true";
  const [showWizard, setShowWizard] = useState(!!preselectedAgency || skipChoice);
  const [currentStep, setCurrentStep] = useState(preselectedAgency ? 2 : skipChoice ? 2 : 1);
  const [selectedAgency, setSelectedAgency] = useState(preselectedAgency || "");
  const [selectedCareTypes, setSelectedCareTypes] = useState<CareCategory[]>([]);
  const [postToMarketplace, setPostToMarketplace] = useState(skipChoice);

  useEffect(() => {
    if (preselectedAgency || skipChoice) {
      setShowWizard(true);
      setCurrentStep(2);
      setSelectedAgency(preselectedAgency || "");
      setPostToMarketplace(skipChoice);
    }
  }, [preselectedAgency, skipChoice]);
  const [formData, setFormData] = useState({
    contactName: "",
    contactPhone: "",
    patientName: "",
    patientAge: "",
    conditions: "",
    gender: "" as "" | "male" | "female" | "other",
    mobility: "assisted" as "independent" | "assisted" | "bedridden",
    cognitive: "" as "" | "normal" | "impaired" | "unconscious",
    riskLevel: "" as "" | "low" | "medium" | "high",
    shiftType: "day" as ShiftType,
    staffPattern: "single" as StaffPattern,
    staffLevel: "L2" as StaffLevel,
    caregiverCount: 1,
    nurseCount: 0,
    hoursPerDay: 8 as 8 | 12 | 24,
    startDate: "",
    durationType: "monthly" as "short" | "monthly" | "long_term",
    city: "Dhaka",
    area: "",
    address: "",
    budgetMin: "",
    budgetMax: "",
    preferredModel: "monthly" as "monthly" | "daily" | "hourly",
    notes: "",
    expiryDays: "15",
    adlBathing: false,
    feedingOral: false,
    feedingTube: false,
    toiletingAssisted: false,
    toiletingFull: false,
    adlMobility: false,
    monitorVitals: false,
    monitorSupervision: false,
    companionship: false,
    personal_care: [] as string[],
    medical_support: [] as string[],
    household_support: [] as string[],
    advanced_care: [] as string[],
    coordination: [] as string[],
    exclusions: [] as string[],
    addOns: [] as string[],
    equipment: [] as string[],
    equipmentProvider: "" as "" | "patient" | "agency" | "mixed",
    locationType: "" as "" | "home" | "hospital",
    accommodationProvided: false,
    foodProvided: false,
    travelDistanceKm: "",
    diagnosis: "",
    medicationComplexity: "" as "" | "low" | "medium" | "high",
    devices: [] as string[],
    procedures: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);

  const didPrefillContact = useRef(false);
  useEffect(() => {
    if (!user || didPrefillContact.current) return;
    didPrefillContact.current = true;
    setFormData((fd) => ({
      ...fd,
      contactName: fd.contactName.trim() ? fd.contactName : user.name?.trim() || "",
      contactPhone: fd.contactPhone.trim() ? fd.contactPhone : user.phone?.trim() || "",
    }));
  }, [user]);

  const next = () => {
    if (currentStep === 2) {
      const age = parseInt(formData.patientAge, 10);
      if (!formData.patientName.trim() || !Number.isFinite(age) || age < 0) {
        toast.error(t("wizard.validationPatient"));
        return;
      }
      if (!formData.contactName.trim() || !formData.contactPhone.trim()) {
        toast.error(t("wizard.validationContact"));
        return;
      }
    }
    if (currentStep === 3 && selectedCareTypes.length === 0) {
      toast.error(t("wizard.validationCareTypes"));
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, 6));
  };
  const prev = () => setCurrentStep(s => Math.max(s - 1, 1));

  /** True when Back should leave the wizard for the pre-wizard choice screen (not step 1 agency picker). */
  const backTargetsChoiceScreen =
    (currentStep === 1 && !preselectedAgency) ||
    (currentStep === 2 && !selectedAgency && (postToMarketplace || skipChoice));

  const exitWizardToChoiceScreen = () => {
    setShowWizard(false);
    setCurrentStep(1);
    setSearchParams((p) => {
      const n = new URLSearchParams(p);
      n.delete("direct");
      return n;
    }, { replace: true });
  };

  const handleWizardBack = () => {
    if (backTargetsChoiceScreen) {
      exitWizardToChoiceScreen();
      return;
    }
    // Deep-linked with ?agency= — step 2 "Back" should return to the prior page (e.g. agency profile), not the in-wizard agency picker.
    const returnTo = (location.state as { wizardReturnTo?: string } | null)?.wizardReturnTo;
    if (
      currentStep === 2 &&
      preselectedAgency &&
      selectedAgency === preselectedAgency
    ) {
      if (returnTo) {
        navigate(returnTo);
        return;
      }
      if (typeof window !== "undefined" && window.history.length > 1) {
        navigate(-1);
        return;
      }
      navigate(`${base}/dashboard`);
      return;
    }
    prev();
  };

  const toggleCareType = (id: CareCategory) => {
    setSelectedCareTypes((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleInField = (field: keyof typeof formData, slug: string) => {
    setFormData((fd) => {
      const arr = fd[field] as string[];
      if (!Array.isArray(arr)) return fd;
      const next = arr.includes(slug) ? arr.filter((s) => s !== slug) : [...arr, slug];
      return { ...fd, [field]: next };
    });
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    const expiryMs = parseInt(formData.expiryDays || "15", 10) * 24 * 3600 * 1000;
    const expiresAt = new Date(Date.now() + expiryMs).toISOString();

    try {
      if (selectedCareTypes.length === 0) {
        toast.error(t("wizard.validationCareTypes"));
        setSubmitting(false);
        return;
      }
      const uccfCats = selectedCareTypes;
      const catLabels = uccfCats.map((id) => t(`packageDetail.categories.${id}`));
      let title = `${catLabels.join(", ")} ${t("wizard.for")} ${formData.patientName.trim() || t("wizard.patient")}`;
      if (title.trim().length < 5) {
        title = `${t("wizard.titleFallbackPrefix")} ${formData.patientName.trim() || t("wizard.patient")} (${formData.city.trim() || "Dhaka"})`;
      }

      const adl: NonNullable<UCCFCareNeeds["ADL"]> = {};
      if (formData.adlBathing) adl.bathing = true;
      if (formData.feedingTube) adl.feeding = "tube";
      else if (formData.feedingOral) adl.feeding = "oral";
      if (formData.toiletingFull) adl.toileting = "full";
      else if (formData.toiletingAssisted) adl.toileting = "assisted";
      if (formData.adlMobility) adl.mobility_support = true;

      const monitoring: NonNullable<UCCFCareNeeds["monitoring"]> = {};
      if (formData.monitorVitals) monitoring.vitals = true;
      if (formData.monitorSupervision) monitoring.continuous_supervision = true;

      const care_needs: UCCFCareNeeds = {};
      if (Object.keys(adl).length) care_needs.ADL = adl;
      if (Object.keys(monitoring).length) care_needs.monitoring = monitoring;
      if (formData.companionship) care_needs.companionship = true;
      const careNeedsPayload: UCCFCareNeeds = Object.keys(care_needs).length ? care_needs : {};

      const services: UCCFServices = {};
      (Object.keys(UCCF_SERVICE_OPTIONS) as (keyof typeof UCCF_SERVICE_OPTIONS)[]).forEach((k) => {
        const sel = formData[k];
        if (Array.isArray(sel) && sel.length > 0) (services as Record<string, string[]>)[k] = sel;
      });

      const medical: UCCFMedical | undefined =
        formData.diagnosis.trim() ||
        formData.medicationComplexity ||
        formData.devices.length ||
        formData.procedures.length
          ? {
              diagnosis: formData.diagnosis.trim() || undefined,
              medication_complexity: formData.medicationComplexity || undefined,
              devices: formData.devices.length ? (formData.devices as UCCFMedical["devices"]) : undefined,
              procedures_required: formData.procedures.length
                ? (formData.procedures as UCCFMedical["procedures_required"])
                : undefined,
            }
          : undefined;

      const logistics: UCCFLogistics | undefined =
        formData.locationType ||
        formData.accommodationProvided ||
        formData.foodProvided ||
        formData.travelDistanceKm
          ? {
              location_type: formData.locationType || undefined,
              accommodation_provided: formData.accommodationProvided || undefined,
              food_provided: formData.foodProvided || undefined,
              travel_distance_km: formData.travelDistanceKm
                ? parseInt(formData.travelDistanceKm, 10)
                : undefined,
            }
          : undefined;

      const equipment: UCCFEquipment | undefined =
        formData.equipment.length > 0 || formData.equipmentProvider
          ? {
              required: formData.equipment,
              provider: formData.equipmentProvider || undefined,
            }
          : undefined;

      const patientAge = parseInt(formData.patientAge, 10);
      const req = await marketplaceService.createCareRequest({
        meta: {
          type: "request",
          title,
          category: uccfCats,
          location: {
            city: formData.city || "Dhaka",
            area: formData.area || undefined,
            address_optional: formData.address || undefined,
          },
          start_date: formData.startDate || undefined,
          duration_type: formData.durationType,
        },
        party: {
          role: "patient",
          name: formData.contactName.trim(),
          contact_phone: formData.contactPhone.trim(),
        },
        care_subject: {
          age: patientAge,
          gender: formData.gender || undefined,
          condition_summary:
            [formData.conditions.trim(), formData.notes.trim()].filter(Boolean).join("\n\n") || undefined,
          mobility: formData.mobility,
          cognitive: formData.cognitive || undefined,
          risk_level: formData.riskLevel || undefined,
        },
        medical,
        care_needs: careNeedsPayload,
        staffing: {
          required_level: formData.staffLevel,
          caregiver_count: formData.caregiverCount,
          nurse_count: formData.nurseCount,
        },
        schedule: {
          hours_per_day: formData.hoursPerDay,
          shift_type: formData.shiftType,
          staff_pattern: formData.staffPattern,
        },
        services: Object.keys(services).length ? services : undefined,
        logistics,
        equipment,
        exclusions: formData.exclusions.length ? formData.exclusions : undefined,
        add_ons: formData.addOns.length ? formData.addOns : undefined,
        pricing: {
          preferred_model: formData.preferredModel,
          budget_min: parseInt(formData.budgetMin, 10) || undefined,
          budget_max: parseInt(formData.budgetMax, 10) || undefined,
        },
        status: "draft",
        expires_at: expiresAt,
      });

      if (postToMarketplace) {
        await marketplaceService.publishCareRequest(req.id);
        toast.success(t("wizard.submitMarketplaceSuccess"));
        navigate(`${base}/marketplace-hub`, { replace: true });
      } else {
        toast.success(t("wizard.submitSuccess"));
        navigate(`${base}/dashboard`, { replace: true });
      }
    } catch (e) {
      if (e instanceof UCCFValidationError) {
        toast.error(e.issues.join(" "));
      } else {
        toast.error(t("wizard.submitFailed"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const { data: agencies, loading, error } = useAsyncData(() => guardianService.getWizardAgencies());

  // ─── Pre-Wizard Choice Screen ───
  if (!showWizard) {
    return (
      <div className="max-w-2xl mx-auto pb-20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: cn.greenBg }}>
            <HeartPulse className="w-8 h-8" style={{ color: cn.green }} />
          </div>
          <h1 className="text-2xl mb-2" style={{ color: cn.text }}>{t("wizard.findRightCare")}</h1>
          <p className="text-sm" style={{ color: cn.textSecondary }}>
            {t("wizard.exploreFirst")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Option 1: Browse marketplace */}
          <Link
            to={`${base}/marketplace-hub?tab=packages`}
            className="stat-card p-6 hover:shadow-md transition-all no-underline group"
            style={{ border: `2px solid ${cn.green}` }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: cn.greenBg }}>
              <Package className="w-6 h-6" style={{ color: cn.green }} />
            </div>
            <h3 className="text-sm mb-2" style={{ color: cn.text }}>{t("wizard.browsePackages")}</h3>
            <p className="text-xs mb-4" style={{ color: cn.textSecondary }}>
              {t("wizard.browseDesc")}
            </p>
            <div className="flex flex-wrap gap-1 mb-4">
              {[t("wizard.instantBooking"), t("wizard.verifiedAgencies"), t("wizard.clearPricing")].map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: cn.greenBg, color: cn.green }}>
                  {tag}
                </span>
              ))}
            </div>
            <span className="flex items-center gap-1 text-xs group-hover:gap-2 transition-all" style={{ color: cn.green }}>
              {t("wizard.exploreMarketplace")} <ChevronRight className="w-3 h-3" />
            </span>
            <div className="mt-3 px-2.5 py-1.5 rounded-lg text-[10px] inline-block" style={{ background: cn.amberBg, color: cn.amber }}>
              {t("wizard.recommended")}
            </div>
          </Link>

          {/* Option 2: Post a job */}
          <button
            onClick={() => { setShowWizard(true); setCurrentStep(2); setPostToMarketplace(true); }}
            className="stat-card p-6 hover:shadow-md transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: cn.pinkBg }}>
              <Megaphone className="w-6 h-6" style={{ color: cn.pink }} />
            </div>
            <h3 className="text-sm mb-2" style={{ color: cn.text }}>{t("wizard.postRequirement")}</h3>
            <p className="text-xs mb-4" style={{ color: cn.textSecondary }}>
              {t("wizard.postDesc")}
            </p>
            <div className="flex flex-wrap gap-1 mb-4">
              {[t("wizard.customRequirements"), t("wizard.receiveBids"), t("wizard.negotiateTerms")].map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: cn.pinkBg, color: cn.pink }}>
                  {tag}
                </span>
              ))}
            </div>
            <span className="flex items-center gap-1 text-xs group-hover:gap-2 transition-all" style={{ color: cn.pink }}>
              {t("wizard.createRequirement")} <ChevronRight className="w-3 h-3" />
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-20">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8 px-2">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all" style={{ background: isActive ? "var(--cn-gradient-caregiver)" : isCompleted ? cn.greenBg : cn.bgInput, color: isActive ? "white" : isCompleted ? cn.green : cn.textSecondary }}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className="text-[9px] hidden md:block" style={{ color: isActive ? cn.pink : cn.textSecondary }}>{step.name}</span>
              </div>
              {i < steps.length - 1 && <div className="flex-1 h-0.5 mx-1" style={{ background: currentStep > step.id ? cn.green : cn.borderLight }} />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="finance-card p-6 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            {/* Step 1: Select Agency */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl mb-1" style={{ color: cn.text }}>{t("wizard.selectAgency")}</h2>
                <p className="text-sm mb-4" style={{ color: cn.textSecondary }}>{t("wizard.selectAgencyDesc")}</p>
                <div className="space-y-3">
                  {agencies ? agencies.map(a => (
                    <button key={a.id} onClick={() => { setSelectedAgency(a.id); next(); }} className="w-full p-4 rounded-xl border text-left transition-all hover:shadow-sm cn-touch-target" style={{ borderColor: selectedAgency === a.id ? cn.pink : cn.border }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs" style={{ background: "var(--cn-gradient-agency)" }}>{a.name.slice(0, 2)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2"><span className="text-sm" style={{ color: cn.text }}>{a.name}</span>{a.verified && <Shield className="w-3 h-3" style={{ color: cn.teal }} />}</div>
                          <div className="flex items-center gap-3 text-xs" style={{ color: cn.textSecondary }}><span className="flex items-center gap-1"><Star className="w-3 h-3" style={{ color: cn.amber }} /> {a.rating}</span><span><MapPin className="w-3 h-3 inline" /> {a.location}</span></div>
                        </div>
                      </div>
                    </button>
                  )) : <PageSkeleton />}
                </div>
              </div>
            )}

            {/* Step 2: Patient Info */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl" style={{ color: cn.text }}>{t("wizard.patientInfo")}</h2>
                <div><label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.patientName")}</label><input type="text" value={formData.patientName} onChange={e => setFormData({ ...formData, patientName: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }} placeholder={t("wizard.patientNamePlaceholder")} /></div>
                <div><label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.age")}</label><input type="number" value={formData.patientAge} onChange={e => setFormData({ ...formData, patientAge: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }} placeholder={t("wizard.age")} /></div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.gender")}</label>
                  <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value as typeof formData.gender })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}>
                    <option value="">{t("wizard.preferNotSay")}</option>
                    <option value="male">{t("wizard.genderMale")}</option>
                    <option value="female">{t("wizard.genderFemale")}</option>
                    <option value="other">{t("wizard.genderOther")}</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.mobility")}</label>
                    <select value={formData.mobility} onChange={(e) => setFormData({ ...formData, mobility: e.target.value as typeof formData.mobility })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}>
                      <option value="independent">{t("wizard.mobilityIndependent")}</option>
                      <option value="assisted">{t("wizard.mobilityAssisted")}</option>
                      <option value="bedridden">{t("wizard.mobilityBedridden")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.cognitive")}</label>
                    <select value={formData.cognitive} onChange={(e) => setFormData({ ...formData, cognitive: e.target.value as typeof formData.cognitive })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}>
                      <option value="">{t("wizard.preferNotSay")}</option>
                      <option value="normal">{t("wizard.cognitiveNormal")}</option>
                      <option value="impaired">{t("wizard.cognitiveImpaired")}</option>
                      <option value="unconscious">{t("wizard.cognitiveUnconscious")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.riskLevel")}</label>
                    <select value={formData.riskLevel} onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value as typeof formData.riskLevel })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}>
                      <option value="">{t("wizard.preferNotSay")}</option>
                      <option value="low">{t("wizard.riskLow")}</option>
                      <option value="medium">{t("wizard.riskMedium")}</option>
                      <option value="high">{t("wizard.riskHigh")}</option>
                    </select>
                  </div>
                </div>
                <div><label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.medicalConditions")}</label><textarea value={formData.conditions} onChange={e => setFormData({ ...formData, conditions: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }} rows={3} placeholder={t("wizard.medicalConditionsPlaceholder")} /></div>
                <p className="text-sm font-medium pt-2" style={{ color: cn.text }}>{t("wizard.contactForAgency")}</p>
                <p className="text-xs" style={{ color: cn.textSecondary }}>{t("wizard.contactForAgencyDesc")}</p>
                <div><label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.contactName")}</label><input type="text" value={formData.contactName} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }} autoComplete="name" /></div>
                <div><label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.contactPhone")}</label><input type="tel" value={formData.contactPhone} onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }} autoComplete="tel" placeholder={t("wizard.contactPhonePlaceholder")} /></div>
              </div>
            )}

            {/* Step 3: Care Needs */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl" style={{ color: cn.text }}>{t("wizard.careRequirements")}</h2>
                <p className="text-sm" style={{ color: cn.textSecondary }}>{t("wizard.careRequirementsDesc")}</p>
                <div className="grid grid-cols-2 gap-3">
                  {VALID_CARE_CATEGORIES.map((id) => (
                    <button key={id} type="button" onClick={() => toggleCareType(id)} className="p-4 rounded-xl border text-left transition-all cn-touch-target" style={{ borderColor: selectedCareTypes.includes(id) ? cn.pink : cn.border, background: selectedCareTypes.includes(id) ? cn.pinkBg : "transparent" }}>
                      <span className="text-2xl block mb-2">{CARE_TYPE_ICONS[id]}</span>
                      <p className="text-sm" style={{ color: cn.text }}>{t(`packageDetail.categories.${id}`)}</p>
                      <p className="text-xs" style={{ color: cn.textSecondary }}>{t(`wizard.careCategoryDesc.${id}`)}</p>
                    </button>
                  ))}
                </div>
                <div className="pt-4 space-y-3" style={{ borderTop: `1px solid ${cn.borderLight}` }}>
                  <p className="text-sm font-medium" style={{ color: cn.text }}>{t("wizard.dailyLiving")}</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "adlBathing" as const, label: t("wizard.needBathing") },
                      { key: "feedingOral" as const, label: t("wizard.needFeedingOral") },
                      { key: "feedingTube" as const, label: t("wizard.needFeedingTube") },
                      { key: "toiletingAssisted" as const, label: t("wizard.needToiletingAssisted") },
                      { key: "toiletingFull" as const, label: t("wizard.needToiletingFull") },
                      { key: "adlMobility" as const, label: t("wizard.needMobilitySupport") },
                    ].map(({ key, label }) => (
                      <button key={key} type="button" onClick={() => setFormData((fd) => ({ ...fd, [key]: !fd[key] }))} className="px-3 py-2 rounded-xl border text-xs cn-touch-target" style={{ borderColor: formData[key] ? cn.pink : cn.border, background: formData[key] ? cn.pinkBg : "transparent", color: formData[key] ? cn.pink : cn.textSecondary }}>{label}</button>
                    ))}
                  </div>
                  <p className="text-sm font-medium pt-2" style={{ color: cn.text }}>{t("wizard.monitoringCompanionship")}</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "monitorVitals" as const, label: t("wizard.monitorVitals") },
                      { key: "monitorSupervision" as const, label: t("wizard.continuousSupervision") },
                      { key: "companionship" as const, label: t("wizard.companionship") },
                    ].map(({ key, label }) => (
                      <button key={key} type="button" onClick={() => setFormData((fd) => ({ ...fd, [key]: !fd[key] }))} className="px-3 py-2 rounded-xl border text-xs cn-touch-target" style={{ borderColor: formData[key] ? cn.pink : cn.border, background: formData[key] ? cn.pinkBg : "transparent", color: formData[key] ? cn.pink : cn.textSecondary }}>{label}</button>
                    ))}
                  </div>
                </div>
                <div className="pt-4 space-y-4" style={{ borderTop: `1px solid ${cn.borderLight}` }}>
                  <p className="text-sm font-medium" style={{ color: cn.text }}>{t("wizard.serviceChecklist")}</p>
                  {(Object.keys(UCCF_SERVICE_OPTIONS) as Array<keyof typeof UCCF_SERVICE_OPTIONS>).map((bucket) => {
                    const opts = UCCF_SERVICE_OPTIONS[bucket];
                    const selectedList = formData[bucket] as string[];
                    const field = bucket as keyof typeof formData;
                    return (
                      <div key={bucket}>
                        <p className="text-xs mb-2" style={{ color: cn.textSecondary }}>{bucket.replace(/_/g, " ")}</p>
                        <div className="flex flex-wrap gap-2">
                          {opts.map((slug) => {
                            const selected = selectedList.includes(slug);
                            return (
                              <button key={slug} type="button" onClick={() => toggleInField(field, slug)} className="px-3 py-1.5 rounded-lg border text-xs cn-touch-target" style={{ borderColor: selected ? cn.green : cn.border, background: selected ? cn.greenBg : "transparent", color: selected ? cn.green : cn.textSecondary }}>{slug.replace(/_/g, " ")}</button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-4 space-y-3" style={{ borderTop: `1px solid ${cn.borderLight}` }}>
                  <p className="text-sm font-medium" style={{ color: cn.text }}>{t("wizard.exclusionsAddOnsEquip")}</p>
                  <p className="text-xs" style={{ color: cn.textSecondary }}>{t("wizard.exclusions")}</p>
                  <div className="flex flex-wrap gap-2">
                    {UCCF_EXCLUSION_OPTIONS.map((slug) => {
                      const selected = formData.exclusions.includes(slug);
                      return (
                        <button key={slug} type="button" onClick={() => toggleInField("exclusions", slug)} className="px-3 py-1.5 rounded-lg border text-xs cn-touch-target" style={{ borderColor: selected ? "#EF4444" : cn.border, background: selected ? "rgba(239,68,68,0.08)" : "transparent", color: selected ? "#EF4444" : cn.textSecondary }}>{slug.replace(/_/g, " ")}</button>
                      );
                    })}
                  </div>
                  <p className="text-xs" style={{ color: cn.textSecondary }}>{t("wizard.addOns")}</p>
                  <div className="flex flex-wrap gap-2">
                    {UCCF_ADD_ON_OPTIONS.map((slug) => {
                      const selected = formData.addOns.includes(slug);
                      return (
                        <button key={slug} type="button" onClick={() => toggleInField("addOns", slug)} className="px-3 py-1.5 rounded-lg border text-xs cn-touch-target" style={{ borderColor: selected ? cn.amber : cn.border, background: selected ? cn.amberBg : "transparent", color: selected ? cn.amber : cn.textSecondary }}>{slug.replace(/_/g, " ")}</button>
                      );
                    })}
                  </div>
                  <p className="text-xs" style={{ color: cn.textSecondary }}>{t("wizard.equipment")}</p>
                  <div className="flex flex-wrap gap-2">
                    {UCCF_EQUIPMENT_SLUGS.map((slug) => {
                      const selected = formData.equipment.includes(slug);
                      return (
                        <button key={slug} type="button" onClick={() => toggleInField("equipment", slug)} className="px-3 py-1.5 rounded-lg border text-xs cn-touch-target" style={{ borderColor: selected ? cn.teal : cn.border, background: selected ? cn.tealBg : "transparent", color: selected ? cn.teal : cn.textSecondary }}>{slug.replace(/_/g, " ")}</button>
                      );
                    })}
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: cn.textSecondary }}>{t("wizard.equipmentProvider")}</label>
                    <select value={formData.equipmentProvider} onChange={(e) => setFormData({ ...formData, equipmentProvider: e.target.value as typeof formData.equipmentProvider })} className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}>
                      <option value="">{t("wizard.preferNotSay")}</option>
                      <option value="patient">{t("wizard.providerPatient")}</option>
                      <option value="agency">{t("wizard.providerAgency")}</option>
                      <option value="mixed">{t("wizard.providerMixed")}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Schedule */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl" style={{ color: cn.text }}>{t("wizard.schedulePreferences")}</h2>
                <div>
                  <label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.shiftType")}</label>
                  <div className="flex gap-2 flex-wrap">
                    {(["day", "night", "rotational"] as const).map((st) => (
                      <button key={st} type="button" onClick={() => setFormData({ ...formData, shiftType: st })} className="flex-1 min-w-[5rem] py-2.5 rounded-xl border text-xs cn-touch-target" style={{ borderColor: formData.shiftType === st ? cn.pink : cn.border, background: formData.shiftType === st ? cn.pinkBg : "transparent", color: formData.shiftType === st ? cn.pink : cn.text }}>{t(`wizard.shiftType_${st}`)}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.staffPattern")}</label>
                  <div className="flex gap-2 flex-wrap">
                    {(["single", "double", "rotational_team"] as const).map((sp) => (
                      <button key={sp} type="button" onClick={() => setFormData({ ...formData, staffPattern: sp })} className="flex-1 min-w-[5rem] py-2.5 rounded-xl border text-xs cn-touch-target" style={{ borderColor: formData.staffPattern === sp ? cn.pink : cn.border, background: formData.staffPattern === sp ? cn.pinkBg : "transparent", color: formData.staffPattern === sp ? cn.pink : cn.text }}>{t(`wizard.staffPattern_${sp}`)}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.staffLevel")}</label>
                  <select value={formData.staffLevel} onChange={(e) => setFormData({ ...formData, staffLevel: e.target.value as StaffLevel })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}>
                    {(["L1", "L2", "L3", "L4"] as const).map((lv) => (
                      <option key={lv} value={lv}>{t(`packageDetail.staffLevels.${lv}`)}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.caregiverCount")}</label>
                    <input type="number" min={0} value={formData.caregiverCount} onChange={(e) => setFormData({ ...formData, caregiverCount: Math.max(0, parseInt(e.target.value, 10) || 0) })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }} />
                  </div>
                  <div>
                    <label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.nurseCount")}</label>
                    <input type="number" min={0} value={formData.nurseCount} onChange={(e) => setFormData({ ...formData, nurseCount: Math.max(0, parseInt(e.target.value, 10) || 0) })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.hoursPerDay")}</label>
                  <div className="flex gap-2">
                    {([8, 12, 24] as const).map((h) => (
                      <button key={h} type="button" onClick={() => setFormData({ ...formData, hoursPerDay: h })} className="flex-1 py-2.5 rounded-xl border text-xs cn-touch-target" style={{ borderColor: formData.hoursPerDay === h ? cn.pink : cn.border, background: formData.hoursPerDay === h ? cn.pinkBg : "transparent", color: formData.hoursPerDay === h ? cn.pink : cn.text }}>{h}h</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div><label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.city")}</label><input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }} /></div>
                  <div><label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.area")}</label><input type="text" value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }} placeholder={t("wizard.areaPlaceholder")} /></div>
                  <div><label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.addressOptional")}</label><input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }} /></div>
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.locationType")}</label>
                  <select value={formData.locationType} onChange={(e) => setFormData({ ...formData, locationType: e.target.value as typeof formData.locationType })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}>
                    <option value="">{t("wizard.preferNotSay")}</option>
                    <option value="home">{t("wizard.locationHome")}</option>
                    <option value="hospital">{t("wizard.locationHospital")}</option>
                  </select>
                </div>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: cn.text }}>
                    <input type="checkbox" checked={formData.accommodationProvided} onChange={(e) => setFormData({ ...formData, accommodationProvided: e.target.checked })} className="rounded" />
                    {t("wizard.accommodationProvided")}
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: cn.text }}>
                    <input type="checkbox" checked={formData.foodProvided} onChange={(e) => setFormData({ ...formData, foodProvided: e.target.checked })} className="rounded" />
                    {t("wizard.foodProvided")}
                  </label>
                </div>
                <div><label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.travelDistanceKm")}</label><input type="number" min={0} value={formData.travelDistanceKm} onChange={(e) => setFormData({ ...formData, travelDistanceKm: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }} placeholder="e.g. 10" /></div>
                <div><label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.preferredStartDate")}</label><input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }} /></div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.durationType")}</label>
                  <select value={formData.durationType} onChange={(e) => setFormData({ ...formData, durationType: e.target.value as typeof formData.durationType })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}>
                    <option value="short">{t("wizard.durationShort")}</option>
                    <option value="monthly">{t("wizard.durationMonthly")}</option>
                    <option value="long_term">{t("wizard.durationLongTerm")}</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 5: Budget */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <h2 className="text-xl" style={{ color: cn.text }}>{t("wizard.budgetRange")}</h2>
                <p className="text-sm" style={{ color: cn.textSecondary }}>{t("wizard.budgetDesc")}</p>
                <div>
                  <label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.preferredPricingModel")}</label>
                  <select value={formData.preferredModel} onChange={(e) => setFormData({ ...formData, preferredModel: e.target.value as typeof formData.preferredModel })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}>
                    <option value="monthly">{t("wizard.modelMonthly")}</option>
                    <option value="daily">{t("wizard.modelDaily")}</option>
                    <option value="hourly">{t("wizard.modelHourly")}</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.minimum")}</label><input type="number" value={formData.budgetMin} onChange={e => setFormData({ ...formData, budgetMin: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }} placeholder="15,000" /></div>
                  <div><label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.maximum")}</label><input type="number" value={formData.budgetMax} onChange={e => setFormData({ ...formData, budgetMax: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }} placeholder="35,000" /></div>
                </div>
                <div className="p-4 rounded-xl space-y-3" style={{ background: cn.bgInput, border: `1px solid ${cn.borderLight}` }}>
                  <p className="text-sm font-medium" style={{ color: cn.text }}>{t("wizard.medicalOptional")}</p>
                  <div><label className="block text-xs mb-1" style={{ color: cn.textSecondary }}>{t("wizard.diagnosis")}</label><input type="text" value={formData.diagnosis} onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }} /></div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: cn.textSecondary }}>{t("wizard.medicationComplexity")}</label>
                    <select value={formData.medicationComplexity} onChange={(e) => setFormData({ ...formData, medicationComplexity: e.target.value as typeof formData.medicationComplexity })} className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}>
                      <option value="">{t("wizard.preferNotSay")}</option>
                      <option value="low">{t("wizard.medLow")}</option>
                      <option value="medium">{t("wizard.medMedium")}</option>
                      <option value="high">{t("wizard.medHigh")}</option>
                    </select>
                  </div>
                  <p className="text-xs" style={{ color: cn.textSecondary }}>{t("wizard.devices")}</p>
                  <div className="flex flex-wrap gap-2">
                    {UCCF_MEDICAL_DEVICES.map((d) => {
                      const selected = formData.devices.includes(d);
                      return (
                        <button key={d} type="button" onClick={() => toggleInField("devices", d)} className="px-3 py-1.5 rounded-lg border text-xs cn-touch-target" style={{ borderColor: selected ? cn.teal : cn.border, background: selected ? cn.tealBg : "transparent", color: selected ? cn.teal : cn.textSecondary }}>{d.replace(/_/g, " ")}</button>
                      );
                    })}
                  </div>
                  <p className="text-xs" style={{ color: cn.textSecondary }}>{t("wizard.procedures")}</p>
                  <div className="flex flex-wrap gap-2">
                    {UCCF_MEDICAL_PROCEDURES.map((p) => {
                      const selected = formData.procedures.includes(p);
                      return (
                        <button key={p} type="button" onClick={() => toggleInField("procedures", p)} className="px-3 py-1.5 rounded-lg border text-xs cn-touch-target" style={{ borderColor: selected ? cn.teal : cn.border, background: selected ? cn.tealBg : "transparent", color: selected ? cn.teal : cn.textSecondary }}>{p.replace(/_/g, " ")}</button>
                      );
                    })}
                  </div>
                </div>
                <div><label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.additionalNotes")}</label><textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }} rows={3} placeholder={t("wizard.additionalNotesPlaceholder")} /></div>

                {/* Job Expiry Picker */}
                <div className="p-4 rounded-xl" style={{ background: cn.bgInput, border: `1px solid ${cn.border}` }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cn.amberBg }}>
                      <Timer className="w-5 h-5" style={{ color: cn.amber }} />
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: cn.text }}>{t("wizard.listingExpiry")}</p>
                      <p className="text-xs" style={{ color: cn.textSecondary }}>
                        {t("wizard.expiryDesc")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {[3, 7, 10, 15].map(d => (
                      <button
                        key={d}
                        onClick={() => setFormData({ ...formData, expiryDays: String(d) })}
                        className="flex-1 py-2.5 rounded-xl border text-xs cn-touch-target transition-all"
                        style={{
                          borderColor: formData.expiryDays === String(d) ? cn.amber : cn.border,
                          background: formData.expiryDays === String(d) ? cn.amberBg : "transparent",
                          color: formData.expiryDays === String(d) ? cn.amber : cn.text,
                        }}
                      >
                        {d} days
                      </button>
                    ))}
                  </div>
                  <div className="flex items-start gap-2 mt-3">
                    <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" style={{ color: cn.amber }} />
                    <p className="text-[10px]" style={{ color: cn.textSecondary }}>
                      {t("wizard.expiryNote")}
                    </p>
                  </div>
                </div>

                {/* Post to Marketplace Toggle */}
                <div className="p-4 rounded-xl" style={{ background: cn.bgInput, border: `1px solid ${postToMarketplace ? cn.green : cn.border}` }}>
                  <button
                    onClick={() => setPostToMarketplace(!postToMarketplace)}
                    className="w-full flex items-center justify-between cn-touch-target"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: postToMarketplace ? cn.greenBg : cn.bgInput }}>
                        <Globe className="w-5 h-5" style={{ color: postToMarketplace ? cn.green : cn.textSecondary }} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm" style={{ color: cn.text }}>{t("wizard.postToMarketplace")}</p>
                        <p className="text-xs" style={{ color: cn.textSecondary }}>
                          {postToMarketplace
                            ? t("wizard.marketplaceOn")
                            : t("wizard.marketplaceOff")}
                        </p>
                      </div>
                    </div>
                    {postToMarketplace
                      ? <ToggleRight className="w-8 h-8 shrink-0" style={{ color: cn.green }} />
                      : <ToggleLeft className="w-8 h-8 shrink-0" style={{ color: cn.textSecondary }} />
                    }
                  </button>
                  {postToMarketplace && (
                    <p className="text-[10px] mt-2 ml-13" style={{ color: cn.green }}>
                      {t("wizard.marketplaceHint")}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 6: Review */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <h2 className="text-xl" style={{ color: cn.text }}>{t("wizard.reviewSubmit")}</h2>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl" style={{ background: cn.bgInput }}><p className="text-xs mb-1" style={{ color: cn.textSecondary }}>{t("wizard.patient")}</p><p className="text-sm" style={{ color: cn.text }}>{formData.patientName || t("wizard.notSpecified")}, {t("wizard.age")} {formData.patientAge || "N/A"}</p></div>
                  <div className="p-3 rounded-xl" style={{ background: cn.bgInput }}><p className="text-xs mb-1" style={{ color: cn.textSecondary }}>{t("wizard.contactForAgency")}</p><p className="text-sm" style={{ color: cn.text }}>{formData.contactName || "—"} · {formData.contactPhone || "—"}</p></div>
                  <div className="p-3 rounded-xl" style={{ background: cn.bgInput }}><p className="text-xs mb-1" style={{ color: cn.textSecondary }}>{t("wizard.careTypes")}</p><div className="flex flex-wrap gap-1">{selectedCareTypes.map((ct) => <span key={ct} className="px-2 py-0.5 rounded-full text-xs" style={{ background: cn.pinkBg, color: cn.pink }}>{t(`packageDetail.categories.${ct}`)}</span>)}</div></div>
                  <div className="p-3 rounded-xl" style={{ background: cn.bgInput }}><p className="text-xs mb-1" style={{ color: cn.textSecondary }}>{t("wizard.schedule")}</p><p className="text-sm" style={{ color: cn.text }}>{t(`wizard.shiftType_${formData.shiftType}`)} · {t(`wizard.staffPattern_${formData.staffPattern}`)} · {formData.hoursPerDay}h/{t("wizard.dayShort")} · {t(`packageDetail.staffLevels.${formData.staffLevel}`)} · {t("wizard.cgNurseShort", { c: formData.caregiverCount, n: formData.nurseCount })} · {t("wizard.starting")} {formData.startDate || "TBD"} · {formData.durationType}</p></div>
                  <div className="p-3 rounded-xl" style={{ background: cn.bgInput }}><p className="text-xs mb-1" style={{ color: cn.textSecondary }}>{t("wizard.budget")}</p><p className="text-sm" style={{ color: cn.text }}>৳{formData.budgetMin || "?"} – ৳{formData.budgetMax || "?"} · {formData.preferredModel}</p></div>
                  {/* Expiry info */}
                  <div className="p-3 rounded-xl flex items-center gap-2" style={{ background: cn.amberBg }}>
                    <Timer className="w-4 h-4" style={{ color: cn.amber }} />
                    <div>
                      <p className="text-xs" style={{ color: cn.textSecondary }}>{t("wizard.listingExpiry")}</p>
                      <p className="text-sm" style={{ color: cn.amber }}>{t("wizard.expiryDays", { count: parseInt(formData.expiryDays, 10) || 15 })}</p>
                    </div>
                  </div>
                  {/* Marketplace posting indicator */}
                  <div className="p-3 rounded-xl flex items-center gap-2" style={{ background: postToMarketplace ? cn.greenBg : cn.bgInput }}>
                    <Globe className="w-4 h-4" style={{ color: postToMarketplace ? cn.green : cn.textSecondary }} />
                    <div>
                      <p className="text-xs" style={{ color: cn.textSecondary }}>{t("wizard.distribution")}</p>
                      <p className="text-sm" style={{ color: postToMarketplace ? cn.green : cn.text }}>
                        {postToMarketplace ? t("wizard.openMarketplace") : t("wizard.directOnly")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: `1px solid ${cn.borderLight}` }}>
          <button type="button" onClick={handleWizardBack} disabled={currentStep === 1 && !!preselectedAgency} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm disabled:opacity-30 cn-touch-target" style={{ color: cn.text }}>
            <ChevronLeft className="w-4 h-4" /> {backTargetsChoiceScreen ? t("wizard.backToOptions") : t("wizard.back")}
          </button>
          {currentStep < 6 ? (
            <button onClick={next} className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm text-white cn-touch-target" style={{ background: "var(--cn-gradient-caregiver)" }}>
              {t("wizard.next")} <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm text-white cn-touch-target disabled:opacity-60" style={{ background: "var(--cn-gradient-guardian)" }}>
              {submitting ? (
                <>{t("wizard.submitting")}</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> {t("wizard.submitRequirement")}</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}