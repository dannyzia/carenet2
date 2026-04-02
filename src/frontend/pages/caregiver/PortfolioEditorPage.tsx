"use client";
import React, { useState } from "react";
import { User, Edit3, Save, ArrowLeft, Camera, Plus, Trash2, Award, FileText, Briefcase, CheckCircle2, ShieldCheck, Layout, Eye, Globe } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { cn } from "@/frontend/theme/tokens";
import { PageHero } from "@/frontend/components/PageHero";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { caregiverService } from "@/backend/services/caregiver.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { useTranslation } from "react-i18next";

export default function PortfolioEditorPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.portfolioEditor", "Portfolio Editor"));

  const [activeTab, setActiveTab] = useState("profile");
  const { data: portfolio, loading } = useAsyncData(() => caregiverService.getPortfolio());

  if (loading || !portfolio) return <PageSkeleton />;

  return (
    <div>
      <PageHero gradient="radial-gradient(143.86% 887.35% at -10.97% -22.81%, #7CE577 0%, #5FB865 100%)">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-4"><h1 className="text-2xl font-bold text-white">Professional Portfolio</h1></div>
            <div className="flex gap-2">
              <Button variant="ghost" className="text-white hover:bg-white/10 rounded-xl px-4 h-11 font-bold"><Eye className="w-4 h-4 mr-2" /> Live Preview</Button>
              <Button className="bg-[#FEB4C5] hover:bg-[#DB869A] text-white font-bold rounded-xl h-11 px-6 shadow-lg"><Save className="w-4 h-4 mr-2" /> Save Portfolio</Button>
            </div>
          </div>
          <div className="flex gap-8 border-b border-white/10">
            {[{ id: "profile", label: "Basic Info", icon: User }, { id: "experience", label: "Experience", icon: Briefcase }, { id: "education", label: "Education", icon: Award }, { id: "gallery", label: "Work Photos", icon: Camera }].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all relative ${activeTab === t.id ? 'text-white' : 'text-white/40 hover:text-white/60'}`}>
                <t.icon className="w-4 h-4" />{t.label}{activeTab === t.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-white rounded-full" />}
              </button>
            ))}
          </div>
        </div>
      </PageHero>
      <div className="max-w-5xl mx-auto px-6 -mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="finance-card p-10">
              {activeTab === "profile" && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="flex items-center gap-8">
                    <div className="relative group"><img src="https://images.unsplash.com/photo-1559839734-2b71f1536783?auto=format&fit=crop&q=80&w=200&h=200" className="w-24 h-24 rounded-3xl object-cover ring-4 ring-gray-50" alt="p" /><button className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-white shadow-xl text-gray-400 hover:text-[#FEB4C5] transition-colors"><Camera className="w-4 h-4" /></button></div>
                    <div className="flex-1 space-y-4"><div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Professional Title</label><input className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 outline-none font-bold text-gray-800" placeholder="e.g. Senior Nurse & Care Specialist" /></div></div>
                  </div>
                  <div className="space-y-2"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Short Bio</label><textarea className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-sm text-gray-600 leading-relaxed min-h-[120px]" placeholder="Tell families why you are the best caregiver for their loved ones..." /></div>
                </div>
              )}
              {activeTab === "experience" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-gray-800">Job History</h3><Button variant="ghost" className="text-[#FEB4C5] font-black uppercase text-[10px] tracking-widest"><Plus className="w-3 h-3 mr-1" /> Add Job</Button></div>
                  {[1, 2].map(i => (
                    <div key={i} className="p-6 rounded-2xl border border-gray-100 space-y-4 relative group">
                      <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all text-red-400"><Trash2 className="w-4 h-4" /></button>
                      <div className="grid grid-cols-2 gap-4"><input className="bg-transparent border-b border-gray-100 pb-2 outline-none font-bold text-sm" placeholder="Organization / Family" defaultValue={i === 1 ? "Evercare Hospital" : "Private Guardian Care"} /><input className="bg-transparent border-b border-gray-100 pb-2 outline-none text-xs text-gray-400" placeholder="Duration (e.g. 2020 - 2022)" /></div>
                      <textarea className="w-full bg-gray-50/50 p-3 rounded-xl border-none outline-none text-xs text-gray-500" placeholder="Responsibilities..." defaultValue={i === 1 ? "Led the ICU geriatric nursing team, managed complex post-op cases." : ""} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <aside className="lg:col-span-1 space-y-6">
            <div className="finance-card p-8 bg-gray-900 text-white">
              <h3 className="font-bold mb-6 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#7CE577]" />Profile Strength</h3>
              <div className="space-y-4"><div className="flex justify-between items-end mb-1"><span className="text-[10px] font-bold text-white/40 uppercase">Completeness</span><span className="text-xl font-black text-[#7CE577]">92%</span></div><div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-[#7CE577]" style={{ width: '92%' }} /></div><div className="pt-4 space-y-2"><p className="text-[10px] text-white/60 flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-[#7CE577]" /> Documents Verified</p><p className="text-[10px] text-white/60 flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-[#7CE577]" /> NID Authenticated</p><p className="text-[10px] text-orange-400 flex items-center gap-2"><Layout className="w-3 h-3" /> Add work gallery to reach 100%</p></div></div>
            </div>
            <div className="finance-card p-8"><h3 className="font-bold text-gray-800 mb-6">Social Sharing</h3><p className="text-xs text-gray-400 leading-relaxed mb-6">Share your public portfolio link directly with families or agencies outside the platform.</p><div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between mb-4"><span className="text-[10px] font-mono text-gray-400 truncate">carenet.bd/rahat-khan-nurse</span><Button variant="ghost" size="icon" className="h-8 w-8 text-[#FEB4C5]"><Globe className="w-4 h-4" /></Button></div><Button className="w-full h-11 bg-gray-900 text-white rounded-xl text-xs font-bold">Copy Public Link</Button></div>
          </aside>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: ".finance-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 2rem; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03); }" }} />
    </div>
  );
}