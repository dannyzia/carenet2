import { cn } from "@/frontend/theme/tokens";
import { Radio, Phone, Eye, AlertTriangle, Clock, CheckCircle2, Users, Bell, Activity } from "lucide-react";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { agencyService } from "@/backend/services/agency.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { useTranslation } from "react-i18next";

const statusColor: Record<string, { color: string; bg: string; border: string; label: string }> = { "on-time": { color: "#5FB865", bg: "rgba(95,184,101,0.12)", border: "#5FB865", label: "On Time" }, "grace": { color: "#E8A838", bg: "rgba(232,168,56,0.12)", border: "#E8A838", label: "Grace Period" }, "late": { color: "#EF4444", bg: "rgba(239,68,68,0.12)", border: "#EF4444", label: "Late" } };

export default function ShiftMonitoringPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.shiftMonitoring", "Shift Monitoring"));

  const { data: monitorData, loading } = useAsyncData(() => agencyService.getShiftMonitoringData());

  if (loading || !monitorData) return <PageSkeleton cards={4} />;

  const { shifts: activeShifts, alerts } = monitorData;

  const onTimeCount = activeShifts.filter(s => s.status === "on-time").length;
  const onTimeRate = activeShifts.length > 0 ? Math.round((onTimeCount / activeShifts.length) * 100) : 0;
  const incidentCount = alerts.filter(a => a.type === "missed").length;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cn.tealBg }}><Radio className="w-5 h-5" style={{ color: cn.teal }} /></div><div><h1 className="text-xl" style={{ color: cn.text }}>Live Shift Monitor</h1><p className="text-sm" style={{ color: cn.textSecondary }}><span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />{activeShifts.length} shifts active now</span></p></div></div></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{[{ label: "On-Time Rate", value: `${onTimeRate}%`, color: cn.green, bg: cn.greenBg, icon: CheckCircle2 }, { label: "Active Shifts", value: String(activeShifts.length), color: cn.teal, bg: cn.tealBg, icon: Users }, { label: "Alerts", value: String(alerts.length), color: cn.blue, bg: cn.blueBg, icon: Clock }, { label: "Incidents Today", value: String(incidentCount), color: cn.amber, bg: cn.amberBg, icon: AlertTriangle }].map((s) => { const Icon = s.icon; return (<div key={s.label} className="stat-card"><Icon className="w-5 h-5 mb-2" style={{ color: s.color }} /><p className="text-lg" style={{ color: s.color }}>{s.value}</p><p className="text-xs" style={{ color: cn.textSecondary }}>{s.label}</p></div>); })}</div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-2 space-y-3"><h2 className="text-sm" style={{ color: cn.text }}>Active Shifts</h2>{activeShifts.map((shift) => { const sc = statusColor[shift.status]; return (<div key={shift.caregiver} className="finance-card p-4 transition-all" style={{ borderLeft: `3px solid ${sc.border}` }}><div className="flex items-start justify-between mb-2"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full flex items-center justify-center text-xs" style={{ background: cn.pinkBg, color: cn.pink }}>{shift.caregiver.split(" ").map(w => w[0]).join("")}</div><div><p className="text-sm" style={{ color: cn.text }}>{shift.caregiver}</p><p className="text-xs" style={{ color: cn.textSecondary }}>{shift.patient} | {shift.time}</p></div></div><span className="px-2 py-0.5 rounded-full text-xs" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span></div><div className="flex items-center justify-between text-xs" style={{ color: cn.textSecondary }}><span>Check-in: {shift.checkedIn}</span><span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Last log: {shift.lastLog}</span></div><div className="flex gap-2 mt-3"><button className="px-3 py-2 rounded-lg text-xs border flex items-center gap-1 shrink-0 cn-touch-target" style={{ borderColor: cn.border, color: cn.textSecondary }}><Phone className="w-3 h-3" /> Call</button><button className="px-3 py-2 rounded-lg text-xs border flex items-center gap-1 shrink-0 cn-touch-target" style={{ borderColor: cn.border, color: cn.textSecondary }}><Eye className="w-3 h-3" /> View Logs</button>{shift.status === "late" && <button className="px-3 py-2 rounded-lg text-xs text-white shrink-0 cn-touch-target" style={{ background: "#EF4444" }}>Assign Replacement</button>}</div></div>); })}</div><div className="hidden lg:block"><h2 className="text-sm mb-3" style={{ color: cn.text }}>Alerts</h2><div className="space-y-3">{alerts.map((alert, i) => (<div key={i} className="finance-card p-4" style={{ borderLeft: `3px solid ${alert.type === "missed" ? "#EF4444" : "#E8A838"}` }}><div className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: alert.type === "missed" ? "#EF4444" : "#E8A838" }} /><div><p className="text-sm" style={{ color: cn.text }}>{alert.text}</p><p className="text-xs mt-1" style={{ color: cn.textSecondary }}>{alert.time}</p></div></div></div>))}</div></div></div>
      </div>
    </>
  );
}