/**
 * Channel Partner Pending Approval Page
 * Read-only submitted details, waiting for admin review
 */

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getMyChanPProfile, type ChanPProfile } from "@/backend/services/channelPartnerService";

export default function ChanPPendingApprovalPage() {
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

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold text-yellow-800 mb-2">
          {t("cp.pendingApproval.title")}
        </h1>
        <p className="text-yellow-700 mb-6">{t("cp.pendingApproval.message")}</p>

        <div className="bg-white rounded-lg p-6 text-left max-w-md mx-auto">
          <h2 className="font-semibold mb-4">{t("cp.pendingApproval.submittedInfo")}</h2>
          {profile && (
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-500">{t("cp.pendingApproval.businessName")}</dt>
                <dd className="font-medium">{profile.businessName || "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">{t("cp.pendingApproval.phone")}</dt>
                <dd className="font-medium">{profile.phone || "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">{t("cp.pendingApproval.submittedAt")}</dt>
                <dd className="font-medium">{new Date(profile.createdAt).toLocaleDateString()}</dd>
              </div>
            </dl>
          )}
        </div>

        <p className="text-sm text-yellow-600 mt-6">
          {t("cp.pendingApproval.contactSupport")}
        </p>
      </div>
    </div>
  );
}
