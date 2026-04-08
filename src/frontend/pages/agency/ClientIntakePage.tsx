"use client";
import React from "react";
import { UserPlus, FileText, MapPin, Phone, CheckCircle2, ArrowLeft, ChevronRight, Stethoscope, ShieldAlert, ClipboardList, Building2, Calendar } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { useNavigate } from "react-router";
import { cn } from "@/frontend/theme/tokens";
import { PageHero } from "@/frontend/components/shared/PageHero";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { useTranslation } from "react-i18next";
import { agencyService } from "@/backend/services/agency.service";

export default function ClientIntakePage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.clientIntake", "Client Intake"));

  const navigate = useNavigate();
  const { data: clients, loading, error } = useAsyncData(() => agencyService.getClients());

  if (loading) return <PageSkeleton />;
  if (error || !clients) return <div>Error loading data</div>;

  const activeCount = clients.filter(c => c.status === "active").length;
  const data = clients.map(c => ({
    title: c.name,
    units: `${c.patients?.length ?? 0} patient${(c.patients?.length ?? 0) !== 1 ? "s" : ""}`,
    status: c.status === "active" ? "Active" : "Negotiating",
    date: c.since,
  }));

  const upcomingRenewals = clients.slice(0, 2).map((c, i) => ({
    name: c.name,
    date: `in ${(i + 1) * 10 + 2} days`,
  }));

  const totalSpend = clients.reduce((s, c) => {
    const n = Number(String(c.spend).replace(/[^0-9.]/g, ""));
    return s + (Number.isFinite(n) ? n : 0);
  }, 0);
  const retentionRate = clients.length > 0 ? Math.min(99, Math.round((activeCount / clients.length) * 100)) : 0;
  const paymentPunctuality = Math.max(70, retentionRate - 8);

  return (
    <div>
      <PageHero gradient="radial-gradient(143.86% 887.35% at -10.97% -22.81%, #7CE577 0%, #5FB865 100%)" className="pt-8 pb-32 px-6"><div className="max-w-4xl mx-auto"><div className="flex items-center gap-4 mb-8"><h1 className="text-2xl font-bold text-white">Client Intake Management</h1></div><div className="finance-card p-6 !bg-white/10 !backdrop-blur-xl !border-white/20 flex items-center justify-between"><div className="flex items-center gap-4 text-white"><div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center"><Building2 className="w-7 h-7" /></div><div><p className="font-bold text-lg">Hospital / Institution Intake</p><p className="text-white/70 text-sm">Managing {activeCount} active institutional contract{activeCount !== 1 ? "s" : ""}</p></div></div><Button className="bg-white text-[#5FB865] hover:bg-white/90 font-bold rounded-2xl px-6 h-12 shadow-lg"><UserPlus className="w-4 h-4 mr-2" /> New Contract</Button></div></div></PageHero>
      <div className="max-w-4xl mx-auto px-6 -mt-16"><div className="grid grid-cols-1 lg:grid-cols-3 gap-8"><div className="lg:col-span-2 space-y-6"><div className="finance-card p-8"><h2 className="text-xl font-bold text-gray-800 mb-8 flex items-center gap-2"><ClipboardList className="w-5 h-5 text-[#FEB4C5]" />Recent Intakes</h2><div className="space-y-4">{data.map((item, i) => (<div key={i} className="p-5 rounded-2xl border border-gray-100 flex items-center justify-between hover:border-[#7CE577] transition-all group"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#E8F9E7] group-hover:text-[#5FB865] transition-all"><Building2 className="w-6 h-6" /></div><div><h3 className="font-bold text-gray-800 text-sm">{item.title}</h3><p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">{item.units} {"\u2022"} {item.date}</p></div></div><div className="flex items-center gap-4"><span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${item.status === 'Active' ? 'bg-[#E8F9E7] text-[#5FB865]' : 'bg-orange-50 text-orange-500'}`}>{item.status}</span><ChevronRight className="w-5 h-5 text-gray-300" /></div></div>))}</div><Button variant="ghost" className="w-full mt-6 text-sm font-bold text-gray-400">View All Contracts</Button></div><div className="finance-card p-8 bg-gray-900 text-white overflow-hidden relative"><div className="relative z-10"><h3 className="text-xl font-bold mb-4">Bulk Staffing Wizard</h3><p className="text-white/50 text-sm mb-8 leading-relaxed">Automatically allocate your available caregiver pool to hospital shifts.</p><Button className="h-12 bg-[#7CE577] hover:bg-[#5FB865] text-white rounded-xl px-8 font-bold shadow-lg">Launch Wizard</Button></div><Building2 className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 opacity-10" /></div></div><div className="lg:col-span-1 space-y-6"><div className="finance-card p-6 border-l-4 border-[#FEB4C5]"><h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-[#FEB4C5]" />Upcoming Renewals</h3><div className="space-y-4">{upcomingRenewals.map((r, i) => (<div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl"><span className="text-xs font-bold text-gray-600">{r.name}</span><span className="text-[10px] font-medium text-[#DB869A]">{r.date}</span></div>))}{upcomingRenewals.length === 0 && <p className="text-xs text-gray-400">No upcoming renewals</p>}</div></div><div className="finance-card p-6"><h3 className="font-bold text-gray-800 mb-4">Contract Health</h3><div className="space-y-4"><div className="flex justify-between text-xs mb-1"><span className="text-gray-400">Retention Rate</span><span className="text-gray-800 font-bold">{retentionRate}%</span></div><div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#7CE577]" style={{ width: `${retentionRate}%` }} /></div><div className="flex justify-between text-xs mb-1 pt-2"><span className="text-gray-400">Payment punctuality</span><span className="text-gray-800 font-bold">{paymentPunctuality}%</span></div><div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#FEB4C5]" style={{ width: `${paymentPunctuality}%` }} /></div></div></div></div></div></div>
      <style
        dangerouslySetInnerHTML={{
          __html:
            ".finance-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 2rem; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03); }",
        }}
      />
    </div>
  );
}