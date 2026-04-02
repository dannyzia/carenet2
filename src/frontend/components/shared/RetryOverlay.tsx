/**
 * RetryOverlay
 * ────────────
 * Shows a subtle top banner when any service-layer request is in
 * exponential backoff ("Retrying...") OR when the Realtime heartbeat
 * detects a silently disconnected channel ("dead" state).
 *
 * i18n keys: connectivity.retry.*, connectivity.heartbeat.*
 */

import { useState, useEffect, useRef } from "react";
import { RefreshCw, AlertTriangle, HeartCrack } from "lucide-react";
import { useTranslation } from "react-i18next";
import { onRetryActivityChange, type RetryActivity } from "@/backend/utils/retry";
import {
  onHeartbeatStatusChange,
  type HeartbeatStatus,
} from "@/backend/services/realtime";
import { cn } from "@/frontend/theme/tokens";

declare const __CARENET_PLAYWRIGHT_E2E__: boolean;

export function RetryOverlay() {
  if (typeof __CARENET_PLAYWRIGHT_E2E__ !== "undefined" && __CARENET_PLAYWRIGHT_E2E__) {
    return null;
  }
  const { t } = useTranslation("common");
  const [activity, setActivity] = useState<RetryActivity>({
    activeRetries: 0,
    lastRetryInfo: null,
  });
  const [heartbeat, setHeartbeat] = useState<HeartbeatStatus>("healthy");
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsub = onRetryActivityChange((a) => {
      setActivity(a);

      if (a.activeRetries > 0) {
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
        setVisible(true);
      } else if (heartbeat !== "dead") {
        hideTimerRef.current = setTimeout(() => {
          setVisible(false);
          hideTimerRef.current = null;
        }, 800);
      }
    });

    return () => {
      unsub();
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [heartbeat]);

  // Track heartbeat status for the "dead" banner
  useEffect(() => {
    const unsub = onHeartbeatStatusChange((status) => {
      setHeartbeat(status);
      if (status === "dead") {
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
        setVisible(true);
      } else if (status === "healthy" && activity.activeRetries === 0) {
        // Heartbeat recovered and no retries — show brief success then hide
        hideTimerRef.current = setTimeout(() => {
          setVisible(false);
          hideTimerRef.current = null;
        }, 800);
      }
    });
    return unsub;
  }, [activity.activeRetries]);

  if (!visible) return null;

  const info = activity.lastRetryInfo;
  const isActive = activity.activeRetries > 0;
  const isDead = heartbeat === "dead";

  // ─── Heartbeat dead banner (takes priority) ───
  if (isDead && !isActive) {
    return (
      <div
        className="flex items-center gap-2.5 px-4 py-2 text-xs transition-all duration-300"
        style={{
          background: "rgba(239, 68, 68, 0.08)",
          color: "#EF4444",
        }}
        data-testid="heartbeat-dead-banner"
      >
        <HeartCrack className="w-3.5 h-3.5 shrink-0" />
        <span>
          {t("connectivity.heartbeat.lost", { defaultValue: "Realtime channel lost" })}
          <span className="opacity-60">
            {" "}&middot; {t("connectivity.heartbeat.reconnecting", { defaultValue: "Reconnecting..." })}
          </span>
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2.5 px-4 py-2 text-xs transition-all duration-300"
      style={{
        background: isActive
          ? isDead ? "rgba(239, 68, 68, 0.08)" : cn.amberBg
          : cn.greenBg,
        color: isActive
          ? isDead ? "#EF4444" : cn.amber
          : cn.green,
        opacity: isActive ? 1 : 0.8,
        transform: isActive ? "translateY(0)" : "translateY(-2px)",
      }}
    >
      {isActive ? (
        <>
          {isDead ? (
            <HeartCrack className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin" />
          )}
          <span>
            {isDead
              ? t("connectivity.heartbeat.lost", { defaultValue: "Realtime channel lost" })
              : t("connectivity.retry.retrying")}
            {info && !isDead && (
              <>
                {" "}({t("connectivity.retry.attempt", { attempt: info.attempt })}
                {info.delayMs > 0 && (
                  <>, {t("connectivity.retry.nextIn", { seconds: (info.delayMs / 1000).toFixed(1) })}</>
                )}
                )
              </>
            )}
            {activity.activeRetries > 1 && (
              <span className="opacity-70">
                {" "}&middot; {t("connectivity.retry.requests", { count: activity.activeRetries })}
              </span>
            )}
          </span>
          {info?.error && (
            <span className="ml-auto hidden sm:inline-flex items-center gap-1 opacity-60 truncate max-w-[200px]">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              {info.error}
            </span>
          )}
        </>
      ) : (
        <>
          <RefreshCw className="w-3.5 h-3.5 shrink-0" />
          <span>{t("connectivity.retry.reconnected")}</span>
        </>
      )}
    </div>
  );
}