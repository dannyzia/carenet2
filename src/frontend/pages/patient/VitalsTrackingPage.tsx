"use client";
import React, { useState } from "react";
import { Activity, Droplets, Thermometer, Heart, ArrowLeft, Plus, History, TrendingUp, Share2, AlertCircle } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { useNavigate } from "react-router";
import { PageHero } from "@/frontend/components/shared/PageHero";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { cn } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { patientService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useTranslation } from "react-i18next";

export default function VitalsTrackingPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.vitalsTracking", "Vitals Tracking"));

  const { data: mockVitalsData, loading } = useAsyncData(() => patientService.getVitalsData());
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  if (loading || !mockVitalsData) return <PageSkeleton cards={3} />;

  const latestVital = mockVitalsData.length > 0 ? mockVitalsData[mockVitalsData.length - 1] : null;
  const currentReadings = [
    { label: "Blood Pressure", val: latestVital ? `${latestVital.bp}/80` : "—", unit: "mmHg", icon: Activity, color: "#DB869A" },
    { label: "Blood Sugar", val: latestVital ? `${(latestVital.sugar / 18).toFixed(1)}` : "—", unit: "mmol/L", icon: Droplets, color: "#7CE577" },
    { label: "Heart Rate", val: latestVital ? `${latestVital.heartRate}` : "—", unit: "bpm", icon: Heart, color: "#FEB4C5" },
    { label: "Temperature", val: "98.6", unit: "\u00B0F", icon: Thermometer, color: "#FFB74D" },
  ];
  const recentLogs = mockVitalsData.slice(-3).reverse().map((v, i) => ({
    time: v.time,
    val: i === 0 ? `${v.bp}/80` : i === 1 ? `${v.sugar}` : `${v.heartRate} bpm`,
    label: i === 0 ? (v.bp > 130 ? "BP Elevated" : "BP Normal") : i === 1 ? (v.sugar > 100 ? "Sugar check" : "Sugar stable") : "Heart Rate",
    alert: (i === 0 && v.bp > 130) || (i === 1 && v.sugar > 120),
  }));

  return (
    <div>
      <PageHero gradient="radial-gradient(143.86% 887.35% at -10.97% -22.81%, #7CE577 0%, #5FB865 100%)" className="pt-8 pb-32 px-6"><div className="max-w-5xl mx-auto"><div className="flex justify-between items-center mb-8"><h1 className="text-2xl font-bold text-white">Vitals Tracking</h1><div className="flex gap-2"><Button variant="ghost" className="text-white hover:bg-white/10 rounded-xl"><Share2 className="w-5 h-5" /></Button><Button className="bg-white text-[#5FB865] hover:bg-white/90 rounded-xl font-bold"><Plus className="w-5 h-5 mr-1" /> Log Vital</Button></div></div><div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">{currentReadings.map((vital, idx) => (<div key={idx} className="flex-shrink-0 w-44 finance-card p-5 !bg-white/10 !backdrop-blur-xl !border-white/20"><vital.icon className="w-6 h-6 text-white mb-3" /><p className="text-white/60 text-xs font-bold uppercase tracking-wider">{vital.label}</p><p className="text-white text-2xl font-bold mt-1">{vital.val}</p><p className="text-white/80 text-[10px] mt-1 font-medium">{vital.unit}</p></div>))}</div></div></PageHero>
      <div className="max-w-5xl mx-auto px-6 -mt-16"><div className="grid grid-cols-1 lg:grid-cols-3 gap-8"><div className="lg:col-span-2 space-y-6"><div className="finance-card p-8"><div className="flex justify-between items-center mb-8"><h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#7CE577]" />Weekly Trends</h2></div><div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={mockVitalsData}><defs><linearGradient id="colorBp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7CE577" stopOpacity={0.3}/><stop offset="95%" stopColor="#7CE577" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" /><XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#999' }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#999' }} /><Tooltip /><Area type="monotone" dataKey="bp" stroke="#7CE577" strokeWidth={3} fillOpacity={1} fill="url(#colorBp)" /><Area type="monotone" dataKey="heartRate" stroke="#FEB4C5" strokeWidth={3} fill="transparent" /></AreaChart></ResponsiveContainer></div><div className="flex justify-center gap-6 mt-6"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#7CE577]" /><span className="text-xs font-medium text-gray-500">Blood Pressure</span></div><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#FEB4C5]" /><span className="text-xs font-medium text-gray-500">Heart Rate</span></div></div></div><div className="finance-card p-8"><h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><History className="w-5 h-5 text-gray-400" />Recent Logs</h2><div className="space-y-4">{recentLogs.map((log, idx) => (<div key={idx} className={`p-4 rounded-2xl border ${log.alert ? 'border-red-100 bg-red-50' : 'border-gray-50 bg-gray-50'} flex justify-between items-center`}><div className="flex items-center gap-4"><div className={`w-10 h-10 rounded-full flex items-center justify-center ${log.alert ? 'bg-red-200' : 'bg-white'}`}>{log.alert ? <AlertCircle className="w-5 h-5 text-red-500" /> : <Activity className="w-5 h-5 text-gray-400" />}</div><div><p className="font-bold text-gray-800">{log.val}</p><p className="text-xs text-gray-400">{log.time}</p></div></div><span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${log.alert ? 'text-red-500' : 'text-gray-400'}`}>{log.label}</span></div>))}</div></div></div><div className="lg:col-span-1 space-y-6"><div className="finance-card p-8 bg-gradient-to-br from-[#FEB4C5]/20 to-[#DB869A]/20 border-[#FEB4C5]/20"><h3 className="text-lg font-bold text-gray-800 mb-4">Health Insight</h3><p className="text-sm text-gray-600 leading-relaxed">Heart rate has been 5% higher than usual during evening hours. Recommend monitoring activity levels post-dinner.</p><Button className="w-full mt-6 bg-[#DB869A] text-white rounded-xl shadow-lg font-bold">Talk to Doctor</Button></div><div className="finance-card p-8"><h3 className="text-lg font-bold text-gray-800 mb-4">Daily Goal</h3><div className="flex justify-between text-xs mb-1"><span className="text-gray-400">Activity Level</span><span className="text-gray-800 font-bold">80%</span></div><div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#7CE577]" style={{ width: '80%' }} /></div><p className="text-[10px] text-gray-400 italic text-center mt-2">Goal: 30 mins light walking</p></div></div></div></div>
      <style dangerouslySetInnerHTML={{ __html: ".finance-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 2rem; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03); } .scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }" }} />
    </div>
  );
}