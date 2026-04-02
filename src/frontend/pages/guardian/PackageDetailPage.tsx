/**
 * PackageDetailPage — Guardian views full agency package before subscribing
 */
import { useParams, Link, useNavigate } from "react-router";
import {
  ArrowLeft, Star, Shield, MapPin, Clock, Users, DollarSign, CheckCircle2,
  Phone, MessageSquare, Package, Heart, Activity, Utensils, Home,
  FileText, AlertTriangle, Zap, Award, TrendingUp, ChevronRight,
} from "lucide-react";
import { cn } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle, useCareSeekerBasePath } from "@/frontend/hooks";
import { marketplaceService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useAriaToast } from "@/frontend/hooks/useAriaToast";
import type { AgencyPackage, CareCategory } from "@/backend/models";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const categoryLabels: Record<CareCategory, string> = {
  elderly: "Elderly Care", post_surgery: "Post-Surgery", chronic: "Chronic Care",
  critical: "Critical/ICU", baby: "Baby Care", disability: "Disability",
};
const categoryColors: Record<CareCategory, { color: string; bg: string }> = {
  elderly: { color: "#7B5EA7", bg: "rgba(123,94,167,0.12)" },
  post_surgery: { color: "#0288D1", bg: "rgba(2,136,209,0.12)" },
  chronic: { color: "#E8A838", bg: "rgba(232,168,56,0.12)" },
  critical: { color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  baby: { color: "#DB869A", bg: "rgba(219,134,154,0.12)" },
  disability: { color: "#00897B", bg: "rgba(0,137,123,0.12)" },
};

const staffLevelLabels: Record<string, string> = {
  L1: "Basic Attendant", L2: "Trained Caregiver", L3: "Licensed Nurse", L4: "Specialist/RN",
};

export default function PackageDetailPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.packageDetail", "Package Detail"));

  const toast = useAriaToast();
  const base = useCareSeekerBasePath();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: pkg, loading } = useAsyncData(() =>
    marketplaceService.getAgencyPackageById(id!)
  );

  if (loading) return <PageSkeleton />;
  if (!pkg) return (
    <div className="text-center py-20">
      <Package className="w-12 h-12 mx-auto mb-3" style={{ color: cn.borderLight }} />
      <p style={{ color: cn.textSecondary }}>Package not found</p>
      <Link to={`${base}/marketplace-hub`} className="text-sm mt-3 inline-block" style={{ color: cn.green }}>Back to Marketplace</Link>
    </div>
  );

  const pricing = pkg.pricing;
  const priceLabel = `৳${(pricing.base_price || 0).toLocaleString()}/${pricing.pricing_model === "daily" ? "day" : pricing.pricing_model === "hourly" ? "hr" : "mo"}`;

  const allServices = [
    ...(pkg.services?.personal_care || []).map(s => ({ s, cat: "Personal Care" })),
    ...(pkg.services?.medical_support || []).map(s => ({ s, cat: "Medical Support" })),
    ...(pkg.services?.household_support || []).map(s => ({ s, cat: "Household" })),
    ...(pkg.services?.advanced_care || []).map(s => ({ s, cat: "Advanced Care" })),
    ...(pkg.services?.coordination || []).map(s => ({ s, cat: "Coordination" })),
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Back */}
      <Link to={`${base}/marketplace-hub`} className="inline-flex items-center gap-1.5 text-sm no-underline" style={{ color: cn.textSecondary }}>
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </Link>

      {/* Hero Card */}
      <div className="stat-card p-6 space-y-4">
        {pkg.featured && (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4" style={{ color: cn.amber }} />
            <span className="text-xs" style={{ color: cn.amber }}>Featured Package</span>
          </div>
        )}
        <h1 className="text-xl" style={{ color: cn.text }}>{pkg.meta.title}</h1>

        {/* Categories */}
        <div className="flex flex-wrap gap-1.5">
          {pkg.meta.category.map(cat => {
            const cc = categoryColors[cat];
            return <span key={cat} className="px-2.5 py-1 rounded-full text-xs" style={{ background: cc.bg, color: cc.color }}>{categoryLabels[cat]}</span>;
          })}
        </div>

        {/* Price + Duration */}
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cn.greenBg }}>
              <DollarSign className="w-5 h-5" style={{ color: cn.green }} />
            </div>
            <div>
              <p className="text-lg" style={{ color: cn.green }}>{priceLabel}</p>
              {pricing.included_hours && <p className="text-xs" style={{ color: cn.textSecondary }}>{pricing.included_hours}h included</p>}
            </div>
          </div>
          {pricing.overtime_rate && (
            <div className="text-xs" style={{ color: cn.textSecondary }}>
              Overtime: ৳{pricing.overtime_rate}/hr
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => navigate(`${base}/booking?package=${pkg.id}`)}
            className="flex-1 py-3 rounded-xl text-white text-sm cn-touch-target"
            style={{ background: "var(--cn-gradient-guardian)" }}
          >
            Subscribe to Package
          </button>
          <button
            onClick={() => navigate(`${base}/messages?to=${pkg.agency_id}`)}
            className="px-4 py-3 rounded-xl border text-sm cn-touch-target"
            style={{ borderColor: cn.border, color: cn.text }}
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Agency Info */}
      <div className="stat-card p-5">
        <h3 className="text-sm mb-3" style={{ color: cn.textSecondary }}>Agency</h3>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm" style={{ background: "var(--cn-gradient-agency)" }}>
            {pkg.agency_name.slice(0, 2)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: cn.text }}>{pkg.agency_name}</span>
              {pkg.agency_verified && <Shield className="w-4 h-4" style={{ color: cn.teal }} />}
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: cn.textSecondary }}>
              {pkg.agency_rating && <span className="flex items-center gap-1"><Star className="w-3 h-3" style={{ color: cn.amber }} /> {pkg.agency_rating}</span>}
              {pkg.subscribers && <span>{pkg.subscribers} subscribers</span>}
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {pkg.party.service_area?.join(", ")}</span>
            </div>
          </div>
          <Link to={`${base}/agency/${pkg.agency_id}`} className="text-xs no-underline flex items-center gap-1" style={{ color: cn.green }}>
            Profile <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Staffing */}
      <div className="stat-card p-5 space-y-3">
        <h3 className="text-sm flex items-center gap-2" style={{ color: cn.textSecondary }}>
          <Users className="w-4 h-4" /> Staffing
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Level", value: staffLevelLabels[pkg.staffing.required_level] || pkg.staffing.required_level },
            { label: "Caregivers", value: pkg.staffing.caregiver_count || 0 },
            { label: "Nurses", value: pkg.staffing.nurse_count || 0 },
            { label: "Experience", value: pkg.staffing.experience_years ? `${pkg.staffing.experience_years}+ yrs` : "Any" },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: cn.bgInput }}>
              <p className="text-sm" style={{ color: cn.text }}>{s.value}</p>
              <p className="text-[10px]" style={{ color: cn.textSecondary }}>{s.label}</p>
            </div>
          ))}
        </div>
        {pkg.staffing.gender_preference && pkg.staffing.gender_preference !== "none" && (
          <p className="text-xs" style={{ color: cn.textSecondary }}>Gender preference: {pkg.staffing.gender_preference}</p>
        )}
        {pkg.staffing.certifications_required?.length ? (
          <div className="flex flex-wrap gap-1">
            {pkg.staffing.certifications_required.map(c => (
              <span key={c} className="px-2 py-0.5 rounded-full text-xs" style={{ background: cn.purpleBg, color: cn.purple }}>{c}</span>
            ))}
          </div>
        ) : null}
      </div>

      {/* Schedule */}
      {pkg.schedule && (
        <div className="stat-card p-5 space-y-3">
          <h3 className="text-sm flex items-center gap-2" style={{ color: cn.textSecondary }}>
            <Clock className="w-4 h-4" /> Schedule
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Hours/Day", value: `${pkg.schedule.hours_per_day || 8}h` },
              { label: "Shift", value: pkg.schedule.shift_type || "Day" },
              { label: "Pattern", value: pkg.schedule.staff_pattern || "Single" },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: cn.bgInput }}>
                <p className="text-sm" style={{ color: cn.text }}>{s.value}</p>
                <p className="text-[10px]" style={{ color: cn.textSecondary }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      {allServices.length > 0 && (
        <div className="stat-card p-5 space-y-3">
          <h3 className="text-sm flex items-center gap-2" style={{ color: cn.textSecondary }}>
            <Heart className="w-4 h-4" /> Services Included
          </h3>
          {["Personal Care", "Medical Support", "Household", "Advanced Care", "Coordination"].map(cat => {
            const items = allServices.filter(s => s.cat === cat);
            if (!items.length) return null;
            return (
              <div key={cat}>
                <p className="text-xs mb-1.5" style={{ color: cn.textSecondary }}>{cat}</p>
                <div className="flex flex-wrap gap-1.5">
                  {items.map(({ s }) => (
                    <span key={s} className="px-2.5 py-1 rounded-full text-xs flex items-center gap-1" style={{ background: cn.greenBg, color: cn.green }}>
                      <CheckCircle2 className="w-3 h-3" /> {s}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SLA */}
      {pkg.sla && (
        <div className="stat-card p-5 space-y-3">
          <h3 className="text-sm flex items-center gap-2" style={{ color: cn.textSecondary }}>
            <Award className="w-4 h-4" /> Service Level Agreement
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              pkg.sla.replacement_time_hours != null && { label: "Replacement Time", value: `${pkg.sla.replacement_time_hours}h` },
              pkg.sla.emergency_response_minutes != null && { label: "Emergency Response", value: `${pkg.sla.emergency_response_minutes} min` },
              pkg.sla.attendance_guarantee_percent != null && { label: "Attendance Guarantee", value: `${pkg.sla.attendance_guarantee_percent}%` },
              pkg.sla.reporting_frequency && { label: "Reports", value: pkg.sla.reporting_frequency },
            ].filter(Boolean).map((s: any) => (
              <div key={s.label} className="p-3 rounded-xl" style={{ background: cn.bgInput }}>
                <p className="text-sm" style={{ color: cn.teal }}>{s.value}</p>
                <p className="text-[10px]" style={{ color: cn.textSecondary }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance & Logistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {pkg.compliance && (
          <div className="stat-card p-5 space-y-2">
            <h3 className="text-sm" style={{ color: cn.textSecondary }}>Compliance</h3>
            {[
              pkg.compliance.background_verified && "Background verified",
              pkg.compliance.medical_fit && "Medical fitness certified",
              pkg.compliance.contract_required && "Contract provided",
              pkg.compliance.trial_available && "Trial period available",
            ].filter(Boolean).map(item => (
              <div key={item as string} className="flex items-center gap-2 text-xs" style={{ color: cn.green }}>
                <CheckCircle2 className="w-3 h-3" /> {item}
              </div>
            ))}
          </div>
        )}
        {pkg.logistics && (
          <div className="stat-card p-5 space-y-2">
            <h3 className="text-sm" style={{ color: cn.textSecondary }}>Logistics</h3>
            {[
              pkg.logistics.location_type && `Location: ${pkg.logistics.location_type}`,
              pkg.logistics.accommodation_provided && "Accommodation provided",
              pkg.logistics.food_provided && "Food provided",
              pkg.logistics.travel_distance_km && `Service radius: ${pkg.logistics.travel_distance_km}km`,
            ].filter(Boolean).map(item => (
              <div key={item as string} className="flex items-center gap-2 text-xs" style={{ color: cn.text }}>
                <Home className="w-3 h-3" style={{ color: cn.textSecondary }} /> {item}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exclusions & Add-ons */}
      {(pkg.exclusions?.length || pkg.add_ons?.length) ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pkg.exclusions?.length ? (
            <div className="stat-card p-5 space-y-2">
              <h3 className="text-sm" style={{ color: cn.textSecondary }}>Exclusions</h3>
              {pkg.exclusions.map(e => (
                <div key={e} className="flex items-center gap-2 text-xs" style={{ color: cn.red }}>
                  <AlertTriangle className="w-3 h-3" /> {e}
                </div>
              ))}
            </div>
          ) : null}
          {pkg.add_ons?.length ? (
            <div className="stat-card p-5 space-y-2">
              <h3 className="text-sm" style={{ color: cn.textSecondary }}>Available Add-ons</h3>
              {pkg.add_ons.map(a => (
                <div key={a} className="flex items-center gap-2 text-xs" style={{ color: cn.blue }}>
                  <Zap className="w-3 h-3" /> {a}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Extra charges */}
      {pricing.extra_charges?.length ? (
        <div className="stat-card p-5 space-y-2">
          <h3 className="text-sm" style={{ color: cn.textSecondary }}>Extra Charges</h3>
          {pricing.extra_charges.map(c => (
            <div key={c} className="flex items-center gap-2 text-xs" style={{ color: cn.amber }}>
              <DollarSign className="w-3 h-3" /> {c}
            </div>
          ))}
        </div>
      ) : null}

      {/* Bottom CTA */}
      <div className="stat-card p-5 flex gap-3">
        <button
          onClick={() => navigate(`${base}/booking?package=${pkg.id}`)}
          className="flex-1 py-3 rounded-xl text-white text-sm cn-touch-target"
          style={{ background: "var(--cn-gradient-guardian)" }}
        >
          Subscribe to This Package
        </button>
        <button
          onClick={() => navigate(`${base}/messages?to=${pkg.agency_id}`)}
          className="px-6 py-3 rounded-xl border text-sm cn-touch-target flex items-center gap-2"
          style={{ borderColor: cn.border, color: cn.text }}
        >
          <Phone className="w-4 h-4" /> Contact Agency
        </button>
      </div>
    </div>
  );
}