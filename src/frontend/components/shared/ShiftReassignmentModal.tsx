import { useState } from "react";
import { backupService } from "@/backend/services";
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
import { toast } from "sonner";

export interface ShiftReassignmentBackupOption {
  caregiverId: string;
  caregiverName: string;
  available: boolean;
}

export interface ShiftReassignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shiftId: string;
  backups: ShiftReassignmentBackupOption[];
  onCompleted: () => void;
}

export function ShiftReassignmentModal({
  open,
  onOpenChange,
  shiftId,
  backups,
  onCompleted,
}: ShiftReassignmentModalProps) {
  const { t } = useTranslation("common");
  const [toId, setToId] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setToId("");
    setReason("");
  };

  const submit = async () => {
    if (!toId || !reason.trim()) return;
    setSubmitting(true);
    try {
      await backupService.reassignShift(shiftId, toId, reason.trim());
      toast.success(t("shiftReassignment.success"));
      reset();
      onOpenChange(false);
      onCompleted();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("shiftReassignment.failed"));
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
          <DialogTitle>{t("shiftReassignment.title")}</DialogTitle>
          <DialogDescription>{t("shiftReassignment.description", { shiftId })}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-2">
            <Label>{t("shiftReassignment.selectBackup")}</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={toId}
              onChange={(e) => setToId(e.target.value)}
            >
              <option value="">{t("shiftReassignment.choose")}</option>
              {backups
                .filter((b) => b.available)
                .map((b) => (
                  <option key={b.caregiverId} value={b.caregiverId}>
                    {b.caregiverName}
                  </option>
                ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sr-reason">{t("shiftReassignment.reason")}</Label>
            <Textarea
              id="sr-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("shiftReassignment.reasonPlaceholder")}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("actions.cancel", "Cancel")}
          </Button>
          <Button type="button" disabled={submitting || !toId || !reason.trim()} onClick={() => void submit()}>
            {submitting ? t("shiftReassignment.submitting") : t("shiftReassignment.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
