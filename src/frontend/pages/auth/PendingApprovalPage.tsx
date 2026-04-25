import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { useAuth } from "@/frontend/auth/AuthContext";
import { useNavigate } from "react-router";
import i18n from "@/frontend/i18n";
import { roleDashboardPath } from "@/backend/navigation/roleAppPaths";

export default function PendingApprovalPage() {
  const { user, refreshActivationStatus } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;

  // Auto-navigate when status changes to approved
  useEffect(() => {
    if (user.activationStatus === 'approved') {
      navigate(roleDashboardPath(user.activeRole));
    }
  }, [user.activationStatus, user.activeRole, navigate]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshActivationStatus();
    setIsRefreshing(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 text-center">
      <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <Clock size={32} />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {i18n.t("activation.pendingApproval.title", { ns: "common" })}
      </h1>
      <p className="text-gray-600 mb-8">
        {i18n.t("activation.pendingApproval.description", { role: user.activeRole, ns: "common" })}
      </p>

      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100 mb-8" role="status" aria-live="polite">
        <p className="text-sm text-yellow-800">
          {i18n.t("activation.pendingApproval.refreshing", { ns: "common" })}
        </p>
      </div>

      <button
        className="w-full py-3 text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        onClick={handleRefresh}
        disabled={isRefreshing}
        aria-live="polite"
      >
        {isRefreshing ? i18n.t("activation.pendingApproval.refreshing", { ns: "common" }) : i18n.t("activation.pendingApproval.refreshStatus", { ns: "common" })}
      </button>
    </div>
  );
}
