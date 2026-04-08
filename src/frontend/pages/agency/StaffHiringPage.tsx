"use client";
import React from "react";
import { Users, Search, Filter, UserCheck, CheckCircle2, XCircle, Clock, Briefcase, ArrowLeft, ChevronRight, ShieldCheck, Award, Plus } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { agencyService } from "@/backend/services/agency.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { cn } from "@/frontend/theme/tokens";
import { PageHero } from "@/frontend/components/shared/PageHero";
import { useTranslation } from "react-i18next";

export default function StaffHiringPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.staffHiring", "Staff Hiring"));

  const { data: hiringData, loading } = useAsyncData(() => agencyService.getStaffHiringData());

  if (loading || !hiringData) return <PageSkeleton />;

  const totalApplicants = hiringData.openPositions.reduce((s, p) => s + p.applicants, 0);
  const interviewCount = hiringData.recentApplicants.filter(a => a.status === "interview").length;
  const vettingCount = hiringData.recentApplicants.filter(a => a.status === "screening" || a.status === "new").length;
  const statusLabel: Record<string, string> = { interview: "Interviewing", screening: "Vetting", new: "Screening" };

  return (
    <div>
      <PageHero gradient="radial-gradient(143.86% 887.35% at -10.97% -22.81%, #1F2937 0%, #111827 100%)" className="pt-8 pb-32 px-6"><div className="max-w-5xl mx-auto"><div className="flex justify-between items-center mb-8"><h1 className="text-2xl font-bold text-white">Staff Recruitment</h1><div className="flex gap-2"><Button className="bg-[#8EC5FC] hover:bg-[#5B9FFF] text-white font-bold rounded-xl h-12 px-6 shadow-lg"><UserCheck className="w-4 h-4 mr-2" /> Invite Supervisor</Button><Button className="bg-[#FEB4C5] hover:bg-[#DB869A] text-white font-bold rounded-xl h-12 px-6 shadow-lg"><Plus className="w-4 h-4 mr-2" /> Post New Opening</Button></div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6">{[{ label: "New Applications", val: String(totalApplicants) }, { label: "Interview Stage", val: String(interviewCount) }, { label: "Vetting Active", val: String(vettingCount) }].map((s, i) => (<div key={i} className="finance-card p-6 !bg-white/5 !backdrop-blur-xl !border-white/10 text-white"><p className="text-white/50 text-[10px] font-bold uppercase mb-2 tracking-widest">{s.label}</p><p className="text-3xl font-black">{s.val}</p></div>))}</div></div></PageHero>
      <div className="max-w-5xl mx-auto px-6 -mt-16"><div className="flex flex-col md:flex-row gap-8"><aside className="w-full md:w-64 space-y-6 flex-shrink-0"><div className="finance-card p-6"><h3 className="font-bold text-gray-800 mb-6">Pipeline Filters</h3><div className="space-y-4">{["Nurse (RN)", "Nurse (LPN)", "Physiotherapist", "Home Aid", "Specialist"].map(role => (<label key={role} className="flex items-center gap-3 cursor-pointer group"><div className="w-5 h-5 rounded-lg border-2 border-gray-100 group-hover:border-[#FEB4C5] transition-all" /><span className="text-sm text-gray-500 group-hover:text-gray-800">{role}</span></label>))}</div></div><div className="finance-card p-6 bg-[#E8F9E7] border-[#7CE577]/30"><p className="text-[10px] font-bold text-[#5FB865] uppercase mb-2 tracking-widest leading-none">Vetting Insight</p><p className="text-xs text-[#5FB865] leading-relaxed">{interviewCount > 0 ? `${interviewCount} candidate${interviewCount !== 1 ? "s" : ""} ready for final interview.` : "No candidates in final interview stage yet."}</p></div></aside><main className="flex-1 space-y-4"><div className="flex justify-between items-center mb-6"><div className="relative flex-1 max-w-sm"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" /><input type="text" placeholder="Search applicants..." className="w-full h-11 pl-11 pr-4 rounded-xl border border-gray-100 bg-white text-sm outline-none" /></div></div>{hiringData.recentApplicants.map((c, i) => { const displayStatus = statusLabel[c.status] ?? c.status; const score = Math.round(c.rating * 20); return (<div key={c.id ?? i} className="finance-card p-5 flex items-center justify-between hover:translate-x-1 transition-all group"><div className="flex items-center gap-5"><div className="relative"><div className="w-14 h-14 rounded-2xl bg-[#FFF5F7] flex items-center justify-center text-[#DB869A] font-black text-xl">{c.name.charAt(0)}</div><div className="absolute -bottom-1 -right-1 bg-[#7CE577] text-white p-1 rounded-full border-2 border-white shadow-sm"><CheckCircle2 className="w-2.5 h-2.5" /></div></div><div><h3 className="font-bold text-gray-800 leading-none">{c.name}</h3><p className="text-xs text-gray-400 mt-2">{c.role} {"\u2022"} {c.experience} exp</p><div className="flex items-center gap-2 mt-2"><div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#FEB4C5]" style={{ width: `${score}%` }} /></div><span className="text-[10px] font-bold text-gray-400">{score}% Match</span></div></div></div><div className="flex items-center gap-6"><div className="text-right"><p className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${c.status === 'interview' ? 'bg-[#FFF5F7] text-[#DB869A]' : 'bg-gray-100 text-gray-500'}`}>{displayStatus}</p></div><Button variant="ghost" size="icon" className="text-gray-300 group-hover:text-gray-800"><ChevronRight className="w-5 h-5" /></Button></div></div>); })}{hiringData.recentApplicants.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No applicants yet.</p>}<Button variant="ghost" className="w-full mt-6 text-gray-400 font-bold hover:text-gray-600">Load More Applicants</Button></main></div></div>
      <style dangerouslySetInnerHTML={{ __html: ".finance-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 2rem; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03); }" }} />
    </div>
  );
}