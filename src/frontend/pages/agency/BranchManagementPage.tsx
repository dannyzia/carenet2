"use client";
import React from "react";
import { Building2, MapPin, Users, Plus, ChevronRight, ArrowLeft, Briefcase, CheckCircle2, TrendingUp, Settings, ShieldCheck, Search } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { agencyService } from "@/backend/services/agency.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { cn } from "@/frontend/theme/tokens";
import { PageHero } from "@/frontend/components/shared/PageHero";
import { useTranslation } from "react-i18next";

export default function BranchManagementPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.branchManagement", "Branch Management"));

  const { data: branches, loading } = useAsyncData(() => agencyService.getBranches());

  if (loading || !branches) return <PageSkeleton />;

  const totalBranches = branches.length;
  const totalStaff = branches.reduce((s, b) => s + b.staff, 0);
  const activeBranches = branches.filter(b => b.active).length;
  const cities = new Set(branches.map(b => b.city).filter(Boolean)).size;

  const cityRevenue = branches.reduce<Record<string, number>>((acc, b) => {
    const key = b.city || "Other";
    acc[key] = (acc[key] || 0) + b.staff;
    return acc;
  }, {});
  const revenueEntries = Object.entries(cityRevenue)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2);
  const maxStaff = Math.max(...Object.values(cityRevenue), 1);

  return (
    <div>
      <PageHero gradient="radial-gradient(143.86% 887.35% at -10.97% -22.81%, #1F2937 0%, #111827 100%)" className="pt-8 pb-32 px-6"><div className="max-w-5xl mx-auto"><div className="flex justify-between items-center mb-12"><div className="flex items-center gap-4"><h1 className="text-2xl font-bold text-white">Branch Network</h1></div><Button className="bg-[#7CE577] hover:bg-[#5FB865] text-white font-bold rounded-xl h-12 px-6 shadow-lg"><Plus className="w-4 h-4 mr-2" /> Register New Branch</Button></div><div className="grid grid-cols-1 md:grid-cols-4 gap-6">{[{ label: "Total Branches", val: String(totalBranches), icon: Building2 }, { label: "Active Staff", val: String(totalStaff), icon: Users }, { label: "Operational Hubs", val: String(activeBranches), icon: MapPin }, { label: "Service Cities", val: String(cities), icon: ShieldCheck }].map((s, i) => (<div key={i} className="finance-card p-6 !bg-white/5 !backdrop-blur-xl !border-white/10 text-white"><s.icon className="w-5 h-5 text-white/40 mb-3" /><p className="text-[10px] font-bold text-white/50 uppercase tracking-widest leading-none mb-2">{s.label}</p><p className="text-2xl font-black">{s.val}</p></div>))}</div></div></PageHero>
      <div className="max-w-5xl mx-auto px-6 -mt-16"><div className="grid grid-cols-1 lg:grid-cols-3 gap-8"><div className="lg:col-span-2 space-y-6"><div className="flex justify-between items-center mb-2"><h2 className="text-lg font-bold text-gray-800">Operational Locations</h2><div className="relative w-48"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" /><input type="text" placeholder="Search branch..." className="w-full bg-white border border-gray-100 rounded-lg h-9 pl-9 pr-3 text-xs outline-none" /></div></div>{branches.map((b, i) => (<div key={i} className="finance-card p-6 flex items-center justify-between group hover:border-[#FEB4C5] transition-all cursor-pointer"><div className="flex items-center gap-5"><div className="w-14 h-14 rounded-2xl bg-[#FFF5F7] flex items-center justify-center text-[#FEB4C5] font-black text-xl group-hover:bg-[#FEB4C5] group-hover:text-white transition-all">{b.name.charAt(0)}</div><div><h3 className="font-bold text-gray-800">{b.name}</h3><div className="flex items-center gap-3 mt-2"><span className="flex items-center text-[10px] font-bold text-gray-400"><MapPin className="w-3 h-3 mr-1" /> {b.city}</span><span className="flex items-center text-[10px] font-bold text-gray-400"><Users className="w-3 h-3 mr-1" /> {b.staff} Staff</span></div></div></div><div className="flex items-center gap-6"><div className="text-right"><p className="text-[10px] font-bold text-[#5FB865] bg-[#E8F9E7] px-2 py-0.5 rounded uppercase tracking-wider">{b.performance}</p></div><Settings className="w-5 h-5 text-gray-200 hover:text-gray-400 transition-colors" /></div></div>))}</div><div className="lg:col-span-1 space-y-6"><div className="finance-card p-8 bg-gray-900 text-white overflow-hidden relative"><h3 className="font-bold mb-6 flex items-center gap-2 relative z-10"><TrendingUp className="w-4 h-4 text-[#7CE577]" />Regional Revenue</h3><div className="space-y-4 relative z-10">{revenueEntries.map(([city, staffCount], i) => { const pct = Math.round((staffCount / maxStaff) * 100); return (<div key={city} className="space-y-1"><div className="flex justify-between text-[10px] font-bold text-white/50 uppercase"><span>{city}</span><span>{staffCount} staff</span></div><div className="w-full h-1 bg-white/10 rounded-full overflow-hidden"><div className={`h-full ${i === 0 ? 'bg-[#7CE577]' : 'bg-[#FEB4C5]'}`} style={{ width: `${pct}%` }} /></div></div>); })}{revenueEntries.length === 0 && <p className="text-xs text-white/40">No branch data</p>}</div><MapPin className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 opacity-10" /></div><div className="finance-card p-8 border-l-4 border-[#FEB4C5]"><h3 className="font-bold text-gray-800 mb-4">Branch Goals</h3><p className="text-xs text-gray-500 leading-relaxed mb-6">Expand to Sylhet Division by Q4 2026. Target: 25 new specialized caregivers.</p></div></div></div></div>
      <style dangerouslySetInnerHTML={{ __html: ".finance-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 2.5rem; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03); }" }} />
    </div>
  );
}