"use client";
import React from "react";
import { Users, Calendar, Clock, CheckCircle2, XCircle, ArrowLeft, Search, Filter, FileSpreadsheet, AlertTriangle, MapPin, ChevronRight } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { agencyService } from "@/backend/services/agency.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { cn } from "@/frontend/theme/tokens";
import { PageHero } from "@/frontend/components/shared/PageHero";
import { useTranslation } from "react-i18next";

export default function StaffAttendancePage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.staffAttendance", "Staff Attendance"));

  const { data: attendance, loading } = useAsyncData(() => agencyService.getStaffAttendance());

  if (loading || !attendance) return <PageSkeleton />;

  const attendanceRows = Array.isArray(attendance)
    ? attendance
    : (attendance.staff || []).map((row) => ({
      name: row.name,
      role: row.role,
      site: "Assigned Shift",
      checkin: row.checkIn || "—",
      duration: row.checkIn ? 8 : 0,
      alert: row.status === "late" || row.status === "absent",
      status: row.status,
    }));

  const attendanceDate = Array.isArray(attendance) ? "Today" : attendance.date;

  return (
    <div>
      <PageHero gradient="radial-gradient(143.86% 887.35% at -10.97% -22.81%, #7CE577 0%, #5FB865 100%)" className="pt-8 pb-32 px-6"><div className="max-w-6xl mx-auto"><div className="flex justify-between items-center mb-8"><h1 className="text-2xl font-bold text-white">Attendance Monitoring</h1><Button className="bg-white text-[#5FB865] hover:bg-white/90 font-bold rounded-xl h-11 px-6 shadow-lg"><FileSpreadsheet className="w-4 h-4 mr-2" /> Export Logs</Button></div><div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">{[{ label: "Currently On Shift", val: "42", status: "ok" }, { label: "Delayed Check-ins", val: "3", status: "warning" }, { label: "No Show / Alert", val: "1", status: "error" }, { label: "Shifts Completed Today", val: "128", status: "ok" }].map((s, i) => (<div key={i} className="flex-shrink-0 w-64 finance-card p-6 !bg-white/10 !backdrop-blur-xl !border-white/20 text-white"><p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2 leading-none">{s.label}</p><div className="flex items-center justify-between"><p className="text-3xl font-black">{s.val}</p><div className={`w-3 h-3 rounded-full ${s.status === 'ok' ? 'bg-[#7CE577]' : s.status === 'warning' ? 'bg-orange-400 animate-pulse' : 'bg-red-500 animate-ping'}`} /></div></div>))}</div></div></PageHero>
      <div className="max-w-6xl mx-auto px-6 -mt-16"><div className="finance-card overflow-hidden"><div className="p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6"><div className="flex items-center gap-8 w-full md:w-auto"><div className="relative flex-1 md:w-80"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" /><input type="text" placeholder="Search staff member..." className="w-full h-11 pl-11 pr-4 rounded-xl border border-gray-100 bg-gray-50/50 text-sm outline-none" /></div><div className="hidden md:flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /><span className="text-sm font-bold text-gray-800">{attendanceDate}</span></div></div></div><div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-gray-50/50 border-b border-gray-100"><tr><th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Staff Member</th><th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Patient / Site</th><th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Check-In</th><th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Duration</th><th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th><th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Action</th></tr></thead><tbody className="divide-y divide-gray-50">{attendanceRows.map((row, i) => (<tr key={i} className="hover:bg-gray-50/50 transition-colors"><td className="px-8 py-6"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-[#FFF5F7] text-[#FEB4C5] flex items-center justify-center font-black text-xs">{row.name.charAt(0)}</div><div><p className="text-sm font-bold text-gray-800 leading-none">{row.name}</p><p className="text-[10px] text-gray-400 mt-1 font-bold">{row.role}</p></div></div></td><td className="px-8 py-6"><div className="flex items-center gap-2"><MapPin className="w-3 h-3 text-gray-300" /><span className="text-xs font-bold text-gray-600">{row.site}</span></div></td><td className="px-8 py-6"><div className="flex items-center gap-2"><Clock className="w-3 h-3 text-gray-300" /><span className="text-xs font-bold text-gray-600">{row.checkin}</span></div></td><td className="px-8 py-6"><span className="text-xs font-black text-gray-800">{row.duration}h</span></td><td className="px-8 py-6"><div className="flex items-center gap-2"><div className={`w-1.5 h-1.5 rounded-full ${row.alert ? 'bg-orange-500 animate-pulse' : 'bg-[#7CE577]'}`} /><span className={`text-[10px] font-black uppercase tracking-wider ${row.alert ? 'text-orange-500' : 'text-[#5FB865]'}`}>{row.status}</span></div></td><td className="px-8 py-6"><Button variant="ghost" size="icon" className="text-gray-200 hover:text-gray-800"><ChevronRight className="w-5 h-5" /></Button></td></tr>))}</tbody></table></div><div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-center"><Button variant="ghost" className="text-xs font-bold text-gray-400">View Historical Logs</Button></div></div></div>
      <style dangerouslySetInnerHTML={{ __html: ".finance-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 2.5rem; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03); } .scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }" }} />
    </div>
  );
}
