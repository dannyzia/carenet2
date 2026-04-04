import { useState } from "react";
import type { DailyTask, TaskCreatorRole, TaskType } from "@/backend/models";
import { scheduleService } from "@/backend/services";
import { Button } from "@/frontend/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { useTranslation } from "react-i18next";
import type { Role } from "@/frontend/auth/types";

function roleToCreatorRole(role: Role): TaskCreatorRole {
  if (role === "caregiver" || role === "guardian" || role === "agency" || role === "patient" || role === "admin") {
    return role;
  }
  return "caregiver";
}

function participationFields(
  userId: string,
  role: Role,
): Pick<DailyTask, "caregiverId" | "guardianId" | "agencyId"> {
  switch (role) {
    case "caregiver":
      return { caregiverId: userId, guardianId: undefined, agencyId: undefined };
    case "guardian":
      return { guardianId: userId, caregiverId: undefined, agencyId: undefined };
    case "agency":
    case "admin":
      return { agencyId: userId, caregiverId: undefined, guardianId: undefined };
    default:
      return { caregiverId: undefined, guardianId: undefined, agencyId: undefined };
  }
}

export interface DailyTaskCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  userId: string;
  activeRole: Role;
  onCreated: () => void;
}

export function DailyTaskCreator({ open, onOpenChange, date, userId, activeRole, onCreated }: DailyTaskCreatorProps) {
  const { t } = useTranslation("common");
  const [type, setType] = useState<TaskType>("task");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [time, setTime] = useState("09:00");
  const [patientName, setPatientName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setType("task");
    setTitle("");
    setDetails("");
    setTime("09:00");
    setPatientName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const part = participationFields(userId, activeRole);
      const creatorRole = roleToCreatorRole(activeRole);
      await scheduleService.addTask({
        type,
        title: title.trim(),
        details: details.trim(),
        time,
        date,
        patientName: patientName.trim() || undefined,
        status: "pending",
        createdBy: userId,
        createdByRole: creatorRole,
        ...part,
      });
      reset();
      onOpenChange(false);
      onCreated();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("dailySchedule.addTaskTitle")}</DialogTitle>
            <DialogDescription>{t("dailySchedule.addTaskDescription")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex gap-2">
              {(["task", "event"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setType(v)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    type === v ? "border-[#DB869A] bg-[#DB869A]/10 text-[#DB869A]" : "border-gray-200 bg-white"
                  }`}
                >
                  {t(`dailySchedule.type.${v}`)}
                </button>
              ))}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dt-title">{t("dailySchedule.fieldTitle")}</Label>
              <Input
                id="dt-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("dailySchedule.fieldTitlePlaceholder")}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dt-details">{t("dailySchedule.fieldDetails")}</Label>
              <Input
                id="dt-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={t("dailySchedule.fieldDetailsPlaceholder")}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="dt-time">{t("dailySchedule.fieldTime")}</Label>
                <Input id="dt-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dt-date">{t("dailySchedule.fieldDate")}</Label>
                <Input id="dt-date" type="date" value={date} readOnly className="bg-gray-50" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dt-patient">{t("dailySchedule.fieldPatientOptional")}</Label>
              <Input
                id="dt-patient"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder={t("dailySchedule.fieldPatientPlaceholder")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("actions.cancel", "Cancel")}
            </Button>
            <Button type="submit" disabled={submitting || !title.trim()}>
              {submitting ? t("dailySchedule.saving") : t("dailySchedule.saveTask")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
