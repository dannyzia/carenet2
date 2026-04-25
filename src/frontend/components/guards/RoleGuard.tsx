import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/frontend/auth/AuthContext";
import type { Role } from "@/frontend/auth/types";
import { roleDashboardPath } from "@/backend/navigation/roleAppPaths";

interface RoleGuardProps {
  /** Allowed roles for this route branch */
  allowedRoles: Role[];
}

/**
 * RoleGuard — checks that the user's active role matches one of the allowed roles.
 * If not, redirects to the dashboard (which will route to the correct role dashboard).
 *
 * Usage in routes.ts:
 *   { element: <RoleGuard allowedRoles={["admin"]} />, children: [...] }
 */
export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  const hasAccess =
    allowedRoles.includes(user.activeRole) ||
    user.roles.some((r) => allowedRoles.includes(r));

  if (!hasAccess) {
    return <Navigate to={roleDashboardPath(user.activeRole)} replace />;
  }

  return <Outlet />;
}
