import { useState } from "react";
import { useNavigate } from "react-router";
import { CheckCircle, AlertCircle, User as UserIcon } from "lucide-react";
import { useAuth } from "@/frontend/auth/AuthContext";
import { activationService } from "@/backend/services/activation.service";
import i18n from "@/frontend/i18n";

export default function CompleteProfilePage() {
  const { user, refreshActivationStatus } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileConfirmed, setProfileConfirmed] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;

  // Role-aware profile completion links
  const getProfileLink = () => {
    switch (user.activeRole) {
      case "caregiver":
        return "/caregiver/profile";
      case "agency":
        return "/agency/storefront";
      case "shop":
        return "/shop/onboarding";
      default:
        return "/";
    }
  };

  const handleSubmit = async () => {
    if (!profileConfirmed) {
      setError(i18n.t("activation.completeProfile.confirmRequired", { ns: "common" }));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const userId = user.id;
      await activationService.submitForReview(userId);
      await refreshActivationStatus();
      navigate("/auth/pending-approval");
    } catch (err) {
      setError(i18n.t("activation.completeProfile.submitError", { ns: "common" }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <UserIcon size={32} />
      </div>

      <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
        {i18n.t("activation.completeProfile.title", { ns: "common" })}
      </h1>
      <p className="text-gray-600 text-center mb-8">
        {i18n.t("activation.completeProfile.description", { role: user.activeRole, ns: "common" })}
      </p>

      <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 mb-8">
        <p className="text-sm text-gray-600">
          {user.activeRole === 'caregiver' && i18n.t("activation.completeProfile.caregiverLink", { ns: "common" })}
          {user.activeRole === 'agency' && i18n.t("activation.completeProfile.agencyLink", { ns: "common" })}
          {user.activeRole === 'shop' && i18n.t("activation.completeProfile.shopLink", { ns: "common" })}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start" role="alert">
          <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
          {error}
        </div>
      )}

      <div className="mb-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={profileConfirmed}
            onChange={(e) => setProfileConfirmed(e.target.checked)}
            className="mt-1 w-4 h-4 text-[#1A1A1A] border-gray-300 rounded focus:ring-[#1A1A1A]"
          />
          <span className="text-sm text-gray-600">
            {i18n.t("activation.completeProfile.confirmLabel", { ns: "common" })}
          </span>
        </label>
      </div>

      <div className="space-y-4">
        <button
          className="w-full bg-[#1A1A1A] hover:bg-black text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? i18n.t("activation.queue.loading", { ns: "common" }) : i18n.t("activation.completeProfile.submitForReview", { ns: "common" })}
        </button>

        <button
          className="w-full py-3 text-gray-600 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          onClick={() => navigate(getProfileLink())}
        >
          {i18n.t("activation.completeProfileButton", { ns: "common" })}
        </button>
      </div>
    </div>
  );
}
