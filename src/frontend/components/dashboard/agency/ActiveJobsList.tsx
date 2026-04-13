import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/frontend/components/ui/button";
import { cn } from "@/frontend/theme/tokens";
import type { AgencyExecutiveActiveJob } from "@/backend/models/agencyExecutiveDashboard.model";

export function ActiveJobsList({ jobs }: { jobs: AgencyExecutiveActiveJob[] }) {
  const { t } = useTranslation(["dashboard", "common"]);
  if (!jobs.length) {
    return (
      <p className="text-sm px-1" style={{ color: cn.textSecondary }}>
        {t("dashboard:agency.executive.activeJobsEmpty")}
      </p>
    );
  }

  return (
    <section aria-labelledby="agency-exec-active-jobs-heading">
      <h2 id="agency-exec-active-jobs-heading" className="text-base font-semibold mb-2 px-1" style={{ color: cn.text }}>
        {t("dashboard:agency.executive.activeJobsTitle")}
      </h2>
      <ul className="flex flex-col gap-2">
        {jobs.map((job) => {
          const patient =
            job.patientLabelKey != null
              ? String(t(job.patientLabelKey, job.patientLabelParams))
              : job.patientLabel;
          const statusText = job.statusKey
            ? String(t(job.statusKey, { defaultValue: job.status }))
            : job.status;
          return (
            <li
              key={job.id}
              className="cn-card-flat rounded-xl border border-[color-mix(in_srgb,var(--cn-text)_8%,transparent)] p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    to={job.placementHref}
                    className="text-sm font-medium truncate block hover:underline underline-offset-2"
                    style={{ color: cn.text }}
                  >
                    {patient}
                  </Link>
                  <p className="text-xs truncate mt-0.5" style={{ color: cn.textSecondary }}>
                    {job.caregiverLabel} · {job.windowLabel}
                  </p>
                </div>
                {job.isLive ? (
                  <span className="shrink-0 text-[0.65rem] font-semibold uppercase px-1.5 py-0.5 rounded" style={{ background: cn.greenBg, color: cn.green }}>
                    {t("dashboard:agency.executive.liveBadge")}
                  </span>
                ) : null}
              </div>
              <p className="text-xs" style={{ color: cn.textSecondary }}>
                {statusText}
              </p>
              <div className="flex flex-col gap-1.5 pt-1">
                {job.actions.map((act, idx) =>
                  act.to ? (
                    <Button
                      key={`${job.id}-${act.kind}`}
                      asChild
                      size="sm"
                      variant={idx === 0 ? "default" : "outline"}
                      className="w-full"
                    >
                      <Link to={act.to}>{t(act.labelKey)}</Link>
                    </Button>
                  ) : null,
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
