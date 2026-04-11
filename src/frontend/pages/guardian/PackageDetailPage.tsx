/**
 * PackageDetailPage — Guardian views full agency package before subscribing
 */
import { useParams, Link, useNavigate, useLocation } from "react-router";
import {
  ArrowLeft, Star, Shield, MapPin, Clock, Users, DollarSign, CheckCircle2,
  Phone, MessageSquare, Package, Heart, Home,
  AlertTriangle, Zap, Award, ChevronRight,
} from "lucide-react";
import { cn } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle, useCareSeekerBasePath } from "@/frontend/hooks";
import { marketplaceService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import type { AgencyPackage, CareCategory } from "@/backend/models";
import { useTranslation } from "react-i18next";
import { DEFAULT_SCHEDULE_HOURS_PER_DAY } from "@/domain/bookingWizardKeys";
import { useAuth } from "@/frontend/auth/AuthContext";
import { PackageEngagementActions } from "@/frontend/components/marketplace/PackageEngagementActions";

const categoryColors: Record<CareCategory, { color: string; bg: string }> = {
  elderly: { color: "#7B5EA7", bg: "rgba(123,94,167,0.12)" },
  post_surgery: { color: "#0288D1", bg: "rgba(2,136,209,0.12)" },
  chronic: { color: "#E8A838", bg: "rgba(232,168,56,0.12)" },
  critical: { color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  baby: { color: "#DB869A", bg: "rgba(219,134,154,0.12)" },
  disability: { color: "#00897B", bg: "rgba(0,137,123,0.12)" },
};

type ServiceCatKey = "personalCare" | "medicalSupport" | "household" | "advancedCare" | "coordination";

const SERVICE_GROUP_ORDER: ServiceCatKey[] = [
  "personalCare",
  "medicalSupport",
  "household",
  "advancedCare",
  "coordination",
];

function buildServiceRows(pkg: AgencyPackage): { s: string; catKey: ServiceCatKey }[] {
  return [
    ...(pkg.services?.personal_care || []).map((s) => ({ s, catKey: "personalCare" as const })),
    ...(pkg.services?.medical_support || []).map((s) => ({ s, catKey: "medicalSupport" as const })),
    ...(pkg.services?.household_support || []).map((s) => ({ s, catKey: "household" as const })),
    ...(pkg.services?.advanced_care || []).map((s) => ({ s, catKey: "advancedCare" as const })),
    ...(pkg.services?.coordination || []).map((s) => ({ s, catKey: "coordination" as const })),
  ];
}

export default function PackageDetailPage() {
  const { t: tDocTitle } = useTranslation("common");
  const { t } = useTranslation("guardian", { keyPrefix: "packageDetail" });
  const { t: tg } = useTranslation("guardian");
  useDocumentTitle(tDocTitle("pageTitles.packageDetail", "Package Detail"));

  const careSeekerBase = useCareSeekerBasePath();
  const { user } = useAuth();
  const activeRole = user?.activeRole;
  const base = activeRole === "caregiver" ? "/caregiver" : careSeekerBase;
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const fromMarketplacePackages = (location.state as { fromMarketplacePackages?: string } | null)?.fromMarketplacePackages;

  const goBackToMarketplace = () => {
    if (fromMarketplacePackages) {
      navigate(fromMarketplacePackages);
      return;
    }
    navigate(`${base}/marketplace-hub?tab=packages`);
  };
  const { data: pkg, loading } = useAsyncData(() => marketplaceService.getAgencyPackageById(id!));

  if (loading) return <PageSkeleton />;
  if (!pkg) {
    return (
      <div className="text-center py-20">
        <Package className="w-12 h-12 mx-auto mb-3" style={{ color: cn.borderLight }} />
        <p style={{ color: cn.textSecondary }}>{t("notFound")}</p>
        <button
          type="button"
          onClick={goBackToMarketplace}
          aria-label={t("backToMarketplace")}
          className="text-sm mt-3 inline-block bg-transparent border-0 cursor-pointer p-0"
          style={{ color: cn.green }}
        >
          {t("backToMarketplace")}
        </button>
      </div>
    );
  }

  const pricing = pkg.pricing;
  const period =
    pricing.pricing_model === "daily"
      ? t("pricingPerDay")
      : pricing.pricing_model === "hourly"
        ? t("pricingPerHour")
        : t("pricingPerMonth");
  const priceLabel = `৳${(pricing.base_price || 0).toLocaleString()}/${period}`;

  const allServices = buildServiceRows(pkg);

  const levelKey = pkg.staffing.required_level;
  const staffLabel =
    levelKey && ["L1", "L2", "L3", "L4"].includes(levelKey)
      ? t(`staffLevels.${levelKey as "L1" | "L2" | "L3" | "L4"}`)
      : pkg.staffing.required_level;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <button
        type="button"
        onClick={goBackToMarketplace}
        aria-label={t("backToMarketplace")}
        className="inline-flex items-center gap-1.5 text-sm bg-transparent border-0 cursor-pointer p-0"
        style={{ color: cn.textSecondary }}
      >
        <ArrowLeft className="w-4 h-4" aria-hidden /> {t("backToMarketplace")}
      </button>

      <div className="stat-card p-6 space-y-4">
        {pkg.featured && (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4" style={{ color: cn.amber }} />
            <span className="text-xs" style={{ color: cn.amber }}>
              {tg("marketplace.featured")}
            </span>
          </div>
        )}
        <h1 className="text-xl" style={{ color: cn.text }}>
          {pkg.meta.title}
        </h1>

        <div className="flex flex-wrap gap-1.5">
          {pkg.meta.category.map((cat) => {
            const cc = categoryColors[cat];
            return (
              <span
                key={cat}
                className="px-2.5 py-1 rounded-full text-xs"
                style={{ background: cc.bg, color: cc.color }}
              >
                {t(`categories.${cat}`)}
              </span>
            );
          })}
        </div>

        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cn.greenBg }}>
              <DollarSign className="w-5 h-5" style={{ color: cn.green }} />
            </div>
            <div>
              <p className="text-lg" style={{ color: cn.green }}>
                {priceLabel}
              </p>
              {pricing.included_hours ? (
                <p className="text-xs" style={{ color: cn.textSecondary }}>
                  {t("includedHoursLabel", { hours: pricing.included_hours })}
                </p>
              ) : null}
            </div>
          </div>
          {pricing.overtime_rate ? (
            <div className="text-xs" style={{ color: cn.textSecondary }}>
              {t("overtimeLine", { rate: String(pricing.overtime_rate) })}
            </div>
          ) : null}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(`${base}/booking?package=${pkg.id}`)}
            className="flex-1 py-3 rounded-xl text-white text-sm cn-touch-target"
            style={{ background: "var(--cn-gradient-guardian)" }}
          >
            {t("subscribe")}
          </button>
          <button
            type="button"
            onClick={() => navigate(`${base}/messages?to=${pkg.agency_id}`)}
            className="px-4 py-3 rounded-xl border text-sm cn-touch-target"
            style={{ borderColor: cn.border, color: cn.text }}
            title={t("contactAgency")}
            aria-label={t("contactAgency")}
          >
            <MessageSquare className="w-4 h-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="stat-card p-5">
        <h3 className="text-sm mb-3" style={{ color: cn.textSecondary }}>
          {t("agency")}
        </h3>
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm"
            style={{ background: "var(--cn-gradient-agency)" }}
          >
            {pkg.agency_name.slice(0, 2)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: cn.text }}>
                {pkg.agency_name}
              </span>
              {pkg.agency_verified && <Shield className="w-4 h-4" style={{ color: cn.teal }} />}
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: cn.textSecondary }}>
              {pkg.agency_rating ? (
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3" style={{ color: cn.amber }} /> {pkg.agency_rating}
                </span>
              ) : null}
              {pkg.subscribers != null ? (
                <span>{tg("marketplace.subscribers", { count: pkg.subscribers })}</span>
              ) : null}
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {pkg.party.service_area?.join(", ")}
              </span>
            </div>
          </div>
          <Link
            to={`${base}/agency/${pkg.agency_id}`}
            className="text-xs no-underline flex items-center gap-1"
            style={{ color: cn.green }}
          >
            {t("profileLink")} <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="stat-card p-5 space-y-3">
        <h3 className="text-sm flex items-center gap-2" style={{ color: cn.textSecondary }}>
          <Users className="w-4 h-4" /> {t("staffing")}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t("level"), value: staffLabel },
            { label: t("caregivers"), value: pkg.staffing.caregiver_count || 0 },
            { label: t("nurses"), value: pkg.staffing.nurse_count || 0 },
            {
              label: t("experience"),
              value: pkg.staffing.experience_years
                ? t("yearsPlus", { years: pkg.staffing.experience_years })
                : t("experienceAny"),
            },
          ].map((s) => (
            <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: cn.bgInput }}>
              <p className="text-sm" style={{ color: cn.text }}>
                {s.value}
              </p>
              <p className="text-[10px]" style={{ color: cn.textSecondary }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
        {pkg.staffing.gender_preference && pkg.staffing.gender_preference !== "none" && (
          <p className="text-xs" style={{ color: cn.textSecondary }}>
            {t("genderPreference", { value: pkg.staffing.gender_preference })}
          </p>
        )}
        {pkg.staffing.certifications_required?.length ? (
          <div className="flex flex-wrap gap-1">
            {pkg.staffing.certifications_required.map((c) => (
              <span
                key={c}
                className="px-2 py-0.5 rounded-full text-xs"
                style={{ background: cn.purpleBg, color: cn.purple }}
              >
                {c}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {pkg.schedule && (
        <div className="stat-card p-5 space-y-3">
          <h3 className="text-sm flex items-center gap-2" style={{ color: cn.textSecondary }}>
            <Clock className="w-4 h-4" /> {t("schedule")}
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: t("hoursPerDay"),
                value: `${pkg.schedule.hours_per_day ?? DEFAULT_SCHEDULE_HOURS_PER_DAY}h`,
              },
              {
                label: t("shift"),
                value: pkg.schedule.shift_type || t("shiftDefault"),
              },
              {
                label: t("pattern"),
                value: pkg.schedule.staff_pattern || t("patternDefault"),
              },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: cn.bgInput }}>
                <p className="text-sm" style={{ color: cn.text }}>
                  {s.value}
                </p>
                <p className="text-[10px]" style={{ color: cn.textSecondary }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {allServices.length > 0 && (
        <div className="stat-card p-5 space-y-3">
          <h3 className="text-sm flex items-center gap-2" style={{ color: cn.textSecondary }}>
            <Heart className="w-4 h-4" /> {t("servicesIncluded")}
          </h3>
          {SERVICE_GROUP_ORDER.map((catKey) => {
            const items = allServices.filter((x) => x.catKey === catKey);
            if (!items.length) return null;
            return (
              <div key={catKey}>
                <p className="text-xs mb-1.5" style={{ color: cn.textSecondary }}>
                  {t(`serviceGroups.${catKey}`)}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {items.map(({ s }) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 rounded-full text-xs flex items-center gap-1"
                      style={{ background: cn.greenBg, color: cn.green }}
                    >
                      <CheckCircle2 className="w-3 h-3" /> {s}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pkg.sla && (
        <div className="stat-card p-5 space-y-3">
          <h3 className="text-sm flex items-center gap-2" style={{ color: cn.textSecondary }}>
            <Award className="w-4 h-4" /> {t("sla")}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                pkg.sla.replacement_time_hours != null && {
                  label: t("replacementTime"),
                  value: `${pkg.sla.replacement_time_hours}h`,
                },
                pkg.sla.emergency_response_minutes != null && {
                  label: t("emergencyResponse"),
                  value: `${pkg.sla.emergency_response_minutes} min`,
                },
                pkg.sla.attendance_guarantee_percent != null && {
                  label: t("attendanceGuarantee"),
                  value: `${pkg.sla.attendance_guarantee_percent}%`,
                },
                pkg.sla.reporting_frequency && {
                  label: t("reports"),
                  value: pkg.sla.reporting_frequency,
                },
              ] as ({ label: string; value: string } | false | undefined)[]
            )
              .filter((row): row is { label: string; value: string } => Boolean(row))
              .map((s) => (
                <div key={s.label} className="p-3 rounded-xl" style={{ background: cn.bgInput }}>
                  <p className="text-sm" style={{ color: cn.teal }}>
                    {s.value}
                  </p>
                  <p className="text-[10px]" style={{ color: cn.textSecondary }}>
                    {s.label}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {pkg.compliance && (
          <div className="stat-card p-5 space-y-2">
            <h3 className="text-sm" style={{ color: cn.textSecondary }}>
              {t("compliance")}
            </h3>
            {[
              pkg.compliance.background_verified && t("backgroundVerified"),
              pkg.compliance.medical_fit && t("medicalFit"),
              pkg.compliance.contract_required && t("contractProvided"),
              pkg.compliance.trial_available && t("trialAvailable"),
            ]
              .filter(Boolean)
              .map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs" style={{ color: cn.green }}>
                  <CheckCircle2 className="w-3 h-3" /> {item}
                </div>
              ))}
          </div>
        )}
        {pkg.logistics && (
          <div className="stat-card p-5 space-y-2">
            <h3 className="text-sm" style={{ color: cn.textSecondary }}>
              {t("logistics")}
            </h3>
            {[
              pkg.logistics.location_type && t("logisticsLocation", { type: pkg.logistics.location_type }),
              pkg.logistics.accommodation_provided && t("accommodationProvided"),
              pkg.logistics.food_provided && t("foodProvided"),
              pkg.logistics.travel_distance_km != null &&
                t("serviceRadiusKm", { km: pkg.logistics.travel_distance_km }),
            ]
              .filter(Boolean)
              .map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs" style={{ color: cn.text }}>
                  <Home className="w-3 h-3" style={{ color: cn.textSecondary }} /> {item}
                </div>
              ))}
          </div>
        )}
      </div>

      {(pkg.exclusions?.length || pkg.add_ons?.length) ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pkg.exclusions?.length ? (
            <div className="stat-card p-5 space-y-2">
              <h3 className="text-sm" style={{ color: cn.textSecondary }}>
                {t("exclusions")}
              </h3>
              {pkg.exclusions.map((e) => (
                <div key={e} className="flex items-center gap-2 text-xs" style={{ color: cn.red }}>
                  <AlertTriangle className="w-3 h-3" /> {e}
                </div>
              ))}
            </div>
          ) : null}
          {pkg.add_ons?.length ? (
            <div className="stat-card p-5 space-y-2">
              <h3 className="text-sm" style={{ color: cn.textSecondary }}>
                {t("addOns")}
              </h3>
              {pkg.add_ons.map((a) => (
                <div key={a} className="flex items-center gap-2 text-xs" style={{ color: cn.blue }}>
                  <Zap className="w-3 h-3" /> {a}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {pricing.extra_charges?.length ? (
        <div className="stat-card p-5 space-y-2">
          <h3 className="text-sm" style={{ color: cn.textSecondary }}>
            {t("extraCharges")}
          </h3>
          {pricing.extra_charges.map((c) => (
            <div key={c} className="flex items-center gap-2 text-xs" style={{ color: cn.amber }}>
              <DollarSign className="w-3 h-3" /> {c}
            </div>
          ))}
        </div>
      ) : null}

      {id && activeRole && (
        <PackageEngagementActions packageId={id} activeRole={activeRole} />
      )}

      <div className="stat-card p-5 flex flex-col sm:flex-row gap-3">
        {activeRole !== "caregiver" && (
          <button
            type="button"
            onClick={() => navigate(`${base}/booking?package=${pkg.id}`)}
            className="flex-1 py-3 rounded-xl text-white text-sm cn-touch-target"
            style={{ background: "var(--cn-gradient-guardian)" }}
          >
            {t("subscribeThis")}
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate(`${base}/messages?to=${pkg.agency_id}`)}
          className="flex-1 sm:flex-none px-6 py-3 rounded-xl border text-sm cn-touch-target flex items-center justify-center gap-2"
          style={{ borderColor: cn.border, color: cn.text }}
        >
          <Phone className="w-4 h-4" /> {t("contactAgency")}
        </button>
      </div>
    </div>
  );
}
