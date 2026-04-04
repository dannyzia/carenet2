import React, { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { section15Service } from "@/backend/services";
import { Button } from "@/frontend/components/ui/button";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Label } from "@/frontend/components/ui/label";
import { cn } from "@/frontend/theme/tokens";

const MOOD_OPTIONS = ["", "good", "ok", "low", "anxious"] as const;

export function Section15CareDiaryForm({
  patientId,
  onSaved,
}: {
  patientId: string;
  onSaved: () => void;
}) {
  const { t } = useTranslation("common");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<string>("");
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!body.trim()) {
      toast.error(t("section15.diaryBodyRequired", "Please enter a note."));
      return;
    }
    setSaving(true);
    try {
      await section15Service.createCareDiaryEntry(patientId, {
        body: body.trim(),
        mood: mood || undefined,
        entryDate: entryDate || undefined,
      });
      setBody("");
      toast.success(t("section15.diarySaved", "Diary entry saved."));
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
        {t("section15.addDiaryEntry", "Add diary entry")}
      </h2>
      <div className="space-y-1">
        <Label htmlFor="s15-diary-date" className="text-xs" style={{ color: cn.textSecondary }}>
          {t("section15.entryDate", "Date")}
        </Label>
        <input
          id="s15-diary-date"
          type="date"
          value={entryDate}
          onChange={(ev) => setEntryDate(ev.target.value)}
          className="w-full max-w-[200px] rounded-md border px-3 py-2 text-sm"
          aria-label={t("section15.entryDate", "Date")}
          style={{ borderColor: cn.border, background: cn.bgInput, color: cn.text }}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="s15-diary-mood" className="text-xs" style={{ color: cn.textSecondary }}>
          {t("section15.moodOptional", "Mood (optional)")}
        </Label>
        <select
          id="s15-diary-mood"
          value={mood}
          onChange={(ev) => setMood(ev.target.value)}
          className="w-full max-w-[220px] rounded-md border px-3 py-2 text-sm"
          aria-label={t("section15.moodOptional", "Mood (optional)")}
          style={{ borderColor: cn.border, background: cn.bgInput, color: cn.text }}
        >
          <option value="">{t("section15.moodUnset", "—")}</option>
          {MOOD_OPTIONS.filter(Boolean).map((m) => (
            <option key={m} value={m}>
              {t(`section15.mood.${m}`, m)}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="s15-diary-body" className="text-xs" style={{ color: cn.textSecondary }}>
          {t("section15.diaryNote", "Note")}
        </Label>
        <Textarea
          id="s15-diary-body"
          value={body}
          onChange={(ev) => setBody(ev.target.value)}
          rows={4}
          placeholder={t("section15.diaryPlaceholder", "What happened today? Vitals, meals, mood…")}
          className="resize-y min-h-[100px]"
          style={{ borderColor: cn.border }}
        />
      </div>
      <Button type="submit" disabled={saving} className="w-full sm:w-auto" style={{ background: cn.teal, color: "white" }}>
        {saving ? t("section15.saving", "Saving…") : t("section15.saveEntry", "Save entry")}
      </Button>
    </form>
  );
}
