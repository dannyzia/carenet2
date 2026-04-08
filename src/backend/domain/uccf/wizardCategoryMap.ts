/**
 * Map guardian/patient wizard care-type chip ids → UCCF CareCategory enums.
 */
import type { CareCategory } from "@/backend/models";

/** Wizard `careTypes[].id` → spec category */
export const WIZARD_CARE_TYPE_TO_UCCF: Record<string, CareCategory> = {
  elderly: "elderly",
  postop: "post_surgery",
  disability: "disability",
  dementia: "chronic",
  child: "baby",
  night: "elderly",
};

export function mapWizardCareTypeIdsToUCCF(ids: string[]): CareCategory[] {
  const out: CareCategory[] = [];
  for (const id of ids) {
    const m = WIZARD_CARE_TYPE_TO_UCCF[id];
    if (m && !out.includes(m)) out.push(m);
  }
  return out.length > 0 ? out : ["elderly"];
}
