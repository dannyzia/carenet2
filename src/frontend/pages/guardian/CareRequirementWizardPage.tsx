import React, { useState, useEffect, useRef } from "react";
import {
  Building2,
  User,
  HeartPulse,
  Wallet,
  ClipboardCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Star,
  MapPin,
  Phone,
  Shield,
  Utensils,
  Dumbbell,
  Pill,
  Move,
  Scissors,
  MessageSquare,
  Search,
  Package,
  Megaphone,
  Globe,
  ToggleLeft,
  ToggleRight,
  Timer,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { useNavigate, useSearchParams, Link, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/frontend/theme/tokens";
import {
  useAsyncData,
  useDocumentTitle,
  useCareSeekerBasePath,
} from "@/frontend/hooks";
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
  UCCFCareSubject,
  UCCFEquipment,
  UCCFLogistics,
  UCCFMedical,
  UCCFServices,
} from "@/backend/models";
import { useAuth } from "@/frontend/auth/AuthContext";

const steps = [
  { id: 1, name: "Agency", icon: Building2 },
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

/** Single source of truth for Step 3 service chips. Each entry maps to a UCCF bucket + optional ADL/monitoring field. */
const UNIFIED_SERVICES = [
  // personal_care
  { slug: "bathing", label: "Bathing", group: "Daily Living" },
  { slug: "grooming", label: "Grooming", group: "Daily Living" },
  { slug: "feeding_oral", label: "Oral feeding", group: "Daily Living" },
  { slug: "feeding_tube", label: "Tube feeding", group: "Daily Living" },
  {
    slug: "toileting_assisted",
    label: "Toileting (assisted)",
    group: "Daily Living",
  },
  {
    slug: "toileting_full",
    label: "Full toileting care",
    group: "Daily Living",
  },
  {
    slug: "mobility_support",
    label: "Mobility support",
    group: "Daily Living",
  },
  // medical_support
  { slug: "vitals", label: "Vitals monitoring", group: "Medical Support" },
  {
    slug: "medication",
    label: "Medication management",
    group: "Medical Support",
  },
  { slug: "wound_care", label: "Wound dressing", group: "Medical Support" },
  {
    slug: "supervision",
    label: "Continuous supervision",
    group: "Medical Support",
  },
  { slug: "companionship", label: "Companionship", group: "Medical Support" },
  // household_support
  { slug: "meal_prep", label: "Meal preparation", group: "Household" },
  { slug: "patient_laundry", label: "Patient laundry", group: "Household" },
  // advanced_care
  { slug: "NG_tube", label: "NG tube care", group: "Advanced Care" },
  { slug: "suction", label: "Suctioning", group: "Advanced Care" },
  { slug: "oxygen_therapy", label: "Oxygen therapy", group: "Advanced Care" },
  // coordination
  { slug: "doctor_visit", label: "Doctor visit escort", group: "Coordination" },
  {
    slug: "hospital_support",
    label: "Hospital support",
    group: "Coordination",
  },
] as const;

export default function CareRequirementWizardPage() {
  const toast = useAriaToast();
  const navigate = useNavigate();
  const location = useLocation();
  const base = useCareSeekerBasePath();
  const { user } = useAuth();
  const { t } = useTranslation("guardian");
  const { t: tCommon } = useTranslation("common");
  useDocumentTitle(
    tCommon("pageTitles.newCareRequirement", "New Care Requirement"),
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const preselectedAgency = searchParams.get("agency");
  const skipChoice = searchParams.get("direct") === "true";
  const [showWizard, setShowWizard] = useState(
    !!preselectedAgency || skipChoice,
  );
  const [currentStep, setCurrentStep] = useState(
    preselectedAgency ? 2 : skipChoice ? 2 : 1,
  );
  const [selectedAgency, setSelectedAgency] = useState(preselectedAgency || "");
  const [selectedCareTypes, setSelectedCareTypes] = useState<CareCategory[]>(
    [],
  );
  const [postToMarketplace, setPostToMarketplace] = useState(skipChoice);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");

  useEffect(() => {
    if (preselectedAgency || skipChoice) {
      setShowWizard(true);
      setCurrentStep(2);
      setSelectedAgency(preselectedAgency || "");
      setPostToMarketplace(skipChoice);
    }
  }, [preselectedAgency, skipChoice]);
  const [formData, setFormData] = useState({
    // Step 2 — location override (pre-filled from patient record)
    city: "Dhaka",
    area: "",
    locationType: "" as "" | "home" | "hospital",

    // Step 3 — unified service checklist (replaces ADL toggles + bucket chips)
    services: [] as string[], // slugs from UNIFIED_SERVICES
    devices: [] as string[], // UCCF_MEDICAL_DEVICES slugs
    procedures: [] as string[], // UCCF_MEDICAL_PROCEDURES slugs
    medicationComplexity: "" as "" | "low" | "medium" | "high",
    equipment: [] as string[], // UCCF_EQUIPMENT_SLUGS
    equipmentProvider: "" as "" | "patient" | "agency" | "mixed",
    exclusions: [] as string[],
    addOns: [] as string[],

    // Step 4 — schedule & staffing
    startDate: "",
    durationType: "monthly" as "short" | "monthly" | "long_term",
    shiftType: "day" as ShiftType,
    hoursPerDay: 8 as 8 | 12 | 24,
    shiftStartTime: "", // HH:MM, only for 8h/12h
    staffLevel: "L2" as StaffLevel,
    staffPattern: "single" as StaffPattern,
    caregiverCount: 1,
    nurseCount: 0,

    // Step 5 — budget & posting
    preferredModel: "monthly" as "monthly" | "daily",
    budgetMin: "",
    budgetMax: "",
    accommodationProvided: false,
    foodProvided: false,
    travelDistanceKm: "",
    expiryDays: "15",
  });
  const [submitting, setSubmitting] = useState(false);

  const {
    data: agencies,
    loading,
    error,
  } = useAsyncData(() => guardianService.getWizardAgencies());
  const { data: myPatients } = useAsyncData(() =>
    guardianService.getPatients(),
  );

  // Pre-fill city/area when patient selected
  useEffect(() => {
    if (!selectedPatientId || !myPatients) return;
    const pt = myPatients.find((p) => p.id === selectedPatientId);
    if (!pt) return;
    setFormData((fd) => ({
      ...fd,
      city: (pt as any).careCity || fd.city || "Dhaka",
      area: (pt as any).careArea || fd.area || "",
    }));
  }, [selectedPatientId, myPatients]);

  const next = () => {
    if (currentStep === 2) {
      if (!selectedPatientId) {
        toast.error(t("wizard.selectPatient"));
        return;
      }
    }
    if (currentStep === 3 && selectedCareTypes.length === 0) {
      toast.error(t("wizard.validationCareTypes"));
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, 6));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const prev = () => {
    setCurrentStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /** True when Back should leave the wizard for the pre-wizard choice screen (not step 1 agency picker). */
  const backTargetsChoiceScreen =
    (currentStep === 1 && !preselectedAgency) ||
    (currentStep === 2 && !selectedAgency && (postToMarketplace || skipChoice));

  const exitWizardToChoiceScreen = () => {
    setShowWizard(false);
    setCurrentStep(1);
    setSearchParams(
      (p) => {
        const n = new URLSearchParams(p);
        n.delete("direct");
        return n;
      },
      { replace: true },
    );
  };

  const handleWizardBack = () => {
    if (backTargetsChoiceScreen) {
      exitWizardToChoiceScreen();
      return;
    }
    // Deep-linked with ?agency= — step 2 "Back" should return to the prior page (e.g. agency profile), not the in-wizard agency picker.
    const returnTo = (location.state as { wizardReturnTo?: string } | null)
      ?.wizardReturnTo;
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
    setSelectedCareTypes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleInField = (field: keyof typeof formData, slug: string) => {
    setFormData((fd) => {
      const arr = fd[field] as string[];
      if (!Array.isArray(arr)) return fd;
      const next = arr.includes(slug)
        ? arr.filter((s) => s !== slug)
        : [...arr, slug];
      return { ...fd, [field]: next };
    });
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    const expiryMs =
      parseInt(formData.expiryDays || "15", 10) * 24 * 3600 * 1000;
    const expiresAt = new Date(Date.now() + expiryMs).toISOString();

    try {
      if (selectedCareTypes.length === 0) {
        toast.error(t("wizard.validationCareTypes"));
        setSubmitting(false);
        return;
      }
      const uccfCats = selectedCareTypes;
      const catLabels = uccfCats.map((id) =>
        t(`packageDetail.categories.${id}`),
      );

      // Look up selected patient
      const pt = myPatients?.find((p) => p.id === selectedPatientId);
      const patientName = pt?.name || t("wizard.patient");
      let title = `${catLabels.join(", ")} ${t("wizard.for")} ${patientName}`;
      if (title.trim().length < 5) {
        title = `${t("wizard.titleFallbackPrefix")} ${patientName} (${formData.city.trim() || "Dhaka"})`;
      }

      // Build ADL, monitoring, services from unified services array
      const sel = formData.services;

      // Build ADL
      const adl: NonNullable<UCCFCareNeeds["ADL"]> = {};
      if (sel.includes("bathing")) adl.bathing = true;
      if (sel.includes("feeding_tube")) adl.feeding = "tube";
      else if (sel.includes("feeding_oral")) adl.feeding = "oral";
      if (sel.includes("toileting_full")) adl.toileting = "full";
      else if (sel.includes("toileting_assisted")) adl.toileting = "assisted";
      if (sel.includes("mobility_support")) adl.mobility_support = true;

      // Build monitoring
      const monitoring: NonNullable<UCCFCareNeeds["monitoring"]> = {};
      if (sel.includes("vitals")) monitoring.vitals = true;
      if (sel.includes("supervision")) monitoring.continuous_supervision = true;

      // Build care_needs
      const care_needs: UCCFCareNeeds = {};
      if (Object.keys(adl).length) care_needs.ADL = adl;
      if (Object.keys(monitoring).length) care_needs.monitoring = monitoring;
      if (sel.includes("companionship")) care_needs.companionship = true;

      // Build services (bucket arrays — exclude ADL/monitoring slugs already handled above)
      const services: UCCFServices = {};
      const PC = [
        "bathing",
        "grooming",
        "feeding_oral",
        "feeding_tube",
        "toileting_assisted",
        "toileting_full",
        "mobility_support",
      ];
      const MS = [
        "vitals",
        "medication",
        "wound_care",
        "supervision",
        "companionship",
      ];
      const HS = ["meal_prep", "patient_laundry"];
      const AC = ["NG_tube", "suction", "oxygen_therapy"];
      const CO = ["doctor_visit", "hospital_support"];
      const pcSlugs = sel
        .filter((s) => PC.includes(s))
        .map((s) => (s === "feeding_oral" ? "feeding_oral" : s));
      const msSlugs = sel.filter((s) => MS.includes(s));
      const hsSlugs = sel.filter((s) => HS.includes(s));
      const acSlugs = sel.filter((s) => AC.includes(s));
      const coSlugs = sel.filter((s) => CO.includes(s));
      if (pcSlugs.length) services.personal_care = pcSlugs;
      if (msSlugs.length) services.medical_support = msSlugs;
      if (hsSlugs.length) services.household_support = hsSlugs;
      if (acSlugs.length) services.advanced_care = acSlugs;
      if (coSlugs.length) services.coordination = coSlugs;

      // Build medical
      const medical: UCCFMedical | undefined =
        formData.devices.length ||
        formData.procedures.length ||
        formData.medicationComplexity
          ? {
              medication_complexity: formData.medicationComplexity || undefined,
              devices: formData.devices.length
                ? (formData.devices as UCCFMedical["devices"])
                : undefined,
              procedures_required: formData.procedures.length
                ? (formData.procedures as UCCFMedical["procedures_required"])
                : undefined,
            }
          : undefined;

      // Build logistics
      const logistics: UCCFLogistics | undefined =
        formData.locationType ||
        formData.accommodationProvided ||
        formData.foodProvided ||
        formData.travelDistanceKm
          ? {
              location_type: formData.locationType || undefined,
              accommodation_provided:
                formData.accommodationProvided || undefined,
              food_provided: formData.foodProvided || undefined,
              travel_distance_km: formData.travelDistanceKm
                ? parseInt(formData.travelDistanceKm, 10)
                : undefined,
            }
          : undefined;

      // Build equipment
      const equipment: UCCFEquipment | undefined =
        formData.equipment.length > 0 || formData.equipmentProvider
          ? {
              required: formData.equipment,
              provider: formData.equipmentProvider || undefined,
            }
          : undefined;

      const req = await marketplaceService.createCareRequest({
        meta: {
          type: "request",
          title,
          category: uccfCats,
          location: {
            city: formData.city || "Dhaka",
            area: formData.area || undefined,
          },
          start_date: formData.startDate || undefined,
          duration_type: formData.durationType,
        },
        party: {
          role: "patient",
          name: patientName,
          contact_phone: user?.phone?.trim() || "",
        },
        care_subject: {
          age: pt?.age ?? 0,
          gender: pt?.gender
            ? pt.gender === "Male"
              ? "male"
              : pt.gender === "Female"
                ? "female"
                : "other"
            : undefined,
          condition_summary:
            pt?.conditionNotes || pt?.conditions?.join(", ") || undefined,
          mobility: (pt?.mobility as UCCFCareSubject["mobility"]) || "assisted",
          cognitive:
            (pt?.cognitive as UCCFCareSubject["cognitive"]) || undefined,
        },
        medical,
        care_needs: Object.keys(care_needs).length ? care_needs : undefined,
        staffing: {
          required_level: formData.staffLevel,
          caregiver_count: formData.caregiverCount,
          nurse_count: formData.nurseCount,
        },
        schedule: {
          hours_per_day: formData.hoursPerDay,
          shift_type: formData.shiftType,
          staff_pattern: formData.staffPattern,
          shift_start_time:
            formData.hoursPerDay < 24 && formData.shiftStartTime
              ? formData.shiftStartTime
              : undefined,
        },
        services: Object.keys(services).length ? services : undefined,
        logistics,
        equipment,
        exclusions: formData.exclusions.length
          ? formData.exclusions
          : undefined,
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

  // ─── Pre-Wizard Choice Screen ───
  if (!showWizard) {
    return (
      <div className="max-w-2xl mx-auto pb-20">
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: cn.greenBg }}
          >
            <HeartPulse className="w-8 h-8" style={{ color: cn.green }} />
          </div>
          <h1 className="text-2xl mb-2" style={{ color: cn.text }}>
            {t("wizard.findRightCare")}
          </h1>
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
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ background: cn.greenBg }}
            >
              <Package className="w-6 h-6" style={{ color: cn.green }} />
            </div>
            <h3 className="text-sm mb-2" style={{ color: cn.text }}>
              {t("wizard.browsePackages")}
            </h3>
            <p className="text-xs mb-4" style={{ color: cn.textSecondary }}>
              {t("wizard.browseDesc")}
            </p>
            <div className="flex flex-wrap gap-1 mb-4">
              {[
                t("wizard.instantBooking"),
                t("wizard.verifiedAgencies"),
                t("wizard.clearPricing"),
              ].map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-[10px]"
                  style={{ background: cn.greenBg, color: cn.green }}
                >
                  {tag}
                </span>
              ))}
            </div>
            <span
              className="flex items-center gap-1 text-xs group-hover:gap-2 transition-all"
              style={{ color: cn.green }}
            >
              {t("wizard.exploreMarketplace")}{" "}
              <ChevronRight className="w-3 h-3" />
            </span>
            <div
              className="mt-3 px-2.5 py-1.5 rounded-lg text-[10px] inline-block"
              style={{ background: cn.amberBg, color: cn.amber }}
            >
              {t("wizard.recommended")}
            </div>
          </Link>

          {/* Option 2: Post a job */}
          <button
            onClick={() => {
              setShowWizard(true);
              setCurrentStep(2);
              setPostToMarketplace(true);
            }}
            className="stat-card p-6 hover:shadow-md transition-all text-left group"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ background: cn.pinkBg }}
            >
              <Megaphone className="w-6 h-6" style={{ color: cn.pink }} />
            </div>
            <h3 className="text-sm mb-2" style={{ color: cn.text }}>
              {t("wizard.postRequirement")}
            </h3>
            <p className="text-xs mb-4" style={{ color: cn.textSecondary }}>
              {t("wizard.postDesc")}
            </p>
            <div className="flex flex-wrap gap-1 mb-4">
              {[
                t("wizard.customRequirements"),
                t("wizard.receiveBids"),
                t("wizard.negotiateTerms"),
              ].map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-[10px]"
                  style={{ background: cn.pinkBg, color: cn.pink }}
                >
                  {tag}
                </span>
              ))}
            </div>
            <span
              className="flex items-center gap-1 text-xs group-hover:gap-2 transition-all"
              style={{ color: cn.pink }}
            >
              {t("wizard.createRequirement")}{" "}
              <ChevronRight className="w-3 h-3" />
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
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                  style={{
                    background: isActive
                      ? "var(--cn-gradient-caregiver)"
                      : isCompleted
                        ? cn.greenBg
                        : cn.bgInput,
                    color: isActive
                      ? "white"
                      : isCompleted
                        ? cn.green
                        : cn.textSecondary,
                  }}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className="text-[9px] hidden md:block"
                  style={{ color: isActive ? cn.pink : cn.textSecondary }}
                >
                  {step.name}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-1"
                  style={{
                    background:
                      currentStep > step.id ? cn.green : cn.borderLight,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="finance-card p-6 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Step 1: Select Agency */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl mb-1" style={{ color: cn.text }}>
                  {t("wizard.selectAgency")}
                </h2>
                <p className="text-sm mb-4" style={{ color: cn.textSecondary }}>
                  {t("wizard.selectAgencyDesc")}
                </p>
                <div className="space-y-3">
                  {agencies ? (
                    agencies.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => {
                          setSelectedAgency(a.id);
                          next();
                        }}
                        className="w-full p-4 rounded-xl border text-left transition-all hover:shadow-sm cn-touch-target"
                        style={{
                          borderColor:
                            selectedAgency === a.id ? cn.pink : cn.border,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs"
                            style={{ background: "var(--cn-gradient-agency)" }}
                          >
                            {a.name.slice(0, 2)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-sm"
                                style={{ color: cn.text }}
                              >
                                {a.name}
                              </span>
                              {a.verified && (
                                <Shield
                                  className="w-3 h-3"
                                  style={{ color: cn.teal }}
                                />
                              )}
                            </div>
                            <div
                              className="flex items-center gap-3 text-xs"
                              style={{ color: cn.textSecondary }}
                            >
                              <span className="flex items-center gap-1">
                                <Star
                                  className="w-3 h-3"
                                  style={{ color: cn.amber }}
                                />{" "}
                                {a.rating}
                              </span>
                              <span>
                                <MapPin className="w-3 h-3 inline" />{" "}
                                {a.location}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <PageSkeleton />
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Patient Info */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl" style={{ color: cn.text }}>
                  {t("wizard.patientInfo")}
                </h2>

                {myPatients && myPatients.length > 0 ? (
                  <div>
                    <label
                      className="block text-sm mb-1"
                      style={{ color: cn.text }}
                    >
                      {t("wizard.selectPatient")}
                    </label>
                    <p
                      className="text-xs mb-2"
                      style={{ color: cn.textSecondary }}
                    >
                      {t("wizard.selectPatientDesc")}
                    </p>
                    <div className="space-y-2">
                      {myPatients.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPatientId(p.id)}
                          className="w-full p-3 rounded-xl border text-left transition-all cn-touch-target"
                          style={{
                            borderColor:
                              selectedPatientId === p.id ? cn.pink : cn.border,
                            background:
                              selectedPatientId === p.id
                                ? cn.pinkBg
                                : "transparent",
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                              style={{ background: p.color || cn.green }}
                            >
                              {p.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p
                                className="text-sm font-medium"
                                style={{ color: cn.text }}
                              >
                                {p.name}
                              </p>
                              <p
                                className="text-xs"
                                style={{ color: cn.textSecondary }}
                              >
                                {p.age ? `${t("wizard.age")} ${p.age}` : ""}
                                {p.relation ? ` · ${p.relation}` : ""}
                                {Array.isArray(p.conditions) &&
                                p.conditions.length > 0
                                  ? ` · ${p.conditions.join(", ")}`
                                  : ""}
                              </p>
                            </div>
                            {selectedPatientId === p.id && (
                              <CheckCircle2
                                className="w-5 h-5 shrink-0"
                                style={{ color: cn.pink }}
                              />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    {selectedPatientId &&
                      (() => {
                        const pt = myPatients?.find(
                          (p) => p.id === selectedPatientId,
                        );
                        if (!pt) return null;
                        return (
                          <div
                            className="mt-4 p-4 rounded-xl"
                            style={{
                              background: cn.bgInput,
                              border: `1px solid ${cn.borderLight}`,
                            }}
                          >
                            <h3
                              className="text-sm font-medium mb-2"
                              style={{ color: cn.text }}
                            >
                              Patient Summary
                            </h3>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span style={{ color: cn.textSecondary }}>
                                  Name:
                                </span>{" "}
                                <span style={{ color: cn.text }}>
                                  {pt.name}
                                </span>
                              </div>
                              <div>
                                <span style={{ color: cn.textSecondary }}>
                                  Age:
                                </span>{" "}
                                <span style={{ color: cn.text }}>
                                  {pt.age || "—"}
                                </span>
                              </div>
                              <div>
                                <span style={{ color: cn.textSecondary }}>
                                  Gender:
                                </span>{" "}
                                <span style={{ color: cn.text }}>
                                  {pt.gender || "—"}
                                </span>
                              </div>
                              <div>
                                <span style={{ color: cn.textSecondary }}>
                                  Mobility:
                                </span>{" "}
                                <span style={{ color: cn.text }}>
                                  {pt.mobility || "—"}
                                </span>
                              </div>
                              <div>
                                <span style={{ color: cn.textSecondary }}>
                                  Cognitive:
                                </span>{" "}
                                <span style={{ color: cn.text }}>
                                  {pt.cognitive || "—"}
                                </span>
                              </div>
                              <div className="col-span-2">
                                <span style={{ color: cn.textSecondary }}>
                                  Conditions:
                                </span>{" "}
                                <span style={{ color: cn.text }}>
                                  {Array.isArray(pt.conditions) &&
                                  pt.conditions.length
                                    ? pt.conditions.join(", ")
                                    : "—"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                  </div>
                ) : (
                  <div
                    className="p-4 rounded-xl text-center"
                    style={{
                      background: cn.bgInput,
                      border: `1px solid ${cn.border}`,
                    }}
                  >
                    <User
                      className="w-8 h-8 mx-auto mb-2"
                      style={{ color: cn.textSecondary }}
                    />
                    <p className="text-sm" style={{ color: cn.text }}>
                      {t("wizard.noPatientsCreated")}
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: cn.textSecondary }}
                    >
                      {t("wizard.createPatientToTag")}
                    </p>
                    <Link
                      to={`${base}/patient-intake`}
                      className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl text-sm text-white no-underline cn-touch-target"
                      style={{ background: "var(--cn-gradient-guardian)" }}
                    >
                      <Plus className="w-4 h-4" />
                      {t("wizard.addPatientFirst")}
                    </Link>
                  </div>
                )}

                {/* Location section */}
                <div
                  className="pt-4 space-y-4"
                  style={{ borderTop: `1px solid ${cn.borderLight}` }}
                >
                  <h3
                    className="text-lg font-medium"
                    style={{ color: cn.text }}
                  >
                    Where will care take place?
                  </h3>
                  <p className="text-xs" style={{ color: cn.textSecondary }}>
                    Pre-filled from patient profile — update if different (e.g.
                    hospital)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        className="block text-sm mb-1"
                        style={{ color: cn.text }}
                      >
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl border text-sm"
                        style={{
                          borderColor: cn.border,
                          color: cn.text,
                          background: cn.bgInput,
                        }}
                        placeholder="e.g. Dhaka"
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm mb-1"
                        style={{ color: cn.text }}
                      >
                        Area / Neighbourhood
                      </label>
                      <input
                        type="text"
                        value={formData.area}
                        onChange={(e) =>
                          setFormData({ ...formData, area: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl border text-sm"
                        style={{
                          borderColor: cn.border,
                          color: cn.text,
                          background: cn.bgInput,
                        }}
                        placeholder="e.g. Dhanmondi, Gulshan"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      className="block text-sm mb-1"
                      style={{ color: cn.text }}
                    >
                      Location Type
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, locationType: "home" })
                        }
                        className="flex-1 px-4 py-3 rounded-xl border text-sm cn-touch-target"
                        style={{
                          borderColor:
                            formData.locationType === "home"
                              ? cn.pink
                              : cn.border,
                          background:
                            formData.locationType === "home"
                              ? cn.pinkBg
                              : "transparent",
                          color:
                            formData.locationType === "home"
                              ? cn.pink
                              : cn.textSecondary,
                        }}
                      >
                        Home care
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, locationType: "hospital" })
                        }
                        className="flex-1 px-4 py-3 rounded-xl border text-sm cn-touch-target"
                        style={{
                          borderColor:
                            formData.locationType === "hospital"
                              ? cn.pink
                              : cn.border,
                          background:
                            formData.locationType === "hospital"
                              ? cn.pinkBg
                              : "transparent",
                          color:
                            formData.locationType === "hospital"
                              ? cn.pink
                              : cn.textSecondary,
                        }}
                      >
                        Hospital
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Care Needs */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl" style={{ color: cn.text }}>
                  {t("wizard.careRequirements")}
                </h2>
                <p className="text-sm" style={{ color: cn.textSecondary }}>
                  {t("wizard.careRequirementsDesc")}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {VALID_CARE_CATEGORIES.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleCareType(id)}
                      className="p-4 rounded-xl border text-left transition-all cn-touch-target"
                      style={{
                        borderColor: selectedCareTypes.includes(id)
                          ? cn.pink
                          : cn.border,
                        background: selectedCareTypes.includes(id)
                          ? cn.pinkBg
                          : "transparent",
                      }}
                    >
                      <span className="text-2xl block mb-2">
                        {CARE_TYPE_ICONS[id]}
                      </span>
                      <p className="text-sm" style={{ color: cn.text }}>
                        {t(`packageDetail.categories.${id}`)}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: cn.textSecondary }}
                      >
                        {t(`wizard.careCategoryDesc.${id}`)}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Section B: Services Needed */}
                <div
                  className="pt-4 space-y-4"
                  style={{ borderTop: `1px solid ${cn.borderLight}` }}
                >
                  <p className="text-sm font-medium" style={{ color: cn.text }}>
                    Services Needed
                  </p>
                  {(() => {
                    const groups = Array.from(
                      new Set(UNIFIED_SERVICES.map((s) => s.group)),
                    );
                    return groups.map((group) => (
                      <div key={group}>
                        <p
                          className="text-xs mb-2"
                          style={{ color: cn.textSecondary }}
                        >
                          {group}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {UNIFIED_SERVICES.filter(
                            (s) => s.group === group,
                          ).map(({ slug, label }) => {
                            const selected = formData.services.includes(slug);
                            return (
                              <button
                                key={slug}
                                type="button"
                                onClick={() =>
                                  setFormData((fd) => ({
                                    ...fd,
                                    services: fd.services.includes(slug)
                                      ? fd.services.filter((s) => s !== slug)
                                      : [...fd.services, slug],
                                  }))
                                }
                                className="px-3 py-2 rounded-xl border text-xs cn-touch-target"
                                style={{
                                  borderColor: selected ? cn.pink : cn.border,
                                  background: selected
                                    ? cn.pinkBg
                                    : "transparent",
                                  color: selected ? cn.pink : cn.textSecondary,
                                }}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                {/* Section C: Medical Equipment */}
                <div
                  className="pt-4 space-y-3"
                  style={{ borderTop: `1px solid ${cn.borderLight}` }}
                >
                  <p className="text-sm font-medium" style={{ color: cn.text }}>
                    Equipment Needed
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { slug: "hospital_bed", label: "Hospital bed" },
                      { slug: "oxygen", label: "Oxygen concentrator" },
                      { slug: "monitor", label: "Patient monitor" },
                    ].map(({ slug, label }) => {
                      const selected = formData.equipment.includes(slug);
                      return (
                        <button
                          key={slug}
                          type="button"
                          onClick={() => toggleInField("equipment", slug)}
                          className="px-3 py-2 rounded-xl border text-xs cn-touch-target"
                          style={{
                            borderColor: selected ? cn.teal : cn.border,
                            background: selected ? cn.tealBg : "transparent",
                            color: selected ? cn.teal : cn.textSecondary,
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  {formData.equipment.length > 0 && (
                    <div>
                      <label
                        className="block text-xs mb-1"
                        style={{ color: cn.textSecondary }}
                      >
                        Equipment Provider
                      </label>
                      <select
                        value={formData.equipmentProvider}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            equipmentProvider: e.target
                              .value as typeof formData.equipmentProvider,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border text-sm"
                        style={{
                          borderColor: cn.border,
                          color: cn.text,
                          background: cn.bgInput,
                        }}
                      >
                        <option value="">Select who provides...</option>
                        <option value="patient">Patient provides</option>
                        <option value="agency">Agency provides</option>
                        <option value="mixed">Mix of both</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Section D: Advanced Medical Needs (conditional) */}
                {formData.services.some((s) =>
                  [
                    "vitals",
                    "medication",
                    "wound_care",
                    "NG_tube",
                    "suction",
                    "oxygen_therapy",
                  ].includes(s),
                ) && (
                  <div
                    className="pt-4 space-y-3"
                    style={{ borderTop: `1px solid ${cn.borderLight}` }}
                  >
                    <details>
                      <summary
                        className="text-sm font-medium cursor-pointer"
                        style={{ color: cn.text }}
                      >
                        Medical Details (optional)
                      </summary>
                      <div className="mt-3 space-y-3">
                        <p
                          className="text-xs"
                          style={{ color: cn.textSecondary }}
                        >
                          Medication Complexity
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { value: "low", label: "Simple" },
                            { value: "medium", label: "Moderate" },
                            { value: "high", label: "Complex" },
                          ].map(({ value, label }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  medicationComplexity:
                                    value as typeof formData.medicationComplexity,
                                })
                              }
                              className="px-3 py-2 rounded-xl border text-xs cn-touch-target"
                              style={{
                                borderColor:
                                  formData.medicationComplexity === value
                                    ? cn.pink
                                    : cn.border,
                                background:
                                  formData.medicationComplexity === value
                                    ? cn.pinkBg
                                    : "transparent",
                                color:
                                  formData.medicationComplexity === value
                                    ? cn.pink
                                    : cn.textSecondary,
                              }}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <p
                          className="text-xs"
                          style={{ color: cn.textSecondary }}
                        >
                          Medical Devices
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { slug: "oxygen", label: "Oxygen concentrator" },
                            { slug: "catheter", label: "Catheter" },
                            { slug: "feeding_tube", label: "Feeding tube" },
                            { slug: "ventilator", label: "Ventilator" },
                          ].map(({ slug, label }) => {
                            const selected = formData.devices.includes(slug);
                            return (
                              <button
                                key={slug}
                                type="button"
                                onClick={() => toggleInField("devices", slug)}
                                className="px-3 py-2 rounded-xl border text-xs cn-touch-target"
                                style={{
                                  borderColor: selected ? cn.teal : cn.border,
                                  background: selected
                                    ? cn.tealBg
                                    : "transparent",
                                  color: selected ? cn.teal : cn.textSecondary,
                                }}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                        <p
                          className="text-xs"
                          style={{ color: cn.textSecondary }}
                        >
                          Medical Procedures
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { slug: "injection", label: "Injection" },
                            { slug: "IV", label: "IV drip" },
                            { slug: "suction", label: "Suctioning" },
                            { slug: "wound_care", label: "Wound dressing" },
                          ].map(({ slug, label }) => {
                            const selected = formData.procedures.includes(slug);
                            return (
                              <button
                                key={slug}
                                type="button"
                                onClick={() =>
                                  toggleInField("procedures", slug)
                                }
                                className="px-3 py-2 rounded-xl border text-xs cn-touch-target"
                                style={{
                                  borderColor: selected ? cn.teal : cn.border,
                                  background: selected
                                    ? cn.tealBg
                                    : "transparent",
                                  color: selected ? cn.teal : cn.textSecondary,
                                }}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </details>
                  </div>
                )}

                {/* Section E: Exclusions & Add-ons */}
                <div
                  className="pt-4 space-y-3"
                  style={{ borderTop: `1px solid ${cn.borderLight}` }}
                >
                  <details>
                    <summary
                      className="text-sm font-medium cursor-pointer"
                      style={{ color: cn.text }}
                    >
                      Exclusions & Add-ons
                    </summary>
                    <div className="mt-3 space-y-3">
                      <p
                        className="text-xs"
                        style={{ color: cn.textSecondary }}
                      >
                        Exclusions
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          {
                            slug: "heavy_household_work",
                            label: "Heavy housework",
                          },
                          {
                            slug: "non_patient_tasks",
                            label: "Non-patient errands",
                          },
                          {
                            slug: "high_risk_procedures",
                            label: "High-risk procedures",
                          },
                        ].map(({ slug, label }) => {
                          const selected = formData.exclusions.includes(slug);
                          return (
                            <button
                              key={slug}
                              type="button"
                              onClick={() => toggleInField("exclusions", slug)}
                              className="px-3 py-2 rounded-xl border text-xs cn-touch-target"
                              style={{
                                borderColor: selected ? "#EF4444" : cn.border,
                                background: selected
                                  ? "rgba(239,68,68,0.08)"
                                  : "transparent",
                                color: selected ? "#EF4444" : cn.textSecondary,
                              }}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      <p
                        className="text-xs"
                        style={{ color: cn.textSecondary }}
                      >
                        Add-ons
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { slug: "physiotherapy", label: "Physiotherapy" },
                          { slug: "ambulance", label: "Ambulance service" },
                          { slug: "diagnostics", label: "Diagnostic tests" },
                        ].map(({ slug, label }) => {
                          const selected = formData.addOns.includes(slug);
                          return (
                            <button
                              key={slug}
                              type="button"
                              onClick={() => toggleInField("addOns", slug)}
                              className="px-3 py-2 rounded-xl border text-xs cn-touch-target"
                              style={{
                                borderColor: selected ? cn.amber : cn.border,
                                background: selected
                                  ? cn.amberBg
                                  : "transparent",
                                color: selected ? cn.amber : cn.textSecondary,
                              }}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            )}

            {/* Step 4: Schedule & Staffing */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl" style={{ color: cn.text }}>
                  Schedule & Staffing
                </h2>

                {/* Schedule panel */}
                <div
                  className="space-y-4"
                  style={{
                    background: cn.bgInput,
                    padding: "16px",
                    borderRadius: "12px",
                  }}
                >
                  <h3
                    className="text-sm font-medium"
                    style={{ color: cn.text }}
                  >
                    Schedule
                  </h3>
                  <div>
                    <label
                      className="block text-sm mb-1"
                      style={{ color: cn.text }}
                    >
                      Preferred Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border text-sm"
                      style={{
                        borderColor: cn.border,
                        color: cn.text,
                        background: cn.bgInput,
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm mb-1"
                      style={{ color: cn.text }}
                    >
                      Care Duration
                    </label>
                    <div className="flex gap-2">
                      {[
                        { value: "short", label: "Short stay" },
                        { value: "monthly", label: "Monthly" },
                        { value: "long_term", label: "Long-term" },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              durationType:
                                value as typeof formData.durationType,
                            })
                          }
                          className="flex-1 py-2.5 rounded-xl border text-xs cn-touch-target"
                          style={{
                            borderColor:
                              formData.durationType === value
                                ? cn.pink
                                : cn.border,
                            background:
                              formData.durationType === value
                                ? cn.pinkBg
                                : "transparent",
                            color:
                              formData.durationType === value
                                ? cn.pink
                                : cn.text,
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label
                      className="block text-sm mb-1"
                      style={{ color: cn.text }}
                    >
                      Shift
                    </label>
                    <div className="flex gap-2">
                      {[
                        { value: "day", label: "Day shift" },
                        { value: "night", label: "Night shift" },
                        { value: "rotational", label: "Rotational" },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              shiftType: value as typeof formData.shiftType,
                            })
                          }
                          className="flex-1 py-2.5 rounded-xl border text-xs cn-touch-target"
                          style={{
                            borderColor:
                              formData.shiftType === value
                                ? cn.pink
                                : cn.border,
                            background:
                              formData.shiftType === value
                                ? cn.pinkBg
                                : "transparent",
                            color:
                              formData.shiftType === value ? cn.pink : cn.text,
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label
                      className="block text-sm mb-1"
                      style={{ color: cn.text }}
                    >
                      Hours per day
                    </label>
                    <div className="flex gap-2">
                      {([8, 12, 24] as const).map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, hoursPerDay: h })
                          }
                          className="flex-1 py-2.5 rounded-xl border text-xs cn-touch-target"
                          style={{
                            borderColor:
                              formData.hoursPerDay === h ? cn.pink : cn.border,
                            background:
                              formData.hoursPerDay === h
                                ? cn.pinkBg
                                : "transparent",
                            color:
                              formData.hoursPerDay === h ? cn.pink : cn.text,
                          }}
                        >
                          {h}h
                        </button>
                      ))}
                    </div>
                  </div>
                  {formData.hoursPerDay !== 24 && (
                    <div>
                      <label
                        className="block text-sm mb-1"
                        style={{ color: cn.text }}
                      >
                        Shift starts at
                      </label>
                      <input
                        type="time"
                        value={formData.shiftStartTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            shiftStartTime: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 rounded-xl border text-sm"
                        style={{
                          borderColor: cn.border,
                          color: cn.text,
                          background: cn.bgInput,
                        }}
                        placeholder="e.g. 10:00"
                      />
                      <p
                        className="text-xs mt-1"
                        style={{ color: cn.textSecondary }}
                      >
                        Default is 08:00 — change only if different
                      </p>
                    </div>
                  )}
                </div>

                {/* Staffing panel */}
                <div
                  className="space-y-4"
                  style={{
                    background: cn.bgInput,
                    padding: "16px",
                    borderRadius: "12px",
                  }}
                >
                  <h3
                    className="text-sm font-medium"
                    style={{ color: cn.text }}
                  >
                    Staffing
                  </h3>
                  <div>
                    <label
                      className="block text-sm mb-1"
                      style={{ color: cn.text }}
                    >
                      Staff Level
                    </label>
                    <select
                      value={formData.staffLevel}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          staffLevel: e.target.value as StaffLevel,
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl border text-sm"
                      style={{
                        borderColor: cn.border,
                        color: cn.text,
                        background: cn.bgInput,
                      }}
                    >
                      <option value="L1">
                        Basic Aide — hygiene & companionship
                      </option>
                      <option value="L2">
                        Trained Caregiver — ADL & vitals
                      </option>
                      <option value="L3">
                        Senior Caregiver — complex ADL & medication
                      </option>
                      <option value="L4">Nurse — clinical procedures</option>
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-sm mb-1"
                      style={{ color: cn.text }}
                    >
                      Staff Pattern
                    </label>
                    <div className="flex gap-2">
                      {[
                        { value: "single", label: "One caregiver per shift" },
                        {
                          value: "double",
                          label: "Two overlapping caregivers",
                        },
                        { value: "rotational_team", label: "Rotating team" },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              staffPattern:
                                value as typeof formData.staffPattern,
                            })
                          }
                          className="flex-1 py-2.5 rounded-xl border text-xs cn-touch-target"
                          style={{
                            borderColor:
                              formData.staffPattern === value
                                ? cn.pink
                                : cn.border,
                            background:
                              formData.staffPattern === value
                                ? cn.pinkBg
                                : "transparent",
                            color:
                              formData.staffPattern === value
                                ? cn.pink
                                : cn.text,
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        className="block text-sm mb-1"
                        style={{ color: cn.text }}
                      >
                        Number of caregivers
                      </label>
                      <input
                        type="number"
                        min={0}
                        defaultValue={1}
                        value={formData.caregiverCount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            caregiverCount: Math.max(
                              0,
                              parseInt(e.target.value, 10) || 0,
                            ),
                          })
                        }
                        className="w-full px-4 py-3 rounded-xl border text-sm"
                        style={{
                          borderColor: cn.border,
                          color: cn.text,
                          background: cn.bgInput,
                        }}
                      />
                    </div>
                    {(formData.staffLevel === "L4" ||
                      formData.services.some((s) =>
                        [
                          "vitals",
                          "NG_tube",
                          "suction",
                          "oxygen_therapy",
                        ].includes(s),
                      )) && (
                      <div>
                        <label
                          className="block text-sm mb-1"
                          style={{ color: cn.text }}
                        >
                          Number of nurses
                        </label>
                        <input
                          type="number"
                          min={0}
                          defaultValue={0}
                          value={formData.nurseCount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              nurseCount: Math.max(
                                0,
                                parseInt(e.target.value, 10) || 0,
                              ),
                            })
                          }
                          className="w-full px-4 py-3 rounded-xl border text-sm"
                          style={{
                            borderColor: cn.border,
                            color: cn.text,
                            background: cn.bgInput,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Budget & Posting */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <h2 className="text-xl" style={{ color: cn.text }}>
                  {t("wizard.budget")} &amp; {t("wizard.reviewSubmit")}
                </h2>

                {/* Pricing model */}
                <div>
                  <label
                    className="block text-sm mb-1"
                    style={{ color: cn.text }}
                  >
                    {t("wizard.preferredPricingModel")}
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: "monthly", label: t("wizard.modelMonthly") },
                      { value: "daily", label: t("wizard.modelDaily") },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            preferredModel:
                              value as typeof formData.preferredModel,
                          })
                        }
                        className="flex-1 py-2.5 rounded-xl border text-xs cn-touch-target"
                        style={{
                          borderColor:
                            formData.preferredModel === value
                              ? cn.pink
                              : cn.border,
                          background:
                            formData.preferredModel === value
                              ? cn.pinkBg
                              : "transparent",
                          color:
                            formData.preferredModel === value
                              ? cn.pink
                              : cn.text,
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className="block text-sm mb-1"
                      style={{ color: cn.text }}
                    >
                      {t("wizard.minimum")}
                    </label>
                    <input
                      type="number"
                      value={formData.budgetMin}
                      onChange={(e) =>
                        setFormData({ ...formData, budgetMin: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border text-sm"
                      style={{
                        borderColor: cn.border,
                        color: cn.text,
                        background: cn.bgInput,
                      }}
                      placeholder="15,000"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm mb-1"
                      style={{ color: cn.text }}
                    >
                      {t("wizard.maximum")}
                    </label>
                    <input
                      type="number"
                      value={formData.budgetMax}
                      onChange={(e) =>
                        setFormData({ ...formData, budgetMax: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border text-sm"
                      style={{
                        borderColor: cn.border,
                        color: cn.text,
                        background: cn.bgInput,
                      }}
                      placeholder="35,000"
                    />
                  </div>
                </div>

                {/* Employer logistics */}
                <div
                  className="p-4 rounded-xl space-y-3"
                  style={{
                    background: cn.bgInput,
                    border: `1px solid ${cn.borderLight}`,
                  }}
                >
                  <p className="text-sm font-medium" style={{ color: cn.text }}>
                    {t("wizard.accommodationProvided")} /{" "}
                    {t("wizard.foodProvided")}
                  </p>
                  <label
                    className="flex items-center gap-2 text-sm cursor-pointer"
                    style={{ color: cn.text }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.accommodationProvided}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          accommodationProvided: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    {t("wizard.accommodationProvided")}
                  </label>
                  <label
                    className="flex items-center gap-2 text-sm cursor-pointer"
                    style={{ color: cn.text }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.foodProvided}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          foodProvided: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    {t("wizard.foodProvided")}
                  </label>
                </div>

                {/* Listing expiry */}
                <div>
                  <label
                    className="block text-sm mb-1"
                    style={{ color: cn.text }}
                  >
                    {t("wizard.listingExpiry")}
                  </label>
                  <div className="flex gap-2">
                    {[3, 7, 10, 15].map((d) => (
                      <button
                        key={d}
                        onClick={() =>
                          setFormData({ ...formData, expiryDays: String(d) })
                        }
                        className="flex-1 py-2.5 rounded-xl border text-xs cn-touch-target transition-all"
                        style={{
                          borderColor:
                            formData.expiryDays === String(d)
                              ? cn.amber
                              : cn.border,
                          background:
                            formData.expiryDays === String(d)
                              ? cn.amberBg
                              : "transparent",
                          color:
                            formData.expiryDays === String(d)
                              ? cn.amber
                              : cn.text,
                        }}
                      >
                        {t("wizard.expiryDays", { count: d })}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Post to Marketplace Toggle */}
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: cn.bgInput,
                    border: `1px solid ${postToMarketplace ? cn.green : cn.border}`,
                  }}
                >
                  <button
                    onClick={() => setPostToMarketplace(!postToMarketplace)}
                    className="w-full flex items-center justify-between cn-touch-target"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                          background: postToMarketplace
                            ? cn.greenBg
                            : cn.bgInput,
                        }}
                      >
                        <Globe
                          className="w-5 h-5"
                          style={{
                            color: postToMarketplace
                              ? cn.green
                              : cn.textSecondary,
                          }}
                        />
                      </div>
                      <div className="text-left">
                        <p className="text-sm" style={{ color: cn.text }}>
                          {t("wizard.postToMarketplace")}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: cn.textSecondary }}
                        >
                          {postToMarketplace
                            ? t("wizard.marketplaceOn")
                            : t("wizard.marketplaceOff")}
                        </p>
                      </div>
                    </div>
                    {postToMarketplace ? (
                      <ToggleRight
                        className="w-8 h-8 shrink-0"
                        style={{ color: cn.green }}
                      />
                    ) : (
                      <ToggleLeft
                        className="w-8 h-8 shrink-0"
                        style={{ color: cn.textSecondary }}
                      />
                    )}
                  </button>
                  {postToMarketplace && (
                    <p
                      className="text-[10px] mt-2 ml-13"
                      style={{ color: cn.green }}
                    >
                      {t("wizard.marketplaceHint")}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 6: Review */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <h2 className="text-xl" style={{ color: cn.text }}>
                  Review & Submit
                </h2>
                <div className="space-y-3">
                  {(() => {
                    const pt = myPatients?.find(
                      (p) => p.id === selectedPatientId,
                    );
                    return (
                      <>
                        {/* Patient card */}
                        <div
                          className="p-3 rounded-xl"
                          style={{ background: cn.bgInput }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p
                              className="text-xs"
                              style={{ color: cn.textSecondary }}
                            >
                              Patient
                            </p>
                            <button
                              type="button"
                              onClick={() => setCurrentStep(2)}
                              className="text-xs"
                              style={{ color: cn.pink }}
                            >
                              Edit
                            </button>
                          </div>
                          <p className="text-sm" style={{ color: cn.text }}>
                            {pt?.name || "—"}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: cn.textSecondary }}
                          >
                            Age: {pt?.age || "—"} · Conditions:{" "}
                            {Array.isArray(pt?.conditions) &&
                            pt.conditions.length
                              ? pt.conditions.join(", ")
                              : "—"}{" "}
                            · Mobility: {pt?.mobility || "—"}
                          </p>
                        </div>

                        {/* Location card */}
                        <div
                          className="p-3 rounded-xl"
                          style={{ background: cn.bgInput }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p
                              className="text-xs"
                              style={{ color: cn.textSecondary }}
                            >
                              Location
                            </p>
                            <button
                              type="button"
                              onClick={() => setCurrentStep(2)}
                              className="text-xs"
                              style={{ color: cn.pink }}
                            >
                              Edit
                            </button>
                          </div>
                          <p className="text-sm" style={{ color: cn.text }}>
                            {formData.city || "Dhaka"}
                            {formData.area ? `, ${formData.area}` : ""} ·{" "}
                            {formData.locationType === "home"
                              ? "Home care"
                              : formData.locationType === "hospital"
                                ? "Hospital"
                                : "—"}
                          </p>
                        </div>

                        {/* Care Types card */}
                        <div
                          className="p-3 rounded-xl"
                          style={{ background: cn.bgInput }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p
                              className="text-xs"
                              style={{ color: cn.textSecondary }}
                            >
                              Care Types
                            </p>
                            <button
                              type="button"
                              onClick={() => setCurrentStep(3)}
                              className="text-xs"
                              style={{ color: cn.pink }}
                            >
                              Edit
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {selectedCareTypes.map((ct) => (
                              <span
                                key={ct}
                                className="px-2 py-0.5 rounded-full text-xs"
                                style={{
                                  background: cn.pinkBg,
                                  color: cn.pink,
                                }}
                              >
                                {t(`packageDetail.categories.${ct}`)}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Services card */}
                        <div
                          className="p-3 rounded-xl"
                          style={{ background: cn.bgInput }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p
                              className="text-xs"
                              style={{ color: cn.textSecondary }}
                            >
                              Services
                            </p>
                            <button
                              type="button"
                              onClick={() => setCurrentStep(3)}
                              className="text-xs"
                              style={{ color: cn.pink }}
                            >
                              Edit
                            </button>
                          </div>
                          <p className="text-sm" style={{ color: cn.text }}>
                            {formData.services.length > 0
                              ? formData.services
                                  .map(
                                    (s) =>
                                      UNIFIED_SERVICES.find(
                                        (us) => us.slug === s,
                                      )?.label || s,
                                  )
                                  .join(", ")
                              : "None selected"}
                          </p>
                        </div>

                        {/* Medical card */}
                        {(formData.devices.length > 0 ||
                          formData.procedures.length > 0) && (
                          <div
                            className="p-3 rounded-xl"
                            style={{ background: cn.bgInput }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <p
                                className="text-xs"
                                style={{ color: cn.textSecondary }}
                              >
                                Medical
                              </p>
                              <button
                                type="button"
                                onClick={() => setCurrentStep(3)}
                                className="text-xs"
                                style={{ color: cn.pink }}
                              >
                                Edit
                              </button>
                            </div>
                            <p className="text-sm" style={{ color: cn.text }}>
                              {formData.devices.length > 0 &&
                                `Devices: ${formData.devices.join(", ")}`}
                              {formData.devices.length > 0 &&
                                formData.procedures.length > 0 &&
                                " · "}
                              {formData.procedures.length > 0 &&
                                `Procedures: ${formData.procedures.join(", ")}`}
                            </p>
                          </div>
                        )}

                        {/* Schedule card */}
                        <div
                          className="p-3 rounded-xl"
                          style={{ background: cn.bgInput }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p
                              className="text-xs"
                              style={{ color: cn.textSecondary }}
                            >
                              Schedule
                            </p>
                            <button
                              type="button"
                              onClick={() => setCurrentStep(4)}
                              className="text-xs"
                              style={{ color: cn.pink }}
                            >
                              Edit
                            </button>
                          </div>
                          <p className="text-sm" style={{ color: cn.text }}>
                            Start: {formData.startDate || "TBD"} · Duration:{" "}
                            {formData.durationType} · Shift:{" "}
                            {formData.shiftType} · {formData.hoursPerDay}h/day
                            {formData.hoursPerDay !== 24 &&
                              ` · Starts at ${formData.shiftStartTime || "08:00"}`}
                          </p>
                        </div>

                        {/* Staffing card */}
                        <div
                          className="p-3 rounded-xl"
                          style={{ background: cn.bgInput }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p
                              className="text-xs"
                              style={{ color: cn.textSecondary }}
                            >
                              Staffing
                            </p>
                            <button
                              type="button"
                              onClick={() => setCurrentStep(4)}
                              className="text-xs"
                              style={{ color: cn.pink }}
                            >
                              Edit
                            </button>
                          </div>
                          <p className="text-sm" style={{ color: cn.text }}>
                            Level: {formData.staffLevel} · Pattern:{" "}
                            {formData.staffPattern} · Caregivers:{" "}
                            {formData.caregiverCount}
                            {(formData.staffLevel === "L4" ||
                              formData.services.some((s) =>
                                [
                                  "vitals",
                                  "NG_tube",
                                  "suction",
                                  "oxygen_therapy",
                                ].includes(s),
                              )) &&
                              ` · Nurses: ${formData.nurseCount}`}
                          </p>
                        </div>

                        {/* Budget card */}
                        <div
                          className="p-3 rounded-xl"
                          style={{ background: cn.bgInput }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p
                              className="text-xs"
                              style={{ color: cn.textSecondary }}
                            >
                              Budget
                            </p>
                            <button
                              type="button"
                              onClick={() => setCurrentStep(5)}
                              className="text-xs"
                              style={{ color: cn.pink }}
                            >
                              Edit
                            </button>
                          </div>
                          <p className="text-sm" style={{ color: cn.text }}>
                            ৳{formData.budgetMin || "?"} – ৳
                            {formData.budgetMax || "?"}/
                            {formData.preferredModel === "daily" ? "day" : "mo"}
                          </p>
                        </div>

                        {/* Listing card */}
                        <div
                          className="p-3 rounded-xl"
                          style={{ background: cn.bgInput }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p
                              className="text-xs"
                              style={{ color: cn.textSecondary }}
                            >
                              Listing
                            </p>
                            <button
                              type="button"
                              onClick={() => setCurrentStep(5)}
                              className="text-xs"
                              style={{ color: cn.pink }}
                            >
                              Edit
                            </button>
                          </div>
                          <p className="text-sm" style={{ color: cn.text }}>
                            Expires in {formData.expiryDays} days · Marketplace:{" "}
                            {postToMarketplace ? "On" : "Off"}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div
          className="flex items-center justify-between mt-8 pt-6"
          style={{ borderTop: `1px solid ${cn.borderLight}` }}
        >
          <button
            type="button"
            onClick={handleWizardBack}
            disabled={currentStep === 1 && !!preselectedAgency}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm disabled:opacity-30 cn-touch-target"
            style={{ color: cn.text }}
          >
            <ChevronLeft className="w-4 h-4" />{" "}
            {backTargetsChoiceScreen
              ? t("wizard.backToOptions")
              : t("wizard.back")}
          </button>
          {currentStep < 6 ? (
            <button
              onClick={next}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm text-white cn-touch-target"
              style={{ background: "var(--cn-gradient-caregiver)" }}
            >
              {t("wizard.next")} <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm text-white cn-touch-target disabled:opacity-60"
              style={{ background: "var(--cn-gradient-guardian)" }}
            >
              {submitting ? (
                <>{t("wizard.submitting")}</>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />{" "}
                  {t("wizard.submitRequirement")}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
