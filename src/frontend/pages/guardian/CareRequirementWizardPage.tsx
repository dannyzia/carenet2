import React, { useState, useMemo } from "react";
import { Building2, User, HeartPulse, Wallet, ClipboardCheck, CheckCircle2, ChevronLeft, ChevronRight, Calendar, Clock, Star, MapPin, Phone, Shield, Utensils, Dumbbell, Pill, Move, Scissors, MessageSquare, Search, Package, Megaphone, Globe, ToggleLeft, ToggleRight, Timer, AlertTriangle } from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle, useCareSeekerBasePath } from "@/frontend/hooks";
import { guardianService } from "@/backend/services";
import { marketplaceService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useAriaToast } from "@/frontend/hooks/useAriaToast";
import { useTranslation } from "react-i18next";

const steps = [
  { id: 1, name: "Select Agency", icon: Building2 },
  { id: 2, name: "Patient", icon: User },
  { id: 3, name: "Care Needs", icon: HeartPulse },
  { id: 4, name: "Schedule", icon: Calendar },
  { id: 5, name: "Budget", icon: Wallet },
  { id: 6, name: "Review", icon: ClipboardCheck },
];

const careTypes = [
  { id: "elderly", label: "Elderly Care", icon: "\u{1F9D3}", desc: "Daily assistance for seniors" },
  { id: "postop", label: "Post-Surgery", icon: "\u{1FA7A}", desc: "Recovery support after surgery" },
  { id: "disability", label: "Disability Support", icon: "\u267F", desc: "Specialized disability care" },
  { id: "dementia", label: "Dementia Care", icon: "\u{1F9E0}", desc: "Memory care and cognitive support" },
  { id: "child", label: "Child Care", icon: "\u{1F476}", desc: "Pediatric and child care" },
  { id: "night", label: "Night Care", icon: "\u{1F319}", desc: "Overnight monitoring and care" },
];

