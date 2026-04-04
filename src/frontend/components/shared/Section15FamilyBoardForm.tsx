import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { section15Service } from "@/backend/services";
import { Button } from "@/frontend/components/ui/button";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Label } from "@/frontend/components/ui/label";
import { cn } from "@/frontend/theme/tokens";

export function Section15FamilyBoardForm({
  patientId,
  onSaved,
}: {
  patientId: string;
  onSaved: () => void;
}) {
  const { t } = useTranslation("common");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) {
      toast.error(t("section15.familyPostRequired", "Please enter a message."));
      return;
    }
    setSaving(true);
    try {
      await section15Service.createFamilyBoardPost(patientId, { body: body.trim() });
      setBody("");
      toast.success(t("section15.familyPostSaved", "Posted to family board."));
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
        {t("section15.addFamilyPost", "Post an update")}
      </h2>
      <div className="space-y-1">
        <Label htmlFor="s15-fb-body" className="text-xs" style={{ color: cn.textSecondary }}>
          {t("section15.familyPostBody", "Message")}
        </Label>
        <Textarea
          id="s15-fb-body"
          value={body}
          onChange={(ev) => setBody(ev.target.value)}
          rows={3}
          placeholder={t("section15.familyPostPlaceholder", "Share a short update with authorized family…")}
          className="resize-y min-h-[80px]"
          style={{ borderColor: cn.border }}
        />
      </div>
      <Button type="submit" disabled={saving} className="w-full sm:w-auto" style={{ background: cn.pink, color: "white" }}>
        {saving ? t("section15.saving", "Saving…") : t("section15.postToBoard", "Post")}
      </Button>
    </form>
  );
}
