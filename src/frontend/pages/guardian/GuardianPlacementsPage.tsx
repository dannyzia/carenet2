import { useState } from "react";
import { cn } from "@/frontend/theme/tokens";
import { Link } from "react-router";
import { Shield, ChevronRight, Calendar, Building2, Heart, User, Clock, MessageSquare, Eye } from "lucide-react";
import { useAsyncData, useDocumentTitle, useCareSeekerBasePath } from "@/frontend/hooks";
import { guardianService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useTranslation } from "react-i18next";

const statusStyles: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#5FB865", bg: "rgba(95,184,101,0.12)" },
  upcoming: { label: "Upcoming", color: "#0288D1", bg: "rgba(2,136,209,0.12)" },
  completed: { label: "Completed", color: "#2E7D32", bg: "rgba(46,125,50,0.12)" },
  cancelled: { label: "Cancelled", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
};

const tabs = [{ key: "all", label: "All" }, { key: "active", label: "Active" }, { key: "upcoming", label: "Upcoming" }, { key: "completed", label: "Completed" }, { key: "cancelled", label: "Cancelled" }];

export default function GuardianPlacementsPage() {
  const { t: tDocTitle } = useTranslation("common");
  const base = useCareSeekerBasePath();
  useDocumentTitle(tDocTitle("pageTitles.guardianPlacements", "Guardian Placements"));

  const [activeTab, setActiveTab] = useState("all");
  const { data: placements, loading } = useAsyncData(() => guardianService.getPlacements());

  if (loading || !placements) return <PageSkeleton cards={3} />;

  const filtered = activeTab === "all" ? placements : placements.filter((p) => p.status === activeTab);

  return (
    <>
      <div className="space-y-6">
        <div><h1 className="text-xl" style={{ color: cn.text }}>My Placements</h1><p className="text-sm" style={{ color: cn.textSecondary }}>Active care contracts with agencies</p></div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {tabs.map((tab) => { const isActive = activeTab === tab.key; return (<button key={tab.key} onClick={() => setActiveTab(tab.key)} className="px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all" style={{ background: isActive ? cn.greenBg : "transparent", color: isActive ? cn.green : cn.textSecondary }}>{tab.label}</button>); })}
        </div>
        <div className="space-y-3">
          {filtered.map((pl) => {
            const st = statusStyles[pl.status]; const pct = pl.shiftsTotal > 0 ? (pl.shiftsCompleted / pl.shiftsTotal) * 100 : 0;
            return (
              <div key={pl.id} className="finance-card p-4 sm:p-5" style={{ borderLeft: pl.status === "active" ? `3px solid ${cn.green}` : undefined }}>
                <div className="flex items-center justify-between mb-2"><span className="text-sm" style={{ color: cn.text }}>{pl.id}</span><span className="px-2.5 py-1 rounded-full text-xs" style={{ background: st.bg, color: st.color }}>{st.label}</span></div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2 text-xs" style={{ color: cn.textSecondary }}><span className="flex items-center gap-1"><Heart className="w-3 h-3" style={{ color: cn.pink }} />{pl.patient}</span><span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{pl.agency}</span></div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-xs" style={{ color: cn.textSecondary }}><span>{pl.careType}</span><span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{pl.startDate} - {pl.endDate}</span></div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ background: cn.pinkBg, color: cn.pink }}>{pl.currentCaregiver.split(" ").map((w) => w[0]).join("")}</div>
                  <span className="text-sm" style={{ color: cn.text }}>{pl.currentCaregiver}</span>
                  {pl.onDuty && <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: cn.greenBg, color: cn.green }}>On Duty</span>}
                  {!pl.onDuty && pl.status === "upcoming" && <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: cn.blueBg, color: cn.blue }}>Upcoming</span>}
                </div>
                <div className="mb-3"><div className="flex justify-between text-xs mb-1" style={{ color: cn.textSecondary }}><span>Shifts: {pl.shiftsCompleted} / {pl.shiftsTotal}</span><span>{Math.round(pct)}%</span></div><div className="w-full h-1.5 rounded-full" style={{ background: cn.bgInput }}><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cn.green }} /></div></div>
                <div className="flex items-center gap-2 pt-3" style={{ borderTop: `1px solid ${cn.border}` }}>
                  <Link to={`${base}/placement/${pl.id}`} className="px-3 py-1.5 rounded-lg text-xs text-white flex items-center gap-1" style={{ background: "var(--cn-gradient-guardian)" }}>View Details <ChevronRight className="w-3 h-3" /></Link>
                  <button className="px-3 py-1.5 rounded-lg text-xs border flex items-center gap-1" style={{ borderColor: cn.border, color: cn.textSecondary }}><MessageSquare className="w-3 h-3" /> Message Agency</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}