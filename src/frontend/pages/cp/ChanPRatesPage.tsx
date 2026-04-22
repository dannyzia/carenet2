/**
 * Channel Partner Rates Page
 * 4 role cards, rate history, read-only view
 */

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getMyRates, getRateHistory, type ChanPRateRecord } from "@/backend/services/channelPartnerService";
import { CP_LEAD_ROLES, CP_CONFIG } from "@/backend/utils/channelPartnerConstants";

export default function ChanPRatesPage() {
  const { t } = useTranslation();
  const [rates, setRates] = useState<Record<string, ChanPRateRecord>>({});
  const [history, setHistory] = useState<ChanPRateRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [ratesData, historyData] = await Promise.all([
        getMyRates(),
        getRateHistory(),
      ]);
      setRates(ratesData);
      setHistory(historyData);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t("cp.rates.title")}</h1>

      {/* Active Rates Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CP_LEAD_ROLES.map((role) => {
          const rate = rates[role];
          const isExpiring = rate && new Date(rate.expiresAt) < new Date(Date.now() + CP_CONFIG.RATE_EXPIRY_NOTIFICATION_WINDOW_DAYS * 24 * 60 * 60 * 1000);

          return (
            <div key={role} className={`bg-white rounded-lg shadow p-4 ${isExpiring ? "border-2 border-yellow-400" : ""}`}>
              <div className="text-2xl mb-2">
                {role === "guardian" && "👨‍👩‍👧"}
                {role === "agency" && "🏢"}
                {role === "caregiver" && "👩‍⚕️"}
                {role === "shop" && "🏪"}
              </div>
              <h3 className="font-medium capitalize">{t(`cp.roles.${role}`)}</h3>
              {rate ? (
                <>
                  <p className="text-3xl font-bold text-pink-600">{rate.rate}%</p>
                  <p className={`text-sm ${isExpiring ? "text-yellow-600 font-medium" : "text-gray-500"}`}>
                    {isExpiring ? t("cp.rates.expiringSoon") : t("cp.rates.expires")}: {new Date(rate.expiresAt).toLocaleDateString()}
                  </p>
                </>
              ) : (
                <p className="text-gray-400">{t("cp.rates.noRate")}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Rate History */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-lg font-semibold p-4 border-b">{t("cp.rates.history")}</h2>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium">{t("cp.rates.role")}</th>
              <th className="px-4 py-2 text-left text-sm font-medium">{t("cp.rates.rate")}</th>
              <th className="px-4 py-2 text-left text-sm font-medium">{t("cp.rates.effectiveFrom")}</th>
              <th className="px-4 py-2 text-left text-sm font-medium">{t("cp.rates.effectiveTo")}</th>
              <th className="px-4 py-2 text-left text-sm font-medium">{t("cp.rates.expiresAt")}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {history.map((rate) => (
              <tr key={rate.id} className={!rate.effectiveTo ? "bg-green-50" : ""}>
                <td className="px-4 py-2 capitalize">{rate.leadRole}</td>
                <td className="px-4 py-2 font-medium">{rate.rate}%</td>
                <td className="px-4 py-2">{new Date(rate.effectiveFrom).toLocaleDateString()}</td>
                <td className="px-4 py-2">{rate.effectiveTo ? new Date(rate.effectiveTo).toLocaleDateString() : t("cp.rates.current")}</td>
                <td className="px-4 py-2">{new Date(rate.expiresAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {history.length === 0 && (
          <div className="p-8 text-center text-gray-500">{t("cp.rates.noHistory")}</div>
        )}
      </div>
    </div>
  );
}
