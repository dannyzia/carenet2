"use client";
import React from "react";
import { FileText, Download, TrendingUp, Calendar, ArrowLeft, ChevronRight, DollarSign, PieChart as PieChartIcon, ShieldCheck, Info } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { useNavigate } from "react-router";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { cn } from "@/frontend/theme/tokens";
import { PageHero } from "@/frontend/components/PageHero";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { caregiverService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useTranslation } from "react-i18next";
import { formatBDT } from "@/frontend/utils/currency";

const COLORS = ['#FEB4C5', '#DB869A', '#7CE577', '#5FB865', '#FFB74D', '#FF8A65'];

export default function TaxReportsPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.taxReports", "Tax Reports"));

  const navigate = useNavigate();
  const { data, loading } = useAsyncData(() => caregiverService.getTaxReportData());
  const { data: transactions, loading: loadingTx } = useAsyncData(() => caregiverService.getTransactions());

  if (loading || loadingTx || !data) return <PageSkeleton cards={3} />;

  const yearlyGross = data.reduce((sum, d) => sum + d.income, 0);
  const estimatedTax = Math.round(yearlyGross * 0.05);
  const tdsCertCount = data.length;

  const txList = transactions || [];
  const expenseCategories = ["Transport", "Supplies", "Communication", "Training"];
  const expenseAmounts = expenseCategories.map((cat, i) => {
    const catTx = txList.filter(tx => tx.desc?.toLowerCase().includes(cat.toLowerCase()) && tx.type === "debit");
    const total = catTx.reduce((sum, tx) => {
      const n = Number(String(tx.amount).replace(/[^\d.-]/g, ""));
      return sum + (Number.isFinite(n) ? Math.abs(n) : 0);
    }, 0);
    return { label: cat, val: total > 0 ? formatBDT(total) : formatBDT([8400, 5200, 3600, 4900][i]) };
  });
  const totalDeductibles = expenseAmounts.reduce((sum, e) => {
    const n = Number(String(e.val).replace(/[^\d.-]/g, ""));
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);

  return (
    <div>
      <PageHero gradient="radial-gradient(143.86% 887.35% at -10.97% -22.81%, #1F2937 0%, #111827 100%)">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8"><div className="flex items-center gap-4"><h1 className="text-2xl font-bold text-white">Financial & Tax Reports</h1></div><div className="flex gap-2"><Button className="bg-[#7CE577] hover:bg-[#5FB865] text-white font-bold rounded-xl h-12 shadow-lg px-6"><Download className="w-4 h-4 mr-2" /> Download Annual Report</Button></div></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="finance-card p-6 !bg-white/5 !backdrop-blur-xl !border-white/10 text-white"><p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-2">Yearly Gross</p><p className="text-3xl font-black">{formatBDT(yearlyGross)}</p><div className="flex items-center gap-1 text-[#7CE577] text-xs font-bold mt-2"><TrendingUp className="w-3 h-3" /> {data.length} months on record</div></div>
            <div className="finance-card p-6 !bg-white/5 !backdrop-blur-xl !border-white/10 text-white"><p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-2">Estimated Tax</p><p className="text-3xl font-black text-orange-400">{formatBDT(estimatedTax)}</p><p className="text-white/40 text-[10px] mt-2 italic">Based on 5% platform deduction</p></div>
            <div className="finance-card p-6 !bg-white/5 !backdrop-blur-xl !border-white/10 text-white"><p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-2">TDS Certificates</p><p className="text-3xl font-black">{tdsCertCount} Available</p><p className="text-[#FEB4C5] text-[10px] font-bold mt-2 uppercase underline cursor-pointer">View Archive</p></div>
          </div>
        </div>
      </PageHero>
      <div className="max-w-5xl mx-auto px-6 -mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="finance-card p-8"><div className="flex justify-between items-center mb-8"><h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><PieChartIcon className="w-5 h-5 text-[#FEB4C5]" />Monthly Income Breakdown</h2><select className="bg-gray-100 border-none rounded-lg text-xs font-bold px-3 py-1.5 outline-none"><option>FY 2025-26</option><option>FY 2024-25</option></select></div><div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#999' }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#999' }} /><Tooltip cursor={{ fill: '#f8f8f8' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} /><Bar dataKey="income" radius={[6, 6, 0, 0]} barSize={40}>{data.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Bar></BarChart></ResponsiveContainer></div></div>
            <div className="finance-card p-8"><h2 className="text-xl font-bold text-gray-800 mb-6">Financial Documents</h2><div className="space-y-4">{[{ title: "Annual Income Statement FY2025-26", size: "245 KB", type: "PDF" }, { title: "TDS Certificate Q1-Q4", size: "128 KB", type: "PDF" }, { title: "Platform Fee Summary", size: "89 KB", type: "PDF" }].map((doc, i) => (<div key={i} className="p-4 rounded-2xl border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-all group"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-[#FFF5F7] text-[#FEB4C5] flex items-center justify-center group-hover:bg-[#FEB4C5] group-hover:text-white transition-all"><FileText className="w-6 h-6" /></div><div><p className="font-bold text-gray-800 text-sm">{doc.title}</p><p className="text-[10px] text-gray-400 uppercase font-medium">{doc.size} • {doc.type}</p></div></div><Button variant="ghost" size="icon" className="text-gray-300 hover:text-[#FEB4C5]"><Download className="w-5 h-5" /></Button></div>))}</div></div>
          </div>
          <div className="lg:col-span-1 space-y-6">
            <div className="finance-card p-8 bg-orange-50 border-orange-100"><h3 className="text-orange-700 font-bold mb-4 flex items-center gap-2"><Info className="w-5 h-5" />Bangladesh Tax Guide</h3><p className="text-sm text-orange-600 leading-relaxed mb-6">Under current regulations, individual care providers earning below ৳3.5L annually may be exempt from certain income taxes. Consult with a professional for precise filing.</p><Button className="w-full h-12 bg-orange-600 text-white rounded-xl shadow-lg font-bold hover:bg-orange-700">Talk to Tax Advisor</Button></div>
            <div className="finance-card p-8"><h3 className="font-bold text-gray-800 mb-6">Expense Summary</h3><div className="space-y-4">{expenseAmounts.map((e, i) => (<div key={i} className="flex justify-between text-xs"><span className="text-gray-400 font-medium">{e.label}</span><span className="text-gray-800 font-bold">{e.val}</span></div>))}<div className="pt-4 border-t border-gray-100 flex justify-between"><span className="text-sm font-bold text-gray-800">Total Deductibles</span><span className="text-sm font-bold text-[#FEB4C5]">{formatBDT(totalDeductibles)}</span></div></div></div>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: ".finance-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 2.5rem; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03); }" }} />
    </div>
  );
}