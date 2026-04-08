import { useState, useEffect } from "react";
import { cn } from "@/frontend/theme/tokens";
import {
  Pill, Clock, Bell, Plus, CheckCircle2, XCircle, Calendar,
  User, ChevronLeft, ChevronRight, AlertTriangle, Repeat,
  Sun, Moon, Sunrise, Sunset,
} from "lucide-react";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { caregiverService } from "@/backend/services/caregiver.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import type { MedScheduleItem } from "@/backend/models";
import { MedicineSearchCombobox } from "@/frontend/components/shared/MedicineSearchCombobox";
import { useTranslation } from "react-i18next";

const timingIcons = { morning: Sunrise, afternoon: Sun, evening: Sunset, night: Moon };
const timingColors: Record<string, string> = { morning: "#FF9800", afternoon: "#2196F3", evening: "#9C27B0", night: "#3F51B5" };

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CaregiverMedSchedulePage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.caregiverMedSchedule", "Caregiver Med Schedule"));

  const { data: initialSchedule, loading } = useAsyncData(() => caregiverService.getMedSchedule());
  const [schedule, setSchedule] = useState<MedScheduleItem[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [view, setView] = useState<"today" | "week" | "setup">("today");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSched, setNewSched] = useState({
    patientName: "", medicineName: "", genericName: "", dosage: "", time: "",
    timing: "morning" as "morning" | "afternoon" | "evening" | "night",
    instructions: "", repeat: "daily" as string,
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    reminderMinutes: 15,
  });

  // Sync loaded data into local state once
  if (initialSchedule && !initialized) {
    setSchedule(initialSchedule);
    setInitialized(true);
  }

  if (loading || !initialSchedule) return <PageSkeleton cards={4} />;

  const markTaken = (id: string) => {
    setSchedule(s => s.map(item =>
      item.id === id ? { ...item, taken: true, takenAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) } : item
    ));
  };
  const markMissed = (id: string) => {
    setSchedule(s => s.map(item => item.id === id ? { ...item, taken: false } : item));
  };

  const takenCount = schedule.filter(s => s.taken === true).length;
  const missedCount = schedule.filter(s => s.taken === false).length;
  const pendingCount = schedule.filter(s => s.taken === null).length;

  const groupedByTiming = {
    morning: schedule.filter(s => s.timing === "morning"),
    afternoon: schedule.filter(s => s.timing === "afternoon"),
    evening: schedule.filter(s => s.timing === "evening"),
    night: schedule.filter(s => s.timing === "night"),
  };

  const toggleDay = (day: string) => {
    setNewSched(s => ({ ...s, days: s.days.includes(day) ? s.days.filter(d => d !== day) : [...s.days, day] }));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl" style={{ color: cn.textHeading }}>Medication Schedule</h1>
          <p className="text-sm mt-0.5" style={{ color: cn.textSecondary }}>Today: {takenCount} taken, {pendingCount} pending, {missedCount} missed</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: cn.border }}>
            {(["today", "week", "setup"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} className="px-3 py-2 text-sm capitalize"
                style={{ background: view === v ? cn.pink : cn.bgCard, color: view === v ? "white" : cn.text }}>
                {v === "setup" ? "Setup" : v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="finance-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: cn.textSecondary }}>Today's Progress</span>
          <span className="text-xs" style={{ color: cn.green }}>{takenCount}/{schedule.length} administered</span>
        </div>
        <div className="w-full h-2 rounded-full" style={{ background: cn.borderLight }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${(takenCount / schedule.length) * 100}%`, background: "var(--cn-gradient-caregiver)" }} />
        </div>
        <div className="flex gap-4 mt-2">
          <span className="flex items-center gap-1 text-xs" style={{ color: cn.green }}><CheckCircle2 className="w-3 h-3" /> {takenCount} Taken</span>
          <span className="flex items-center gap-1 text-xs" style={{ color: cn.amber }}><Clock className="w-3 h-3" /> {pendingCount} Pending</span>
          {missedCount > 0 && <span className="flex items-center gap-1 text-xs" style={{ color: cn.red }}><XCircle className="w-3 h-3" /> {missedCount} Missed</span>}
        </div>
      </div>

      {view === "today" && (
        <div className="space-y-5">
          {(Object.entries(groupedByTiming) as [string, MedScheduleItem[]][]).map(([timing, items]) => {
            if (items.length === 0) return null;
            const Icon = timingIcons[timing as keyof typeof timingIcons];
            const color = timingColors[timing];
            return (
              <div key={timing}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-4 h-4" style={{ color }} />
                  <h3 className="text-sm capitalize" style={{ color: cn.text }}>{timing}</h3>
                  <span className="text-xs" style={{ color: cn.textSecondary }}>({items.length} meds)</span>
                </div>
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.id} className="finance-card p-4 flex items-center gap-3"
                      style={{ borderLeft: `3px solid ${item.taken === true ? cn.green : item.taken === false ? cn.red : color}`, opacity: item.taken === true ? 0.7 : 1 }}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Pill className="w-4 h-4" style={{ color: cn.pink }} />
                          <span className="text-sm" style={{ color: cn.text, textDecoration: item.taken === true ? "line-through" : "none" }}>
                            {item.medicineName} — {item.dosage}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs" style={{ color: cn.textSecondary }}>
                          <span className="flex items-center gap-1"><User className="w-3 h-3" /> {item.patientName}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.scheduledTime}</span>
                        </div>
                        {item.instructions && <p className="text-xs mt-1" style={{ color: cn.textSecondary }}>{item.instructions}</p>}
                        {item.taken === true && item.takenAt && <p className="text-xs mt-1 flex items-center gap-1" style={{ color: cn.green }}><CheckCircle2 className="w-3 h-3" /> Administered at {item.takenAt}</p>}
                        {item.taken === false && <p className="text-xs mt-1 flex items-center gap-1" style={{ color: cn.red }}><XCircle className="w-3 h-3" /> Missed</p>}
                      </div>
                      {item.taken === null && (
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => markTaken(item.id)} className="p-2 rounded-lg" style={{ background: cn.greenBg }}><CheckCircle2 className="w-4 h-4" style={{ color: cn.green }} /></button>
                          <button onClick={() => markMissed(item.id)} className="p-2 rounded-lg" style={{ background: "rgba(239,68,68,0.1)" }}><XCircle className="w-4 h-4" style={{ color: cn.red }} /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "week" && (
        <div className="finance-card p-5 overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <button className="p-2 rounded-lg"><ChevronLeft className="w-5 h-5" style={{ color: cn.textSecondary }} /></button>
            <h3 style={{ color: cn.text }}>This Week</h3>
            <button className="p-2 rounded-lg"><ChevronRight className="w-5 h-5" style={{ color: cn.textSecondary }} /></button>
          </div>
          <div className="min-w-[500px]">
            <div className="grid grid-cols-8 gap-1 mb-2">
              <div className="text-xs" style={{ color: cn.textSecondary }}>Medicine</div>
              {weekDays.map(d => <div key={d} className="text-center text-xs" style={{ color: cn.text }}>{d}</div>)}
            </div>
            {schedule.map((med, i) => (
              <div key={i} className="grid grid-cols-8 gap-1 border-t py-2" style={{ borderColor: cn.borderLight }}>
                <div className="pr-2">
                  <p className="text-xs truncate" style={{ color: cn.text }}>{med.medicineName} {med.dosage}</p>
                  <p className="text-[10px] truncate" style={{ color: cn.textSecondary }}>{med.patientName}</p>
                </div>
                {weekDays.map((_, j) => (
                  <div key={j} className="flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: cn.greenBg }}><CheckCircle2 className="w-3.5 h-3.5" style={{ color: cn.green }} /></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "setup" && (
        <div className="space-y-4">
          <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm" style={{ background: "var(--cn-gradient-caregiver)" }}>
            <Plus className="w-4 h-4" /> Add Recurring Schedule
          </button>

          {showAddForm && (
            <div className="finance-card p-5 space-y-4" style={{ borderLeft: `3px solid ${cn.pink}` }}>
              <h3 className="text-sm flex items-center gap-2" style={{ color: cn.pink }}><Bell className="w-4 h-4" /> New Medication Schedule</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="text-xs mb-1.5 block" style={{ color: cn.textSecondary }}>Patient</label><select value={newSched.patientName} onChange={e => setNewSched({ ...newSched, patientName: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }}><option value="">Select patient</option>{[...new Set(schedule.map(s => s.patientName))].map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                <div><label className="text-xs mb-1.5 block" style={{ color: cn.textSecondary }}>Medicine</label><MedicineSearchCombobox value={newSched.medicineName} genericLabel={newSched.genericName} onChange={({ name, generic }) => setNewSched({ ...newSched, medicineName: name, genericName: generic })} placeholder="Search BD medicine…" /></div>
                <div><label className="text-xs mb-1.5 block" style={{ color: cn.textSecondary }}>Dosage</label><input type="text" value={newSched.dosage} onChange={e => setNewSched({ ...newSched, dosage: e.target.value })} placeholder="e.g., 500mg" className="w-full px-4 py-3 rounded-xl border text-sm" style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }} /></div>
                <div><label className="text-xs mb-1.5 block" style={{ color: cn.textSecondary }}>Scheduled Time</label><input type="time" value={newSched.time} onChange={e => setNewSched({ ...newSched, time: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }} /></div>
              </div>
              <div><label className="text-xs mb-1.5 block" style={{ color: cn.textSecondary }}>Repeat Days</label><div className="flex gap-2">{weekDays.map(d => (<button key={d} onClick={() => toggleDay(d)} className="w-10 h-10 rounded-lg text-xs border" style={{ borderColor: newSched.days.includes(d) ? cn.pink : cn.border, background: newSched.days.includes(d) ? cn.pinkBg : "transparent", color: newSched.days.includes(d) ? cn.pink : cn.text }}>{d}</button>))}</div></div>
              <div><label className="text-xs mb-1.5 block" style={{ color: cn.textSecondary }}>Reminder (minutes before)</label><div className="flex gap-2">{[5, 10, 15, 30].map(m => (<button key={m} onClick={() => setNewSched({ ...newSched, reminderMinutes: m })} className="px-3 py-2 rounded-lg text-xs border" style={{ borderColor: newSched.reminderMinutes === m ? cn.pink : cn.border, color: newSched.reminderMinutes === m ? cn.pink : cn.text, background: newSched.reminderMinutes === m ? cn.pinkBg : "transparent" }}>{m} min</button>))}</div></div>
              <div><label className="text-xs mb-1.5 block" style={{ color: cn.textSecondary }}>Instructions</label><input type="text" value={newSched.instructions} onChange={e => setNewSched({ ...newSched, instructions: e.target.value })} placeholder="e.g., Take with food" className="w-full px-4 py-3 rounded-xl border text-sm" style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }} /></div>
              <div className="flex gap-3 pt-2">
                <button className="px-5 py-2.5 rounded-xl text-white text-sm" style={{ background: "var(--cn-gradient-caregiver)" }}>Save Schedule</button>
                <button onClick={() => setShowAddForm(false)} className="px-5 py-2.5 rounded-xl text-sm border" style={{ borderColor: cn.border, color: cn.textSecondary }}>Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-sm" style={{ color: cn.text }}>Active Recurring Schedules</h3>
            {schedule.map((s, i) => (
              <div key={i} className="finance-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cn.pinkBg }}><Repeat className="w-5 h-5" style={{ color: cn.pink }} /></div>
                <div className="flex-1">
                  <p className="text-sm" style={{ color: cn.text }}>{s.medicineName} {s.dosage}</p>
                  <div className="flex flex-wrap gap-3 text-xs" style={{ color: cn.textSecondary }}>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {s.patientName}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.scheduledTime}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Daily</span>
                    {s.instructions && <span className="flex items-center gap-1"><Bell className="w-3 h-3" /> {s.instructions}</span>}
                  </div>
                </div>
              </div>
            ))}
            {schedule.length === 0 && <p className="text-xs text-center py-4" style={{ color: cn.textSecondary }}>No recurring schedules yet. Add one above.</p>}
          </div>
        </div>
      )}
    </div>
  );
}