import { useState } from "react";
import { cn } from "@/frontend/theme/tokens";
import { Calendar, Clock, User, Plus, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { guardianService } from "@/backend/services/guardian.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { useTranslation } from "react-i18next";

function buildWeekDays() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);
  const shorts = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return shorts.map((short, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return { short, date: d.getDate(), month: months[d.getMonth()], isToday: i === dayOfWeek };
  });
}
const weekDays = buildWeekDays();

export default function GuardianSchedulePage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.guardianSchedule", "Guardian Schedule"));

  const [view, setView] = useState<"today" | "week" | "all">("today");
  const [showModal, setShowModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const { data: appointments, loading: l1 } = useAsyncData(() => guardianService.getScheduleAppointments());
  const { data: todayEvents, loading: l2 } = useAsyncData(() => guardianService.getScheduleTodayEvents());

  if (l1 || l2 || !appointments || !todayEvents) return <PageSkeleton cards={4} />;

  return (
    <div className="space-y-5">
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-3"><h1 className="text-xl" style={{ color: cn.textHeading }}>Care Schedule</h1><button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm cn-touch-target" style={{ background: "var(--cn-gradient-guardian)" }}><Plus className="w-4 h-4" /> Book</button></div>
        <div className="flex gap-2 overflow-x-auto cn-scroll-x pb-2 -mx-1 px-1">
          {weekDays.map((day) => { const isSelected = day.date === selectedDay; return (<button key={day.date} onClick={() => { setSelectedDay(day.date); setView("today"); }} className="flex flex-col items-center py-2 px-3 rounded-xl min-w-[52px] transition-all cn-no-select" style={{ background: isSelected ? "var(--cn-gradient-guardian)" : cn.bgCard, boxShadow: isSelected ? "0 4px 12px rgba(95,184,101,0.3)" : cn.shadowCard, color: isSelected ? "#fff" : cn.text }}><span className="text-[10px] uppercase" style={{ opacity: isSelected ? 0.8 : 0.5 }}>{day.short}</span><span className="text-lg" style={{ fontWeight: isSelected ? 700 : 500 }}>{day.date}</span>{day.isToday && (<div className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ background: isSelected ? "#fff" : cn.green }} />)}</button>); })}
        </div>
        <div className="mt-4 space-y-3">
          {todayEvents.map((ev, i) => (<div key={i} className="flex gap-3 p-3 rounded-xl cn-touch-target" style={{ background: cn.bgCard, boxShadow: cn.shadowCard, borderLeft: `3px solid ${ev.color}` }}><div className="text-right shrink-0 w-14"><p className="text-sm" style={{ color: cn.text, fontWeight: 600 }}>{ev.time}</p></div><div className="flex-1 min-w-0"><p className="text-sm truncate" style={{ color: cn.text, fontWeight: 500 }}>{ev.title}</p><div className="flex items-center gap-2 mt-1 text-xs" style={{ color: cn.textSecondary }}><span className="flex items-center gap-1 truncate"><User className="w-3 h-3 shrink-0" />{ev.caregiver}</span><span className="truncate">{ev.patient}</span></div></div><div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ background: ev.color }} /></div>))}
        </div>
      </div>
      <div className="hidden md:block space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div><h1 className="text-2xl font-semibold" style={{ color: "#535353" }}>Care Schedule</h1><p className="text-sm" style={{ color: "#848484" }}>View and manage all care appointments</p></div>
          <div className="flex gap-2"><div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "#E5E7EB" }}>{(["today", "week", "all"] as const).map(v => (<button key={v} onClick={() => setView(v)} className="px-3 py-2 text-xs capitalize transition-all" style={{ background: view === v ? "#5FB865" : "white", color: view === v ? "white" : "#535353" }}>{v}</button>))}</div><button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm" style={{ background: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #A8F5A3 0%, #5FB865 100%)" }}><Plus className="w-4 h-4" /> Book</button></div>
        </div>
        {view === "today" && (<div className="grid grid-cols-1 lg:grid-cols-3 gap-5"><div className="finance-card p-5 lg:col-span-2"><div className="flex items-center justify-between mb-4"><h2 className="font-semibold" style={{ color: "#535353" }}>Today \u2014 {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</h2><div className="flex gap-1"><button className="p-1.5 rounded hover:bg-gray-100"><ChevronLeft className="w-4 h-4" style={{ color: "#848484" }} /></button><button className="p-1.5 rounded hover:bg-gray-100"><ChevronRight className="w-4 h-4" style={{ color: "#848484" }} /></button></div></div><div className="space-y-3">{todayEvents.map((ev, i) => (<div key={i} className="flex gap-4 p-4 rounded-xl" style={{ background: "#F9FAFB", borderLeft: `3px solid ${ev.color}` }}><div className="text-right shrink-0 w-16"><p className="text-sm font-semibold" style={{ color: "#535353" }}>{ev.time}</p></div><div className="flex-1"><p className="font-medium text-sm" style={{ color: "#535353" }}>{ev.title}</p><div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "#848484" }}><span className="flex items-center gap-1"><User className="w-3 h-3" />{ev.caregiver}</span><span>\u2022</span><span>{ev.patient}</span></div></div><div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ background: ev.color }} /></div>))}</div></div><div className="space-y-4"><div className="finance-card p-5"><h3 className="font-semibold mb-3" style={{ color: "#535353" }}>Quick Stats</h3><div className="space-y-3">{[{ label: "Sessions Today", value: String(todayEvents.length), color: "#DB869A" }, { label: "Active Caregivers", value: String(new Set(todayEvents.map(e => e.caregiver)).size), color: "#5FB865" }, { label: "Hours Booked", value: `${todayEvents.length * 3}h`, color: "#7B5EA7" }].map(s => (<div key={s.label} className="flex justify-between items-center"><p className="text-sm" style={{ color: "#848484" }}>{s.label}</p><p className="font-bold text-sm" style={{ color: s.color }}>{s.value}</p></div>))}</div></div><div className="finance-card p-4"><h3 className="text-sm font-semibold mb-3" style={{ color: "#535353" }}>Upcoming This Week</h3><div className="space-y-2">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (<div key={d} className="flex items-center gap-2"><span className="text-xs w-8" style={{ color: "#848484" }}>{d}</span><div className="flex-1 h-2 rounded-full" style={{ background: "#F3F4F6" }}>{i < 5 && <div className="h-full rounded-full" style={{ width: `${60 + i * 8}%`, background: "radial-gradient(to right, #A8F5A3, #5FB865)" }} />}</div><span className="text-xs" style={{ color: "#848484" }}>{i < 5 ? `${2 + i}` : "0"}h</span></div>))}</div></div></div></div>)}
        {view === "all" && (<div className="space-y-3">{appointments.map(a => (<div key={a.id} className="finance-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="w-3 h-10 rounded-full shrink-0" style={{ background: a.color }} /><div><p className="font-medium text-sm" style={{ color: "#535353" }}>{a.title}</p><div className="flex items-center gap-3 text-xs mt-0.5" style={{ color: "#848484" }}><span className="flex items-center gap-1"><User className="w-3 h-3" />{a.caregiver}</span><span className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.time}</span><span>{a.date}</span></div></div></div><div className="flex items-center gap-2"><span className="badge-pill" style={{ background: `${a.color}20`, color: a.color }}>{a.type}</span><button className="px-3 py-1.5 rounded-lg text-xs border hover:bg-gray-50" style={{ borderColor: "#E5E7EB", color: "#535353" }}>Edit</button><button className="px-3 py-1.5 rounded-lg text-xs border hover:bg-red-50" style={{ borderColor: "#EF4444", color: "#EF4444" }}>Cancel</button></div></div>))}</div>)}
      </div>
      <style dangerouslySetInnerHTML={{ __html: ".finance-card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); } .badge-pill { display: inline-flex; align-items: center; padding: 0.2rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 500; }" }} />
    </div>
  );
}