import { useLayoutEffect } from "react";
import { useNavigate } from "@/lib/react-router-shim";

/**
 * Legacy URL `/agency/marketplace-browse` → canonical care requirement board.
 * Client redirect so behavior does not depend on data-router loaders (PWA/HMR-safe).
 */
export default function AgencyMarketplaceBrowseLegacyRedirect() {
  const navigate = useNavigate();
  useLayoutEffect(() => {
    navigate("/agency/care-requirement-board", { replace: true });
  }, [navigate]);
  return (
    <div className="flex min-h-[30vh] items-center justify-center text-sm" style={{ color: "var(--cn-text-secondary)" }}>
      Redirecting…
    </div>
  );
}
