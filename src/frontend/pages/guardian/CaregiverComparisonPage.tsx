"use client";
import React, { useState } from "react";
import { Link, useLocation } from "react-router";
import { Users, ArrowLeft, Star, CheckCircle2, ShieldCheck, Award, TrendingUp, Search, Filter, ChevronRight, MessageSquare, Clock, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { PageHero } from "@/frontend/components/PageHero";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { guardianService } from "@/backend/services/guardian.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { useTranslation } from "react-i18next";

const DollarSign = ({ className }: { className?: string }) => (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>);
const Stethoscope = ({ className }: { className?: string }) => (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4.5a2.5 2.5 0 0 1 2.5 2.5v6.5a2.5 2.5 0 0 1 -2.5 2.5h-6.5a2.5 2.5 0 0 1 -2.5 -2.5v-6.5a2.5 2.5 0 0 1 2.5 -2.5h6.5"></path><path d="M12 12.5a2.5 2.5 0 0 0 2.5 2.5v3.5a2.5 2.5 0 0 0 -2.5 2.5h-6.5a2.5 2.5 0 0 0 -2.5 -2.5v-3.5a2.5 2.5 0 0 0 2.5 -2.5h6.5"></path></svg>);

export default function CaregiverComparisonPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.caregiverComparison", "Caregiver Comparison"));

  const loc = useLocation();
  const wizardBackState = { wizardReturnTo: `${loc.pathname}${loc.search}` };
  const [mobileIndex, setMobileIndex] = useState(0);
  const { data: caregivers, loading } = useAsyncData(() => guardianService.getCaregiverComparison());

  if (loading || !caregivers) return <PageSkeleton />;

  const selectedCaregivers = caregivers;
  const comparisonRows = [
    { label: "Rating", key: "rating", icon: Star, color: "text-yellow-400" },
    { label: "Hourly Rate", key: "rate", icon: DollarSign, color: "text-[#7CE577]" },
    { label: "Experience", key: "exp", icon: Clock, color: "text-blue-400" },
    { label: "Specialty", key: "specialty", icon: Stethoscope, color: "text-[#DB869A]" }
  ];

  return (
    <div>
      <PageHero gradient="radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FEB4C5 0%, #DB869A 100%)" className="pt-8 pb-24 md:pb-32 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-8 md:mb-12 text-white"><h1 className="text-xl md:text-2xl">Compare Caregivers</h1></div>
          <div className="hidden md:grid grid-cols-2 md:grid-cols-3 gap-6"><div className="finance-card p-6 !bg-white/10 !backdrop-blur-xl !border-white/20 text-white text-center"><p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Best for Recovery</p><p className="font-bold">Dr. Rahat Khan</p></div><div className="finance-card p-6 !bg-white/10 !backdrop-blur-xl !border-white/20 text-white text-center"><p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Expert Mobility</p><p className="font-bold">Sumaiya Akter</p></div></div>
          <div className="md:hidden flex items-center justify-center gap-2">{selectedCaregivers.map((_, i) => (<div key={i} className="w-2 h-2 rounded-full transition-all" style={{ background: i === mobileIndex ? "#fff" : "rgba(255,255,255,0.3)", transform: i === mobileIndex ? "scale(1.5)" : "scale(1)" }} />))}</div>
        </div>
      </PageHero>
      <div className="max-w-5xl mx-auto px-4 md:px-6 -mt-12 md:-mt-16">
        <div className="md:hidden">
          <div className="overflow-x-auto snap-x snap-mandatory flex gap-4 cn-scroll-x -mx-2 px-2 pb-4" onScroll={(e) => { const el = e.currentTarget; const idx = Math.round(el.scrollLeft / (el.scrollWidth / selectedCaregivers.length)); setMobileIndex(Math.min(idx, selectedCaregivers.length - 1)); }}>
            {selectedCaregivers.map((c) => (<div key={c.id} className="snap-center shrink-0 w-[85vw] max-w-[340px]"><div className="rounded-2xl overflow-hidden" style={{ background: cn.bgCard, boxShadow: cn.shadowCard }}><div className="p-5 text-center"><img src={c.img} className="w-16 h-16 rounded-2xl object-cover mx-auto ring-2 ring-white shadow-lg mb-3" alt={c.name} /><h3 className="text-base" style={{ color: cn.textHeading }}>{c.name}</h3><p className="text-xs uppercase tracking-widest mt-0.5" style={{ color: cn.pink }}>{c.type}</p><span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg mt-1" style={{ background: cn.tealBg, color: cn.teal }}>{c.agency.name}</span></div><div className="px-5 pb-3 space-y-3">{comparisonRows.map((row) => (<div key={row.key} className="flex items-center justify-between py-2" style={{ borderTop: `1px solid ${cn.borderLight}` }}><div className="flex items-center gap-2"><row.icon className={`w-4 h-4 ${row.color}`} /><span className="text-xs" style={{ color: cn.textSecondary }}>{row.label}</span></div><span className="text-sm" style={{ color: cn.text, fontWeight: 600 }}>{String(c[row.key as keyof typeof c])}</span></div>))}</div><div className="px-5 pb-5"><Link to={`/guardian/care-requirement-wizard?agency=${c.agency.id}`} state={wizardBackState} className="block w-full"><Button className="w-full h-12 text-white text-xs rounded-xl" style={{ background: "var(--cn-gradient-guardian)" }}>Request via Agency</Button></Link></div></div></div>))}
          </div>
        </div>
        <div className="hidden md:block finance-card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead><tr className="border-b border-gray-50"><th className="p-8 w-1/3"></th>{selectedCaregivers.map(c => (<th key={c.id} className="p-8 w-1/3 text-center"><div className="space-y-4"><img src={c.img} className="w-20 h-20 rounded-3xl object-cover mx-auto ring-4 ring-gray-50 shadow-lg" alt="c" /><div><h3 className="font-black text-gray-800 leading-tight">{c.name}</h3><p className="text-[10px] text-[#FEB4C5] font-black uppercase tracking-widest mt-1">{c.type}</p><span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg mt-1" style={{ background: cn.tealBg, color: cn.teal }}>{c.agency.name}</span></div></div></th>))}</tr></thead>
            <tbody className="divide-y divide-gray-50">{comparisonRows.map((row, i) => (<tr key={i} className="hover:bg-gray-50/30 transition-all"><td className="p-8"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center"><row.icon className={`w-4 h-4 ${row.color}`} /></div><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{row.label}</span></div></td>{selectedCaregivers.map(c => (<td key={c.id} className="p-8 text-center"><span className="text-sm font-black text-gray-800">{c[row.key as keyof typeof c]}</span></td>))}</tr>))}<tr><td className="p-8"></td>{selectedCaregivers.map(c => (<td key={c.id} className="p-8 text-center"><Link to={`/guardian/care-requirement-wizard?agency=${c.agency.id}`} state={wizardBackState} className="block w-full"><Button className="w-full h-12 text-white font-black text-xs rounded-xl shadow-xl transition-all" style={{ background: "var(--cn-gradient-guardian)" }}>Request via Agency</Button></Link></td>))}</tr></tbody>
          </table>
        </div>
        <div className="mt-12 p-8 rounded-[2.5rem] bg-gray-900 text-white flex flex-col md:flex-row items-center justify-between gap-8"><div className="flex items-center gap-6"><div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-[#7CE577]"><ShieldCheck className="w-8 h-8" /></div><div><h3 className="text-xl font-bold">Agency-Verified Care</h3><p className="text-white/50 text-xs mt-1">All caregivers are verified and managed by licensed agencies for your safety and peace of mind.</p></div></div><Link to="/agencies"><Button variant="ghost" className="text-white hover:bg-white/10 font-bold border border-white/20 rounded-xl px-8 h-12">Browse Agencies</Button></Link></div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: ".finance-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 3rem; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03); }" }} />
    </div>
  );
}