import { useEffect } from "react";
import { useTransitionNavigate } from "@/frontend/hooks/useTransitionNavigate";
import { useAuth } from "@/frontend/auth/AuthContext";
import { cn } from "@/frontend/theme/tokens";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@/frontend/hooks";
import { roleDashboardPath } from "@/backend/navigation/roleAppPaths";

/**
 * DashboardPage — Role-aware redirect.
 *
 * /dashboard → detects active role from auth context → redirects to
 * /{role}/dashboard (e.g. /caregiver/dashboard, /guardian/dashboard).
 *
 * If not authenticated, ProtectedRoute will redirect to login.
 */
export default function DashboardPage() {
  const { t: tDocTitle } = useTranslation("common");
  const { t: tDash } = useTranslation("dashboard");
  useDocumentTitle(tDocTitle("pageTitles.dashboard", "Dashboard"));

  const navigate = useTransitionNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      navigate("/auth/login", { replace: true });
      return;
    }

    // Redirect to role-specific dashboard
    navigate(roleDashboardPath(user.activeRole), { replace: true });
  }, [isAuthenticated, user, isLoading, navigate]);

  // Show spinner while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: cn.bgPage }}>
      <div className="text-center">
        <div
          className="w-10 h-10 rounded-full border-3 border-t-transparent animate-spin mx-auto mb-4"
          style={{ borderColor: cn.pink, borderTopColor: "transparent" }}
        />
        <p className="text-sm" style={{ color: cn.textSecondary }}>
          {tDash("shared.redirecting")}
        </p>
      </div>
    </div>
  );
}