export default function CareRequirementWizardPage() {
  const toast = useAriaToast();
  const navigate = useNavigate();
  const base = useCareSeekerBasePath();
  const { t } = useTranslation("guardian");
  const { t: tCommon } = useTranslation("common");
  useDocumentTitle(tCommon("pageTitles.newCareRequirement", "New Care Requirement"));
  const [searchParams] = useSearchParams();
  const preselectedAgency = searchParams.get("agency");
  const skipChoice = searchParams.get("direct") === "true";
  const [showWizard, setShowWizard] = useState(!!preselectedAgency || skipChoice);
  const [currentStep, setCurrentStep] = useState(preselectedAgency ? 2 : 1);
  const [selectedAgency, setSelectedAgency] = useState(preselectedAgency || "");
  const [selectedCareTypes, setSelectedCareTypes] = useState<string[]>([]);
  const [postToMarketplace, setPostToMarketplace] = useState(false);
  const [formData, setFormData] = useState({ patientName: "", patientAge: "", conditions: "", scheduleType: "daily", startDate: "", duration: "", budgetMin: "", budgetMax: "", notes: "", expiryDays: "15" });
  const [submitting, setSubmitting] = useState(false);

  const next = () => setCurrentStep(s => Math.min(s + 1, 6));
  const prev = () => setCurrentStep(s => Math.max(s - 1, 1));

  const toggleCareType = (id: string) => {
    setSelectedCareTypes(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    const expiryMs = parseInt(formData.expiryDays || "15", 10) * 24 * 3600 * 1000;
    const expiresAt = new Date(Date.now() + expiryMs).toISOString();

    try {
      const req = await marketplaceService.createCareRequest({
        meta: {
          type: "request",
          title: `${selectedCareTypes.map(ct => careTypes.find(c => c.id === ct)?.label).join(", ")} for ${formData.patientName || "Patient"}`,
          category: selectedCareTypes,
          location: { city: "Dhaka", area: "" },
        },
        party: {
          role: "patient",
          name: formData.patientName || "Guardian User",
          contact_phone: "+880-1700-000000",
        },
        care_subject: {
          age: parseInt(formData.patientAge) || undefined,
          conditions: formData.conditions ? formData.conditions.split(",").map(s => s.trim()) : [],
        },
        staffing: { required_level: "L2", caregiver_count: 1 },
        schedule: {
          hours_per_day: 8,
          shift_type: formData.scheduleType === "night" ? "night" : "day",
          pattern: formData.scheduleType,
          start_date: formData.startDate || undefined,
        },
        pricing: {
          pricing_model: "monthly",
          budget_min: parseInt(formData.budgetMin) || undefined,
          budget_max: parseInt(formData.budgetMax) || undefined,
        },
        status: "draft",
        expires_at: expiresAt,
      } as any);

      if (postToMarketplace) {
        await marketplaceService.publishCareRequest(req.id);
        toast.success(t("wizard.submitMarketplaceSuccess"));
        navigate(`${base}/marketplace-hub`, { replace: true });
      } else {
        toast.success(t("wizard.submitSuccess"));
        navigate(`${base}/dashboard`, { replace: true });
      }
    } catch {
      toast.error(t("wizard.submitFailed"));
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
            to={`${base}/marketplace-hub`}
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
            onClick={() => setShowWizard(true)}
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
                <div><label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.medicalConditions")}</label><textarea value={formData.conditions} onChange={e => setFormData({ ...formData, conditions: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }} rows={3} placeholder={t("wizard.medicalConditionsPlaceholder")} /></div>
              </div>
            )}

            {/* Step 3: Care Needs */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl" style={{ color: cn.text }}>{t("wizard.careRequirements")}</h2>
                <p className="text-sm" style={{ color: cn.textSecondary }}>{t("wizard.careRequirementsDesc")}</p>
                <div className="grid grid-cols-2 gap-3">
                  {careTypes.map(ct => (
                    <button key={ct.id} onClick={() => toggleCareType(ct.id)} className="p-4 rounded-xl border text-left transition-all cn-touch-target" style={{ borderColor: selectedCareTypes.includes(ct.id) ? cn.pink : cn.border, background: selectedCareTypes.includes(ct.id) ? cn.pinkBg : "transparent" }}>
                      <span className="text-2xl block mb-2">{ct.icon}</span>
                      <p className="text-sm" style={{ color: cn.text }}>{ct.label}</p>
                      <p className="text-xs" style={{ color: cn.textSecondary }}>{ct.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Schedule */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl" style={{ color: cn.text }}>{t("wizard.schedulePreferences")}</h2>
                <div className="flex gap-2">
                  {["daily", "weekly", "live-in", "as-needed"].map(t => (
                    <button key={t} onClick={() => setFormData({ ...formData, scheduleType: t })} className="flex-1 py-2.5 rounded-xl border text-xs cn-touch-target" style={{ borderColor: formData.scheduleType === t ? cn.pink : cn.border, background: formData.scheduleType === t ? cn.pinkBg : "transparent", color: formData.scheduleType === t ? cn.pink : cn.text }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
                  ))}
                </div>
                <div><label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.preferredStartDate")}</label><input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }} /></div>
                <div><label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.duration")}</label><input type="text" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }} placeholder={t("wizard.durationPlaceholder")} /></div>
              </div>
            )}

            {/* Step 5: Budget */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <h2 className="text-xl" style={{ color: cn.text }}>{t("wizard.budgetRange")}</h2>
                <p className="text-sm" style={{ color: cn.textSecondary }}>{t("wizard.budgetDesc")}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.minimum")}</label><input type="number" value={formData.budgetMin} onChange={e => setFormData({ ...formData, budgetMin: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }} placeholder="15,000" /></div>
                  <div><label className="block text-sm mb-1" style={{ color: cn.text }}>{t("wizard.maximum")}</label><input type="number" value={formData.budgetMax} onChange={e => setFormData({ ...formData, budgetMax: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }} placeholder="35,000" /></div>
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
                  <div className="p-3 rounded-xl" style={{ background: cn.bgInput }}><p className="text-xs mb-1" style={{ color: cn.textSecondary }}>{t("wizard.careTypes")}</p><div className="flex flex-wrap gap-1">{selectedCareTypes.map(ct => <span key={ct} className="px-2 py-0.5 rounded-full text-xs" style={{ background: cn.pinkBg, color: cn.pink }}>{careTypes.find(c => c.id === ct)?.label}</span>)}</div></div>
                  <div className="p-3 rounded-xl" style={{ background: cn.bgInput }}><p className="text-xs mb-1" style={{ color: cn.textSecondary }}>{t("wizard.schedule")}</p><p className="text-sm" style={{ color: cn.text }}>{formData.scheduleType} {t("wizard.starting")} {formData.startDate || "TBD"} {t("wizard.for")} {formData.duration || "TBD"}</p></div>
                  <div className="p-3 rounded-xl" style={{ background: cn.bgInput }}><p className="text-xs mb-1" style={{ color: cn.textSecondary }}>{t("wizard.budget")}</p><p className="text-sm" style={{ color: cn.text }}>৳{formData.budgetMin || "?"} - ৳{formData.budgetMax || "?"}{t("wizard.perMonth")}</p></div>
                  {/* Expiry info */}
                  <div className="p-3 rounded-xl flex items-center gap-2" style={{ background: cn.amberBg }}>
                    <Timer className="w-4 h-4" style={{ color: cn.amber }} />
                    <div>
                      <p className="text-xs" style={{ color: cn.textSecondary }}>{t("wizard.listingExpiry")}</p>
                      <p className="text-sm" style={{ color: cn.amber }}>{formData.expiryDays} days from posting</p>
                    </div>
                  </div>
                  {/* Marketplace posting indicator */}
                  <div className="p-3 rounded-xl flex items-center gap-2" style={{ background: postToMarketplace ? cn.greenBg : cn.bgInput }}>
                    <Globe className="w-4 h-4" style={{ color: postToMarketplace ? cn.green : cn.textSecondary }} />
                    <div>
                      <p className="text-xs" style={{ color: cn.textSecondary }}>{t("wizard.distribution")}</p>
                      <p className="text-sm" style={{ color: postToMarketplace ? cn.green : cn.text }}>
                        {postToMarketplace ? "Posted to Open Marketplace (agencies can bid)" : "Direct to selected agency only"}
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
          <button onClick={currentStep === 1 && !preselectedAgency ? () => setShowWizard(false) : prev} disabled={currentStep === 1 && !!preselectedAgency} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm disabled:opacity-30 cn-touch-target" style={{ color: cn.text }}>
            <ChevronLeft className="w-4 h-4" /> {currentStep === 1 && !preselectedAgency ? t("wizard.backToOptions") : t("wizard.back")}
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