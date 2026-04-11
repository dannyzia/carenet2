/**
 * Feature flags from Vite env. No user-facing copy here.
 * Care-seeker ↔ caregiver direct contact is off unless explicitly enabled.
 */
const env = import.meta.env;

function readBool(key: string, defaultValue: boolean): boolean {
  const v = env[key as keyof ImportMetaEnv] as string | undefined;
  if (v === undefined || v === "") return defaultValue;
  return v === "true" || v === "1";
}

export const features = {
  /** When false: hide caregiver search/compare, block care-seeker↔caregiver DMs (app + DB trigger). */
  careSeekerCaregiverContactEnabled: readBool(
    "VITE_CARE_SEEKER_CAREGIVER_CONTACT_ENABLED",
    false,
  ),
} as const;
