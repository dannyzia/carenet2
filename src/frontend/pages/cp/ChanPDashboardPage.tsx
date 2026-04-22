/**
 * Channel Partner Dashboard Page
 * Summary cards, rate-expiry banner, recent activity, quick links
 */

import React, { useCallback, useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { useAuth } from "@/frontend/auth/AuthContext";
import { getMyChanPProfile, getMyRates, getMyCommissions, type ChanPProfile, type ChanPRateRecord, type ChanPCommission } from "@/backend/services/channelPartnerService";
import { CP_CONFIG } from "@/backend/utils/channelPartnerConstants";
import { useCpRealtime } from "@/frontend/hooks/useCpRealtime";

export default function ChanPDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ChanPProfile | null>(null);
  const [rates, setRates] = useState<Record<string, ChanPRateRecord>>({});
  const [commissions, setCommissions] = useState<ChanPCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const loadCommissions = useCallback(async () => {
    const commissionsData = await getMyCommissions({ status: "credited" });
    if (mountedRef.current) {
      setCommissions(commissionsData);
    }
  }, []);

  const loadPageData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileData, ratesData, commissionsData] = await Promise.all([
        getMyChanPProfile(),
        getMyRates(),
        getMyCommissions({ status: "credited" }),
      ]);
      if (!mountedRef.current) return;
      setProfile(profileData);
      setRates(ratesData);
      setCommissions(commissionsData);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void loadPageData();
    return () => {
      mountedRef.current = false;
    };
  }, [loadPageData]);

  useCpRealtime(
    "channel_partner_commissions",
    "*",
    user?.myChanPId ? `channel_partner_id=eq.${user.myChanPId}` : "",
    Boolean(user?.myChanPId),
    loadCommissions,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold text-red-600">{t("cp.error.noProfile")}</h1>
      </div>
    );
  }

  // Check for expiring rates
  const expiringRates = Object.values(rates).filter(
    (rate) =>
      !rate.effectiveTo &&
      new Date(rate.expiresAt) <
        new Date(Date.now() + CP_CONFIG.RATE_EXPIRY_DASHBOARD_VISIBILITY_DAYS * 24 * 60 * 60 * 1000)
  );

  const totalEarnings = commissions.reduce((sum, c) => sum + c.cpCommissionAmount, 0);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t("cp.dashboard.title")}</h1>

      {/* Rate Expiry Banner */}
      {expiringRates.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800">
            {t("cp.dashboard.expiringRates", { count: expiringRates.length })}
          </h3>
          <ul className="mt-2 space-y-1">
            {expiringRates.map((rate) => (
              <li key={rate.id} className="text-sm text-yellow-700">
                {t(`cp.roles.${rate.leadRole}`)}: {rate.rate}% (expires {new Date(rate.expiresAt).toLocaleDateString()})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">{t("cp.dashboard.referralCode")}</h3>
          <p className="text-lg font-semibold">{profile.referralCode || t("cp.dashboard.noCode")}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">{t("cp.dashboard.status")}</h3>
          <p className="text-lg font-semibold capitalize">{profile.status}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">{t("cp.dashboard.totalEarnings")}</h3>
          <p className="text-lg font-semibold">{totalEarnings.toLocaleString()} CP</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          to="/cp/leads"
          className="bg-pink-50 hover:bg-pink-100 rounded-lg p-4 text-center transition"
        >
          <span className="block text-2xl mb-2">👥</span>
          <span className="font-medium">{t("cp.dashboard.myLeads")}</span>
        </Link>
        <Link
          to="/cp/create-lead"
          className="bg-blue-50 hover:bg-blue-100 rounded-lg p-4 text-center transition"
        >
          <span className="block text-2xl mb-2">➕</span>
          <span className="font-medium">{t("cp.dashboard.createLead")}</span>
        </Link>
        <Link
          to="/cp/commissions"
          className="bg-green-50 hover:bg-green-100 rounded-lg p-4 text-center transition"
        >
          <span className="block text-2xl mb-2">💰</span>
          <span className="font-medium">{t("cp.dashboard.commissions")}</span>
        </Link>
        <Link
          to="/cp/rates"
          className="bg-purple-50 hover:bg-purple-100 rounded-lg p-4 text-center transition"
        >
          <span className="block text-2xl mb-2">📊</span>
          <span className="font-medium">{t("cp.dashboard.myRates")}</span>
        </Link>
      </div>
    </div>
  );
}
