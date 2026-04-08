"use client";

import React from "react";
import { DollarSign, ArrowLeft, ChevronRight, Calendar, Clock, User, MapPin, CheckCircle2, TrendingUp, Download, CreditCard, Briefcase, History, Activity } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { caregiverService } from "@/backend/services/caregiver.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { cn } from "@/frontend/theme/tokens";
import { PageHero } from "@/frontend/components/PageHero";
import { useTranslation } from "react-i18next";
import { formatBDT } from "@/frontend/utils/currency";

export default function DailyEarningsDetailPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.dailyEarningsDetail", "Daily Earnings Detail"));

  const { data: earningsDetail, loading } = useAsyncData(() => caregiverService.getDailyEarningsDetail());

  if (loading || !earningsDetail) return <PageSkeleton />;

  return (
    <div>
      <PageHero gradient="radial-gradient(143.86% 887.35% at -10.97% -22.81%, #7CE577 0%, #5FB865 100%)">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-12 text-white">
            <div className="flex items-center gap-4"><h1 className="text-2xl font-bold">Earnings Breakdown</h1></div>
            <div className="px-4 py-2 rounded-xl bg-white/10 text-[10px] font-black uppercase tracking-widest border border-white/10">{earningsDetail.date}</div>
          </div>
          <div className="finance-card p-10 !bg-white/10 !backdrop-blur-xl !border-white/20 text-white flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Net Earned Today</p>
              <p className="text-5xl font-black">{formatBDT(earningsDetail.totalEarnings)}</p>
            </div>
            <div className="flex gap-3"><Button className="bg-white text-[#5FB865] hover:bg-white/90 font-black rounded-2xl h-14 px-8 shadow-xl"><Download className="w-5 h-5 mr-2" /> Daily Statement</Button></div>
          </div>
        </div>
      </PageHero>

      <div className="max-w-4xl mx-auto px-6 -mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><History className="w-5 h-5 text-[#FEB4C5]" />Job Activity ({earningsDetail.shifts} Jobs)</h2>
            {earningsDetail.breakdown.map((job, i) => (
              <div key={i} className="finance-card p-6 flex items-center justify-between group hover:border-[#FEB4C5] transition-all">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-[#FFF5F7] flex items-center justify-center text-[#DB869A] group-hover:bg-[#FEB4C5] group-hover:text-white transition-all"><Briefcase className="w-6 h-6" /></div>
                  <div>
                    <h3 className="font-bold text-gray-800 leading-none">{job.client}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">{job.type} • {job.hours} hrs</p>
                    <div className="flex items-center gap-2 mt-2"><span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-[#E8F9E7] text-[#5FB865]">{job.time}</span></div>
                  </div>
                </div>
                <div className="text-right"><p className="text-lg font-black text-gray-800">{formatBDT(job.total)}</p><p className="text-[10px] text-gray-300 font-bold uppercase">{formatBDT(job.rate)}/hr</p></div>
              </div>
            ))}
          </div>

          <aside className="lg:col-span-1 space-y-6">
            <div className="finance-card p-8 bg-gray-900 text-white">
              <h3 className="font-bold mb-8">Daily Ledger</h3>
              {(() => {
                const gross = earningsDetail.breakdown.reduce((s, j) => s + j.total, 0);
                const platformFee = Math.round(gross * 0.05);
                const tds = Math.round(gross * 0.02);
                const net = gross - platformFee - tds;
                return (
                  <div className="space-y-4">
                    <div className="flex justify-between text-xs"><span className="text-white/40">Gross Earnings</span><span className="font-bold">{formatBDT(gross)}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-white/40">Platform Fee (5%)</span><span className="font-bold text-red-400">-{formatBDT(platformFee)}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-white/40">TDS / Tax (2%)</span><span className="font-bold text-red-400">-{formatBDT(tds)}</span></div>
                    <div className="pt-4 border-t border-white/10 flex justify-between items-center"><span className="text-sm font-black uppercase">Net Total</span><span className="text-2xl font-black text-[#7CE577]">{formatBDT(net)}</span></div>
                  </div>
                );
              })()}
            </div>
            <div className="finance-card p-8 bg-gradient-to-br from-[#FEB4C5]/10 to-[#DB869A]/10 border-[#FEB4C5]/20">
              <TrendingUp className="w-6 h-6 text-[#DB869A] mb-4" />
              <h3 className="text-lg font-black text-gray-800 mb-2">Today's Summary</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{earningsDetail.shifts} shifts · {earningsDetail.hours} hours · {formatBDT(earningsDetail.totalEarnings)} earned</p>
            </div>
          </aside>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: "\n        .finance-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 2.5rem; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03); }\n      " }} />
    </div>
  );
}