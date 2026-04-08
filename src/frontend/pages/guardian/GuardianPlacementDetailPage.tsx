import { Link, useParams } from "react-router";
import { ChevronLeft, Phone, MessageSquare, Star } from "lucide-react";
import { cn } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle, useCareSeekerBasePath } from "@/frontend/hooks";
import { guardianService } from "@/backend/services/guardian.service";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useTranslation } from "react-i18next";
import { formatBDT } from "@/frontend/utils/currency";

const statusBadge: Record<string, { color: string; bg: string }> = {
  completed: { color: "#5FB865", bg: "rgba(95,184,101,0.12)" }, late: { color: "#E8A838", bg: "rgba(232,168,56,0.12)" },
  missed: { color: "#EF4444", bg: "rgba(239,68,68,0.12)" }, replacement: { color: "#7B5EA7", bg: "rgba(123,94,167,0.12)" },
};

export default function GuardianPlacementDetailPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.guardianPlacementDetail", "Guardian Placement Detail"));
  const base = useCareSeekerBasePath();

  const { id } = useParams();
  const { data: detailData, loading } = useAsyncData(() => guardianService.getPlacementDetail(id || ""), [id]);
  const { data: placements, loading: loadingPl } = useAsyncData(() => guardianService.getPlacements());
  const { data: transactions, loading: loadingTx } = useAsyncData(() => guardianService.getTransactions());

  if (loading || loadingPl || loadingTx || !detailData) return <PageSkeleton cards={4} />;

  const { shiftHistory, caregiverTimeline } = detailData;
  const placement = (placements || []).find(p => p.id === id) || (placements || [])[0];
  const txList = transactions || [];
  const totalBilled = txList.reduce((s, tx) => {
    const n = Number(String(tx.amount).replace(/[^\d.-]/g, ""));
    return s + (Number.isFinite(n) ? Math.abs(n) : 0);
  }, 0);
  const paidAmt = txList.filter(tx => tx.status === "paid" || tx.status === "completed").reduce((s, tx) => {
    const n = Number(String(tx.amount).replace(/[^\d.-]/g, ""));
    return s + (Number.isFinite(n) ? Math.abs(n) : 0);
  }, 0);
  const outstanding = Math.max(0, totalBilled - paidAmt);

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-6 pb-8">
        <Link to={`${base}/placements`} className="inline-flex items-center gap-1 text-sm" style={{ color: cn.textSecondary }}><ChevronLeft className="w-4 h-4" /> Back to Placements</Link>
        <div className="finance-card p-5" style={{ borderLeft: `3px solid ${cn.green}` }}>
          <div className="flex items-center justify-between mb-3"><span className="text-sm" style={{ color: cn.text }}>{id || placement?.id || "—"}</span><span className="px-2.5 py-1 rounded-full text-xs" style={{ background: cn.greenBg, color: cn.green }}>{placement?.status || "Active"}</span></div>
          <div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs" style={{ color: cn.textSecondary }}>Patient</p><p style={{ color: cn.text }}>{placement?.patient || "—"}</p></div><div><p className="text-xs" style={{ color: cn.textSecondary }}>Agency</p><p style={{ color: cn.text }}>{placement?.agency || "—"}</p></div><div><p className="text-xs" style={{ color: cn.textSecondary }}>Duration</p><p style={{ color: cn.text }}>{placement ? `${placement.startDate}${placement.endDate ? ` - ${placement.endDate}` : ""}` : "—"}</p></div><div><p className="text-xs" style={{ color: cn.textSecondary }}>Cost to Date</p><p style={{ color: cn.green }}>{formatBDT(totalBilled)}</p></div></div>
        </div>
        <div className="finance-card p-5" style={{ boxShadow: `0 0 0 2px ${cn.greenBg}` }}>
          <h3 className="text-sm mb-3" style={{ color: cn.text }}>Current Shift</h3>
          <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-full flex items-center justify-center text-xs" style={{ background: cn.pinkBg, color: cn.pink }}>{placement?.currentCaregiver ? placement.currentCaregiver.split(" ").map(w => w[0]).join("") : "—"}</div><div className="flex-1"><p className="text-sm" style={{ color: cn.text }}>{placement?.currentCaregiver || "—"}</p><p className="text-xs" style={{ color: cn.textSecondary }}>{placement?.careType || "Care"}</p></div><span className="px-2 py-0.5 rounded-full text-xs animate-pulse" style={{ background: cn.greenBg, color: cn.green }}>{placement?.onDuty ? "On Duty" : "Off Duty"}</span></div>
          <div className="flex gap-2"><button className="flex-1 py-2 rounded-lg text-xs border flex items-center justify-center gap-1" style={{ borderColor: cn.border, color: cn.textSecondary }}><Phone className="w-3 h-3" /> Call</button><button className="flex-1 py-2 rounded-lg text-xs border flex items-center justify-center gap-1" style={{ borderColor: cn.border, color: cn.textSecondary }}><MessageSquare className="w-3 h-3" /> Message</button></div>
        </div>
        <div className="finance-card p-5">
          <h3 className="text-sm mb-3" style={{ color: cn.text }}>Caregiver Rotation Timeline</h3>
          <div className="space-y-2">{caregiverTimeline.map((cg, i) => (<div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: cn.bgInput }}><div className="w-8 h-8 rounded-full flex items-center justify-center text-xs" style={{ background: cn.pinkBg, color: cn.pink }}>{cg.name.split(" ").map((w) => w[0]).join("")}</div><div className="flex-1 min-w-0"><p className="text-sm" style={{ color: cn.text }}>{cg.name}</p><p className="text-xs" style={{ color: cn.textSecondary }}>{cg.dates} | {cg.shifts} shifts</p></div><div className="flex items-center gap-1 text-xs" style={{ color: cn.amber }}><Star className="w-3 h-3" />{cg.rating}</div></div>))}</div>
        </div>
        <div className="finance-card p-5">
          <h3 className="text-sm mb-3" style={{ color: cn.text }}>Recent Shift History</h3>
          <div className="overflow-x-auto"><table className="w-full text-xs min-w-[500px]"><thead><tr style={{ color: cn.textSecondary }}><th className="text-left py-2 px-2">Date</th><th className="text-left py-2 px-2">Caregiver</th><th className="text-left py-2 px-2">Check-in</th><th className="text-left py-2 px-2">Check-out</th><th className="text-left py-2 px-2">Status</th><th className="text-left py-2 px-2">Logs</th></tr></thead><tbody>{shiftHistory.map((s, i) => { const badge = statusBadge[s.status] || statusBadge.completed; return (<tr key={i} style={{ borderTop: `1px solid ${cn.border}` }}><td className="py-2 px-2" style={{ color: cn.text }}>{s.date}</td><td className="py-2 px-2" style={{ color: cn.text }}>{s.caregiver}</td><td className="py-2 px-2" style={{ color: cn.textSecondary }}>{s.checkIn}</td><td className="py-2 px-2" style={{ color: cn.textSecondary }}>{s.checkOut}</td><td className="py-2 px-2"><span className="px-2 py-0.5 rounded-full capitalize" style={{ background: badge.bg, color: badge.color }}>{s.status}</span></td><td className="py-2 px-2" style={{ color: cn.textSecondary }}>{s.logs}</td></tr>); })}</tbody></table></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="finance-card p-4"><h3 className="text-sm mb-2" style={{ color: cn.text }}>Financial Summary</h3><div className="space-y-1.5 text-sm"><div className="flex justify-between"><span style={{ color: cn.textSecondary }}>Total Billed</span><span style={{ color: cn.text }}>{formatBDT(totalBilled)}</span></div><div className="flex justify-between"><span style={{ color: cn.textSecondary }}>Paid</span><span style={{ color: cn.green }}>{formatBDT(paidAmt)}</span></div><div className="flex justify-between"><span style={{ color: cn.textSecondary }}>Outstanding</span><span style={{ color: cn.amber }}>{formatBDT(outstanding)}</span></div></div></div>
          <div className="finance-card p-4 space-y-2"><h3 className="text-sm mb-2" style={{ color: cn.text }}>Actions</h3><button className="w-full py-2 rounded-lg text-xs text-white" style={{ background: "var(--cn-gradient-guardian)" }}>Rate Current Caregiver</button><button className="w-full py-2 rounded-lg text-xs border" style={{ borderColor: cn.amber, color: cn.amber }}>Request Caregiver Change</button><button className="w-full py-2 rounded-lg text-xs border" style={{ borderColor: cn.border, color: cn.textSecondary }}>Report Issue</button></div>
        </div>
      </div>
    </>
  );
}