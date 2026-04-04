import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { section15Service } from "@/backend/services";
import { Button } from "@/frontend/components/ui/button";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Label } from "@/frontend/components/ui/label";
import { cn } from "@/frontend/theme/tokens";

export function Section15SymptomForm({
  patientId,
  onSaved,
}: {
  patientId: string;
  onSaved: () => void;
}) {
  const { t } = useTranslation("common");
  const [severity, setSeverity] = useState(5);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!notes.trim()) {
      toast.error(t("section15.symptomNotesRequired", "Please describe how you feel."));
      return;
    }
    setSaving(true);
    try {
      await section15Service.createSymptomJournalEntry(patientId, {
        severity,
        notes: notes.trim(),
      });
      setNotes("");
      setSeverity(5);
      toast.success(t("section15.symptomSaved", "Symptom log saved."));
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("section15.saveFailed", "Could not save. Try again."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="finance-card p-4 space-y-3">
      <h2 className="text-sm font-medium" style={{ color: cn.text }}>
        {t("section15.logSymptom", "Log symptom")}
      </h2>
      <div className="space-y-1">
        <Label htmlFor="s15-sev" className="text-xs" style={{ color: cn.textSecondary }}>
          {t("section15.severityLabel", "Severity (1–10)")}
        </Label>
        <div className="flex items-center gap-3">
          <input
            id="s15-sev"
            type="range"
            min={1}
            max={10}
            value={severity}
            onChange={(ev) => setSeverity(Number(ev.target.value))}
            className="flex-1 max-w-xs"
            style={{ accentColor: cn.teal }}
          />
          <span className="text-sm tabular-nums w-8" style={{ color: cn.text }}>{severity}</span>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="s15-sym-notes" className="text-xs" style={{ color: cn.textSecondary }}>
          {t("section15.symptomNotes", "Notes")}
        </Label>
        <Textarea
          id="s15-sym-notes"
          value={notes}
          onChange={(ev) => setNotes(ev.target.value)}
          rows={3}
          placeholder={t("section15.symptomPlaceholder", "Pain location, triggers, what helped…")}
          className="resize-y min-h-[80px]"
          style={{ borderColor: cn.border }}
        />
      </div>
      <Button type="submit" disabled={saving} className="w-full sm:w-auto" style={{ background: cn.teal, color: "white" }}>
        {saving ? t("section15.saving", "Saving…") : t("section15.saveSymptom", "Save log")}
      </Button>
    </form>
  );
}
