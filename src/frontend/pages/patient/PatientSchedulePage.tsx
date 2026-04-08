import { useState } from "react";
import { cn } from "@/frontend/theme/tokens";
import { Calendar, Clock, User, ChevronLeft, ChevronRight, Pill, Activity, Heart, Dumbbell, UtensilsCrossed, Bell, MapPin } from "lucide-react";
import React from "react";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { patientService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useTranslation } from "react-i18next";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const today = new Date();

function buildPatientWeek() {
  const dayOfWeek = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return weekDays.map((_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return { dayNum: d.getDate(), month: months[d.getMonth()], year: d.getFullYear() };
  });
}
const patientWeek = buildPatientWeek();
const weekStart = patientWeek[0];
const weekEnd = patientWeek[6];
const weekLabel = weekStart.month === weekEnd.month
  ? `${weekStart.month} ${weekStart.dayNum}-${weekEnd.dayNum}, ${weekEnd.year}`
  : `${weekStart.month} ${weekStart.dayNum} - ${weekEnd.month} ${weekEnd.dayNum}, ${weekEnd.year}`;
const typeConfig: Record<string, { icon: React.ElementType; color: string }> = { medication: { icon: Pill, color: "#5FB865" }, vitals: { icon: Activity, color: "#0288D1" }, therapy: { icon: Dumbbell, color: "#7B5EA7" }, meal: { icon: UtensilsCrossed, color: "#E64A19" }, appointment: { icon: Heart, color: "#E91E63" }, general: { icon: Calendar, color: "#6B7280" } };

export default function PatientSchedulePage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.patientSchedule", "Patient Schedule"));

  const [view, setView] = useState<"today" | "week" | "upcoming">("today");
  const { data: todayEvents, loading: lT } = useAsyncData(() => patientService.getTodayEvents());
  const { data: upcomingEvents, loading: lU } = useAsyncData(() => patientService.getUpcomingEvents());

  if (lT || lU || !todayEvents || !upcomingEvents) return <PageSkeleton cards={4} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h1 className="text-xl" style={{ color: cn.textHeading }}>My Care Schedule</h1><p className="text-sm mt-0.5" style={{ color: cn.textSecondary }}>Today: {todayEvents.length} scheduled activities</p></div><div className="flex rounded-lg overflow-hidden border" style={{ borderColor: cn.border }}>{(["today", "week", "upcoming"] as const).map(v => (<button key={v} onClick={() => setView(v)} className="px-3 py-2 text-sm capitalize" style={{ background: view === v ? "var(--cn-blue)" : cn.bgCard, color: view === v ? "white" : cn.text }}>{v}</button>))}</div></div>
      {view === "today" && (<div className="space-y-3"><div className="finance-card p-4 flex items-center gap-3" style={{ background: "var(--cn-blue-bg)" }}><Calendar className="w-5 h-5" style={{ color: "var(--cn-blue)" }} /><div><p className="text-sm" style={{ color: cn.text }}>Today, {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p><p className="text-xs" style={{ color: cn.textSecondary }}>{todayEvents.length} activities planned</p></div></div>{todayEvents.map((event, idx) => { const cfg = typeConfig[event.type]; const Icon = cfg.icon; return (<div key={event.id} className="finance-card p-4 flex items-start gap-3"><div className="flex flex-col items-center shrink-0"><div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${cfg.color}15` }}><Icon className="w-4 h-4" style={{ color: cfg.color }} /></div>{idx < todayEvents.length - 1 && <div className="w-0.5 h-8 mt-1" style={{ background: cn.borderLight }} />}</div><div className="flex-1"><p className="text-sm" style={{ color: cn.text }}>{event.title}</p><div className="flex flex-wrap gap-3 mt-1 text-xs" style={{ color: cn.textSecondary }}><span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {event.time} ({event.duration})</span><span className="flex items-center gap-1"><User className="w-3 h-3" /> {event.caregiver}</span></div>{event.location && <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "var(--cn-blue)" }}><MapPin className="w-3 h-3" /> {event.location}</p>}{event.notes && <p className="text-xs mt-1" style={{ color: cn.textSecondary }}>{event.notes}</p>}</div></div>); })}</div>)}
      {view === "week" && (<div className="finance-card p-5"><div className="flex items-center justify-between mb-4"><button className="p-2 rounded-lg"><ChevronLeft className="w-5 h-5" style={{ color: cn.textSecondary }} /></button><h3 style={{ color: cn.text }}>{weekLabel}</h3><button className="p-2 rounded-lg"><ChevronRight className="w-5 h-5" style={{ color: cn.textSecondary }} /></button></div><div className="grid grid-cols-7 gap-2">{weekDays.map((day, i) => { const isToday = i === today.getDay(); const { dayNum } = patientWeek[i]; const eventCount = i === today.getDay() ? todayEvents.length : Math.max(0, todayEvents.length - Math.abs(i - today.getDay())); return (<div key={day} className="text-center p-2 rounded-xl" style={{ background: isToday ? "var(--cn-blue-bg)" : "transparent" }}><p className="text-xs" style={{ color: cn.textSecondary }}>{day}</p><p className="text-sm my-1" style={{ color: isToday ? "var(--cn-blue)" : cn.text }}>{dayNum}</p><p className="text-[10px] mt-0.5" style={{ color: cn.textSecondary }}>{eventCount} items</p></div>); })}</div></div>)}
      {view === "upcoming" && (<div className="space-y-3">{upcomingEvents.map((event, i) => { const cfg = typeConfig[event.type]; const Icon = cfg.icon; return (<div key={i} className="finance-card p-4 flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${cfg.color}15` }}><Icon className="w-4 h-4" style={{ color: cfg.color }} /></div><div className="flex-1"><p className="text-sm" style={{ color: cn.text }}>{event.title}</p><div className="flex gap-3 text-xs mt-0.5" style={{ color: cn.textSecondary }}><span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {event.date}</span><span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {event.time}</span></div></div><Bell className="w-4 h-4 shrink-0" style={{ color: cn.textSecondary }} /></div>); })}</div>)}
      <div className="finance-card p-4"><h3 className="text-sm mb-3 flex items-center gap-2" style={{ color: cn.text }}><Bell className="w-4 h-4" style={{ color: cn.amber }} /> Active Reminders</h3><div className="space-y-2">{upcomingEvents.slice(0, 2).map((r, i) => (<div key={i} className="p-3 rounded-xl flex items-center gap-3" style={{ background: cn.bgInput }}><Clock className="w-4 h-4 shrink-0" style={{ color: cn.amber }} /><div><p className="text-xs" style={{ color: cn.text }}>{r.title}</p><p className="text-[10px]" style={{ color: cn.textSecondary }}>{r.date} at {r.time}</p></div></div>))}{upcomingEvents.length === 0 && <p className="text-xs" style={{ color: cn.textSecondary }}>No upcoming reminders</p>}</div></div>
    </div>
  );
}