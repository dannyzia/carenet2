import type { Mobility, UCCFCareSubject } from "@/backend/models";

/** Legacy wizard shape used comma-separated conditions; spec uses condition_summary + mobility. */
export type CareSubjectInput = Partial<UCCFCareSubject> & {
  conditions?: string[];
};

const DEFAULT_MOBILITY: Mobility = "assisted";

/**
 * Produce UCCF care_subject for persistence. Applies schema-friendly defaults when fields omitted.
 */
export function normalizeCareSubject(input?: CareSubjectInput | null): UCCFCareSubject {
  const ageRaw = input?.age;
  const age =
    ageRaw != null && !Number.isNaN(Number(ageRaw))
      ? Math.max(0, Math.floor(Number(ageRaw)))
      : 0;

  let condition_summary = input?.condition_summary?.trim() ?? "";
  if (!condition_summary && Array.isArray(input?.conditions) && input!.conditions!.length > 0) {
    condition_summary = input!.conditions!.map((s) => String(s).trim()).filter(Boolean).join(", ");
  }

  return {
    age,
    gender: input?.gender,
    condition_summary: condition_summary || undefined,
    mobility: input?.mobility ?? DEFAULT_MOBILITY,
    cognitive: input?.cognitive,
    risk_level: input?.risk_level,
  };
}
