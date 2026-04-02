"use client";
import React, { useState, useMemo } from "react";
import { Calendar, Clock, User, CreditCard, CheckCircle2, ChevronRight, ChevronLeft, MapPin, Heart, Stethoscope, ShieldAlert, Package } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { useNavigate, useSearchParams } from "react-router";
import { PageHero } from "@/frontend/components/PageHero";
import { motion, AnimatePresence } from "motion/react";
import { useAsyncData, useDocumentTitle, useCareSeekerBasePath } from "@/frontend/hooks";
import { guardianService } from "@/backend/services/guardian.service";
import { marketplaceService } from "@/backend/services/marketplace.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { useAriaToast } from "@/frontend/hooks/useAriaToast";
import type { AgencyPackage, UCCFPricingOffer } from "@/backend/models";
import { useTranslation } from "react-i18next";

const steps = [{ id: 1, name: "Service Details", icon: Stethoscope }, { id: 2, name: "Schedule", icon: Calendar }, { id: 3, name: "Patient Info", icon: User }, { id: 4, name: "Payment", icon: CreditCard }];

// Map package categories to service types
const categoryToServiceType: Record<string, string> = {
  elderly: "Full Day Care",
  chronic: "Full Day Care",
  post_surgery: "Post-Op Recovery",
  baby: "Daily Check-in",
  critical: "Medical Support",
  disability: "Full Day Care",
};

function formatPriceModel(model?: string): string {
  if (model === "daily") return "day";
  if (model === "hourly") return "hr";
  return "mo";
}

