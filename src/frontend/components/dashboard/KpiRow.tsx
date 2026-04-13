import * as React from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import i18n from "@/frontend/i18n";
import { cn } from "@/frontend/theme/tokens";
import type {
  OperationalDashboardKpi,
  OperationalDashboardKpiFormat,
} from "@/backend/models/operationalDashboard.model";
import { formatBdtCompactLakh, formatCarePoints } from "@/frontend/utils/dashboardFormat";

type KpiRowProps = {
  items: OperationalDashboardKpi[];
  /** Hard cap at 4 */
  max?: number;
};

function formatKpiValue(
  format: OperationalDashboardKpiFormat,
  value: number | string,
  locale: string,
  currencySym: string,
  cpSuffix: string,
): string {
  if (format === "plain") return String(value);
  if (format === "count") return typeof value === "number" ? value.toLocaleString(locale) : String(value);
  if (format === "percent") {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return String(value);
    return `${n > 0 ? "+" : ""}${n}%`;
  }
  if (format === "bdtCompact") {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return String(value);
    return formatBdtCompactLakh(n, locale, currencySym);
  }
  if (format === "carePoints") {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return String(value);
    return formatCarePoints(n, locale, cpSuffix);
  }
  return String(value);
}

function renderHint(
  t: TFunction,
  hintKey: string | undefined,
  hintParams: Record<string, string | number> | undefined,
  locale: string,
  _currencySym: string,
  cpSuffix: string,
): string | null {
  if (!hintKey) return null;
  if (hintKey === "dashboard:shared.feeDue" && hintParams && typeof hintParams.amount === "number") {
    const formatted = formatCarePoints(hintParams.amount, locale, cpSuffix);
    return String(t(hintKey, { amount: formatted }));
  }
  return hintParams ? String(t(hintKey, hintParams)) : String(t(hintKey));
}

/**
 * Bottom strip: up to four compact KPI tiles (optional deep link per tile).
 */
export function KpiRow({ items, max = 4 }: KpiRowProps) {
  const { t } = useTranslation(["dashboard", "common"]);
  const slice = items.slice(0, max);
  const locale = i18n.language || "en";
  const currencySym = t("dashboard:shared.currencySymbol");
  const cpSuffix = t("dashboard:shared.carePointsSuffix");
  const tileClass =
    "cn-card-flat p-4 rounded-xl border border-[color-mix(in_srgb,var(--cn-text)_8%,transparent)]";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {slice.map((k) => {
        const label = k.labelParams ? t(k.labelKey, k.labelParams) : t(k.labelKey);
        const valueStr = formatKpiValue(k.format, k.value, locale, currencySym, cpSuffix);
        const hint = renderHint(t, k.hintKey, k.hintParams, locale, currencySym, cpSuffix);
        const inner = (
          <>
            <p className="text-xs font-medium" style={{ color: cn.textSecondary }}>
              {label}
            </p>
            <p className="text-xl font-semibold tabular-nums mt-1" style={{ color: cn.text }}>
              {valueStr}
            </p>
            {hint ? (
              <p className="text-xs mt-1 line-clamp-2" style={{ color: cn.textSecondary }}>
                {hint}
              </p>
            ) : null}
          </>
        );
        if (k.to) {
          return (
            <Link
              key={k.id}
              to={k.to}
              className={`${tileClass} block no-underline hover:shadow-md transition-shadow cn-touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)] focus-visible:ring-offset-2`}
            >
              {inner}
            </Link>
          );
        }
        return (
          <div key={k.id} className={tileClass}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
