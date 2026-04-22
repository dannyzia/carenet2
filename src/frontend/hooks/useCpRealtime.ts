import { useEffect, useRef } from "react";
import { USE_SUPABASE, sb } from "@/backend/services/_sb";

export function useCpRealtime(
  table: string,
  event: "INSERT" | "UPDATE" | "DELETE" | "*",
  filter: string,
  enabled: boolean,
  callback: () => void,
) {
  // Use ref to store callback without triggering effect re-runs
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled || !USE_SUPABASE) {
      return;
    }

    const channelName = `cp-realtime-${table}-${filter}`;
    const channel = sb()
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event,
          schema: "public",
          table,
          filter,
        },
        () => {
          callbackRef.current();
        },
      )
      .subscribe();

    return () => {
      void sb().removeChannel(channel);
    };
  }, [table, event, filter, enabled]); // callback removed from deps
}
