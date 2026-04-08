import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/frontend/auth/AuthContext";
import type { Role } from "@/frontend/auth/types";

/**
 * Renders child routes only if the signed-in user has at least one allowed role.
 * Use under `path: "admin"` (or similar) with nested child routes.
 */
export function RequireRole({ allowedRoles }: { allowedRoles: Role[] }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }
  const allowed = allowedRoles.some((r) => user.roles.includes(r));
  if (!allowed) {
    return <Navigate to={`/${user.activeRole}/dashboard`} replace />;
  }
  return <Outlet />;
}

/** Admin-only shell (System Health, audit, etc.). Moderators use /moderator/* routes. */
export function RequireAdminRoute() {
  return <RequireRole allowedRoles={["admin"]} />;
}
