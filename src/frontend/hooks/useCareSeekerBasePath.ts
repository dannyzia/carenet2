import { useMemo } from "react";
import { useLocation } from "react-router";

/**
 * Care seeker flows are mounted under `/guardian/*` and `/patient/*` (same components).
 * Use this hook so links and redirects stay on the correct prefix.
 */
export function useCareSeekerBasePath(): "/guardian" | "/patient" {
  const { pathname } = useLocation();
  return useMemo(
    () => (pathname.startsWith("/patient/") ? "/patient" : "/guardian"),
    [pathname],
  );
}
