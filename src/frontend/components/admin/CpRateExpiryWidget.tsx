/**
 * Admin Channel Partner Rate Expiry Widget
 * Displays expiring commission rates for Channel Partners
 */

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { adminGetExpiringChanPRates } from "@/backend/services/channelPartnerService";
import { cn } from "@/frontend/theme/tokens";

interface ExpiringRate {
  cpId: string;
  cpName: string;
  cpUserId: string;
  rateId: string;
  leadRole: string;
  rate: number;
  expiresAt: string;
  daysUntilExpiry: number;
}

export function CpRateExpiryWidget() {
  const { t } = useTranslation(["admin", "cp"]);
  const [expiringRates, setExpiringRates] = useState<ExpiringRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const data = await adminGetExpiringChanPRates();
        if (!cancelled) {
          setExpiringRates(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[CpRateExpiryWidget] Failed to load expiring rates:", err);
          setError("Failed to load expiring rates");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/3" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-2 text-cn-text">
          {t("admin.cpRateExpiry.title", "Expiring Rates")}
        </h3>
        <p className="text-sm text-cn-red">
          {error}
        </p>
      </div>
    );
  }

  if (expiringRates.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-2 text-cn-text">
          {t("admin.cpRateExpiry.title", "Expiring Rates")}
        </h3>
        <p className="text-sm text-cn-text-secondary">
          {t("admin.cpRateExpiry.noExpiring", "No rates expiring soon")}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-cn-text">
          {t("admin.cpRateExpiry.title", "Expiring Rates")}
        </h3>
        <Link
          to="/admin/channel-partners"
          className="text-sm font-medium hover:underline text-cn-pink"
        >
          {t("admin.cpRateExpiry.viewAll", "View All")}
        </Link>
      </div>

      <div className="space-y-3">
        {expiringRates.slice(0, 5).map((rate) => (
          <div
            key={rate.rateId}
            className={`flex items-center justify-between p-3 rounded-lg ${
              rate.daysUntilExpiry <= 7
                ? "bg-red-50"
                : rate.daysUntilExpiry <= 14
                  ? "bg-amber-50"
                  : "bg-blue-50"
            }`}
          >
            <div className="flex-1">
              <p className="font-medium text-sm text-cn-text">
                {rate.cpName}
              </p>
              <p className="text-xs text-cn-text-secondary">
                {t(`cp.roles.${rate.leadRole}`)} - {rate.rate}%
              </p>
            </div>
            <div className="text-right">
              <p
                className={`text-sm font-semibold ${
                  rate.daysUntilExpiry <= 7
                    ? "text-cn-red"
                    : rate.daysUntilExpiry <= 14
                      ? "text-cn-amber"
                      : "text-cn-blue"
                }`}
              >
                {rate.daysUntilExpiry === 0
                  ? t("admin.cpRateExpiry.expiresToday", "Today")
                  : rate.daysUntilExpiry === 1
                    ? t("admin.cpRateExpiry.expiresTomorrow", "Tomorrow")
                    : t("admin.cpRateExpiry.daysLeft", {
                        count: rate.daysUntilExpiry,
                      })}
              </p>
              <p className="text-xs text-cn-text-secondary">
                {new Date(rate.expiresAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {expiringRates.length > 5 && (
        <p className="text-xs text-center mt-3 text-cn-text-secondary">
          {t("admin.cpRateExpiry.moreExpiring", {
            count: expiringRates.length - 5,
          })}
        </p>
      )}
    </div>
  );
}
