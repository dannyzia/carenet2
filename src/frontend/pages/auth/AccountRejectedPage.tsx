import { useState, useRef, useEffect } from "react";
import { XCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/frontend/auth/AuthContext";
import { activationService } from "@/backend/services/activation.service";
import i18n from "@/frontend/i18n";

export default function AccountRejectedPage() {
  const { user, refreshActivationStatus } = useAuth();
  const [isReopening, setIsReopening] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Focus management on mount
  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  if (!user) return null;

  const handleReopen = async () => {
    setIsReopening(true);
    try {
      await activationService.reopenForEditing(user.id);
      await refreshActivationStatus();
    } catch (e) {
      console.error(e);
    } finally {
      setIsReopening(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 text-center">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <XCircle size={32} />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {i18n.t("activation.accountRejected.title", { ns: "common" })}
      </h1>
      <p className="text-gray-600 mb-6">
        {i18n.t("activation.accountRejected.description", { role: user.activeRole, ns: "common" })}
      </p>

      {user.activationNote && (
        <div className="text-left p-4 bg-red-50 rounded-lg border border-red-100 mb-8" role="alert" aria-live="assertive">
          <h3 className="font-semibold text-red-800 mb-1">{i18n.t("activation.accountRejected.reasonLabel", { ns: "common" })}</h3>
          <p className="text-sm text-red-700">{user.activationNote}</p>
        </div>
      )}

      <button
        ref={buttonRef}
        className="w-full bg-[#1A1A1A] hover:bg-black text-white py-3 rounded-lg font-medium flex items-center justify-center transition-colors disabled:opacity-50"
        onClick={handleReopen}
        disabled={isReopening}
      >
        {isReopening ? i18n.t("activation.queue.loading", { ns: "common" }) : i18n.t("activation.accountRejected.updateAndResubmit", { ns: "common" })}
        {!isReopening && <ArrowRight className="w-4 h-4 ml-2" />}
      </button>
    </div>
  );
}
