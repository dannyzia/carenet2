import { cn } from "@/frontend/theme/tokens";
import { Link } from "react-router";
import { Heart, Calendar, FileText, Activity, User, ClipboardList, Megaphone, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { patientService } from "@/backend/services/patient.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";

export default function PatientDashboardPage() {
  const { t } = useTranslation(["dashboard", "common"]);
  useDocumentTitle(t("common:pageTitles.patientDashboard", "Dashboard"));

  const { data: vitals, loading: l1 } = useAsyncData(() => patientService.getDashboardVitals());
  const { data: medications, loading: l2 } = useAsyncData(() => patientService.getDashboardMedications());
  const { data: appointments, loading: l3 } = useAsyncData(() => patientService.getAppointments());

  if (l1 || l2 || l3 || !vitals || !medications || !appointments) return <PageSkeleton cards={4} />;

  const vitalLabel = (v: (typeof vitals)[0]) =>
    v.vitalKey ? t(`dashboard:patient.vitals.${v.vitalKey}`) : v.label;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl" style={{ color: cn.text }}>{t("dashboard:patient.title")}</h1>
          <p className="text-sm" style={{ color: cn.textSecondary }}>{t("dashboard:patient.welcomeBack")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/patient/care-requirement-wizard"
            className="px-4 py-2 rounded-lg text-sm text-white no-underline cn-touch-target focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)]"
            style={{ background: "var(--cn-gradient-patient)" }}
          >
            {t("dashboard:patient.postCareRequirement")}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { labelKey: "dashboard:patient.myRequirements", icon: ClipboardList, to: "/patient/care-requirements", color: cn.green },
          { labelKey: "dashboard:patient.marketplaceHub", icon: Megaphone, to: "/patient/marketplace-hub", color: cn.pink },
          { labelKey: "dashboard:patient.placements", icon: Shield, to: "/patient/placements", color: cn.purple },
          { labelKey: "dashboard:patient.findCare", icon: Heart, to: "/patient/search", color: cn.blue },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="cn-card-flat p-4 flex items-center gap-3 no-underline hover:shadow-md transition-shadow cn-touch-target focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)]"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${item.color}18` }}>
                <Icon className="w-5 h-5" style={{ color: item.color }} aria-hidden />
              </div>
              <span className="text-sm font-medium" style={{ color: cn.text }}>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {vitals.map((v, i) => {
          const Icon = v.label === "Pulse Rate" || v.vitalKey === "pulseRate" ? Heart : Activity;
          const label = vitalLabel(v);
          return (
            <Link
              key={i}
              to="/patient/medical-records"
              className="cn-card-flat p-5 block no-underline hover:shadow-md cn-touch-target focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)]"
              aria-label={t("dashboard:patient.vitalsAria", { label })}
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4" style={{ color: v.color }} aria-hidden />
                <span className="text-xs" style={{ color: cn.textSecondary }}>{label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl" style={{ color: cn.text }}>{v.value}</span>
                <span className="text-xs" style={{ color: cn.textSecondary }}>{v.unit}</span>
                <span className="ml-auto text-xs" style={{ color: v.color }}>{v.trend} {v.status}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <Link
        to="/patient/care-history"
        className="cn-card-flat p-5 block no-underline hover:shadow-md cn-touch-target focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)]"
        aria-label={t("dashboard:patient.medicationsAria")}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm" style={{ color: cn.text }}>{t("dashboard:patient.todayMedications")}</h2>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: cn.pinkBg, color: cn.pink }}>
            {t("dashboard:patient.takenCount", { taken: medications.filter((m) => m.taken).length, total: medications.length })}
          </span>
        </div>
        <div className="space-y-3">
          {medications.map((med, i) => (
            <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: i < medications.length - 1 ? `1px solid ${cn.borderLight}` : "none" }}>
              <span className="text-lg" aria-hidden>{"\uD83D\uDC8A"}</span>
              <div className="flex-1">
                <p className="text-sm" style={{ color: cn.text, textDecoration: med.taken ? "line-through" : "none", opacity: med.taken ? 0.5 : 1 }}>{med.name}</p>
                <p className="text-xs" style={{ color: cn.textSecondary }}>{med.time}</p>
              </div>
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: med.taken ? cn.greenBg : cn.bgInput, color: med.taken ? cn.green : cn.textSecondary }}>{med.taken ? "\u2713" : ""}</div>
            </div>
          ))}
        </div>
      </Link>

      <Link
        to="/patient/care-history"
        className="cn-card-flat p-5 block no-underline hover:shadow-md cn-touch-target focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)]"
        aria-label={t("dashboard:patient.appointmentsAria")}
      >
        <h2 className="text-sm mb-4" style={{ color: cn.text }}>{t("dashboard:patient.upcomingAppointments")}</h2>
        <div className="space-y-3">
          {appointments.map((apt, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: cn.bgInput }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cn.pinkBg }}>
                <Calendar className="w-5 h-5" style={{ color: cn.pink }} aria-hidden />
              </div>
              <div className="flex-1">
                <p className="text-sm" style={{ color: cn.text }}>{apt.doctor} - {apt.type}</p>
                <p className="text-xs" style={{ color: cn.textSecondary }}>{apt.date} at {apt.time} | {apt.location}</p>
              </div>
            </div>
          ))}
        </div>
      </Link>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { labelKey: "dashboard:patient.careHistory", icon: FileText, to: "/patient/care-history", color: "#DB869A" },
          { labelKey: "dashboard:patient.medicalRecords", icon: Activity, to: "/patient/medical-records", color: "#5FB865" },
          { labelKey: "dashboard:patient.myProfile", icon: User, to: "/patient/profile", color: "#8B7AE8" },
          { labelKey: "dashboard:patient.messages", icon: Heart, to: "/messages", color: "#0288D1" },
        ].map((link, i) => {
          const Icon = link.icon;
          return (
            <Link
              key={i}
              to={link.to}
              className="cn-card-flat p-4 text-center hover:shadow-md transition-all no-underline cn-touch-target focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)]"
            >
              <Icon className="w-6 h-6 mx-auto mb-2" style={{ color: link.color }} aria-hidden />
              <p className="text-xs" style={{ color: cn.text }}>{t(link.labelKey)}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
