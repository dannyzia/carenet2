"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Calendar, User, CreditCard, CheckCircle2, ChevronRight, Stethoscope, Package } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { useNavigate, useSearchParams, useLocation } from "react-router";
import { PageHero } from "@/frontend/components/PageHero";
import { motion, AnimatePresence } from "motion/react";
import { useAsyncData, useDocumentTitle, useCareSeekerBasePath } from "@/frontend/hooks";
import { guardianService } from "@/backend/services/guardian.service";
import { patientService } from "@/backend/services/patient.service";
import { marketplaceService } from "@/backend/services/marketplace.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { useAriaToast } from "@/frontend/hooks/useAriaToast";
import type { Patient, PatientProfile, UCCFPricingOffer } from "@/backend/models";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/frontend/auth/AuthContext";
import {
  getBookingMinPriceHintBdt,
  getBookingPlatformFeeRate,
  getBkashLogoUrl,
} from "@/config/bookingPresentation";
import {
  BOOKING_SERVICE_TYPE_KEYS,
  BOOKING_TIME_SLOT_KEYS,
  CATEGORY_TO_SERVICE_TYPE_KEY,
  DEFAULT_SERVICE_TYPE_KEY,
  type BookingServiceTypeKey,
} from "@/domain/bookingWizardKeys";

const STEP_ICONS = [Stethoscope, Calendar, User, CreditCard] as const;
const STEP_KEYS = ["serviceDetails", "schedule", "patientInfo", "payment"] as const;

function formatPriceModel(model?: string): string {
  if (model === "daily") return "day";
  if (model === "hourly") return "hr";
  return "mo";
}

function profileToPatient(profile: PatientProfile, userId: string): Patient {
  const g = profile.gender;
  const gender: Patient["gender"] =
    g === "Male" || g === "Female" || g === "Other" ? g : "Other";
  return {
    id: userId,
    name: profile.name?.trim() || "",
    age: profile.age ?? 0,
    gender,
    location: profile.address || "",
    phone: profile.phone || undefined,
    conditions: [],
    status: "active",
  };
}

