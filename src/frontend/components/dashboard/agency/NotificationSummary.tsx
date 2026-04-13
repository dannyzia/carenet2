import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/frontend/theme/tokens";
import type { AgencyExecutiveNotificationSummary } from "@/backend/models/agencyExecutiveDashboard.model";
import { agencyAppPaths } from "@/backend/navigation/agencyAppPaths";

export function NotificationSummary({ data }: { data: AgencyExecutiveNotificationSummary }) {
  const { t } = useTranslation(["dashboard", "common"]);
  const { caregiverApplications, clientInterests, contractUpdates } = data;
  if (caregiverApplications === 0 && clientInterests === 0 && contractUpdates === 0) {
    return null;
  }

  const lines: { key: string; count: number; to: string }[] = [
    {
      key: "dashboard:agency.executive.notifClientInterests",
      count: clientInterests,
      to: agencyAppPaths.packageLeadsTab("clients"),
    },
    {
      key: "dashboard:agency.executive.notifCaregiverApps",
      count: caregiverApplications,
      to: agencyAppPaths.packageLeadsTab("caregivers"),
    },
    {
      key: "dashboard:agency.executive.notifContracts",
      count: contractUpdates,
      to: agencyAppPaths.bidManagement(),
    },
  ];

  return (
    <section
      className="cn-card-flat rounded-xl border border-[color-mix(in_srgb,var(--cn-text)_8%,transparent)] p-4"
      aria-labelledby="agency-exec-notif-heading"
    >
      <h2 id="agency-exec-notif-heading" className="text-base font-semibold mb-2" style={{ color: cn.text }}>
        {t("dashboard:agency.executive.notificationsTitle")}
      </h2>
      <ul className="list-disc pl-5 space-y-1.5 text-sm" style={{ color: cn.text }}>
        {lines
          .filter((l) => l.count > 0)
          .map((l) => (
            <li key={l.key}>
              <Link to={l.to} className="underline-offset-2 hover:underline" style={{ color: cn.text }}>
                {t(l.key, { count: l.count })}
              </Link>
            </li>
          ))}
      </ul>
    </section>
  );
}
