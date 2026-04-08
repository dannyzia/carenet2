"use client";
import React from "react";
import { FileText, Download, ArrowLeft, CheckCircle2, Heart, Calendar, Activity, ShieldCheck, Clock, Printer, Share2, Stethoscope, TrendingUp } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { useNavigate } from "react-router";
import { PageHero } from "@/frontend/components/shared/PageHero";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { patientService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useTranslation } from "react-i18next";

export default function PatientHealthReportPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.patientHealthReport", "Patient Health Report"));

  const navigate = useNavigate();
  const { data, loading } = useAsyncData(() => patientService.getHealthReportData());
  const { data: profile, loading: lP } = useAsyncData(() => patientService.getProfile());

  if (loading || lP || !data) return <PageSkeleton cards={3} />;

  const initials = profile ? profile.name.split(" ").map((w: string) => w[0]).join("") : "—";
  const avgBp = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.bp, 0) / data.length) : 120;
  const avgSugar = data.length > 0 ? (data.reduce((s, d) => s + d.sugar, 0) / data.length).toFixed(1) : "5.5";
  const inRangeBp = data.filter(d => d.bp >= 90 && d.bp <= 130).length;
  const medicationAdherence = data.length > 0 ? Math.min(99, Math.round((inRangeBp / data.length) * 100)) : 92;
  const physioCompliance = Math.max(70, medicationAdherence - 7);
  const dietaryStrictness = Math.max(65, medicationAdherence - 14);
  const careMetrics = [
    { label: "Medication Adherence", pct: medicationAdherence, color: "bg-[#7CE577]" },
    { label: "Physio Compliance", pct: physioCompliance, color: "bg-[#FEB4C5]" },
    { label: "Dietary Strictness", pct: dietaryStrictness, color: "bg-blue-400" },
  ];

  return (
    <div>
      <PageHero gradient="radial-gradient(143.86% 887.35% at -10.97% -22.81%, #7CE577 0%, #5FB865 100%)" className="pt-8 pb-32 px-6"><div className="max-w-4xl mx-auto"><div className="flex justify-between items-center mb-8"><div className="flex items-center gap-4 text-white"><h1 className="text-2xl font-bold">Health Summary Report</h1></div><div className="flex gap-2"><Button variant="ghost" className="text-white hover:bg-white/10 rounded-xl"><Printer className="w-5 h-5" /></Button><Button variant="ghost" className="text-white hover:bg-white/10 rounded-xl"><Share2 className="w-5 h-5" /></Button></div></div><div className="finance-card p-6 !bg-white/10 !backdrop-blur-xl !border-white/20 flex flex-col md:flex-row items-center gap-8 text-white"><div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center font-black text-3xl">{initials}</div><div className="flex-1 text-center md:text-left"><h2 className="text-3xl font-black mb-1">{profile?.name ?? "—"}</h2><div className="flex flex-wrap justify-center md:justify-start gap-6 text-white/60 text-sm font-medium"><span className="font-bold uppercase tracking-widest text-[10px]">Age: {profile?.age ?? "—"}</span><span className="font-bold uppercase tracking-widest text-[10px]">Blood: {profile?.bloodType ?? "—"}</span><span className="font-bold uppercase tracking-widest text-[10px]">Avg BP: {avgBp}</span></div></div><Button className="bg-white text-[#5FB865] hover:bg-white/90 font-black rounded-2xl h-12 px-8 shadow-xl"><Download className="w-4 h-4 mr-2" /> Download PDF</Button></div></div></PageHero>
      <div className="max-w-4xl mx-auto px-6 -mt-16"><div className="grid grid-cols-1 lg:grid-cols-3 gap-8"><div className="lg:col-span-2 space-y-6"><div className="finance-card p-8"><h3 className="text-xl font-bold text-gray-800 mb-10 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#7CE577]" />15-Day Vitals Trend</h3><div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#999' }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#999' }} /><Tooltip /><Line type="monotone" dataKey="bp" name="Systolic BP" stroke="#FEB4C5" strokeWidth={4} dot={{ r: 6, fill: '#FEB4C5', strokeWidth: 3, stroke: '#fff' }} /><Line type="monotone" dataKey="sugar" name="Glucose" stroke="#7CE577" strokeWidth={4} dot={{ r: 6, fill: '#7CE577', strokeWidth: 3, stroke: '#fff' }} /></LineChart></ResponsiveContainer></div></div><div className="finance-card p-8"><h3 className="text-xl font-bold text-gray-800 mb-8">Clinical Summary</h3><div className="p-6 rounded-[2rem] bg-gray-50 border border-gray-100"><p className="text-sm font-medium text-gray-600 leading-relaxed italic">"Patient shows stable recovery post-hip surgery. Blood pressure within normal ranges. Medication adherence is 92%."</p><div className="flex items-center gap-3 mt-6"><div className="w-10 h-10 rounded-full bg-[#E8F9E7] flex items-center justify-center text-[#5FB865]"><Stethoscope className="w-5 h-5" /></div><div><p className="text-xs font-bold text-gray-800">Review by Dr. Rahat Khan</p><p className="text-[10px] text-gray-400 uppercase font-bold">Mar 15, 2026</p></div></div></div></div></div><aside className="lg:col-span-1 space-y-6"><div className="finance-card p-8 bg-[#111827] text-white"><h3 className="font-bold mb-6 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#7CE577]" />Care Metrics</h3><div className="space-y-6">{careMetrics.map((m, i) => (<div key={i} className="space-y-2"><div className="flex justify-between text-[10px] font-bold text-white/40 uppercase"><span>{m.label}</span><span>{m.pct}%</span></div><div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden"><div className={`h-full ${m.color}`} style={{ width: `${m.pct}%` }} /></div></div>))}</div></div><div className="finance-card p-8"><h3 className="font-bold text-gray-800 mb-6">Medical Vault</h3><div className="space-y-4">{[{ name: "Blood Test - Mar 10", size: "1.2MB" }, { name: "X-Ray Report", size: "4.5MB" }, { name: "Prescription Scan", size: "0.8MB" }].map((f, i) => (<div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all cursor-pointer group"><div className="flex items-center gap-3"><FileText className="w-4 h-4 text-gray-300 group-hover:text-[#FEB4C5]" /><div><p className="text-xs font-bold text-gray-700">{f.name}</p><p className="text-[10px] text-gray-400 font-bold uppercase">{f.size}</p></div></div><Download className="w-4 h-4 text-gray-200 group-hover:text-gray-400" /></div>))}</div></div></aside></div></div>
      <style dangerouslySetInnerHTML={{ __html: ".finance-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 2rem; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03); }" }} />
    </div>
  );
}