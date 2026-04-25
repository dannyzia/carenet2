import { useState } from "react";
import { Link } from "react-router";
import { cn } from "@/frontend/theme/tokens";
import { ChevronLeft, Send, Star, CheckCircle2 } from "lucide-react";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { agencyService } from "@/backend/services/agency.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { useTranslation } from "react-i18next";

export default function AgencyRequirementReviewPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.agencyRequirementReview", "Agency Requirement Review"));

  const { data: caregiverRoster, loading } = useAsyncData(() => agencyService.getCaregiverRoster());
  const [complexity, setComplexity] = useState("moderate");
  const [selectedCaregiver, setSelectedCaregiver] = useState<string | null>(null);
  const [proposedRate, setProposedRate] = useState("75000");
  const [notes, setNotes] = useState("");

  if (loading || !caregiverRoster) return <PageSkeleton cards={3} />;

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-6 pb-20">
        <Link to="/agency/requirements-inbox" className="inline-flex items-center gap-1 text-sm" style={{ color: cn.textSecondary }}><ChevronLeft className="w-4 h-4" /> Back to Inbox</Link>
        <h1 className="text-xl" style={{ color: cn.text }}>Review Requirement: CR-2026-0042</h1>
        <div className="finance-card p-5 space-y-3"><h3 className="text-sm" style={{ color: cn.text }}>Requirement Details</h3><div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs" style={{ color: cn.textSecondary }}>Guardian</p><p className="flex items-center gap-1" style={{ color: cn.text }}>Rashed Hossain <CheckCircle2 className="w-3 h-3" style={{ color: cn.green }} /></p></div><div><p className="text-xs" style={{ color: cn.textSecondary }}>Patient</p><p style={{ color: cn.text }}>Mr. Abdul Rahman, 74y</p></div><div><p className="text-xs" style={{ color: cn.textSecondary }}>Care Type</p><p style={{ color: cn.text }}>Full Day Care</p></div><div><p className="text-xs" style={{ color: cn.textSecondary }}>Duration</p><p style={{ color: cn.text }}>3 Months</p></div><div><p className="text-xs" style={{ color: cn.textSecondary }}>Shift</p><p style={{ color: cn.text }}>Day (8AM-8PM)</p></div><div><p className="text-xs" style={{ color: cn.textSecondary }}>Budget</p><p style={{ color: cn.green }}>৳ 60,000 - ৳ 1,05,000/month</p></div></div><div><p className="text-xs mb-1" style={{ color: cn.textSecondary }}>Special Requirements</p><p className="text-sm" style={{ color: cn.text }}>Patient needs assistance with daily mobility exercises. Prefers Bangla-speaking caregiver.</p></div></div>
        <div className="finance-card p-5 space-y-4"><h3 className="text-sm" style={{ color: cn.text }}>Assessment</h3><div><label className="text-xs mb-1.5 block" style={{ color: cn.textSecondary }}>Complexity Rating</label><div className="flex gap-2">{["simple", "moderate", "complex", "critical"].map((c) => (<button key={c} onClick={() => setComplexity(c)} className="px-3 py-2 rounded-lg text-xs capitalize transition-all" style={{ background: complexity === c ? cn.tealBg : cn.bgInput, color: complexity === c ? cn.teal : cn.textSecondary, border: `1px solid ${complexity === c ? cn.teal : cn.border}` }}>{c}</button>))}</div></div><div><label className="text-xs mb-1.5 block" style={{ color: cn.textSecondary }}>Supervisor Notes</label><textarea rows={3} placeholder="Add assessment notes..." className="w-full px-4 py-3 rounded-xl border text-sm resize-none" style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }} /></div></div>
        <div className="finance-card p-5 space-y-4"><h3 className="text-sm" style={{ color: cn.text }}>Propose Caregiver</h3><div className="space-y-2">{caregiverRoster.map((cg) => (<button key={cg.id} onClick={() => cg.available && setSelectedCaregiver(cg.id)} className="w-full p-3 rounded-xl text-left flex items-center gap-3 transition-all" style={{ background: selectedCaregiver === cg.id ? cn.tealBg : cn.bgInput, border: `1.5px solid ${selectedCaregiver === cg.id ? cn.teal : cn.border}`, opacity: cg.available ? 1 : 0.5 }}><div className="w-9 h-9 rounded-full flex items-center justify-center text-xs" style={{ background: cn.pinkBg, color: cn.pink }}>{cg.name.split(" ").map(w => w[0]).join("")}</div><div className="flex-1"><p className="text-sm" style={{ color: cn.text }}>{cg.name}</p><p className="text-xs" style={{ color: cn.textSecondary }}>{cg.specialty} | {cg.experience} | <Star className="w-3 h-3 inline" style={{ color: cn.amber }} /> {cg.rating}</p></div>{!cg.available && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>Busy</span>}{selectedCaregiver === cg.id && <CheckCircle2 className="w-5 h-5" style={{ color: cn.teal }} />}</button>))}</div></div>
        <div className="finance-card p-5 space-y-4"><h3 className="text-sm" style={{ color: cn.text }}>Proposal Details</h3><div><label className="text-xs mb-1 block" style={{ color: cn.textSecondary }}>Proposed Rate (BDT/month)</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: cn.textSecondary }}>{"\u09F3"}</span><input type="number" value={proposedRate} onChange={(e) => setProposedRate(e.target.value)} className="w-full pl-8 pr-4 py-3 rounded-xl border text-sm" style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }} /></div></div><div><label className="text-xs mb-1.5 block" style={{ color: cn.textSecondary }}>Notes for Guardian</label><textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes about the proposed care plan..." className="w-full px-4 py-3 rounded-xl border text-sm resize-none" style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }} /></div></div>
        <div className="flex gap-3"><button className="flex-1 py-3 rounded-xl text-white text-sm flex items-center justify-center gap-2" style={{ background: "var(--cn-gradient-agency)" }}><Send className="w-4 h-4" /> Send Proposal to Guardian</button><button className="py-3 px-6 rounded-xl text-sm border" style={{ borderColor: "#EF4444", color: "#EF4444" }}>Decline</button></div>
      </div>
    </>
  );
}