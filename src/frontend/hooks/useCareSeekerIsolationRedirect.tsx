import type React from "react";
import { useEffect, useRef } from "react";
import { Navigate } from "react-router";
import { useTranslation } from "react-i18next";
import { features } from "@/config/features";
import { useAuth } from "@/frontend/auth/AuthContext";
import { useAriaToast } from "@/frontend/hooks/useAriaToast";
import { roleMarketplaceHubPath } from "@/backend/navigation/roleAppPaths";

/** Target path when care-seeker caregiver discovery is disabled; otherwise null. */
export function useCareSeekerIsolationTarget(): string | null {
  const { user } = useAuth();
  if (features.careSeekerCaregiverContactEnabled) return null;
  const r = user?.activeRole;
  if (r !== "guardian" && r !== "patient") return null;
  return `${roleMarketplaceHubPath(r)}?tab=packages`;
}

/**
 * Renders `<Navigate />` when this route should be blocked for guardian/patient, and shows a toast once.
 */
export function CareSeekerIsolationRedirect(): React.ReactElement | null {
  const target = useCareSeekerIsolationTarget();
  const toast = useAriaToast();
  const { t } = useTranslation("common", { keyPrefix: "isolation" });
  const shown = useRef(false);

  useEffect(() => {
    if (!target || shown.current) return;
    shown.current = true;
    toast.info(t("caregiverContactDisabled"));
  }, [target, toast, t]);

  if (!target) return null;
  return <Navigate to={target} replace />;
}
