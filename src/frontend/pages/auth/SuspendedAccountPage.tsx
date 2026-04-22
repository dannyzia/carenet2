import { Lock } from "lucide-react";
import { useAuth } from "@/frontend/auth/AuthContext";
import i18n from "@/frontend/i18n";

export default function SuspendedAccountPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 text-center">
      <div className="w-16 h-16 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <Lock size={32} />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {i18n.t("activation.suspended.title", { ns: "common" })}
      </h1>
      <p className="text-gray-600 mb-6">
        {i18n.t("activation.suspended.description", { role: user.activeRole, ns: "common" })}
      </p>

      {user.activationNote && (
        <div className="text-left p-4 bg-gray-50 rounded-lg border border-gray-100 mb-8" role="alert" aria-live="assertive">
          <h3 className="font-semibold text-gray-800 mb-1">{i18n.t("activation.accountRejected.reasonLabel", { ns: "common" })}</h3>
          <p className="text-sm text-gray-700">{user.activationNote}</p>
        </div>
      )}

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-8">
        <p className="text-sm text-blue-800">
          {i18n.t("activation.suspended.contactSupport", { ns: "common" })}
        </p>
      </div>

      <button
        className="w-full py-3 text-gray-600 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        onClick={() => window.location.href = "mailto:support@carenet.demo"}
      >
        {i18n.t("activation.accountRejected.contactSupport", { ns: "common" })}
      </button>
    </div>
  );
}
