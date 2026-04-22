/**
 * Channel Partner Account Page
 * Wallet balance, transactions, profile info, bank details
 */

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getMyChanPProfile, type ChanPProfile } from "@/backend/services/channelPartnerService";

export default function ChanPAccountPage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<ChanPProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const data = await getMyChanPProfile();
      setProfile(data);
      setLoading(false);
    }
    loadProfile();
  }, []);

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
        <h1 className="text-xl font-semibold text-red-600">{t("cp.account.notFound")}</h1>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t("cp.account.title")}</h1>

      {/* Profile Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">{t("cp.account.profileInfo")}</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-500">{t("cp.account.businessName")}</dt>
            <dd className="font-medium">{profile.businessName || "-"}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">{t("cp.account.referralCode")}</dt>
            <dd className="font-medium">{profile.referralCode || "-"}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">{t("cp.account.phone")}</dt>
            <dd className="font-medium">{profile.phone || "-"}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">{t("cp.account.status")}</dt>
            <dd className="font-medium capitalize">{profile.status}</dd>
          </div>
        </dl>
      </div>

      {/* Bank Account */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">{t("cp.account.bankDetails")}</h2>
        {profile.bankAccount ? (
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500">{t("cp.account.bankName")}</dt>
              <dd className="font-medium">{profile.bankAccount.bank}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">{t("cp.account.accountName")}</dt>
              <dd className="font-medium">{profile.bankAccount.accountName}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">{t("cp.account.accountNumber")}</dt>
              <dd className="font-medium">{profile.bankAccount.accountNumber}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">{t("cp.account.routingNumber")}</dt>
              <dd className="font-medium">{profile.bankAccount.routingNumber}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-gray-500">{t("cp.account.noBankDetails")}</p>
        )}
      </div>

      {/* Quick Links */}
      <div className="flex gap-4">
        <a
          href="/wallet"
          className="flex-1 py-3 bg-pink-600 text-white text-center rounded-lg hover:bg-pink-700"
        >
          {t("cp.account.viewWallet")}
        </a>
        <a
          href="/cp/commissions"
          className="flex-1 py-3 bg-gray-100 text-gray-800 text-center rounded-lg hover:bg-gray-200"
        >
          {t("cp.account.viewCommissions")}
        </a>
      </div>
    </div>
  );
}
