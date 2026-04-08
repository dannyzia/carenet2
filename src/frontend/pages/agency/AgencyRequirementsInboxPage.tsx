import React, { useState } from "react";
import { Inbox, Clock, CheckCircle2, Send, XCircle, MessageSquare, AlertCircle, User, MapPin, Calendar, Heart, Filter, ChevronRight, Star, TrendingUp, Timer, Eye } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { agencyService } from "@/backend/services/agency.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";

type RequirementStatus = "new" | "under-review" | "proposal-sent" | "accepted" | "declined";
interface Requirement { id: string; guardianName: string; guardianVerified: boolean; guardianPlacements: number; patientName: string; patientAge: number; patientCondition: string; careType: string; duration: string; shiftPreference: string; budgetMin: number; budgetMax: number; location: string; specialRequirements: string; submittedDate: string; submittedAgo: string; responseDeadline: string; status: RequirementStatus; priority: "normal" | "urgent"; isNew: boolean; }
const statusConfig: Record<RequirementStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  "new": { label: "New", color: "#0288D1", bg: "rgba(2,136,209,0.12)", icon: Inbox },
  "under-review": { label: "Under Review", color: "#E8A838", bg: "rgba(232,168,56,0.12)", icon: Eye },
  "proposal-sent": { label: "Proposal Sent", color: "#7B5EA7", bg: "rgba(123,94,167,0.12)", icon: Send },
  "accepted": { label: "Accepted", color: "#5FB865", bg: "rgba(95,184,101,0.12)", icon: CheckCircle2 },
  "declined": { label: "Declined", color: "#EF4444", bg: "rgba(239,68,68,0.12)", icon: XCircle },
};
const tabs: { key: RequirementStatus | "all"; label: string }[] = [{ key: "all", label: "All" }, { key: "new", label: "New" }, { key: "under-review", label: "Under Review" }, { key: "proposal-sent", label: "Proposal Sent" }, { key: "accepted", label: "Accepted" }, { key: "declined", label: "Declined" }];

export default function AgencyRequirementsInboxPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("common");
  useDocumentTitle(t("pageTitles.requirementsInbox", "Requirements Inbox"));
  const [activeTab, setActiveTab] = useState<RequirementStatus | "all">("all");
  const { data: requirements, loading } = useAsyncData(() => agencyService.getRequirementsInbox());

  if (loading || !requirements) return <PageSkeleton />;

  const filtered = activeTab === "all" ? requirements : requirements.filter((r) => r.status === activeTab);
  const newCount = requirements.filter((r) => r.status === "new").length;
  const parseAgoHours = (value: string): number | null => {
    const h = value.match(/(\d+)\s*hour/i);
    if (h) return Number(h[1]);
    const d = value.match(/(\d+)\s*day/i);
    if (d) return Number(d[1]) * 24;
    return null;
  };
  const responded = requirements.filter((r) => r.status !== "new");
  const responseSamples = responded
    .map((r) => parseAgoHours(r.submittedAgo))
    .filter((v): v is number => v !== null);
  const avgResponseHours = responseSamples.length > 0
    ? Math.round((responseSamples.reduce((sum, h) => sum + h, 0) / responseSamples.length) * 10) / 10
    : 0;
  const outcomeCount = requirements.filter((r) => r.status === "accepted" || r.status === "declined").length;
  const acceptedCount = requirements.filter((r) => r.status === "accepted").length;
  const conversionRate = outcomeCount > 0 ? Math.round((acceptedCount / outcomeCount) * 100) : 0;
  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cn.tealBg }}><Inbox className="w-5 h-5" style={{ color: cn.teal }} /></div><div><div className="flex items-center gap-2"><h1 className="text-xl" style={{ color: cn.text }}>Requirements Inbox</h1>{newCount > 0 && <span className="px-2 py-0.5 rounded-full text-xs text-white" style={{ background: "#0288D1" }}>{newCount} new</span>}</div><p className="text-sm" style={{ color: cn.textSecondary }}>Review and respond to guardian care requirements</p></div></div></div>
        <div className="grid grid-cols-3 gap-4">{[
          { label: "New This Week", value: String(newCount), icon: Inbox, color: "#0288D1", bg: "rgba(2,136,209,0.12)" },
          { label: "Avg Response", value: `${avgResponseHours} hrs`, icon: Timer, color: cn.teal, bg: cn.tealBg },
          { label: "Conversion Rate", value: `${conversionRate}%`, icon: TrendingUp, color: cn.green, bg: cn.greenBg },
        ].map((s) => { const Icon = s.icon; return (<div key={s.label} className="stat-card"><div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2" style={{ background: s.bg }}><Icon className="w-4 h-4" style={{ color: s.color }} /></div><p className="text-lg" style={{ color: cn.text }}>{s.value}</p><p className="text-xs" style={{ color: cn.textSecondary }}>{s.label}</p></div>); })}</div>
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">{tabs.map((tab) => { const isActive = activeTab === tab.key; const count = tab.key === "all" ? requirements.length : requirements.filter((r) => r.status === tab.key).length; return (<button key={tab.key} onClick={() => setActiveTab(tab.key)} className="px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all flex items-center gap-1.5" style={{ background: isActive ? cn.tealBg : "transparent", color: isActive ? cn.teal : cn.textSecondary }}>{tab.label}<span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: isActive ? `${cn.teal}20` : `${cn.textSecondary}15` }}>{count}</span></button>); })}</div>
        <div className="space-y-3">{filtered.map((req) => { const statusCfg = statusConfig[req.status]; const StatusIcon = statusCfg.icon; return (
          <div key={req.id} className="finance-card p-4 sm:p-5 transition-all hover:shadow-md" style={{ borderLeft: req.priority === "urgent" ? "3px solid #EF4444" : req.isNew ? "3px solid #0288D1" : undefined }}>
            <div className="flex items-center justify-between gap-2 mb-3"><div className="flex items-center gap-2"><span className="text-sm" style={{ color: cn.text }}>{req.id}</span>{req.isNew && <span className="px-2 py-0.5 rounded-full text-xs text-white" style={{ background: "#0288D1" }}>New</span>}{req.priority === "urgent" && <span className="px-2 py-0.5 rounded-full text-xs text-white" style={{ background: "#EF4444" }}><AlertCircle className="w-3 h-3 inline mr-0.5" />Urgent</span>}</div><span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs" style={{ background: statusCfg.bg, color: statusCfg.color }}><StatusIcon className="w-3 h-3" />{statusCfg.label}</span></div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mb-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full flex items-center justify-center text-xs" style={{ background: cn.greenBg, color: cn.green }}>{req.guardianName.split(" ").map(w => w[0]).join("").slice(0,2)}</div><div><div className="flex items-center gap-1"><span className="text-sm" style={{ color: cn.text }}>{req.guardianName}</span>{req.guardianVerified && <CheckCircle2 className="w-3 h-3" style={{ color: cn.green }} />}</div><span className="text-xs" style={{ color: cn.textSecondary }}>{req.guardianPlacements} previous placement{req.guardianPlacements !== 1 ? "s" : ""}</span></div></div><div className="flex items-center gap-2 text-xs" style={{ color: cn.textSecondary }}><Heart className="w-3 h-3" style={{ color: cn.pink }} /><span>{req.patientName}, {req.patientAge}y</span></div></div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3 text-xs" style={{ color: cn.textSecondary }}><span className="flex items-center gap-1"><Heart className="w-3 h-3" style={{ color: cn.teal }} />{req.careType}</span><span className="flex items-center gap-1"><Clock className="w-3 h-3" />{req.duration}</span><span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{req.shiftPreference}</span><span className="flex items-center gap-1" style={{ color: cn.green }}>{"\u09F3"} {req.budgetMin.toLocaleString()} - {"\u09F3"} {req.budgetMax.toLocaleString()}/day</span></div>
            <div className="mb-3"><div className="flex items-center gap-1 text-xs mb-1" style={{ color: cn.textSecondary }}><MapPin className="w-3 h-3" />{req.location}</div><p className="text-xs line-clamp-2" style={{ color: cn.textSecondary }}>{req.specialRequirements}</p></div>
            <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${cn.border}` }}><div className="flex items-center gap-3 text-xs" style={{ color: cn.textSecondary }}><span>Submitted {req.submittedAgo}</span>{req.status === "new" && <span className="flex items-center gap-1" style={{ color: "#E8A838" }}><Timer className="w-3 h-3" />{req.responseDeadline}</span>}</div><div className="flex items-center gap-2"><Link to={`/agency/requirement-review/${req.id}`} className="px-3 py-1.5 rounded-lg text-xs text-white flex items-center gap-1" style={{ background: "var(--cn-gradient-agency)" }}>{req.status === "new" ? "Review & Respond" : "View Details"}<ChevronRight className="w-3 h-3" /></Link>{(req.status === "new" || req.status === "under-review") && <Link to={`/agency/messages?requirement=${req.id}`} className="px-3 py-1.5 rounded-lg text-xs border flex items-center gap-1 no-underline cn-touch-target" style={{ borderColor: cn.border, color: cn.textSecondary }}><MessageSquare className="w-3 h-3" /> Message</Link>}</div></div>
          </div>); })}{filtered.length === 0 && <div className="finance-card p-12 text-center"><Inbox className="w-12 h-12 mx-auto mb-3" style={{ color: cn.textSecondary }} /><p className="text-sm" style={{ color: cn.textSecondary }}>No requirements found</p></div>}
        </div>
      </div>
    </>
  );
}