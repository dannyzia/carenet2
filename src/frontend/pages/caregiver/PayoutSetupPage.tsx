"use client";
import React from "react";
import { CreditCard, Plus, ChevronRight, ArrowLeft, CheckCircle2, ShieldCheck, History, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { cn } from "@/frontend/theme/tokens";
import { PageHero } from "@/frontend/components/PageHero";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { caregiverService } from "@/backend/services/caregiver.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { useTranslation } from "react-i18next";

export default function PayoutSetupPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.payoutSetup", "Payout Setup"));

  const { data: payoutSettings, loading } = useAsyncData(() => caregiverService.getPayoutSettings());

  if (loading || !payoutSettings) return <PageSkeleton />;

  return (
    <div>
      <PageHero gradient="radial-gradient(143.86% 887.35% at -10.97% -22.81%, #7CE577 0%, #5FB865 100%)">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8"><h1 className="text-2xl font-bold text-white">Payout Methods</h1></div>
          <div className="finance-card p-6 !bg-white/10 !backdrop-blur-xl !border-white/20 flex items-center justify-between">
            <div className="flex items-center gap-4"><div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white"><Wallet className="w-7 h-7" /></div><div><p className="text-white font-bold text-lg">Next Payout</p><p className="text-white/70 text-sm">March 25, 2026</p></div></div>
            <div className="text-right"><p className="text-3xl font-black text-white">৳12,500</p><p className="text-white/70 text-[10px] font-bold uppercase">Ready to withdraw</p></div>
          </div>
        </div>
      </PageHero>
      <div className="max-w-4xl mx-auto px-6 -mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="finance-card p-8">
              <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-gray-800">Your Accounts</h2><Button variant="ghost" className="text-[#5FB865] font-bold text-sm"><Plus className="w-4 h-4 mr-1" /> Add New</Button></div>
              <div className="space-y-4">
                {[{ name: "bKash", account: "017XXXXX901", primary: true, icon: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bkash_logo.png" }, { name: "Nagad", account: "018XXXXX452", primary: false, icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Nagad_logo.svg/2560px-Nagad_logo.svg.png" }, { name: "Dutch Bangla Bank", account: "214.101.XXXX", primary: false, icon: "https://seeklogo.com/images/D/dutch-bangla-bank-logo-7F4C811361-seeklogo.com.png" }].map((m, i) => (
                  <div key={i} className={`p-5 rounded-2xl border flex items-center justify-between transition-all ${m.primary ? 'border-[#7CE577] bg-[#E8F9E7]/30' : 'border-gray-100 bg-white hover:border-[#7CE577]/50'}`}>
                    <div className="flex items-center gap-4"><div className="w-14 h-14 rounded-xl bg-white p-2 border border-gray-100 flex items-center justify-center shadow-sm"><img src={m.icon} className="h-full w-full object-contain" alt={m.name} /></div><div><p className="font-bold text-gray-800">{m.name}</p><p className="text-xs text-gray-400 font-medium">{m.account}</p></div></div>
                    <div className="flex items-center gap-4">{m.primary && <span className="text-[10px] font-bold text-[#5FB865] bg-white px-2 py-1 rounded border border-[#7CE577]/20 uppercase">Primary</span>}<button className="text-gray-300 hover:text-gray-500"><ChevronRight className="w-5 h-5" /></button></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="finance-card p-8 bg-gray-900 text-white relative overflow-hidden">
              <div className="relative z-10"><h2 className="text-xl font-bold mb-2 flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-[#7CE577]" />Secure Payouts</h2><p className="text-white/60 text-sm mb-6 max-w-md">All financial transactions are encrypted and monitored for your safety. CareNet does not store your full banking credentials.</p><Button className="h-12 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/20 font-bold">View Security Settings</Button></div>
              <ShieldCheck className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 opacity-10" />
            </div>
          </div>
          <div className="lg:col-span-1 space-y-6">
            <div className="finance-card p-8"><h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><History className="w-5 h-5 text-gray-400" />Recent History</h3><div className="space-y-6">{[{ date: "Mar 10", amount: "+৳8,400", status: "Completed" }, { date: "Feb 25", amount: "+৳15,200", status: "Completed" }, { date: "Feb 10", amount: "+৳9,100", status: "Completed" }].map((h, i) => (<div key={i} className="flex justify-between items-center"><div><p className="text-sm font-bold text-gray-800">{h.amount}</p><p className="text-[10px] text-gray-400">{h.date}</p></div><span className="text-[10px] font-bold text-[#5FB865] bg-[#E8F9E7] px-2 py-1 rounded uppercase">{h.status}</span></div>))}</div><Button variant="ghost" className="w-full mt-8 text-sm font-bold text-[#5FB865]">View Full Report</Button></div>
            <div className="finance-card p-8 border-l-4 border-[#7CE577]"><TrendingUp className="w-6 h-6 text-[#7CE577] mb-4" /><p className="text-xs text-gray-400 mb-1">Growth this month</p><h4 className="text-2xl font-black text-gray-800">+12%</h4><p className="text-[10px] text-[#5FB865] font-bold mt-2">৳4,200 more than last month</p></div>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: ".finance-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 2rem; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03); }" }} />
    </div>
  );
}