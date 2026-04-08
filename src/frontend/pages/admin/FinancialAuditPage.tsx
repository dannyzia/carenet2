"use client";

import React from "react";
import { TrendingUp, ArrowLeft, Download, CreditCard, ArrowUpRight, ArrowDownRight, Filter, Search, PieChart as PieChartIcon, DollarSign, Briefcase, ShoppingBag, ShieldCheck, ChevronRight } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { useNavigate } from "react-router";
import { PageHero } from "@/frontend/components/PageHero";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { adminService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useTranslation } from "react-i18next";

export default function FinancialAuditPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.financialAudit", "Financial Audit"));

  const navigate = useNavigate();
  const { data, loading } = useAsyncData(() => adminService.getAuditChartData());

  if (loading || !data) return <PageSkeleton cards={3} />;

  const totalRev = data.reduce((s, d) => s + d.rev, 0);
  const totalPayout = data.reduce((s, d) => s + d.payout, 0);
  const netPlatformRev = totalRev - totalPayout;
  const taxLiability = Math.round(netPlatformRev * 0.05);

  const fmtBDT = (n: number) => {
    if (n >= 1_000_000) return `\u09F3${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 100_000) return `\u09F3${(n / 100_000).toFixed(0)}L`;
    if (n >= 1_000) return `\u09F3${(n / 1_000).toFixed(0)}k`;
    return `\u09F3${n.toLocaleString()}`;
  };

  const serviceFeePct = 75;
  const commissionPct = 20;
  const subscriptionPct = 5;
  const revenueSources = [
    { label: "Caregiver Service Fees", val: fmtBDT(Math.round(totalRev * serviceFeePct / 100)), pct: serviceFeePct, icon: Briefcase, color: "bg-[#7CE577]" },
    { label: "Marketplace Commissions", val: fmtBDT(Math.round(totalRev * commissionPct / 100)), pct: commissionPct, icon: ShoppingBag, color: "bg-[#FEB4C5]" },
    { label: "Institutional Subscriptions", val: fmtBDT(Math.round(totalRev * subscriptionPct / 100)), pct: subscriptionPct, icon: CreditCard, color: "bg-[#DB869A]" },
  ];

  const recentPayouts = data.slice(-3).reverse().map((d, i) => ({
    name: ["Service Payouts", "Marketplace Settlements", "Agency Disbursements"][i] || "Payout",
    amount: fmtBDT(d.payout),
    date: i === 0 ? "Latest" : i === 1 ? "Yesterday" : `${i + 1}d ago`,
  }));

  return (
    <div>
      <PageHero gradient="radial-gradient(143.86% 887.35% at -10.97% -22.81%, #1F2937 0%, #111827 100%)" className="pt-8 pb-32 px-6"><div className="max-w-6xl mx-auto"><div className="flex justify-between items-center mb-12"><div className="flex items-center gap-4"><h1 className="text-2xl font-bold text-white">Financial Deep-Dive</h1></div><div className="flex gap-3"><Button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold rounded-xl h-11 px-6 shadow-lg"><Download className="w-4 h-4 mr-2" /> Export Audit Log</Button><Button className="bg-[#7CE577] hover:bg-[#5FB865] text-white font-bold rounded-xl h-11 px-6 shadow-lg"><ShieldCheck className="w-4 h-4 mr-2" /> Verify Integrity</Button></div></div><div className="grid grid-cols-1 md:grid-cols-4 gap-6">{[{ label: "Total Volume", val: fmtBDT(totalRev), change: `${data.length} days`, trend: "up" }, { label: "Net Platform Rev", val: fmtBDT(netPlatformRev), change: `${Math.round((netPlatformRev / Math.max(totalRev, 1)) * 100)}%`, trend: "up" }, { label: "Active Payouts", val: fmtBDT(totalPayout), change: `${data.length} periods`, trend: "down" }, { label: "Tax Liability", val: fmtBDT(taxLiability), change: "5% est.", trend: "up" }].map((s, i) => (<div key={i} className="finance-card p-6 !bg-white/5 !backdrop-blur-xl !border-white/10 text-white"><p className="text-[10px] font-bold text-white/50 uppercase tracking-widest leading-none mb-2">{s.label}</p><div className="flex items-end gap-3"><p className="text-2xl font-black">{s.val}</p><span className={`text-[10px] font-bold flex items-center mb-1 ${s.trend === 'up' ? 'text-[#7CE577]' : 'text-red-400'}`}>{s.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />} {s.change}</span></div></div>))}</div></div></PageHero>
      <div className="max-w-6xl mx-auto px-6 -mt-16"><div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6"><div className="finance-card p-10"><div className="flex justify-between items-center mb-10"><h3 className="text-xl font-bold text-gray-800">Transaction Volume vs. Payouts</h3><select className="bg-gray-100 border-none rounded-lg text-[10px] font-black uppercase px-3 h-8 outline-none"><option>Last 30 Days</option><option>Last Quarter</option></select></div><div className="h-80 w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data}><defs><linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7CE577" stopOpacity={0.3}/><stop offset="95%" stopColor="#7CE577" stopOpacity={0}/></linearGradient><linearGradient id="colorPay" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FEB4C5" stopOpacity={0.3}/><stop offset="95%" stopColor="#FEB4C5" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#999' }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#999' }} /><Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} /><Area type="monotone" dataKey="rev" stroke="#7CE577" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" /><Area type="monotone" dataKey="payout" stroke="#FEB4C5" strokeWidth={3} fillOpacity={1} fill="url(#colorPay)" /></AreaChart></ResponsiveContainer></div></div>
          <div className="finance-card p-10"><h3 className="text-xl font-bold text-gray-800 mb-8">Revenue Sources</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-12"><div className="space-y-6">{revenueSources.map((item, i) => (<div key={i} className="space-y-2"><div className="flex justify-between items-center"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center text-white`}><item.icon className="w-4 h-4" /></div><span className="text-sm font-bold text-gray-700">{item.label}</span></div><span className="text-sm font-black text-gray-800">{item.val}</span></div><div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden"><div className={`h-full ${item.color}`} style={{ width: `${item.pct}%` }} /></div></div>))}</div><div className="bg-gray-50 rounded-[2.5rem] flex items-center justify-center p-8"><PieChartIcon className="w-32 h-32 text-gray-200" /></div></div></div></div>
        <aside className="lg:col-span-1 space-y-6"><div className="finance-card p-8 border-l-4 border-orange-400 bg-orange-50/30"><h3 className="font-bold text-orange-700 mb-4">Pending Reconciliations</h3><p className="text-xs text-orange-600 leading-relaxed mb-6">There are 12 transactions from bKash gateway that require manual verification for TrxID mismatch.</p><Button className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Start Reconciliation</Button></div><div className="finance-card p-8"><h3 className="font-bold text-gray-800 mb-6">Recent Large Payouts</h3><div className="space-y-6">{recentPayouts.map((p, i) => (<div key={i} className="flex justify-between items-center group cursor-pointer"><div><p className="text-xs font-bold text-gray-800">{p.name}</p><p className="text-[10px] text-gray-400 uppercase font-bold">{p.date}</p></div><div className="text-right"><p className="text-sm font-black text-[#5FB865]">{p.amount}</p><ChevronRight className="inline-block w-3 h-3 text-gray-200 group-hover:text-gray-400" /></div></div>))}</div><Button variant="ghost" className="w-full mt-10 text-[10px] font-black uppercase tracking-widest text-[#FEB4C5] bg-[#FFF5F7] h-11 rounded-xl">View All Financials</Button></div></aside>
      </div></div>
      <style dangerouslySetInnerHTML={{ __html: ".finance-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 2rem; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03); }" }} />
    </div>
  );
}