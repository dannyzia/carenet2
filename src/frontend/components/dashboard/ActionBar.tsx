import * as React from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/frontend/components/ui/button";
import type { OperationalDashboardAction } from "@/backend/models/operationalDashboard.model";
import type { Role } from "@/frontend/theme/tokens";
import { getRoleActionGradient } from "@/frontend/theme/roleActionGradients";

type ActionBarProps = {
  actions: OperationalDashboardAction[];
  /** When set, primary buttons use the same gradient as role selection tiles. */
  role?: Role;
  /** Resolved screen-reader label (preferred when already translated). */
  ariaLabel?: string;
  /** i18n key for aria-label when `ariaLabel` is not passed. */
  ariaLabelKey?: string;
};

/**
 * Top strip: 2–4 primary navigation actions only (no metrics).
 */
export function ActionBar({ actions, role, ariaLabel, ariaLabelKey }: ActionBarProps) {
  const { t } = useTranslation(["dashboard", "common"]);
  const resolvedAria =
    ariaLabel ?? (ariaLabelKey ? t(ariaLabelKey) : t("dashboard:admin.opsAriaLabel"));
  const gradient = role ? getRoleActionGradient(role) : undefined;

  return (
    <section className="flex flex-wrap gap-2 sm:gap-3" aria-label={resolvedAria}>
      {actions.map((a) => (
        <Button
          key={a.id}
          asChild
          size="lg"
          className={`rounded-xl shadow-sm px-5 border-0 ${gradient ? "text-white hover:opacity-95" : ""}`}
          style={gradient ? { background: gradient } : undefined}
        >
          <Link to={a.to} className="no-underline">
            {t(a.labelKey)}
          </Link>
        </Button>
      ))}
    </section>
  );
}
