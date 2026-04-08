/**
 * Locale-aware formatting for role dashboards (BDT, CarePoints, dates).
 */

export function formatDashboardDate(date: Date, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
}

/** Bangladesh Taka with locale-aware grouping; symbol is passed from i18n. */
export function formatBdtAmount(amount: number, locale: string, symbol: string): string {
  const n = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount);
  return `${symbol} ${n}`;
}

/** Compact BDT for large values (e.g. lakhs) — dashboard headline use. */
export function formatBdtCompactLakh(amount: number, locale: string, symbol: string): string {
  const lakh = 100_000;
  if (amount >= lakh) {
    const v = amount / lakh;
    const s = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(v);
    return `${symbol} ${s}L`;
  }
  return formatBdtAmount(amount, locale, symbol);
}

export function formatCarePoints(amount: number, locale: string, suffix: string): string {
  const n = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount);
  return `${n} ${suffix}`;
}
