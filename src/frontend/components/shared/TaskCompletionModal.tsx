import { useState, useRef } from "react";
import type { DailyTask } from "@/backend/models";
import { scheduleService, uploadService } from "@/backend/services";
import { Button } from "@/frontend/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
import { Label } from "@/frontend/components/ui/label";
import { Textarea } from "@/frontend/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { Camera } from "lucide-react";

export interface TaskCompletionModalProps {
  task: DailyTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void;
}

export function TaskCompletionModal({ task, open, onOpenChange, onCompleted }: TaskCompletionModalProps) {
  const { t } = useTranslation("common");
  const [note, setNote] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setNote("");
    setPhotoUrl(undefined);
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const uploaded = await uploadService.uploadFile(file, "other", "file");
      setPhotoUrl(uploaded.url);
    } catch {
      const reader = new FileReader();
      reader.onload = () => setPhotoUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const submit = async () => {
    if (!task) return;
    setSubmitting(true);
    try {
      await scheduleService.completeTask(task.id, note.trim() || undefined, photoUrl);
      reset();
      onOpenChange(false);
      onCompleted();
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
        <DialogHeader>
          <DialogTitle>{t("dailySchedule.completeTitle")}</DialogTitle>
          <DialogDescription>
            {task ? task.title : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="tc-note">{t("dailySchedule.completionNote")}</Label>
            <Textarea
              id="tc-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder={t("dailySchedule.completionNotePlaceholder")}
            />
          </div>
          <div className="grid gap-2">
            <Label>{t("dailySchedule.completionPhotoOptional")}</Label>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Camera className="size-4 mr-1" />
                {t("dailySchedule.addPhoto")}
              </Button>
              {photoUrl ? (
                <span className="text-xs text-muted-foreground">{t("dailySchedule.photoAttached")}</span>
              ) : null}
            </div>
            {photoUrl ? (
              <img src={photoUrl} alt="" className="max-h-32 rounded-lg border object-contain" />
            ) : null}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("actions.cancel", "Cancel")}
          </Button>
          <Button type="button" onClick={submit} disabled={submitting}>
            {submitting ? t("dailySchedule.completing") : t("dailySchedule.markComplete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
