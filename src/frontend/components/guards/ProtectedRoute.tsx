import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/frontend/auth/AuthContext";

/**
 * Roles that require activation approval before accessing protected routes.
 * Channel partner is excluded per the CP migration strategy (uses existing approval flow).
 */
const GATED_ROLES = ['caregiver', 'agency', 'shop'] as const;

const PROFILE_EDIT_PATHS: Record<string, string[]> = {
  caregiver: ['/caregiver/profile'],
  agency: ['/agency/storefront'],
  shop: ['/shop/onboarding'],
};

/**
 * ProtectedRoute — wraps authenticated route branches.
 * If user is not authenticated, redirects to login with return URL.
 * If user's role requires activation and status is not approved, redirects to holding page.
 */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#FEB4C5", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />;
  }

  // ─── Role Activation Gate ───
  if (user && GATED_ROLES.includes(user.activeRole as any)) {
    const status = user.activationStatus;

    // Skip gate if already approved or status is undefined (backward compatibility)
    if (status === 'approved' || !status) {
      return <Outlet />;
    }

    if (status === 'profile_incomplete') {
      const allowed = PROFILE_EDIT_PATHS[user.activeRole] || [];
      if (allowed.some(p => location.pathname.startsWith(p))) {
        return <Outlet />;
      }
      return <Navigate to="/auth/complete-profile" replace />;
    }

    // Redirect to appropriate holding page based on activation status
    switch (status) {
      case 'pending_approval':
        return <Navigate to="/auth/pending-approval" replace />;
      case 'rejected':
        return <Navigate to="/auth/account-rejected" replace />;
      case 'suspended':
        return <Navigate to="/auth/suspended" replace />;
      default:
        // Unknown status - allow through (defensive)
        return <Outlet />;
    }
  }

  return <Outlet />;
}
