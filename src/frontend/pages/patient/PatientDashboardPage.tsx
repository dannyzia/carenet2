import { cn } from "@/frontend/theme/tokens";
import { Link } from "react-router";
import { Heart, Calendar, FileText, Activity, User, Pill, ClipboardList, Megaphone, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { patientService } from "@/backend/services/patient.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";

export default function PatientDashboardPage() {
  const { t } = useTranslation("common");
  useDocumentTitle(t("pageTitles.patientDashboard", "Dashboard"));

  const { data: vitals, loading: l1 } = useAsyncData(() => patientService.getDashboardVitals());
  const { data: medications, loading: l2 } = useAsyncData(() => patientService.getDashboardMedications());
  const { data: appointments, loading: l3 } = useAsyncData(() => patientService.getAppointments());

  if (l1 || l2 || l3 || !vitals || !medications || !appointments) return <PageSkeleton cards={4} />;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl" style={{ color: cn.text }}>My Health Dashboard</h1>
          <p className="text-sm" style={{ color: cn.textSecondary }}>Welcome back! Here's your health overview.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/patient/care-requirement-wizard"
            className="px-4 py-2 rounded-lg text-sm text-white no-underline"
            style={{ background: "var(--cn-gradient-patient)" }}
          >
            Post care requirement
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "My requirements", icon: ClipboardList, to: "/patient/care-requirements", color: cn.green },
          { label: "Marketplace hub", icon: Megaphone, to: "/patient/marketplace-hub", color: cn.pink },
          { label: "Placements", icon: Shield, to: "/patient/placements", color: "#7B5EA7" },
          { label: "Find care", icon: Heart, to: "/patient/search", color: "#0288D1" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} className="finance-card p-4 flex items-center gap-3 no-underline hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${item.color}18` }}>
                <Icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <span className="text-sm font-medium" style={{ color: cn.text }}>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {vitals.map((v, i) => {
          const Icon = v.label === "Pulse Rate" ? Heart : Activity;
          return (
            <div key={i} className="finance-card p-5">
              <div className="flex items-center gap-2 mb-3"><Icon className="w-4 h-4" style={{ color: v.color }} /><span className="text-xs" style={{ color: cn.textSecondary }}>{v.label}</span></div>
              <div className="flex items-baseline gap-1"><span className="text-2xl" style={{ color: cn.text }}>{v.value}</span><span className="text-xs" style={{ color: cn.textSecondary }}>{v.unit}</span><span className="ml-auto text-xs" style={{ color: v.color }}>{v.trend} {v.status}</span></div>
            </div>
          );
        })}
      </div>

      {/* Medications */}
      <div className="finance-card p-5">
        <div className="flex items-center justify-between mb-4"><h2 className="text-sm" style={{ color: cn.text }}>Today's Medications</h2><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: cn.pinkBg, color: cn.pink }}>{medications.filter(m => m.taken).length}/{medications.length} taken</span></div>
        <div className="space-y-3">
          {medications.map((med, i) => (
            <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: i < medications.length - 1 ? `1px solid ${cn.borderLight}` : "none" }}>
              <span className="text-lg">{"\uD83D\uDC8A"}</span>
              <div className="flex-1"><p className="text-sm" style={{ color: cn.text, textDecoration: med.taken ? "line-through" : "none", opacity: med.taken ? 0.5 : 1 }}>{med.name}</p><p className="text-xs" style={{ color: cn.textSecondary }}>{med.time}</p></div>
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: med.taken ? cn.greenBg : cn.bgInput, color: med.taken ? cn.green : cn.textSecondary }}>{med.taken ? "\u2713" : ""}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Appointments */}
      <div className="finance-card p-5">
        <h2 className="text-sm mb-4" style={{ color: cn.text }}>Upcoming Appointments</h2>
        <div className="space-y-3">
          {appointments.map((apt, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: cn.bgInput }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cn.pinkBg }}><Calendar className="w-5 h-5" style={{ color: cn.pink }} /></div>
              <div className="flex-1"><p className="text-sm" style={{ color: cn.text }}>{apt.doctor} - {apt.type}</p><p className="text-xs" style={{ color: cn.textSecondary }}>{apt.date} at {apt.time} | {apt.location}</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Care History", icon: FileText, to: "/patient/care-history", color: "#DB869A" },
          { label: "Medical Records", icon: Activity, to: "/patient/medical-records", color: "#5FB865" },
          { label: "My Profile", icon: User, to: "/patient/profile", color: "#8B7AE8" },
          { label: "Messages", icon: Heart, to: "/messages", color: "#0288D1" },
        ].map((link, i) => {
          const Icon = link.icon;
          return (
            <Link key={i} to={link.to} className="finance-card p-4 text-center hover:shadow-md transition-all no-underline">
              <Icon className="w-6 h-6 mx-auto mb-2" style={{ color: link.color }} />
              <p className="text-xs" style={{ color: cn.text }}>{link.label}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
