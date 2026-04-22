/**
 * Channel Partner Rejected Page
 * Show rejection reason, allow reapplication
 */

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { getMyChanPProfile, type ChanPProfile } from "@/backend/services/channelPartnerService";

export default function ChanPRejectedPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  const handleReapply = async () => {
    // Navigate to registration flow with existing data pre-filled
    // Note: The registration flow should detect existing rejected profile and allow reapplication
    navigate("/auth/register/channel_partner?reapply=true");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-red-800 mb-2">{t("cp.rejected.title")}</h1>

        {profile?.rejectionReason && (
          <div className="bg-white rounded-lg p-6 text-left max-w-md mx-auto mb-6">
            <h2 className="font-semibold text-red-700 mb-2">{t("cp.rejected.reason")}</h2>
            <p className="text-gray-700">{profile.rejectionReason}</p>
            {profile.rejectedAt && (
              <p className="text-sm text-gray-500 mt-2">
                {t("cp.rejected.rejectedOn")}: {new Date(profile.rejectedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        <p className="text-red-700 mb-6">{t("cp.rejected.message")}</p>

        <button
          onClick={handleReapply}
          className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
        >
          {t("cp.rejected.reapply")}
        </button>

        <p className="text-sm text-red-600 mt-4">
          {t("cp.rejected.contactSupport")}
        </p>
      </div>
    </div>
  );
}
