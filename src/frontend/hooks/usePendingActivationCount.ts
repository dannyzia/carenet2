/**
 * usePendingActivationCount — returns the current pending role activation count
 * for admin/moderator sidebar badge display. Subscribes to real-time count changes.
 */
import { useState, useEffect } from "react";
import { adminService } from "@/backend/services/admin.service";
import { moderatorService } from "@/backend/services/moderator.service";
import { useAuth } from "@/backend/store/auth/AuthContext";
import { isDemoUser } from "@/frontend/auth/mockAuth";

export function usePendingActivationCount(): number {
  const [count, setCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    if (isDemoUser(user)) return;

    const fetchCount = async () => {
      try {
        let pendingCount = 0;
        if (user.activeRole === "admin") {
          const result = await adminService.getPendingActivations();
          pendingCount = result.length;
        } else if (user.activeRole === "moderator") {
          const result = await moderatorService.getPendingActivations();
          pendingCount = result.length;
        }
        setCount(pendingCount);
      } catch (error) {
        console.error("Failed to fetch pending activation count:", error);
      }
    };

    fetchCount();

    // Poll every 30 seconds for updates (realtime subscription could be added later)
    const interval = setInterval(fetchCount, 30000);

    return () => clearInterval(interval);
  }, [user]);

  return count;
}