export default function BookingWizardPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.bookingWizard", "Booking Wizard"));

  const toast = useAriaToast();
  const navigate = useNavigate();
  const base = useCareSeekerBasePath();
  const subscriberId = base === "/patient" ? "patient-current" : "guardian-current";
  const [searchParams] = useSearchParams();
  const packageId = searchParams.get("package");
  const [currentStep, setCurrentStep] = useState(1);
  const [completed, setCompleted] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  // Load package data if subscribing from marketplace
  const { data: packageData, loading: pkgLoading } = useAsyncData(
    () => packageId ? marketplaceService.getAgencyPackageById(packageId) : Promise.resolve(null),
    [packageId]
  );

  // Auto-select service type from package category
  const autoSelectedService = useMemo(() => {
    if (!packageData) return null;
    const primaryCat = packageData.meta.category[0];
    return categoryToServiceType[primaryCat] || "Full Day Care";
  }, [packageData]);

  // Use auto-selected if user hasn't manually chosen
  const activeService = selectedService || autoSelectedService;

  // Package pricing helpers
  const pkgPricing = packageData?.pricing as UCCFPricingOffer | undefined;
  const pkgBasePrice = pkgPricing?.base_price || 0;
  const pkgModel = pkgPricing?.pricing_model || "monthly";
  const pkgOvertimeRate = pkgPricing?.overtime_rate;
  const pkgIncludedHours = pkgPricing?.included_hours;

  const handleConfirm = async () => {
    if (packageId) {
      setSubscribing(true);
      try {
        await marketplaceService.subscribeToPackage(packageId, subscriberId);
        toast.success("Successfully subscribed to package!");
        setCompleted(true);
      } catch {
        toast.error("Subscription failed. Please try again.");
      } finally {
        setSubscribing(false);
      }
    } else {
      setCompleted(true);
    }
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
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{packageId ? "Subscribed!" : "Booking Requested!"}</h2>
          <p className="text-gray-500 mb-8">
            {packageId
              ? `You've successfully subscribed to "${packageData?.meta.title || "the package"}". The agency will begin onboarding shortly.`
              : "Dr. Rahat Khan has been notified and will respond within 30 minutes."}
          </p>
          <Button
            onClick={() => navigate(packageId ? `${base}/marketplace-hub` : `${base}/dashboard`)}
            className="w-full h-14 rounded-2xl font-bold text-lg"
            style={{ background: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FEB4C5 0%, #DB869A 100%)" }}
          >
            {packageId ? "Back to Marketplace" : "Go to Dashboard"}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <PageHero gradient="radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FEB4C5 0%, #DB869A 100%)" className="pt-12 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <h1 className="text-2xl font-bold text-white">
              {packageId ? "Package Subscription" : "Booking Wizard"}
            </h1>
            {packageData && (
              <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs flex items-center gap-1.5">
                <Package className="w-3 h-3" /> {packageData.agency_name}
              </span>
            )}
          </div>
          <div className="flex justify-between relative"><div className="absolute top-1/2 left-0 w-full h-1 bg-white/20 -translate-y-1/2" /><div className="absolute top-1/2 left-0 h-1 bg-white -translate-y-1/2 transition-all duration-500" style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }} />{steps.map((step) => (<div key={step.id} className="relative z-10 flex flex-col items-center"><div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${currentStep >= step.id ? 'bg-white text-[#DB869A]' : 'bg-[#EAB1C1] text-white'}`}>{currentStep > step.id ? <CheckCircle2 className="w-6 h-6" /> : <step.icon className="w-5 h-5" />}</div><span className="text-[10px] font-bold text-white mt-2 uppercase tracking-wider">{step.name}</span></div>))}</div>
        </div>
      </PageHero>
      <div className="max-w-3xl mx-auto px-6 -mt-12">
        <div className="finance-card p-8">
          <AnimatePresence mode="wait">
            <motion.div key={currentStep} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.3 }}>
              {/* Step 1: Service Details — auto-select from package */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800">Choose Service Type</h2>
                  {packageData && (
                    <div className="p-4 rounded-2xl bg-[#FFF5F7] border border-[#FEB4C5]/30 flex items-start gap-3">
                      <Package className="w-5 h-5 text-[#DB869A] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-gray-800">Pre-filled from: {packageData.meta.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Service type auto-selected based on package category. You can change it below.
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {["Full Day Care", "Post-Op Recovery", "Daily Check-in", "Medical Support"].map((type) => {
                      const isActive = activeService === type;
                      const isAutoSelected = !selectedService && autoSelectedService === type;
                      return (
                        <button
                          key={type}
                          onClick={() => setSelectedService(type)}
                          className={`p-6 rounded-2xl border-2 transition-all text-left group ${
                            isActive ? "border-[#FEB4C5] bg-[#FFF5F7]" : "border-gray-100 hover:border-[#FEB4C5] hover:bg-[#FFF5F7]"
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                            isActive ? "bg-[#FEB4C5]/20" : "bg-gray-50 group-hover:bg-[#FEB4C5]/10"
                          }`}>
                            <Stethoscope className={`w-6 h-6 ${isActive ? "text-[#FEB4C5]" : "text-gray-400 group-hover:text-[#FEB4C5]"}`} />
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-800">{type}</p>
                            {isAutoSelected && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#FEB4C5]/20 text-[#DB869A]">
                                From Package
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {packageData && isActive
                              ? `৳${pkgBasePrice.toLocaleString()}/${formatPriceModel(pkgModel)}`
                              : "Starting from ৳400/hr"}
                          </p>
                          {isActive && <CheckCircle2 className="w-5 h-5 text-[#FEB4C5] mt-2" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Schedule — pre-fill from package */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800">Select Date & Time</h2>
                  {packageData?.schedule && (
                    <div className="p-4 rounded-2xl bg-[#FFF5F7] border border-[#FEB4C5]/30">
                      <p className="text-xs text-[#DB869A] mb-2 flex items-center gap-1.5"><Package className="w-3 h-3" /> Package Schedule</p>
                      <div className="flex gap-4 text-sm text-gray-700">
                        <span>{packageData.schedule.hours_per_day}h/day</span>
                        <span className="capitalize">{packageData.schedule.shift_type} shift</span>
                        <span className="capitalize">{packageData.schedule.staff_pattern?.replace("_", " ")}</span>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-sm font-bold text-gray-400 mb-4 uppercase">Start Date</p>
                      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <Calendar className="w-10 h-10 text-[#FEB4C5] mb-2" />
                        <p className="text-lg font-bold text-gray-800 underline">
                          {packageData?.meta.start_date
                            ? new Date(packageData.meta.start_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                            : "March 18, 2026"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-400 mb-4 uppercase">Start Time</p>
                      <div className="grid grid-cols-2 gap-2">
                        {["09:00 AM", "11:00 AM", "02:00 PM", "05:00 PM"].map(t => (
                          <button
                            key={t}
                            onClick={() => setSelectedTime(t)}
                            className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                              selectedTime === t ? "border-[#FEB4C5] bg-[#FFF5F7] text-[#DB869A]" : "border-gray-200 hover:border-[#FEB4C5]"
                            }`}
                          >{t}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Patient Info */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800">Patient Details</h2>
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl border-2 border-[#FEB4C5] bg-[#FFF5F7] flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center"><User className="text-[#FEB4C5]" /></div>
                      <div>
                        <p className="font-bold text-gray-800">Mrs. Fatema Begum</p>
                        <p className="text-xs text-gray-500">Age: 72 • Condition: Post-Op</p>
                      </div>
                      <CheckCircle2 className="w-6 h-6 text-[#FEB4C5] ml-auto" />
                    </div>
                    <button className="w-full p-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 font-medium hover:bg-gray-50 transition-colors">+ Add New Patient</button>
                  </div>
                </div>
              )}

              {/* Step 4: Payment Summary — show package pricing */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800">Payment Summary</h2>

                  {/* Package info banner */}
                  {packageData && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FFF5F7] to-[#F0FFF0] border border-[#FEB4C5]/20 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs" style={{ background: "var(--cn-gradient-agency, linear-gradient(135deg, #5FB865, #3D9942))" }}>
                        {packageData.agency_name.slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-800">{packageData.meta.title}</p>
                        <p className="text-xs text-gray-500">{packageData.agency_name} • {packageData.meta.category.map(c => c.replace("_", " ")).join(", ")}</p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-[#5FB865]" />
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-2xl p-6 space-y-3">
                    {packageData ? (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">
                            {activeService || packageData.meta.title}
                            {pkgIncludedHours ? ` (${pkgIncludedHours}h included)` : ""}
                          </span>
                          <span className="font-bold text-gray-800">
                            ৳{pkgBasePrice.toLocaleString()}/{formatPriceModel(pkgModel)}
                          </span>
                        </div>
                        {pkgOvertimeRate && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Overtime Rate</span>
                            <span className="font-bold text-gray-800">৳{pkgOvertimeRate}/hr</span>
                          </div>
                        )}
                        {pkgPricing?.extra_charges?.length ? (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Extra charges may apply</span>
                            <span className="text-xs text-gray-400">{pkgPricing.extra_charges.join(", ")}</span>
                          </div>
                        ) : null}
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Platform Fee</span>
                          <span className="font-bold text-gray-800">৳{Math.round(pkgBasePrice * 0.05).toLocaleString()}</span>
                        </div>
                        <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between">
                          <span className="font-bold text-gray-800">Total</span>
                          <span className="font-bold text-2xl text-[#7CE577]">
                            ৳{(pkgBasePrice + Math.round(pkgBasePrice * 0.05)).toLocaleString()}/{formatPriceModel(pkgModel)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Post-Op Recovery (4 hrs)</span><span className="font-bold text-gray-800">৳3,200</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Platform Fee</span><span className="font-bold text-gray-800">৳150</span></div>
                        <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between"><span className="font-bold text-gray-800">Total</span><span className="font-bold text-2xl text-[#7CE577]">৳3,350</span></div>
                      </>
                    )}
                  </div>

                  {/* SLA preview for package */}
                  {packageData?.sla && (
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                      <p className="text-xs font-bold text-gray-400 uppercase">Service Guarantee</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {packageData.sla.replacement_time_hours != null && (
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <CheckCircle2 className="w-3 h-3 text-[#5FB865]" /> {packageData.sla.replacement_time_hours}h replacement
                          </div>
                        )}
                        {packageData.sla.emergency_response_minutes != null && (
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <CheckCircle2 className="w-3 h-3 text-[#5FB865]" /> {packageData.sla.emergency_response_minutes}min emergency
                          </div>
                        )}
                        {packageData.sla.attendance_guarantee_percent != null && (
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <CheckCircle2 className="w-3 h-3 text-[#5FB865]" /> {packageData.sla.attendance_guarantee_percent}% attendance
                          </div>
                        )}
                        {packageData.sla.reporting_frequency && (
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <CheckCircle2 className="w-3 h-3 text-[#5FB865]" /> {packageData.sla.reporting_frequency} reports
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <p className="text-sm font-bold text-gray-400 uppercase">Payment Method</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button className="p-4 rounded-xl border-2 border-[#FEB4C5] bg-[#FFF5F7] flex items-center gap-3"><img src="https://upload.wikimedia.org/wikipedia/commons/5/5c/Bkash_logo.png" className="h-5" alt="bkash" /><span className="font-bold text-[#DB869A]">bKash</span></button>
                      <button className="p-4 rounded-xl border-2 border-gray-100 flex items-center gap-3"><CreditCard className="w-5 h-5 text-gray-400" /><span className="font-bold text-gray-600">Card</span></button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          <div className="flex gap-4 mt-12 pt-8 border-t border-gray-100">{currentStep > 1 && (<Button variant="outline" onClick={prevStep} className="h-14 flex-1 rounded-2xl font-bold border-gray-200">Back</Button>)}<Button onClick={currentStep === steps.length ? handleConfirm : nextStep} className="h-14 flex-[2] rounded-2xl font-bold shadow-lg" disabled={subscribing} style={{ background: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FEB4C5 0%, #DB869A 100%)" }}>{subscribing ? "Processing..." : currentStep === steps.length ? (packageId ? "Confirm Subscription" : "Confirm Booking") : "Next Step"}<ChevronRight className="ml-2 w-5 h-5" /></Button></div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: ".finance-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 2.5rem; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05); }" }} />
    </div>
  );
}