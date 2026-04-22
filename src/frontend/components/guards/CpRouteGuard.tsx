import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/frontend/auth/AuthContext";
import { getMyChanPProfile, type ChanPProfile } from "@/backend/services/channelPartnerService";

export function CpRouteGuard() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [profile, setProfile] = useState<ChanPProfile | null | undefined>(undefined);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!user || user.activeRole !== "channel_partner") {
        currentUserIdRef.current = null;
        setProfile(null);
        setProfileError(null);
        setProfileLoading(false);
        return;
      }

      if (currentUserIdRef.current === user.id && profile !== undefined && !profileError) {
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);
      setProfileError(null);

      try {
        const result = await getMyChanPProfile(user.id);
        if (!cancelled) {
          currentUserIdRef.current = user.id;
          setProfile(result);
        }
      } catch (error) {
        console.warn("[CpRouteGuard] failed to load channel partner profile", error);
        if (!cancelled) {
          setProfile(null);
          setProfileError("Unable to load Channel Partner profile. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.activeRole, retryCount]);

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-pink-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (user.activeRole !== "channel_partner") {
    return <Navigate to={`/${user.activeRole}/dashboard`} replace />;
  }

  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-6 text-center">
          <p className="text-base text-gray-700 mb-4">{profileError}</p>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700"
            onClick={() => {
              setProfileError(null);
              setProfile(undefined);
              setRetryCount((prev) => prev + 1);
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const status = profile?.status ?? "pending_approval";
  const currentPath = location.pathname;

  const targetRoute =
    status === "active"
      ? null
      : status === "pending_approval"
        ? "/cp/pending-approval"
        : status === "suspended"
          ? "/cp/suspended"
          : status === "rejected"
            ? "/cp/rejected"
            : status === "deactivated"
              ? "/cp/deactivated"
              : "/cp/pending-approval";

  const isOnStatusPage =
    currentPath === "/cp/pending-approval" ||
    currentPath === "/cp/suspended" ||
    currentPath === "/cp/rejected" ||
    currentPath === "/cp/deactivated";

  if (status === "active" && isOnStatusPage) {
    return <Navigate to="/cp/dashboard" replace />;
  }

  if (targetRoute && currentPath !== targetRoute) {
    return <Navigate to={targetRoute} replace />;
  }

  return <Outlet />;
}
