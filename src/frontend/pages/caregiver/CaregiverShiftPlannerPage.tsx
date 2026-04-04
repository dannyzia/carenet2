import { useState } from "react";
import { Link } from "react-router";
import { cn } from "@/frontend/theme/tokens";
import { Plus, Clock, CheckSquare, User, Calendar, ChevronRight, GripVertical, Trash2, Edit3, Copy, AlertCircle, Save, ClipboardList, Pill, Activity, UtensilsCrossed, Dumbbell } from "lucide-react";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { caregiverService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useTranslation } from "react-i18next";
import type { ShiftPlan as ApiShiftPlan } from "@/backend/models";

interface ShiftTask { id: string; title: string; category: string; scheduledTime: string; duration: string; priority: "high" | "medium" | "low"; notes: string; completed: boolean; }
interface ShiftPlan { id: string; patientName: string; date: string; shiftTime: string; tasks: ShiftTask[]; status: "draft" | "active" | "completed"; dbStatus?: string; }

function adaptShiftPlans(api: ApiShiftPlan[]): ShiftPlan[] {
  return api.map((p) => ({
    id: p.id,
    patientName: p.patientName,
    date: p.date,
    shiftTime: p.shiftTime,
    dbStatus: p.dbStatus,
    status: p.status === "upcoming" ? "draft" : p.status === "completed" ? "completed" : "active",
    tasks: p.tasks.map((t, i) => ({
      id: `${p.id}-task-${i}`,
      title: t.label,
      category: "general",
      scheduledTime: "—",
      duration: "—",
      priority: "medium" as const,
      notes: "",
      completed: t.done,
    })),
  }));
}

const categoryIcons: Record<string, React.ElementType> = { medication: Pill, vitals: Activity, meal: UtensilsCrossed, exercise: Dumbbell, general: ClipboardList };
const categoryColors: Record<string, string> = { medication: "#5FB865", vitals: "#0288D1", meal: "#E64A19", exercise: "#7B5EA7", general: "#6B7280" };
const priorityColors = { high: "#EF4444", medium: "#F59E0B", low: "#6B7280" };

export default function CaregiverShiftPlannerPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.caregiverShiftPlanner", "Caregiver Shift Planner"));

  const { data: shiftPlans, loading } = useAsyncData(() => caregiverService.getShiftPlans());

  if (loading || !shiftPlans) return <PageSkeleton cards={3} />;

  return <ShiftPlannerContent initialPlans={adaptShiftPlans(shiftPlans)} />;
}

