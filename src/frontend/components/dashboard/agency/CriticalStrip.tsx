import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/frontend/theme/tokens";
import type { AgencyExecutiveAlert } from "@/backend/models/agencyExecutiveDashboard.model";

export function CriticalStrip({ alerts }: { alerts: AgencyExecutiveAlert[] }) {
  const { t } = useTranslation(["dashboard", "common"]);
  if (!alerts.length) return null;

  return (
    <section
      className="rounded-lg border border-[color-mix(in_srgb,var(--cn-red)_35%,transparent)] bg-[color-mix(in_srgb,var(--cn-red)_8%,transparent)] overflow-hidden"
      aria-label={t("dashboard:agency.executive.criticalAria")}
    >
      <ul className="divide-y divide-[color-mix(in_srgb,var(--cn-text)_10%,transparent)]">
        {alerts.map((a) => {
          const text = a.messageKey
            ? String(t(a.messageKey, a.messageParams as Record<string, string | number> | undefined))
            : (a.message ?? "");
          const isHigh = a.severity === "high";
          const severityLabel = isHigh
            ? t("dashboard:agency.executive.severityHigh")
            : t("dashboard:agency.executive.severityMedium");
          const inner = (
            <>
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: isHigh ? cn.red : cn.amber }}>
                {severityLabel}
              </span>
              <p className="text-sm mt-0.5 leading-snug" style={{ color: cn.text }}>
                {text}
              </p>
            </>
          );
          return (
            <li key={a.id}>
              {a.filterHref ? (
                <Link
                  to={a.filterHref}
                  className="block w-full text-left px-3 py-2.5 min-h-[44px] active:opacity-90"
                >
                  {inner}
                </Link>
              ) : (
                <div className="px-3 py-2.5">{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
