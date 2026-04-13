import * as React from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Button } from "@/frontend/components/ui/button";
import { cn } from "@/frontend/theme/tokens";
import type {
  OperationalDashboardQueueRow,
  OperationalQueuePriority,
} from "@/backend/models/operationalDashboard.model";

type WorkQueueProps = {
  title: string;
  rows: OperationalDashboardQueueRow[];
  columnLabels: {
    type: string;
    priority: string;
    entity: string;
    reason: string;
    time: string;
    actions: string;
  };
  emptyLabel: string;
};

function priorityStyle(p: OperationalQueuePriority): { bg: string; color: string } {
  if (p === "high") return { bg: "rgba(239, 68, 68, 0.12)", color: cn.red };
  if (p === "low") return { bg: cn.greenBg, color: cn.green };
  return { bg: cn.amberBg, color: cn.amber };
}

function resolveCell(
  t: TFunction,
  key: string | undefined,
  raw: string,
  params?: Record<string, string | number>,
): string {
  if (key) return params ? String(t(key, params)) : String(t(key));
  return raw;
}

/**
 * Middle execution queue: prioritized rows with a primary route and optional inline routes.
 */
export function WorkQueue({ title, rows, columnLabels, emptyLabel }: WorkQueueProps) {
  const { t } = useTranslation(["dashboard", "common", "workItem"]);

  return (
    <section className="cn-card-flat rounded-xl border border-[color-mix(in_srgb,var(--cn-text)_10%,transparent)] overflow-hidden">
      <div className="px-4 py-3 sm:px-5 border-b border-[color-mix(in_srgb,var(--cn-text)_8%,transparent)]">
        <h2 className="text-base font-semibold" style={{ color: cn.text }}>
          {title}
        </h2>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-sm text-center" style={{ color: cn.textSecondary }}>
          {emptyLabel}
        </p>
      ) : (
        <>
          <div
            className="hidden md:grid gap-0 text-xs font-semibold uppercase tracking-wide px-4 py-2 border-b border-[color-mix(in_srgb,var(--cn-text)_8%,transparent)]"
            style={{
              color: cn.textSecondary,
              gridTemplateColumns:
                "minmax(5rem,0.9fr) minmax(4.5rem,0.6fr) minmax(6rem,1.2fr) minmax(6rem,1.1fr) minmax(4rem,0.5fr) minmax(9rem,1.2fr)",
            }}
          >
            <span>{columnLabels.type}</span>
            <span>{columnLabels.priority}</span>
            <span>{columnLabels.entity}</span>
            <span>{columnLabels.reason}</span>
            <span>{columnLabels.time}</span>
            <span className="text-right">{columnLabels.actions}</span>
          </div>
          <ul className="divide-y divide-[color-mix(in_srgb,var(--cn-text)_8%,transparent)]">
            {rows.map((r) => {
              const ps = priorityStyle(r.priority);
              const typeLabel = resolveCell(t, r.typeKey, r.type, undefined);
              const entityLabel = resolveCell(t, r.entityKey, r.entity, r.entityParams);
              const reasonLabel = resolveCell(t, r.reasonKey, r.reason, r.reasonParams);
              const priorityLabel = t(`dashboard:shared.queuePriority.${r.priority}`);
              return (
                <li key={r.id}>
                  <div className="md:hidden p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="cn-badge text-[0.65rem]" style={{ background: cn.bgInput, color: cn.textSecondary }}>
                        {typeLabel}
                      </span>
                      <span className="cn-badge text-[0.65rem]" style={{ background: ps.bg, color: ps.color }}>
                        {priorityLabel}
                      </span>
                    </div>
                    <p className="text-sm font-medium" style={{ color: cn.text }}>
                      {entityLabel}
                    </p>
                    <p className="text-xs" style={{ color: cn.textSecondary }}>
                      {reasonLabel}
                    </p>
                    <p className="text-xs" style={{ color: cn.textSecondary }}>
                      {r.time}
                    </p>
                    <div className="flex flex-col gap-2 mt-1">
                      <Button asChild size="sm" variant="default" className="w-full">
                        <Link to={r.href}>{t(r.primaryActionLabelKey)}</Link>
                      </Button>
                      {r.inlineActions?.map((ia) => (
                        <Button key={`${r.id}-${ia.to}`} asChild size="sm" variant={ia.variant ?? "outline"} className="w-full">
                          <Link to={ia.to}>{t(ia.labelKey)}</Link>
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div
                    className="hidden md:grid items-center gap-2 px-4 py-3 text-sm"
                    style={{
                      gridTemplateColumns:
                        "minmax(5rem,0.9fr) minmax(4.5rem,0.6fr) minmax(6rem,1.2fr) minmax(6rem,1.1fr) minmax(4rem,0.5fr) minmax(9rem,1.2fr)",
                    }}
                  >
                    <span style={{ color: cn.text }}>{typeLabel}</span>
                    <span>
                      <span className="cn-badge text-[0.65rem]" style={{ background: ps.bg, color: ps.color }}>
                        {priorityLabel}
                      </span>
                    </span>
                    <span className="min-w-0 truncate" style={{ color: cn.text }} title={entityLabel}>
                      {entityLabel}
                    </span>
                    <span className="min-w-0 line-clamp-2" style={{ color: cn.textSecondary }}>
                      {reasonLabel}
                    </span>
                    <span className="text-xs tabular-nums" style={{ color: cn.textSecondary }}>
                      {r.time}
                    </span>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {r.inlineActions?.map((ia) => (
                        <Button key={`${r.id}-${ia.to}-inline`} asChild size="sm" variant={ia.variant ?? "outline"}>
                          <Link to={ia.to}>{t(ia.labelKey)}</Link>
                        </Button>
                      ))}
                      <Button asChild size="sm" variant="default">
                        <Link to={r.href}>{t(r.primaryActionLabelKey)}</Link>
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
