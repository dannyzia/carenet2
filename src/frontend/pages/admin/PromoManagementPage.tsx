"use client";

import { cn } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { adminService } from "@/backend/services/admin.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import React from "react";
import { Tag, Plus, Search, Filter, ArrowLeft, ChevronRight, ShoppingBag, TrendingUp, Calendar, Settings, XCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { useNavigate } from "react-router";
import { PageHero } from "@/frontend/components/PageHero";
import { useTranslation } from "react-i18next";

const ShoppingCart = ({ className }: { className?: string }) => (<svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>);

export default function PromoManagementPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.promoManagement", "Promo Management"));

  const navigate = useNavigate();
  const { data: promoData, loading } = useAsyncData(() => adminService.getPromoData());

  if (loading || !promoData) return <PageSkeleton />;

  return (
    <div>
      <PageHero gradient="radial-gradient(143.86% 887.35% at -10.97% -22.81%, #1F2937 0%, #111827 100%)" className="pt-8 pb-32 px-6"><div className="max-w-5xl mx-auto"><div className="flex justify-between items-center mb-12"><div className="flex items-center gap-4"><h1 className="text-2xl font-bold text-white">Promos & Discounts</h1></div><Button className="bg-[#7CE577] hover:bg-[#5FB865] text-white font-bold rounded-xl h-12 px-6 shadow-lg"><Plus className="w-4 h-4 mr-2" /> Create Campaign</Button></div><div className="grid grid-cols-1 md:grid-cols-4 gap-6">{[Tag, ShoppingBag, TrendingUp, Settings].map((Icon, i) => { const s = promoData.stats[i] || { label: "—", val: "—" }; return (<div key={i} className="finance-card p-6 !bg-white/5 !backdrop-blur-xl !border-white/10 text-white"><Icon className="w-5 h-5 text-white/40 mb-3" /><p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2 leading-none">{s.label}</p><p className="text-2xl font-black">{s.val}</p></div>); })}</div></div></PageHero>
      <div className="max-w-5xl mx-auto px-6 -mt-16"><div className="finance-card overflow-hidden"><div className="p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6"><div className="flex items-center gap-6 w-full md:w-auto"><div className="relative flex-1 md:w-64"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" /><input type="text" placeholder="Search codes..." className="w-full h-11 pl-11 pr-4 rounded-xl border border-gray-100 bg-gray-50/50 text-sm outline-none" /></div><div className="flex bg-gray-100 rounded-lg p-1">{["Active", "Draft", "Expired"].map(t => (<button key={t} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${t === 'Active' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}>{t}</button>))}</div></div><Button variant="outline" className="h-11 rounded-xl border-gray-200 font-bold"><Filter className="w-4 h-4 mr-2" /> Filter</Button></div>
        <div className="p-8 space-y-4">{promoData.promos.map((p, i) => (<div key={i} className="p-6 rounded-2xl border border-gray-100 flex items-center justify-between hover:border-[#FEB4C5] transition-all group"><div className="flex items-center gap-6"><div className="w-16 h-16 rounded-2xl bg-[#FFF5F7] flex flex-col items-center justify-center text-[#DB869A] border border-[#FEB4C5]/20 group-hover:bg-[#FEB4C5] group-hover:text-white transition-all"><Tag className="w-6 h-6" /><span className="text-[10px] font-black mt-1 uppercase">{p.val}</span></div><div><div className="flex items-center gap-2 mb-1"><h3 className="font-black text-gray-800 text-lg tracking-wider">{p.code}</h3><span className="text-[10px] font-bold bg-[#E8F9E7] text-[#5FB865] px-2 py-0.5 rounded uppercase">Verified</span></div><p className="text-xs text-gray-400 font-medium">{p.type} \u2022 {p.target}</p><div className="flex items-center gap-4 mt-3"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"><ShoppingCart className="w-3 h-3" /> {p.used} used</span><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"><Calendar className="w-3 h-3" /> Expires {p.expires}</span></div></div></div><div className="flex items-center gap-4"><Button variant="ghost" size="icon" className="text-gray-300 hover:text-gray-800"><Settings className="w-5 h-5" /></Button><Button variant="ghost" size="icon" className="text-gray-300 hover:text-red-500"><XCircle className="w-5 h-5" /></Button><ChevronRight className="w-6 h-6 text-gray-200" /></div></div>))}</div>
        <div className="p-8 bg-gray-50 border-t border-gray-100"><div className="flex justify-between items-center text-sm font-bold text-gray-400"><span>Showing 12 active campaigns</span><div className="flex gap-2"><Button variant="outline" className="h-8 w-8 p-0 rounded-lg">1</Button><Button variant="ghost" className="h-8 w-8 p-0 rounded-lg">2</Button></div></div></div></div></div>
      <style dangerouslySetInnerHTML={{ __html: ".finance-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 2.5rem; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03); }" }} />
    </div>
  );
}