export default function BookingWizardPage() {
  const { t: tDocTitle } = useTranslation("common");
  const { t } = useTranslation("guardian", { keyPrefix: "bookingWizard" });
  const { t: tg } = useTranslation("guardian");
  useDocumentTitle(tDocTitle("pageTitles.bookingWizard", "Booking Wizard"));

  const toast = useAriaToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const base = useCareSeekerBasePath();
  const isPatientCareSeeker = base === "/patient";
  const subscriptionOwnerId =
    user?.id ?? (isPatientCareSeeker ? "patient-current" : "guardian-current");
  const [searchParams] = useSearchParams();
  const packageId = searchParams.get("package");
  const [currentStep, setCurrentStep] = useState(1);
  const [completed, setCompleted] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [selectedServiceKey, setSelectedServiceKey] = useState<BookingServiceTypeKey | null>(null);
  const [selectedTimeKey, setSelectedTimeKey] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, STEP_KEYS.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const { data: careRecipients, loading: recipientsLoading } = useAsyncData(
    async () => {
      if (isPatientCareSeeker) {
        const uid = user?.id;
        if (!uid) return [];
        try {
          const prof = await patientService.getProfile();
          return [profileToPatient(prof, uid)];
        } catch {
          return [];
        }
      }
      return guardianService.getPatients();
    },
    [isPatientCareSeeker, user?.id],
  );

  useEffect(() => {
    const list = careRecipients ?? [];
    if (list.length === 0) {
      setSelectedPatientId(null);
      return;
    }
    setSelectedPatientId((prev) => {
      if (prev && list.some((p) => p.id === prev)) return prev;
      return list[0]!.id;
    });
  }, [careRecipients]);

  const { data: packageData, loading: pkgLoading } = useAsyncData(
    () => (packageId ? marketplaceService.getAgencyPackageById(packageId) : Promise.resolve(null)),
    [packageId],
  );

  const autoSelectedServiceKey = useMemo((): BookingServiceTypeKey => {
    if (!packageData?.meta.category?.length) return DEFAULT_SERVICE_TYPE_KEY;
    const primaryCat = packageData.meta.category[0];
    return CATEGORY_TO_SERVICE_TYPE_KEY[primaryCat] ?? DEFAULT_SERVICE_TYPE_KEY;
  }, [packageData]);

  const activeServiceKey = selectedServiceKey ?? autoSelectedServiceKey;

  const pkgPricing = packageData?.pricing as UCCFPricingOffer | undefined;
  const pkgBasePrice = pkgPricing?.base_price || 0;
  const pkgModel = pkgPricing?.pricing_model || "monthly";
  const pkgOvertimeRate = pkgPricing?.overtime_rate;
  const pkgIncludedHours = pkgPricing?.included_hours;

  const platformFeeRate = getBookingPlatformFeeRate();
  const platformFeeAmount = Math.round(pkgBasePrice * platformFeeRate);
  const minPriceHintBdt = getBookingMinPriceHintBdt();
  const bkashLogoUrl = getBkashLogoUrl();

  const selectedPatient = useMemo(
    () => careRecipients?.find((p) => p.id === selectedPatientId) ?? null,
    [careRecipients, selectedPatientId],
  );

  const canLeavePatientStep =
    recipientsLoading || (careRecipients?.length ?? 0) === 0
      ? false
      : !!selectedPatientId;

  const handleConfirm = async () => {
    if (packageId) {
      setSubscribing(true);
      try {
        await marketplaceService.subscribeToPackage(
          packageId,
          subscriptionOwnerId,
          selectedPatientId ?? undefined,
          selectedPatient
            ? { name: selectedPatient.name, phone: selectedPatient.phone }
            : undefined,
        );
        toast.success(t("toastSubscribed"));
        setCompleted(true);
      } catch {
        toast.error(t("toastSubscribeFailed"));
      } finally {
        setSubscribing(false);
      }
    } else {
      setCompleted(true);
    }
  };

  const goNext = () => {
    if (currentStep === 3 && !canLeavePatientStep) return;
    nextStep();
  };

  if (pkgLoading && packageId) return <PageSkeleton />;

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] px-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="finance-card p-12 text-center max-w-md w-full"
        >
          <div className="w-24 h-24 bg-[#E8F9E7] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-[#5FB865]" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {packageId ? t("completionSubscribed") : t("completionBookingRequested")}
          </h2>
          <p className="text-gray-500 mb-8">
            {packageId
              ? t("completionPackageBody", {
                  title: packageData?.meta.title ?? t("untitledPackage"),
                })
              : t("completionGenericBody")}
          </p>
          <Button
            onClick={() => navigate(packageId ? `${base}/marketplace-hub` : `${base}/dashboard`)}
            className="w-full h-14 rounded-2xl font-bold text-lg"
            style={{ background: "var(--cn-gradient-guardian, radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FEB4C5 0%, #DB869A 100%))" }}
          >
            {packageId ? t("backToMarketplace") : t("goToDashboard")}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <PageHero
        gradient="radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FEB4C5 0%, #DB869A 100%)"
        className="pt-12 pb-24 px-6"
      >
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <h1 className="text-2xl font-bold text-white">
              {packageId ? t("titlePackage") : t("titleGeneric")}
            </h1>
            {packageData && (
              <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs flex items-center gap-1.5">
                <Package className="w-3 h-3" /> {packageData.agency_name}
              </span>
            )}
          </div>
          <div className="flex justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-white/20 -translate-y-1/2" />
            <div
              className="absolute top-1/2 left-0 h-1 bg-white -translate-y-1/2 transition-all duration-500"
              style={{ width: `${((currentStep - 1) / (STEP_KEYS.length - 1)) * 100}%` }}
            />
            {STEP_KEYS.map((stepKey, i) => {
              const stepNum = i + 1;
              const Icon = STEP_ICONS[i]!;
              return (
                <div key={stepKey} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                      currentStep >= stepNum ? "bg-white text-[#DB869A]" : "bg-[#EAB1C1] text-white"
                    }`}
                  >
                    {currentStep > stepNum ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-white mt-2 uppercase tracking-wider">
                    {t(`steps.${stepKey}`)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </PageHero>
      <div className="max-w-3xl mx-auto px-6 -mt-12">
        <div className="finance-card p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800">{t("step1.title")}</h2>
                  {packageData && (
                    <div className="p-4 rounded-2xl bg-[#FFF5F7] border border-[#FEB4C5]/30 flex items-start gap-3">
                      <Package className="w-5 h-5 text-[#DB869A] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-gray-800">
                          {t("step1.prefilledTitle", { title: packageData.meta.title })}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{t("step1.prefilledHint")}</p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {BOOKING_SERVICE_TYPE_KEYS.map((key) => {
                      const isActive = activeServiceKey === key;
                      const isAutoSelected = !selectedServiceKey && autoSelectedServiceKey === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedServiceKey(key)}
                          className={`p-6 rounded-2xl border-2 transition-all text-left group ${
                            isActive
                              ? "border-[#FEB4C5] bg-[#FFF5F7]"
                              : "border-gray-100 hover:border-[#FEB4C5] hover:bg-[#FFF5F7]"
                          }`}
                        >
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                              isActive ? "bg-[#FEB4C5]/20" : "bg-gray-50 group-hover:bg-[#FEB4C5]/10"
                            }`}
                          >
                            <Stethoscope
                              className={`w-6 h-6 ${isActive ? "text-[#FEB4C5]" : "text-gray-400 group-hover:text-[#FEB4C5]"}`}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-800">{t(`serviceTypes.${key}`)}</p>
                            {isAutoSelected && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#FEB4C5]/20 text-[#DB869A]">
                                {t("step1.fromPackage")}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {packageData && isActive
                              ? t("step1.priceFromPackage", {
                                  amount: pkgBasePrice.toLocaleString(),
                                  unit: formatPriceModel(pkgModel),
                                })
                              : minPriceHintBdt != null
                                ? t("step1.priceStarting", { amount: String(minPriceHintBdt) })
                                : "\u00A0"}
                          </p>
                          {isActive && <CheckCircle2 className="w-5 h-5 text-[#FEB4C5] mt-2" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800">{t("step2.title")}</h2>
                  {packageData?.schedule && (
                    <div className="p-4 rounded-2xl bg-[#FFF5F7] border border-[#FEB4C5]/30">
                      <p className="text-xs text-[#DB869A] mb-2 flex items-center gap-1.5">
                        <Package className="w-3 h-3" /> {t("step2.packageSchedule")}
                      </p>
                      <div className="flex gap-4 text-sm text-gray-700">
                        <span>
                          {t("step2.hoursPerDay", { n: packageData.schedule.hours_per_day })}
                        </span>
                        <span className="capitalize">
                          {t("step2.shift", { type: packageData.schedule.shift_type })}
                        </span>
                        <span className="capitalize">
                          {t("step2.pattern", {
                            pattern: packageData.schedule.staff_pattern?.replace("_", " ") ?? "",
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-sm font-bold text-gray-400 mb-4 uppercase">{t("step2.startDate")}</p>
                      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <Calendar className="w-10 h-10 text-[#FEB4C5] mb-2" />
                        <p className="text-lg font-bold text-gray-800 underline">
                          {packageData?.meta.start_date
                            ? t("step2.startDateFormatted", {
                                date: new Date(packageData.meta.start_date).toLocaleDateString(
                                  undefined,
                                  { month: "long", day: "numeric", year: "numeric" },
                                ),
                              })
                            : t("step2.startDateTbd")}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-400 mb-4 uppercase">{t("step2.startTime")}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {BOOKING_TIME_SLOT_KEYS.map((slotKey) => (
                          <button
                            key={slotKey}
                            type="button"
                            onClick={() => setSelectedTimeKey(slotKey)}
                            className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                              selectedTimeKey === slotKey
                                ? "border-[#FEB4C5] bg-[#FFF5F7] text-[#DB869A]"
                                : "border-gray-200 hover:border-[#FEB4C5]"
                            }`}
                          >
                            {t(`timeSlots.${slotKey}`)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800">{t("patient.title")}</h2>
                  <p className="text-sm text-gray-500">
                    {isPatientCareSeeker ? t("patient.subtitlePatient") : t("patient.subtitleGuardian")}
                  </p>
                  {recipientsLoading ? (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-20 rounded-2xl bg-gray-100" />
                      <div className="h-20 rounded-2xl bg-gray-100" />
                    </div>
                  ) : (careRecipients?.length ?? 0) === 0 ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                      <p className="font-bold mb-2">{t("patient.emptyTitle")}</p>
                      <p className="mb-4">
                        {isPatientCareSeeker ? t("patient.emptyPatient") : t("patient.emptyGuardian")}
                      </p>
                      {isPatientCareSeeker ? (
                        <Button
                          type="button"
                          className="rounded-2xl"
                          onClick={() => navigate(`${base}/profile`)}
                        >
                          {t("patient.goToProfile")}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          className="rounded-2xl"
                          onClick={() =>
                            navigate(`${base}/patient-intake`, {
                              state: { returnTo: `${location.pathname}${location.search}` },
                            })
                          }
                        >
                          {t("patient.addPatient")}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(careRecipients ?? []).map((p) => {
                        const isSel = p.id === selectedPatientId;
                        const cond =
                          p.conditions?.length > 0
                            ? p.conditions.join(", ")
                            : t("patient.noConditions");
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedPatientId(p.id)}
                            className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 text-left transition-all ${
                              isSel
                                ? "border-[#FEB4C5] bg-[#FFF5F7]"
                                : "border-gray-100 hover:border-[#FEB4C5]/50 hover:bg-gray-50"
                            }`}
                          >
                            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 border border-gray-100">
                              <User className="text-[#FEB4C5]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-gray-800 truncate">{p.name}</p>
                              <p className="text-xs text-gray-500">
                                {t("patient.ageLabel")}: {p.age}
                                {p.relation ? ` • ${p.relation}` : ""}
                                {" • "}
                                {cond}
                              </p>
                            </div>
                            {isSel ? <CheckCircle2 className="w-6 h-6 text-[#FEB4C5] shrink-0" /> : null}
                          </button>
                        );
                      })}
                      {!isPatientCareSeeker ? (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`${base}/patient-intake`, {
                              state: { returnTo: `${location.pathname}${location.search}` },
                            })
                          }
                          className="w-full p-4 rounded-2xl border-2 border-dashed border-gray-200 text-[#DB869A] font-medium hover:bg-[#FFF5F7] transition-colors"
                        >
                          {t("patient.addAnother")}
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800">{t("step4.title")}</h2>

                  {packageData && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FFF5F7] to-[#F0FFF0] border border-[#FEB4C5]/20 flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs"
                        style={{ background: "var(--cn-gradient-agency, linear-gradient(135deg, #5FB865, #3D9942))" }}
                      >
                        {packageData.agency_name.slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-800">{packageData.meta.title}</p>
                        <p className="text-xs text-gray-500">
                          {packageData.agency_name} •{" "}
                          {packageData.meta.category.map((c) => c.replace("_", " ")).join(", ")}
                        </p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-[#5FB865]" />
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-2xl p-6 space-y-3">
                    {packageData ? (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">
                            {t("step4.lineLabel", {
                              label:
                                t(`serviceTypes.${activeServiceKey}`) || packageData.meta.title,
                              included: pkgIncludedHours
                                ? t("step4.includedHours", { hours: pkgIncludedHours })
                                : "",
                            })}
                          </span>
                          <span className="font-bold text-gray-800">
                            {t("step1.priceFromPackage", {
                              amount: pkgBasePrice.toLocaleString(),
                              unit: formatPriceModel(pkgModel),
                            })}
                          </span>
                        </div>
                        {pkgOvertimeRate != null && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">{t("step4.overtimeLabel")}</span>
                            <span className="font-bold text-gray-800">
                              {t("step4.overtimeValue", { amount: String(pkgOvertimeRate) })}
                            </span>
                          </div>
                        )}
                        {pkgPricing?.extra_charges?.length ? (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">{tg("marketplace.extraChargesMayApply")}</span>
                            <span className="text-xs text-gray-400">
                              {pkgPricing.extra_charges.join(", ")}
                            </span>
                          </div>
                        ) : null}
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">{t("step4.platformFee")}</span>
                          <span className="font-bold text-gray-800">
                            {t("step4.feeFormatted", { amount: platformFeeAmount.toLocaleString() })}
                          </span>
                        </div>
                        <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between">
                          <span className="font-bold text-gray-800">{t("step4.total")}</span>
                          <span className="font-bold text-2xl text-[#7CE577]">
                            {t("step4.totalFormatted", {
                              amount: (pkgBasePrice + platformFeeAmount).toLocaleString(),
                              unit: formatPriceModel(pkgModel),
                            })}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <p className="font-bold text-gray-800">{t("step4.genericSummaryTitle")}</p>
                        <p className="text-sm text-gray-600">{t("step4.genericSummaryBody")}</p>
                      </div>
                    )}
                  </div>

                  {packageData?.sla && (
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                      <p className="text-xs font-bold text-gray-400 uppercase">
                        {tg("marketplace.serviceGuarantee")}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {packageData.sla.replacement_time_hours != null && (
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <CheckCircle2 className="w-3 h-3 text-[#5FB865]" />
                            {t("step4.slaReplacement", {
                              hours: String(packageData.sla.replacement_time_hours),
                            })}
                          </div>
                        )}
                        {packageData.sla.emergency_response_minutes != null && (
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <CheckCircle2 className="w-3 h-3 text-[#5FB865]" />
                            {t("step4.slaEmergency", {
                              minutes: String(packageData.sla.emergency_response_minutes),
                            })}
                          </div>
                        )}
                        {packageData.sla.attendance_guarantee_percent != null && (
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <CheckCircle2 className="w-3 h-3 text-[#5FB865]" />
                            {t("step4.slaAttendance", {
                              percent: String(packageData.sla.attendance_guarantee_percent),
                            })}
                          </div>
                        )}
                        {packageData.sla.reporting_frequency && (
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <CheckCircle2 className="w-3 h-3 text-[#5FB865]" />
                            {t("step4.slaReports", {
                              frequency: String(packageData.sla.reporting_frequency),
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <p className="text-sm font-bold text-gray-400 uppercase">{t("step4.paymentMethod")}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        className="p-4 rounded-xl border-2 border-[#FEB4C5] bg-[#FFF5F7] flex items-center gap-3"
                      >
                        {bkashLogoUrl ? (
                          <img src={bkashLogoUrl} className="h-5" alt="" />
                        ) : null}
                        <span className="font-bold text-[#DB869A]">{t("step4.paymentBkash")}</span>
                      </button>
                      <button
                        type="button"
                        className="p-4 rounded-xl border-2 border-gray-100 flex items-center gap-3"
                      >
                        <CreditCard className="w-5 h-5 text-gray-400" />
                        <span className="font-bold text-gray-600">{t("step4.paymentCard")}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          <div className="flex gap-4 mt-12 pt-8 border-t border-gray-100">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={prevStep}
                className="h-14 flex-1 rounded-2xl font-bold border-gray-200"
              >
                {t("nav.back")}
              </Button>
            )}
            <Button
              onClick={currentStep === STEP_KEYS.length ? handleConfirm : goNext}
              className="h-14 flex-[2] rounded-2xl font-bold shadow-lg"
              disabled={subscribing || (currentStep === 3 && !canLeavePatientStep)}
              style={{
                background:
                  "var(--cn-gradient-guardian, radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FEB4C5 0%, #DB869A 100%))",
              }}
            >
              {subscribing
                ? t("nav.processing")
                : currentStep === STEP_KEYS.length
                  ? packageId
                    ? t("nav.confirmPackage")
                    : t("nav.confirmBooking")
                  : t("nav.next")}
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html:
            ".finance-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 2.5rem; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05); }",
        }}
      />
    </div>
  );
}
