/**
 * Non-copy configuration for booking/subscription UI (rates, URLs, fallbacks).
 * User-facing strings live in locale files; defaults for Supabase fallbacks come from env.
 */

function readEnvString(key: string): string {
  const v = import.meta.env[key as keyof ImportMetaEnv];
  return v != null && String(v).trim() !== "" ? String(v) : "";
}

function readEnvNumber(key: string): number | undefined {
  const v = import.meta.env[key as keyof ImportMetaEnv];
  if (v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** Platform fee rate for summary display (e.g. 0.05). Set `VITE_BOOKING_PLATFORM_FEE_RATE` in `.env`. */
export function getBookingPlatformFeeRate(): number {
  return readEnvNumber("VITE_BOOKING_PLATFORM_FEE_RATE") ?? 0;
}

/** Optional minimum price hint (BDT) for service tiles when no package price applies. */
export function getBookingMinPriceHintBdt(): number | undefined {
  return readEnvNumber("VITE_BOOKING_MIN_PRICE_HINT_BDT");
}

/** bKash logo URL for payment step; omit env to show label only. */
export function getBkashLogoUrl(): string {
  return readEnvString("VITE_PAYMENT_BKASH_LOGO_URL");
}

/** Fallback party row when subscription payload omits name/phone (set in `.env` for production). */
export function getSubscriptionDefaultParty(): { name: string; phone: string } {
  return {
    name: readEnvString("VITE_SUBSCRIPTION_DEFAULT_PARTY_NAME"),
    phone: readEnvString("VITE_SUBSCRIPTION_DEFAULT_PARTY_PHONE"),
  };
}
