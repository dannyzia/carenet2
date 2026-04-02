import { useState, useEffect, useCallback, useRef } from "react";
import { saveFormDraft, getFormDraft, deleteFormDraft } from "@/backend/offline/db";

/**
 * useFormDraft — Persists form data to Dexie IndexedDB with auto-save debounce.
 *
 * Features:
 *   - Restores draft on mount if one exists (< 3 days old)
 *   - Auto-saves on every change with 500ms debounce
 *   - Clears draft on explicit submit
 *   - 3-day TTL auto-enforced by db layer
 *
 * Usage:
 *   const { draft, updateDraft, clearDraft, isRestored } = useFormDraft("care-requirement", user?.id ?? "");
 *   // Pass auth `user.id` so Dexie keys drafts per account (demo users use stable ids like `demo-patient-1`).
 *   // On mount, draft contains any saved data
 *   // Call updateDraft(partialData) on form changes
 *   // Call clearDraft() after successful submission
 */

export interface UseFormDraftReturn<T extends Record<string, any>> {
  /** The current draft data (null until loaded) */
  draft: T | null;
  /** Whether a saved draft was restored from IndexedDB */
  isRestored: boolean;
  /** Whether the draft is currently being saved */
  isSaving: boolean;
  /** Merge partial data into the draft and persist */
  updateDraft: (partial: Partial<T>) => void;
  /** Replace the entire draft and persist */
  setDraft: (data: T) => void;
  /** Clear the persisted draft (call after successful submit) */
  clearDraft: () => Promise<void>;
}

const DEBOUNCE_MS = 500;

export function useFormDraft<T extends Record<string, any>>(
  formKey: string,
  userId: string
): UseFormDraftReturn<T> {
  const [draft, setDraftState] = useState<T | null>(null);
  const [isRestored, setIsRestored] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const draftRef = useRef<T | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // Load existing draft on mount
  useEffect(() => {
    mountedRef.current = true;
    if (!formKey || !userId) return;

    getFormDraft(formKey, userId).then((saved) => {
      if (!mountedRef.current) return;
      if (saved) {
        const data = saved as T;
        draftRef.current = data;
        setDraftState(data);
        setIsRestored(true);
      }
    });

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [formKey, userId]);

  // Debounced persist
  const persistDraft = useCallback(
    (data: T) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        if (!mountedRef.current) return;
        setIsSaving(true);
        try {
          await saveFormDraft(formKey, data, userId);
        } catch (e) {
          console.warn("[useFormDraft] Save failed:", e);
        } finally {
          if (mountedRef.current) setIsSaving(false);
        }
      }, DEBOUNCE_MS);
    },
    [formKey, userId]
  );

  const updateDraft = useCallback(
    (partial: Partial<T>) => {
      const next = { ...(draftRef.current || ({} as T)), ...partial } as T;
      draftRef.current = next;
      setDraftState(next);
      persistDraft(next);
    },
    [persistDraft]
  );

  const setDraft = useCallback(
    (data: T) => {
      draftRef.current = data;
      setDraftState(data);
      persistDraft(data);
    },
    [persistDraft]
  );

  const clearDraft = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    draftRef.current = null;
    setDraftState(null);
    setIsRestored(false);
    await deleteFormDraft(formKey, userId);
  }, [formKey, userId]);

  return { draft, isRestored, isSaving, updateDraft, setDraft, clearDraft };
}
