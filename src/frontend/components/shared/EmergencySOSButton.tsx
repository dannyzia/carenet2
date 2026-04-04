import { Link, useLocation } from "react-router";
import { ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Floating SOS entry — patient role only; hidden on the dedicated SOS route.
 */
export function EmergencySOSButton() {
  const { t } = useTranslation("common");
  const location = useLocation();
  if (location.pathname.includes("/patient/emergency-sos")) return null;

  return (
    <Link
      to="/patient/emergency-sos"
      className="fixed z-[45] flex items-center justify-center size-14 rounded-full bg-red-600 text-white shadow-lg shadow-red-600/40 md:size-16 cn-touch-target animate-pulse"
      style={{
        right: "max(1rem, env(safe-area-inset-right, 0px))",
        bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))",
      }}
      aria-label={t("emergencySos.floatingLabel")}
      data-testid="emergency-sos-fab"
    >
      <ShieldAlert className="size-7 md:size-8" aria-hidden />
    </Link>
  );
}
