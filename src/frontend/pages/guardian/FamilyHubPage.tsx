"use client";
import React from "react";
import { Users, Heart, Calendar, Activity, ShieldAlert, ArrowLeft, Plus, ChevronRight, Stethoscope, Bell, MapPin, Clock } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Link } from "react-router";
import { cn } from "@/frontend/theme/tokens";
import { PageHero } from "@/frontend/components/PageHero";
import { useAsyncData, useDocumentTitle, useCareSeekerBasePath } from "@/frontend/hooks";
import { guardianService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useTranslation } from "react-i18next";

export default function FamilyHubPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.familyHub", "Family Hub"));

  const base = useCareSeekerBasePath();
  const { data: familyMembers, loading } = useAsyncData(() => guardianService.getFamilyMembers());

  if (loading || !familyMembers) return <PageSkeleton cards={3} />;

  const activityLabels = ["Vitals Check due", "Meds Refill", "Doctor Visit", "Therapy Session", "Follow-up"];
  const timeLabels = ["10 min", "2 days", "Next Mon", "Tomorrow", "3 days"];
  const hubActivity = familyMembers.slice(0, 3).map((m, i) => ({
    label: m.activeCare ? activityLabels[i % activityLabels.length] : "Check-in Reminder",
    person: m.name.split(" ").slice(0, 2).join(" ").replace(/(\w)\w+$/, "$1."),
    time: timeLabels[i % timeLabels.length],
  }));

  return (
    <div>
      <PageHero gradient="radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FEB4C5 0%, #DB869A 100%)" className="pt-8 pb-32 px-6">
        <div className="max-w-5xl mx-auto"><div className="flex justify-between items-center mb-8"><div className="flex items-center gap-4 text-white"><h1 className="text-2xl font-bold">Family Hub</h1></div><Link to={`${base}/patient-intake`}><Button className="bg-white text-[#DB869A] hover:bg-white/90 font-black rounded-2xl h-12 px-6 shadow-lg"><Plus className="w-4 h-4 mr-2" /> Add Family Member</Button></Link></div><div className="finance-card p-6 !bg-white/10 !backdrop-blur-xl !border-white/20 flex items-center justify-between text-white"><div className="flex items-center gap-4"><div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center"><Heart className="w-7 h-7 fill-white" /></div><div><p className="font-bold text-lg">Centralized Care</p><p className="text-white/70 text-sm">Managing health for {familyMembers.length} family members</p></div></div><div className="flex gap-2"><button className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"><Bell className="w-5 h-5" /></button><button className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"><ShieldAlert className="w-5 h-5" /></button></div></div></div>
      </PageHero>
      <div className="max-w-5xl mx-auto px-6 -mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6"><h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Users className="w-5 h-5 text-[#FEB4C5]" />Your Loved Ones</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{familyMembers.map((member, i) => (<div key={i} className="finance-card p-6 group hover:translate-y-[-4px] transition-all cursor-pointer"><div className="flex items-center gap-4 mb-6"><img src={member.img} className="w-14 h-14 rounded-2xl object-cover ring-4 ring-gray-50 group-hover:ring-[#FFF5F7] transition-all" alt="m" /><div><h3 className="font-bold text-gray-800 leading-none">{member.name}</h3><p className="text-[10px] text-[#FEB4C5] font-black uppercase mt-2 tracking-widest">{member.relation} \u2022 {member.age} yrs</p></div></div><div className="space-y-3 pt-4 border-t border-gray-50"><div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase"><span>Care Status</span><span className={member.activeCare ? 'text-[#5FB865]' : 'text-gray-300'}>{member.activeCare ? 'Active Monitoring' : 'No Active Shift'}</span></div><p className="text-xs font-medium text-gray-600 truncate">{member.condition}</p></div><Link to={`${base}/dashboard`} className="mt-6 block"><Button variant="outline" className="w-full h-10 rounded-xl border-gray-100 text-[10px] font-black uppercase tracking-widest hover:border-[#FEB4C5] hover:text-[#DB869A] transition-all">Open Health Dashboard</Button></Link></div>))}</div></div>
          <aside className="lg:col-span-1 space-y-6"><div className="finance-card p-8 bg-gray-900 text-white"><h3 className="font-bold mb-6">Hub Activity</h3><div className="space-y-6">{hubActivity.length > 0 ? hubActivity.map((a, i) => (<div key={i} className="flex gap-4"><div className="w-1 h-10 rounded-full bg-[#FEB4C5]" /><div><p className="text-xs font-bold text-white">{a.label}</p><p className="text-[10px] text-white/40 uppercase font-bold">{a.person} \u2022 {a.time}</p></div></div>)) : <p className="text-xs text-white/40">No upcoming activities</p>}</div></div><div className="finance-card p-8 border-l-4 border-[#7CE577]"><h3 className="font-bold text-gray-800 mb-4">Emergency Kit</h3><p className="text-xs text-gray-500 leading-relaxed mb-6">Quick access to medical files and emergency contacts for all family members.</p><Link to={`${base}/emergency`}><Button className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl shadow-lg">Panic Hub</Button></Link></div></aside>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: ".finance-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 2rem; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03); }" }} />
    </div>
  );
}
