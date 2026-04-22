/**
 * Channel Partner Suspended Page
 * Show suspension reason, admin contact info
 */

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getMyChanPProfile, type ChanPProfile } from "@/backend/services/channelPartnerService";

export default function ChanPSuspendedPage() {
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
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-orange-800 mb-2">{t("cp.suspended.title")}</h1>

        {profile?.suspendedReason && (
          <div className="bg-white rounded-lg p-6 text-left max-w-md mx-auto mb-6">
            <h2 className="font-semibold text-orange-700 mb-2">{t("cp.suspended.reason")}</h2>
            <p className="text-gray-700">{profile.suspendedReason}</p>
            {profile.suspendedAt && (
              <p className="text-sm text-gray-500 mt-2">
                {t("cp.suspended.suspendedOn")}: {new Date(profile.suspendedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        <p className="text-orange-700 mb-6">{t("cp.suspended.message")}</p>

        <div className="bg-white rounded-lg p-6 text-left max-w-md mx-auto">
          <h3 className="font-semibold mb-2">{t("cp.suspended.contactAdmin")}</h3>
          <p className="text-sm text-gray-600">
            Email: support@carenet.com
            <br />
            Phone: 0123456789
          </p>
        </div>
      </div>
    </div>
  );
}
