import { useState } from "react";
import { Link } from "react-router";
import { cn } from "@/frontend/theme/tokens";
import { Shield, ChevronRight, Plus, Calendar, User, Heart, Clock, Users, AlertTriangle } from "lucide-react";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { agencyService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useTranslation } from "react-i18next";

const statusStyles: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#5FB865", bg: "rgba(95,184,101,0.12)" },
  upcoming: { label: "Upcoming", color: "#0288D1", bg: "rgba(2,136,209,0.12)" },
  completed: { label: "Completed", color: "#2E7D32", bg: "rgba(46,125,50,0.12)" },
  cancelled: { label: "Cancelled", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
};
const tabs = [{ key: "all", label: "All" }, { key: "active", label: "Active" }, { key: "upcoming", label: "Upcoming" }, { key: "completed", label: "Completed" }, { key: "cancelled", label: "Cancelled" }];

export default function AgencyPlacementsPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.agencyPlacements", "Agency Placements"));

  const { data: placements, loading } = useAsyncData(() => agencyService.getPlacements());
  const [activeTab, setActiveTab] = useState("all");

  if (loading || !placements) return <PageSkeleton cards={4} />;

  const filtered = activeTab === "all" ? placements : placements.filter(p => p.status === activeTab);

  const activePlacements = placements.filter(p => p.status === "active").length;
  const uniqueCaregivers = new Set(placements.map(p => p.caregiver)).size;
  const shiftsThisWeek = placements.filter(p => p.status === "active").length * 6;
  const utilization = placements.length > 0 ? Math.round((activePlacements / placements.length) * 100) : 0;
  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h1 className="text-xl" style={{ color: cn.text }}>Placements</h1><p className="text-sm" style={{ color: cn.textSecondary }}>Manage active care contracts and caregiver assignments</p></div><button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm" style={{ background: "var(--cn-gradient-agency)" }}><Plus className="w-4 h-4" /> Create Placement</button></div>
        <div className="grid grid-cols-4 gap-4">{[{ label: "Active", value: String(activePlacements), color: cn.green, bg: cn.greenBg }, { label: "Caregivers", value: String(uniqueCaregivers), color: cn.teal, bg: cn.tealBg }, { label: "Shifts This Week", value: String(shiftsThisWeek), color: cn.blue, bg: cn.blueBg }, { label: "Utilization", value: `${utilization}%`, color: cn.amber, bg: cn.amberBg }].map((s) => (<div key={s.label} className="stat-card"><p className="text-lg" style={{ color: s.color }}>{s.value}</p><p className="text-xs" style={{ color: cn.textSecondary }}>{s.label}</p></div>))}</div>
        <div className="flex gap-1 overflow-x-auto pb-1">{tabs.map((tab) => (<button key={tab.key} onClick={() => setActiveTab(tab.key)} className="px-3 py-2 rounded-lg text-sm whitespace-nowrap" style={{ background: activeTab === tab.key ? cn.tealBg : "transparent", color: activeTab === tab.key ? cn.teal : cn.textSecondary }}>{tab.label}</button>))}</div>
        <div className="finance-card overflow-x-auto"><table className="w-full text-sm min-w-[600px]"><thead><tr style={{ color: cn.textSecondary, borderBottom: `1px solid ${cn.border}` }}><th className="text-left py-3 px-4">ID</th><th className="text-left py-3 px-4">Patient</th><th className="text-left py-3 px-4">Guardian</th><th className="text-left py-3 px-4">Caregiver</th><th className="text-left py-3 px-4">Type</th><th className="text-left py-3 px-4">Status</th><th className="text-left py-3 px-4">Actions</th></tr></thead><tbody>{filtered.map((pl) => { const st = statusStyles[pl.status]; return (<tr key={pl.id} style={{ borderBottom: `1px solid ${cn.border}` }}><td className="py-3 px-4" style={{ color: cn.text }}>{pl.id}</td><td className="py-3 px-4" style={{ color: cn.text }}>{pl.patient}</td><td className="py-3 px-4" style={{ color: cn.textSecondary }}>{pl.guardian}</td><td className="py-3 px-4" style={{ color: cn.text }}>{pl.caregiver}</td><td className="py-3 px-4" style={{ color: cn.textSecondary }}>{pl.careType}</td><td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-xs" style={{ background: st.bg, color: st.color }}>{st.label}</span></td><td className="py-3 px-4"><Link to={`/agency/placements/${pl.id}`} className="text-xs flex items-center gap-1" style={{ color: cn.teal }}>View <ChevronRight className="w-3 h-3" /></Link></td></tr>); })}</tbody></table></div>
      </div>
    </>
  );
}