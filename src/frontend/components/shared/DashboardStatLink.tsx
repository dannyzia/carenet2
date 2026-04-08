import { Link } from "react-router";
import type { LucideIcon } from "lucide-react";
import { cn as cnTokens } from "@/frontend/theme/tokens";

type Props = {
  to: string;
  label: string;
  value: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  hint?: string;
  ariaLabel?: string;
  /** When true, show trending icon row like admin/caregiver top cards */
  showTrend?: boolean;
  trendIcon?: LucideIcon;
  trendColor?: string;
  className?: string;
};

/**
 * Clickable dashboard KPI tile — consistent hover, focus, and touch targets.
 */
export function DashboardStatLink({
  to,
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  hint,
  ariaLabel,
  showTrend,
  trendIcon: TrendIcon,
  trendColor,
  className = "",
}: Props) {
  const Trend = TrendIcon;
  return (
    <Link
      to={to}
      className={`cn-stat-card block no-underline hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)] focus-visible:ring-offset-2 cn-touch-target ${className}`.trim()}
      aria-label={ariaLabel ?? `${label}: ${value}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
          <Icon className="w-5 h-5" style={{ color: iconColor }} aria-hidden />
        </div>
        {showTrend && Trend ? <Trend className="w-4 h-4" style={{ color: trendColor ?? cnTokens.green }} aria-hidden /> : null}
      </div>
      <p className="text-2xl" style={{ color: cnTokens.text }}>
        {value}
      </p>
      <p className="text-xs mt-0.5" style={{ color: cnTokens.textSecondary }}>
        {label}
      </p>
      {hint ? (
        <p className="text-xs mt-1" style={{ color: iconColor }}>
          {hint}
        </p>
      ) : null}
    </Link>
  );
}
