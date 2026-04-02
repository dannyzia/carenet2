import { cn } from "@/frontend/theme/tokens";
import { ChevronLeft, CheckCircle2, Clock, Calendar, Building2, Heart, User, Send, Star, MessageSquare, AlertCircle } from "lucide-react";
import { useAsyncData, useDocumentTitle, useCareSeekerBasePath } from "@/frontend/hooks";
import { guardianService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";

const stepsTimeline = [{ label: "Draft", done: true }, { label: "Submitted", done: true }, { label: "Agency Reviewing", done: true, current: false }, { label: "Job Created", done: false }, { label: "Caregiver Assigned", done: false }, { label: "Active Care", done: false }, { label: "Completed", done: false }];

export default function CareRequirementDetailPage() {
  const { id } = useParams();
  const base = useCareSeekerBasePath();
  const { t } = useTranslation("common");
  useDocumentTitle(t("pageTitles.careRequirement", "Care Requirement"));
  const { data: messages, loading } = useAsyncData(() => guardianService.getCareRequirementMessages(id ?? ""));

  if (loading || !messages) return <PageSkeleton cards={3} />;

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-6 pb-8">
        <Link to={`${base}/care-requirements`} className="inline-flex items-center gap-1 text-sm" style={{ color: cn.textSecondary }}><ChevronLeft className="w-4 h-4" /> Back to Requirements</Link>
        <div className="finance-card p-5"><div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(232,168,56,0.12)" }}><Clock className="w-5 h-5" style={{ color: "#E8A838" }} /></div><div><h2 className="text-sm" style={{ color: cn.text }}>{id || "CR-2026-0042"}</h2><span className="px-2 py-0.5 rounded-full text-xs" style={{ background: "rgba(232,168,56,0.12)", color: "#E8A838" }}>Agency Reviewing</span></div></div><div className="flex items-center gap-0 overflow-x-auto pb-2">{stepsTimeline.map((step, i) => (<div key={step.label} className="flex items-center shrink-0"><div className="flex flex-col items-center"><div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step.done ? "text-white" : ""}`} style={{ background: step.done ? cn.green : cn.bgInput, color: step.done ? undefined : cn.textSecondary, border: step.done ? undefined : `1px solid ${cn.border}` }}>{step.done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}</div><span className="text-xs mt-1 whitespace-nowrap" style={{ color: step.done ? cn.green : cn.textSecondary }}>{step.label}</span></div>{i < stepsTimeline.length - 1 && (<div className="w-6 sm:w-10 h-0.5 mx-0.5" style={{ background: step.done ? cn.green : cn.border }} />)}</div>))}</div></div>
        <div className="finance-card p-5 space-y-3"><h3 className="text-sm" style={{ color: cn.text }}>Requirement Summary</h3><div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs" style={{ color: cn.textSecondary }}>Patient</p><p style={{ color: cn.text }}>Mr. Abdul Rahman, 74y</p></div><div><p className="text-xs" style={{ color: cn.textSecondary }}>Condition</p><p style={{ color: cn.text }}>Elderly - Mobility Issues</p></div><div><p className="text-xs" style={{ color: cn.textSecondary }}>Care Type</p><p style={{ color: cn.text }}>Full Day Care</p></div><div><p className="text-xs" style={{ color: cn.textSecondary }}>Duration</p><p style={{ color: cn.text }}>3 Months</p></div><div><p className="text-xs" style={{ color: cn.textSecondary }}>Shift</p><p style={{ color: cn.text }}>Day (8AM-8PM)</p></div><div><p className="text-xs" style={{ color: cn.textSecondary }}>Budget</p><p style={{ color: cn.green }}>\u09F3 2,000 - \u09F3 3,500/day</p></div></div><div><p className="text-xs mb-1" style={{ color: cn.textSecondary }}>Special Requirements</p><p className="text-sm" style={{ color: cn.text }}>Patient needs assistance with daily mobility exercises. Prefers Bangla-speaking caregiver with elderly care experience.</p></div></div>
        <div className="finance-card p-5"><div className="flex items-center gap-2 mb-3"><Building2 className="w-4 h-4" style={{ color: cn.teal }} /><h3 className="text-sm" style={{ color: cn.text }}>Agency Response</h3></div><div className="p-4 rounded-xl text-center" style={{ background: cn.bgInput }}><AlertCircle className="w-8 h-8 mx-auto mb-2" style={{ color: cn.amber }} /><p className="text-sm" style={{ color: cn.text }}>Awaiting agency proposal</p><p className="text-xs mt-1" style={{ color: cn.textSecondary }}>The agency is reviewing your requirement and will send a care plan proposal shortly.</p></div></div>
        <div className="finance-card p-5"><h3 className="text-sm mb-3" style={{ color: cn.text }}>Communication</h3><div className="space-y-3 mb-4">{messages.map((msg, i) => (<div key={i} className={`flex ${msg.from === "guardian" ? "justify-end" : "justify-start"}`}><div className="max-w-[80%] p-3 rounded-xl text-sm" style={{ background: msg.from === "guardian" ? cn.greenBg : cn.bgInput, color: cn.text }}><p className="text-xs mb-1" style={{ color: cn.textSecondary }}>{msg.name}</p><p>{msg.text}</p><p className="text-xs mt-1" style={{ color: cn.textSecondary }}>{msg.time}</p></div></div>))}</div><div className="flex gap-2"><input type="text" placeholder="Type a message..." className="flex-1 px-4 py-2.5 rounded-xl border text-sm" style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }} /><button className="px-4 py-2.5 rounded-xl text-white" style={{ background: "var(--cn-gradient-guardian)" }}><Send className="w-4 h-4" /></button></div></div>
      </div>
    </>
  );
}