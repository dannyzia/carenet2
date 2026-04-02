import { useState } from "react";
import { cn } from "@/frontend/theme/tokens";
import { Briefcase, Plus, MapPin, Clock, Users, ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { agencyService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";

type JobStatus = "all" | "open" | "in-progress" | "filled" | "closed";

const tabs: { key: JobStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "in-progress", label: "In Progress" },
  { key: "filled", label: "Filled" },
  { key: "closed", label: "Closed" },
];

const statusStyles: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: "Open", color: "#0288D1", bg: "rgba(2,136,209,0.12)" },
  "in-progress": { label: "In Progress", color: "#E8A838", bg: "rgba(232,168,56,0.12)" },
  in_progress: { label: "In Progress", color: "#E8A838", bg: "rgba(232,168,56,0.12)" },
  filled: { label: "Filled", color: "#5FB865", bg: "rgba(95,184,101,0.12)" },
  closed: { label: "Closed", color: "#848484", bg: "rgba(132,132,132,0.12)" },
};

export default function AgencyJobManagementPage() {
  const { t } = useTranslation("common");
  useDocumentTitle(t("pageTitles.jobManagement", "Job Management"));
  const { data: loadedJobs, loading } = useAsyncData(() => agencyService.getJobs());
  const [activeTab, setActiveTab] = useState<JobStatus>("all");

  if (loading || !loadedJobs) return <PageSkeleton cards={4} />;

  const filtered = activeTab === "all" ? loadedJobs : loadedJobs.filter((j) => j.status === activeTab);
  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cn.tealBg }}><Briefcase className="w-5 h-5" style={{ color: cn.teal }} /></div><div><h1 className="text-xl" style={{ color: cn.text }}>Job Management</h1><p className="text-sm" style={{ color: cn.textSecondary }}>Create and manage caregiver job postings</p></div></div><button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm" style={{ background: "var(--cn-gradient-agency)" }}><Plus className="w-4 h-4" /> Create Job</button></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{[{ label: "Open Jobs", value: "3", color: "#0288D1", bg: "rgba(2,136,209,0.12)" }, { label: "Applications (Week)", value: "18", color: cn.amber, bg: cn.amberBg }, { label: "Avg Time to Fill", value: "5.2 days", color: cn.teal, bg: cn.tealBg }, { label: "Fill Rate", value: "84%", color: cn.green, bg: cn.greenBg }].map((s) => (<div key={s.label} className="stat-card"><p className="text-lg" style={{ color: s.color }}>{s.value}</p><p className="text-xs" style={{ color: cn.textSecondary }}>{s.label}</p></div>))}</div>
        <div className="flex gap-1 overflow-x-auto pb-1 cn-scroll-x -mx-1 px-1">{tabs.map((tab) => { const isActive = activeTab === tab.key; const count = tab.key === "all" ? loadedJobs.length : loadedJobs.filter((j) => j.status === tab.key).length; return (<button key={tab.key} onClick={() => setActiveTab(tab.key)} className="px-3 py-2 rounded-lg text-sm whitespace-nowrap flex items-center gap-1.5 cn-no-select" style={{ background: isActive ? cn.tealBg : "transparent", color: isActive ? cn.teal : cn.textSecondary }}>{tab.label} <span className="text-xs opacity-70">({count})</span></button>); })}</div>
        <div className="space-y-3">{filtered.map((job) => { const st = statusStyles[job.status] || { label: job.status || "Unknown", color: "#848484", bg: "rgba(132,132,132,0.12)" }; return (
          <div key={job.id} className="finance-card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2 min-w-0"><span className="text-sm truncate" style={{ color: cn.text }}>{job.id}</span><span className="text-xs px-2 py-0.5 rounded-full shrink-0 hidden sm:inline" style={{ background: cn.bgInput, color: cn.textSecondary }}>Req: {job.reqId}</span></div><span className="px-2.5 py-1 rounded-full text-xs shrink-0" style={{ background: st.bg, color: st.color }}>{st.label}</span></div>
            <h3 className="text-sm mb-2" style={{ color: cn.text }}>{job.careType}</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2 text-xs" style={{ color: cn.textSecondary }}><span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span><span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.shiftType}</span><span style={{ color: cn.green }}>{job.rate}</span></div>
            <div className="flex flex-wrap gap-1.5 mb-3">{job.skills.map((s) => (<span key={s} className="px-2 py-0.5 rounded-full text-xs" style={{ background: cn.purpleBg, color: cn.purple }}>{s}</span>))}<span className="px-2 py-0.5 rounded-full text-xs" style={{ background: cn.bgInput, color: cn.textSecondary }}>{job.experience}</span></div>
            <div className="flex items-center justify-between pt-3 gap-3" style={{ borderTop: `1px solid ${cn.border}` }}><div className="flex items-center gap-3 text-xs min-w-0" style={{ color: cn.textSecondary }}><span className="hidden sm:inline">Posted {job.posted}</span><span className="flex items-center gap-1 shrink-0" style={{ color: job.applications > 0 ? cn.amber : cn.textSecondary }}><Users className="w-3 h-3" />{job.applications} applications</span></div><Link to={`/agency/jobs/${job.id}/applications`} className="px-3 py-2 rounded-lg text-xs text-white flex items-center gap-1 shrink-0 cn-touch-target" style={{ background: "var(--cn-gradient-agency)" }}>{job.applications > 0 ? "View" : "Edit"} <ChevronRight className="w-3 h-3" /></Link></div>
          </div>); })}</div>
      </div>
    </>
  );
}
