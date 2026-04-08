import { Link, useParams } from "react-router";
import { cn } from "@/frontend/theme/tokens";
import { ChevronLeft, User, Calendar, Clock, Users, Star, Plus, CreditCard, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { agencyService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useTranslation } from "react-i18next";

const statusColor: Record<string, { color: string; bg: string }> = { completed: { color: "#5FB865", bg: "rgba(95,184,101,0.12)" }, scheduled: { color: "#0288D1", bg: "rgba(2,136,209,0.12)" }, unassigned: { color: "#EF4444", bg: "rgba(239,68,68,0.12)" } };

export default function AgencyPlacementDetailPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.agencyPlacementDetail", "Agency Placement Detail"));

  const { id } = useParams();
  const { data: shifts, loading } = useAsyncData(() => agencyService.getPlacementShifts(id ?? ""));

  if (loading || !shifts) return <PageSkeleton cards={3} />;

  // Derive assigned caregivers from shift data
  const caregiverShiftMap = shifts
    .filter(s => s.caregiver)
    .reduce<Record<string, { shifts: number; isPrimary: boolean }>>((acc, s) => {
      acc[s.caregiver] = acc[s.caregiver]
        ? { ...acc[s.caregiver], shifts: acc[s.caregiver].shifts + 1 }
        : { shifts: 1, isPrimary: false };
      return acc;
    }, {});
  const sortedCaregivers = Object.entries(caregiverShiftMap)
    .sort(([, a], [, b]) => b.shifts - a.shifts)
    .map(([name, info], i) => ({ name, shifts: info.shifts, status: i === 0 ? "Primary" : "Backup" }));

  // Derive financial summary from shifts
  const completedShifts = shifts.filter(s => s.status === "completed").length;
  const ratePerShift = 1200;
  const agencyMarginRate = 0.27;
  const totalBilled = completedShifts * Math.round(ratePerShift / (1 - agencyMarginRate));
  const totalPaid = completedShifts * ratePerShift;
  const agencyMargin = totalBilled - totalPaid;

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-6 pb-8">
        <Link to="/agency/placements" className="inline-flex items-center gap-1 text-sm" style={{ color: cn.textSecondary }}><ChevronLeft className="w-4 h-4" /> Back to Placements</Link>
        <div className="finance-card p-5" style={{ borderLeft: `3px solid ${cn.teal}` }}><div className="flex items-center justify-between mb-3"><h1 className="text-lg" style={{ color: cn.text }}>{id || "PL-2026-0018"}</h1><span className="px-2.5 py-1 rounded-full text-xs" style={{ background: cn.greenBg, color: cn.green }}>Active</span></div><div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm"><div><p className="text-xs" style={{ color: cn.textSecondary }}>Patient</p><p style={{ color: cn.text }}>Mr. Abdul Rahman, 74y</p></div><div><p className="text-xs" style={{ color: cn.textSecondary }}>Guardian</p><p style={{ color: cn.text }}>Rashed Hossain</p></div><div><p className="text-xs" style={{ color: cn.textSecondary }}>Duration</p><p style={{ color: cn.text }}>Jan 10 - Mar 10</p></div></div></div>
        <div className="finance-card p-5"><div className="flex items-center justify-between mb-4"><h3 className="text-sm" style={{ color: cn.text }}>Shift Planner — This Week</h3><button className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ background: cn.tealBg, color: cn.teal }}><Plus className="w-3 h-3" /> Add Shift</button></div><div className="space-y-2">{shifts.map((s) => { const sc = statusColor[s.status] || statusColor.scheduled; return (<div key={s.day} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: cn.bgInput }}><span className="w-10 text-sm" style={{ color: cn.text }}>{s.day}</span><div className="flex-1">{s.caregiver ? <span className="text-sm" style={{ color: cn.text }}>{s.caregiver}</span> : <span className="text-sm flex items-center gap-1" style={{ color: "#EF4444" }}><AlertTriangle className="w-3 h-3" /> Unassigned</span>}<p className="text-xs" style={{ color: cn.textSecondary }}>{s.time}</p></div><span className="px-2 py-0.5 rounded-full text-xs capitalize" style={{ background: sc.bg, color: sc.color }}>{s.status}</span></div>); })}</div></div>
        <div className="finance-card p-5"><h3 className="text-sm mb-3" style={{ color: cn.text }}>Assigned Caregivers</h3><div className="space-y-2">{sortedCaregivers.length > 0 ? sortedCaregivers.map((cg) => (<div key={cg.name} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: cn.bgInput }}><div className="w-8 h-8 rounded-full flex items-center justify-center text-xs" style={{ background: cn.pinkBg, color: cn.pink }}>{cg.name.split(" ").map((w: string) => w[0]).join("")}</div><div className="flex-1"><p className="text-sm" style={{ color: cn.text }}>{cg.name}</p><p className="text-xs" style={{ color: cn.textSecondary }}>{cg.shifts} shifts</p></div><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: cg.status === "Primary" ? cn.tealBg : cn.amberBg, color: cg.status === "Primary" ? cn.teal : cn.amber }}>{cg.status}</span></div>)) : <p className="text-xs text-center py-3" style={{ color: cn.textSecondary }}>No caregivers assigned yet</p>}<button className="w-full p-3 rounded-xl border-2 border-dashed text-sm flex items-center justify-center gap-2" style={{ borderColor: cn.border, color: cn.textSecondary }}><Plus className="w-4 h-4" /> Assign New Caregiver</button></div></div>
        <div className="finance-card p-5"><h3 className="text-sm mb-3" style={{ color: cn.text }}>Financial Summary</h3><div className="grid grid-cols-3 gap-4 text-center"><div><p className="text-xs" style={{ color: cn.textSecondary }}>Billed to Guardian</p><p className="text-lg" style={{ color: cn.text }}>{"\u09F3"} {totalBilled.toLocaleString()}</p></div><div><p className="text-xs" style={{ color: cn.textSecondary }}>Paid to Caregivers</p><p className="text-lg" style={{ color: cn.pink }}>{"\u09F3"} {totalPaid.toLocaleString()}</p></div><div><p className="text-xs" style={{ color: cn.textSecondary }}>Agency Margin</p><p className="text-lg" style={{ color: cn.green }}>{"\u09F3"} {agencyMargin.toLocaleString()}</p></div></div></div>
      </div>
    </>
  );
}