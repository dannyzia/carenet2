"use client";

import React from "react";
import { ShieldAlert, Search, Filter, ArrowLeft, Download, Clock, User, Lock, CreditCard, Activity, ChevronRight, Database, Terminal, ShieldCheck } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { useNavigate } from "react-router";
import { PageHero } from "@/frontend/components/PageHero";
import { cn } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { adminService } from "@/backend/services/admin.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { useTranslation } from "react-i18next";

export default function AuditLogsPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.auditLogs", "Audit Logs"));

  const navigate = useNavigate();
  const { data, loading } = useAsyncData(() => adminService.getAuditLogs());

  if (loading || !data) return <PageSkeleton />;

  return (
    <div>
      <PageHero gradient="radial-gradient(143.86% 887.35% at -10.97% -22.81%, #111827 0%, #000000 100%)" className="pt-8 pb-32 px-6"><div className="max-w-6xl mx-auto"><div className="flex justify-between items-center mb-12"><div className="flex items-center gap-4"><h1 className="text-2xl font-bold text-white">System Audit Logs</h1></div><div className="flex gap-2"><Button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold rounded-xl h-11 px-6 shadow-lg"><Download className="w-4 h-4 mr-2" /> Export JSON</Button><Button className="bg-[#7CE577] hover:bg-[#5FB865] text-white font-bold rounded-xl h-11 px-6 shadow-lg"><ShieldCheck className="w-4 h-4 mr-2" /> Run Security Audit</Button></div></div><div className="grid grid-cols-1 md:grid-cols-4 gap-6">{[{ label: data.stats?.[0]?.label ?? "Total Events", val: data.stats?.[0]?.val ?? String(data.logs.length), icon: Activity }, { label: data.stats?.[1]?.label ?? "Security Alerts", val: data.stats?.[1]?.val ?? "—", icon: ShieldAlert, color: 'text-orange-400' }, { label: data.stats?.[2]?.label ?? "Data Integrity", val: data.stats?.[2]?.val ?? "—", icon: Database, color: 'text-[#7CE577]' }, { label: data.stats?.[3]?.label ?? "Auth Success", val: data.stats?.[3]?.val ?? "—", icon: Lock }].map((s, i) => (<div key={i} className="finance-card p-6 !bg-white/5 !backdrop-blur-xl !border-white/10 text-white"><s.icon className={`w-5 h-5 mb-3 ${s.color || 'text-white/40'}`} /><p className="text-[10px] font-bold text-white/50 uppercase tracking-widest leading-none mb-2">{s.label}</p><p className="text-2xl font-black">{s.val}</p></div>))}</div></div></PageHero>
      <div className="max-w-6xl mx-auto px-6 -mt-16"><div className="finance-card overflow-hidden"><div className="p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6"><div className="flex items-center gap-6 w-full md:w-auto"><div className="relative flex-1 md:w-80"><Terminal className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" /><input type="text" placeholder="Search logs (UID, Action, IP)..." className="w-full h-11 pl-11 pr-4 rounded-xl border border-gray-100 bg-gray-50/50 text-xs font-mono outline-none focus:bg-white focus:ring-2 focus:ring-gray-200" /></div></div><div className="flex gap-3"><Button variant="outline" className="h-11 rounded-xl border-gray-200 text-xs font-bold uppercase tracking-widest"><Filter className="w-3 h-3 mr-2" /> All Modules</Button><select className="bg-gray-100 border-none rounded-xl text-[10px] font-black uppercase tracking-widest px-4 h-11 outline-none cursor-pointer"><option>Last 1 Hour</option><option>Last 24 Hours</option><option>Last 7 Days</option></select></div></div>
        <div className="overflow-x-auto"><table className="w-full text-left font-mono"><thead className="bg-gray-50/50 border-b border-gray-100"><tr><th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th><th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th><th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">User ID</th><th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">IP Address</th><th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Severity</th></tr></thead><tbody className="divide-y divide-gray-50">{data.logs.map((log, i) => (<tr key={i} className="hover:bg-gray-50/50 transition-colors group"><td className="px-8 py-5 text-xs text-gray-400">{log.time}</td><td className="px-8 py-5"><span className="text-[10px] font-bold text-gray-800">{log.action}</span></td><td className="px-8 py-5 text-xs text-blue-500 underline cursor-pointer">{log.uid}</td><td className="px-8 py-5 text-xs text-gray-500">{log.ip}</td><td className="px-8 py-5 text-right"><span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded ${log.severity === 'info' ? 'bg-blue-50 text-blue-500' : log.severity === 'warning' ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'}`}>{log.severity}</span></td></tr>))}</tbody></table></div>
        <div className="p-8 bg-gray-900 border-t border-white/5 flex justify-between items-center text-white/40"><p className="text-[10px] font-mono tracking-tighter">AUDIT LOG &bull; {data.logs.length} RECORD{data.logs.length !== 1 ? "S" : ""}</p><div className="flex gap-4"><Button variant="ghost" className="text-[10px] font-black text-white/40 uppercase hover:text-white">Previous Page</Button><Button variant="ghost" className="text-[10px] font-black text-white/40 uppercase hover:text-white">Next Page</Button></div></div></div></div>
      <style dangerouslySetInnerHTML={{ __html: ".finance-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 2.5rem; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03); }" }} />
    </div>
  );
}