import { cn } from "@/frontend/theme/tokens";
import { ChevronLeft, ChevronRight, Plus, Clock, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { caregiverService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useTranslation } from "react-i18next";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hours = ["8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM"];

export default function CaregiverSchedulePage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.caregiverSchedule", "Caregiver Schedule"));

  const [view, setView] = useState<"week" | "list">("week");
  const { data: scheduleData, loading: lS } = useAsyncData(() => caregiverService.getScheduleData());
  const { data: upcomingBookings, loading: lB } = useAsyncData(() => caregiverService.getUpcomingBookings());

  const [availability, setAvailability] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!scheduleData) return;
    setAvailability((prev) => {
      if (days.every((d) => Object.prototype.hasOwnProperty.call(prev, d))) return prev;
      return Object.fromEntries(
        days.map((d) => [d, d in prev ? prev[d]! : Boolean(scheduleData[d]?.length)]),
      ) as Record<string, boolean>;
    });
  }, [scheduleData]);

  if (lS || lB || !scheduleData || !upcomingBookings) return <PageSkeleton cards={3} />;

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl" style={{ color: cn.text }}>My Schedule</h1>
            <p className="text-sm mt-0.5" style={{ color: cn.textSecondary }}>Manage your caregiving appointments</p>
          </div>
          <div className="flex gap-2">
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: cn.border }}>
              {(["week", "list"] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="px-4 py-2 text-sm capitalize transition-all"
                  style={{
                    background: view === v ? "#DB869A" : cn.bgCard,
                    color: view === v ? "white" : cn.text,
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm"
              style={{ background: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FEB4C5 0%, #DB869A 100%)" }}
            >
              <Plus className="w-4 h-4" /> Add Slot
            </button>
          </div>
        </div>

        {/* Week View */}
        {view === "week" && (
          <div className="schedule-card p-5 overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <button className="p-2 rounded-lg hover:opacity-70">
                <ChevronLeft className="w-5 h-5" style={{ color: cn.textSecondary }} />
              </button>
              <h3 style={{ color: cn.text }}>March 10–16, 2026</h3>
              <button className="p-2 rounded-lg hover:opacity-70">
                <ChevronRight className="w-5 h-5" style={{ color: cn.textSecondary }} />
              </button>
            </div>
            <div className="min-w-[600px]">
              <div className="grid grid-cols-8 gap-1 mb-2">
                <div className="text-xs" style={{ color: cn.textSecondary }}>Time</div>
                {days.map(d => (
                  <div key={d} className="text-center text-xs" style={{ color: cn.text }}>{d}</div>
                ))}
              </div>
              {hours.map((hour, hIdx) => {
                const h = 8 + hIdx;
                return (
                  <div
                    key={hour}
                    className="grid grid-cols-8 gap-1 border-t"
                    style={{ borderColor: cn.borderLight, minHeight: "2.5rem" }}
                  >
                    <div className="text-xs py-1 pr-2" style={{ color: cn.textSecondary }}>{hour}</div>
                    {days.map(d => {
                      const events = (scheduleData[d] || []).filter(e => e.startHour === h);
                      return (
                        <div key={d} className="relative">
                          {events.map((ev, i) => (
                            <div
                              key={i}
                              className="absolute inset-x-0.5 top-0.5 rounded-md p-1 text-xs z-10 cursor-pointer"
                              style={{
                                background: ev.color + "40",
                                borderLeft: `3px solid ${ev.color}`,
                                color: cn.text,
                              }}
                            >
                              <p className="truncate">{ev.label}</p>
                              <p className="truncate opacity-70">{ev.patient}</p>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* List View */}
        {view === "list" && (
          <div className="space-y-3">
            {upcomingBookings.map(b => (
              <div
                key={b.id}
                className="schedule-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "#FEB4C520" }}
                  >
                    <User className="w-5 h-5" style={{ color: "#DB869A" }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: cn.text }}>{b.patient}</p>
                    <p className="text-xs" style={{ color: cn.textSecondary }}>{b.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm flex-wrap">
                  <span className="flex items-center gap-1 text-xs" style={{ color: cn.textSecondary }}>
                    <Clock className="w-3.5 h-3.5" />{b.time}
                  </span>
                  <span className="text-xs" style={{ color: cn.textSecondary }}>{b.date}</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs"
                    style={{
                      background: b.status === "confirmed" ? "#7CE57720" : "#FFB54D20",
                      color: b.status === "confirmed" ? "#5FB865" : "#E8A838",
                    }}
                  >
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Availability */}
        <div className="schedule-card p-5">
          <h2 className="mb-4" style={{ color: cn.text }}>Weekly Availability</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(availability).map(([day, avail]) => (
              <button
                key={day}
                onClick={() => setAvailability(a => ({ ...a, [day]: !a[day as keyof typeof a] }))}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all capitalize text-sm"
                style={{
                  borderColor: avail ? "#DB869A" : cn.border,
                  background: avail ? "#FEB4C520" : cn.bgCard,
                  color: avail ? "#DB869A" : cn.textSecondary,
                }}
              >
                {day.slice(0, 3).charAt(0).toUpperCase() + day.slice(1, 3)}
                <div className="w-2 h-2 rounded-full" style={{ background: avail ? "#DB869A" : cn.border }} />
              </button>
            ))}
          </div>
          <button
            className="mt-4 px-5 py-2 rounded-lg text-white text-sm"
            style={{ background: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FEB4C5 0%, #DB869A 100%)" }}
          >
            Save Availability
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: "\n        .schedule-card {\n          background: var(--cn-bg-card, white);\n          border-radius: 12px;\n          box-shadow: 0 2px 8px rgba(0,0,0,0.08);\n          border: 1px solid var(--cn-border-light, #F3F4F6);\n        }\n      " }} />
    </>
  );
}