function ShiftPlannerContent({ initialPlans }: { initialPlans: ShiftPlan[] }) {
  const [plans] = useState(initialPlans);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(initialPlans[0]?.id ?? null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", category: "general", scheduledTime: "", duration: "", priority: "medium" as "high" | "medium" | "low", notes: "" });
  const activePlan = plans.find(p => p.id === selectedPlan);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl" style={{ color: cn.textHeading }}>Shift Task Planner</h1>
          <p className="text-sm mt-0.5" style={{ color: cn.textSecondary }}>Plan and organize tasks for upcoming shifts</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm" style={{ background: "var(--cn-gradient-caregiver)" }}><Plus className="w-4 h-4" /> New Shift Plan</button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {plans.map(plan => (
          <button key={plan.id} onClick={() => setSelectedPlan(plan.id)} className="finance-card p-3 min-w-[200px] flex-shrink-0 text-left transition-all" style={{ borderColor: selectedPlan === plan.id ? cn.pink : cn.border, borderWidth: "2px", background: selectedPlan === plan.id ? cn.pinkBg : undefined }}>
            <div className="flex items-center gap-2 mb-1"><User className="w-4 h-4" style={{ color: cn.pink }} /><span className="text-sm" style={{ color: cn.text }}>{plan.patientName}</span></div>
            <div className="flex items-center gap-2 text-xs" style={{ color: cn.textSecondary }}><Calendar className="w-3 h-3" /> {plan.date}</div>
            <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: cn.textSecondary }}><Clock className="w-3 h-3" /> {plan.shiftTime}</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs" style={{ color: cn.textSecondary }}>{plan.tasks.length} tasks</span>
              <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: plan.status === "active" ? cn.greenBg : plan.status === "draft" ? cn.amberBg : cn.bgInput, color: plan.status === "active" ? cn.green : plan.status === "draft" ? cn.amber : cn.textSecondary }}>{plan.status}</span>
            </div>
            <div className="flex gap-2 mt-2">
              <Link
                to={`/caregiver/shift-check-in/${plan.id}`}
                className="flex-1 text-center text-[10px] py-1.5 rounded-lg border no-underline"
                style={{ borderColor: cn.border, color: cn.pink }}
                onClick={(e) => e.stopPropagation()}
              >
                Check in
              </Link>
              <Link
                to={`/caregiver/shift-checkout/${plan.id}`}
                className="flex-1 text-center text-[10px] py-1.5 rounded-lg border no-underline"
                style={{ borderColor: cn.border, color: cn.text }}
                onClick={(e) => e.stopPropagation()}
              >
                Check out
              </Link>
            </div>
          </button>
        ))}
      </div>

      {activePlan && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm" style={{ color: cn.text }}>Tasks for {activePlan.patientName} — {activePlan.shiftTime}</h2>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border" style={{ borderColor: cn.border, color: cn.textSecondary }}><Copy className="w-3 h-3" /> Duplicate Plan</button>
              <button onClick={() => setShowAddTask(!showAddTask)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white" style={{ background: "var(--cn-gradient-caregiver)" }}><Plus className="w-3 h-3" /> Add Task</button>
            </div>
          </div>

          {showAddTask && (
            <div className="finance-card p-4 space-y-3" style={{ borderLeft: `3px solid ${cn.pink}` }}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2"><label className="text-xs mb-1 block" style={{ color: cn.textSecondary }}>Task Title</label><input type="text" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} placeholder="e.g., Administer Evening Meds" className="w-full px-3 py-2.5 rounded-xl border text-sm" style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }} /></div>
                <div><label className="text-xs mb-1 block" style={{ color: cn.textSecondary }}>Category</label><select value={newTask.category} onChange={e => setNewTask({ ...newTask, category: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border text-sm" style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }}><option value="general">General</option><option value="medication">Medication</option><option value="vitals">Vitals</option><option value="meal">Meal</option><option value="exercise">Exercise</option></select></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div><label className="text-xs mb-1 block" style={{ color: cn.textSecondary }}>Time</label><input type="time" value={newTask.scheduledTime} onChange={e => setNewTask({ ...newTask, scheduledTime: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border text-sm" style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }} /></div>
                <div><label className="text-xs mb-1 block" style={{ color: cn.textSecondary }}>Duration</label><input type="text" value={newTask.duration} onChange={e => setNewTask({ ...newTask, duration: e.target.value })} placeholder="e.g., 15 min" className="w-full px-3 py-2.5 rounded-xl border text-sm" style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }} /></div>
                <div className="col-span-2"><label className="text-xs mb-1 block" style={{ color: cn.textSecondary }}>Priority</label><div className="flex gap-2">{(["high", "medium", "low"] as const).map(p => (<button key={p} onClick={() => setNewTask({ ...newTask, priority: p })} className="flex-1 py-2 rounded-lg text-xs border capitalize" style={{ borderColor: newTask.priority === p ? priorityColors[p] : cn.border, color: newTask.priority === p ? priorityColors[p] : cn.text, background: newTask.priority === p ? `${priorityColors[p]}15` : "transparent" }}>{p}</button>))}</div></div>
              </div>
              <div><label className="text-xs mb-1 block" style={{ color: cn.textSecondary }}>Notes</label><input type="text" value={newTask.notes} onChange={e => setNewTask({ ...newTask, notes: e.target.value })} placeholder="Additional details..." className="w-full px-3 py-2.5 rounded-xl border text-sm" style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }} /></div>
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-xl text-white text-sm" style={{ background: "var(--cn-gradient-caregiver)" }}>Add Task</button>
                <button onClick={() => setShowAddTask(false)} className="px-4 py-2 rounded-xl text-sm border" style={{ borderColor: cn.border, color: cn.textSecondary }}>Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {activePlan.tasks.map((task, idx) => {
              const CatIcon = categoryIcons[task.category] || ClipboardList;
              const catColor = categoryColors[task.category] || "#6B7280";
              return (
                <div key={task.id} className="finance-card p-3 sm:p-4 flex items-start gap-3 group">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${catColor}20` }}><CatIcon className="w-4 h-4" style={{ color: catColor }} /></div>
                    {idx < activePlan.tasks.length - 1 && <div className="w-0.5 h-6 mt-1" style={{ background: cn.borderLight }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: cn.text }}>{task.title}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: `${priorityColors[task.priority]}15`, color: priorityColors[task.priority] }}>{task.priority}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs" style={{ color: cn.textSecondary }}><span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {task.scheduledTime}</span><span>{task.duration}</span></div>
                    {task.notes && <p className="text-xs mt-1" style={{ color: cn.textSecondary }}>{task.notes}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 rounded-lg" style={{ color: cn.textSecondary }}><Edit3 className="w-3.5 h-3.5" /></button>
                    <button className="p-1.5 rounded-lg" style={{ color: cn.red }}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm" style={{ background: "var(--cn-gradient-caregiver)" }}><Save className="w-4 h-4" /> {activePlan.status === "draft" ? "Activate Plan" : "Save Changes"}</button>
            {activePlan.status === "draft" && <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm border" style={{ borderColor: cn.border, color: cn.textSecondary }}><Save className="w-4 h-4" /> Save as Draft</button>}
          </div>
        </div>
      )}

      <div className="finance-card p-5">
        <h3 className="text-sm mb-3" style={{ color: cn.text }}>Quick Templates</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { name: "Night Shift — Elderly Care", tasks: 8, desc: "Medication, vitals, bedtime routine, night checks" },
            { name: "Day Shift — Pediatric", tasks: 6, desc: "Medication, PT session, meals, monitoring" },
            { name: "Morning Routine — General", tasks: 5, desc: "Wake up, medication, breakfast, morning vitals" },
          ].map((tpl, i) => (
            <button key={i} className="p-3 rounded-xl border text-left hover:opacity-80 transition-all" style={{ borderColor: cn.border }}>
              <p className="text-sm" style={{ color: cn.text }}>{tpl.name}</p>
              <p className="text-xs mt-0.5" style={{ color: cn.textSecondary }}>{tpl.desc}</p>
              <span className="text-xs mt-1 inline-block" style={{ color: cn.pink }}>{tpl.tasks} tasks</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}