import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, Circle, ListTodo, Plus } from "lucide-react";
import { useAuth } from "@/backend/store/auth/AuthContext";
import { scheduleService } from "@/backend/services";
import type { DailyTask } from "@/backend/models";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { DailyTaskCreator } from "@/frontend/components/shared/DailyTaskCreator";
import { TaskCompletionModal } from "@/frontend/components/shared/TaskCompletionModal";
import { Button } from "@/frontend/components/ui/button";
import { cn } from "@/frontend/theme/tokens";
import { useTranslation } from "react-i18next";

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function statusLabel(t: (k: string, d?: string) => string, s: DailyTask["status"]) {
  switch (s) {
    case "pending":
      return t("dailySchedule.status.pending");
    case "in_progress":
      return t("dailySchedule.status.inProgress");
    case "completed":
      return t("dailySchedule.status.completed");
    case "cancelled":
      return t("dailySchedule.status.cancelled");
    default:
      return s;
  }
}

export default function DailySchedulePage() {
  const { t } = useTranslation("common");
  useDocumentTitle(t("pageTitles.dailySchedule", "Daily schedule"));

  const { user } = useAuth();
  const [date, setDate] = useState(todayISO);
  const [createOpen, setCreateOpen] = useState(false);
  const [completeTask, setCompleteTask] = useState<DailyTask | null>(null);
  const [completeOpen, setCompleteOpen] = useState(false);

  const loadTasks = useCallback(() => scheduleService.getDailyTasks(date), [date]);

  const { data: tasks, loading, refetch } = useAsyncData(loadTasks, [date]);

  const sorted = useMemo(() => {
    if (!tasks) return [];
    return [...tasks].sort((a, b) => a.time.localeCompare(b.time));
  }, [tasks]);

  if (!user) return <PageSkeleton cards={2} />;
  if (loading && !tasks) return <PageSkeleton cards={3} />;

  const openComplete = (task: DailyTask) => {
    setCompleteTask(task);
    setCompleteOpen(true);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#DB869A] mb-1">
            <ListTodo className="size-6" />
            <span className="text-sm font-semibold uppercase tracking-wide">{t("dailySchedule.badge")}</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: cn.text }}>
            {t("dailySchedule.title")}
          </h1>
          <p className="text-sm mt-1" style={{ color: cn.textSecondary }}>
            {t("dailySchedule.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
          />
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="size-4" />
            {t("dailySchedule.newTask")}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white/90 shadow-sm divide-y divide-gray-100">
        {sorted.length === 0 ? (
          <div className="p-10 text-center text-sm" style={{ color: cn.textSecondary }}>
            {t("dailySchedule.empty")}
          </div>
        ) : (
          sorted.map((task) => (
            <div key={task.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {task.status === "completed" ? (
                  <CheckCircle2 className="size-5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="size-5 text-gray-300 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-medium text-gray-500">{task.time}</span>
                    <span
                      className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                    >
                      {t(`dailySchedule.type.${task.type}`)}
                    </span>
                    <span
                      className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background:
                          task.status === "completed"
                            ? "#DCFCE7"
                            : task.status === "in_progress"
                              ? "#FEF3C7"
                              : task.status === "cancelled"
                                ? "#F3F4F6"
                                : "#E0E7FF",
                        color: cn.text,
                      }}
                    >
                      {statusLabel(t, task.status)}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900 mt-1">{task.title}</p>
                  {task.details ? <p className="text-sm text-gray-600 mt-0.5">{task.details}</p> : null}
                  {task.patientName ? (
                    <p className="text-xs text-gray-500 mt-1">{t("dailySchedule.forPatient", { name: task.patientName })}</p>
                  ) : null}
                  {task.completionNote ? (
                    <p className="text-xs text-emerald-700 mt-2 italic">{task.completionNote}</p>
                  ) : null}
                </div>
              </div>
              {task.status !== "completed" && task.status !== "cancelled" ? (
                <Button size="sm" variant="secondary" onClick={() => openComplete(task)} data-testid="complete-task">
                  {t("dailySchedule.complete")}
                </Button>
              ) : null}
            </div>
          ))
        )}
      </div>

      <DailyTaskCreator
        open={createOpen}
        onOpenChange={setCreateOpen}
        date={date}
        userId={user.id}
        activeRole={user.activeRole}
        onCreated={() => refetch()}
      />

      <TaskCompletionModal
        task={completeTask}
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        onCompleted={() => refetch()}
      />
    </div>
  );
}
