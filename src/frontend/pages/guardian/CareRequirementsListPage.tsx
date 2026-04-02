import { cn } from "@/frontend/theme/tokens";
import { Link } from "react-router";
import { ClipboardList, Plus, ChevronRight, MessageSquare, Calendar, Clock, Building2, Heart, Eye } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAsyncData, useDocumentTitle, useCareSeekerBasePath } from "@/frontend/hooks";
import { guardianService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";

type Status = "all" | "draft" | "submitted" | "reviewing" | "job-created" | "active" | "completed" | "cancelled";
const statusStyles: Record<string, { label: string; color: string; bg: string }> = { draft: { label: "Draft", color: "#6B7280", bg: "rgba(107,114,128,0.12)" }, submitted: { label: "Submitted", color: "#0288D1", bg: "rgba(2,136,209,0.12)" }, reviewing: { label: "Agency Reviewing", color: "#E8A838", bg: "rgba(232,168,56,0.12)" }, "job-created": { label: "Job Created", color: "#7B5EA7", bg: "rgba(123,94,167,0.12)" }, active: { label: "Active Care", color: "#5FB865", bg: "rgba(95,184,101,0.12)" }, completed: { label: "Completed", color: "#2E7D32", bg: "rgba(46,125,50,0.12)" }, cancelled: { label: "Cancelled", color: "#EF4444", bg: "rgba(239,68,68,0.12)" } };
const tabs: { key: Status; label: string }[] = [{ key: "all", label: "All" }, { key: "draft", label: "Draft" }, { key: "submitted", label: "Submitted" }, { key: "reviewing", label: "Reviewing" }, { key: "job-created", label: "Job Created" }, { key: "active", label: "Active" }, { key: "completed", label: "Completed" }, { key: "cancelled", label: "Cancelled" }];

export default function CareRequirementsListPage() {
  const { t } = useTranslation("common");
  useDocumentTitle(t("pageTitles.careRequirements", "Care Requirements"));
  const base = useCareSeekerBasePath();
  const [activeTab, setActiveTab] = useState<Status>("all");
  const { data: requirements, loading } = useAsyncData(() => guardianService.getCareRequirements());

  if (loading || !requirements) return <PageSkeleton cards={3} />;

  const filtered = activeTab === "all" ? requirements : requirements.filter((r) => r.status === activeTab);
  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h1 className="text-xl" style={{ color: cn.text }}>My Care Requirements</h1><p className="text-sm" style={{ color: cn.textSecondary }}>Track care requirements submitted to agencies</p></div><Link to={`${base}/care-requirement-wizard`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm" style={{ background: "var(--cn-gradient-guardian)" }}><Plus className="w-4 h-4" /> New Requirement</Link></div>
        <div className="flex gap-1 overflow-x-auto pb-1">{tabs.map((tab) => { const isActive = activeTab === tab.key; return (<button key={tab.key} onClick={() => setActiveTab(tab.key)} className="px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all" style={{ background: isActive ? cn.greenBg : "transparent", color: isActive ? cn.green : cn.textSecondary }}>{tab.label}</button>); })}</div>
        <div className="space-y-3">{filtered.map((req) => { const st = statusStyles[req.status]; return (<div key={req.id} className="finance-card p-4 sm:p-5"><div className="flex items-center justify-between mb-2"><span className="text-sm" style={{ color: cn.text }}>{req.id}</span><span className="px-2.5 py-1 rounded-full text-xs" style={{ background: st.bg, color: st.color }}>{st.label}</span></div><div className="flex flex-wrap gap-x-4 gap-y-1 mb-2 text-xs" style={{ color: cn.textSecondary }}><span className="flex items-center gap-1"><Heart className="w-3 h-3" style={{ color: cn.pink }} />{req.patient}</span><span>{req.careType}</span><span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{req.agency}</span></div><div className="flex flex-wrap gap-x-4 gap-y-1 mb-2 text-xs" style={{ color: cn.textSecondary }}><span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{req.schedule}</span><span style={{ color: cn.green }}>{req.budget}</span></div><p className="text-xs mb-3" style={{ color: cn.textSecondary }}>{req.note}</p><div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${cn.border}` }}><span className="text-xs" style={{ color: cn.textSecondary }}>Submitted {req.submitted}</span><div className="flex gap-2"><Link to={`${base}/care-requirement/${req.id}`} className="px-3 py-1.5 rounded-lg text-xs text-white flex items-center gap-1" style={{ background: "var(--cn-gradient-guardian)" }}>View Details <ChevronRight className="w-3 h-3" /></Link>{req.status === "active" && (<Link to={`${base}/placements`} className="px-3 py-1.5 rounded-lg text-xs border flex items-center gap-1" style={{ borderColor: cn.green, color: cn.green }}><Eye className="w-3 h-3" /> Placement</Link>)}</div></div></div>); })}</div>
      </div>
    </>
  );
}
