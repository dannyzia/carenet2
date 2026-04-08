/**
 * ConnectivityDemoPage — /dev/connectivity
 * ─────────────────────────────────────────
 * Interactive Storybook-style demo page for all connectivity components
 * and state simulation. Lets developers visually test:
 *
 *   - Offline / Online transitions
 *   - Lie-fi simulation (online but unreachable)
 *   - Slow 3G / throttled connections
 *   - Data Saver mode toggle
 *   - Realtime channel heartbeat states
 *   - Retry backoff behavior
 *
 * Uses _forceOnline() and realtime simulation helpers to drive
 * real component state without needing actual network manipulation.
 */

import { useState, useCallback } from "react";
import {
  Wifi, WifiOff, Zap, ZapOff, AlertTriangle, Play, Pause,
  RotateCcw, Heart, Activity, Radio, Gauge, BatteryLow,
  ChevronRight, Settings2, Bug, Layers, Plus, Minus, Send,
} from "lucide-react";
import { cn } from "@/frontend/theme/tokens";
import { useConnectivityDebug, type ConnectivityDebugInfo } from "@/frontend/hooks/useConnectivityDebug";
import { useGlobalChannelHealthToast } from "@/frontend/hooks/useGlobalChannelHealthToast";
import { _forceOnline } from "@/backend/utils/onlineState";
import { OfflineIndicator } from "@/frontend/components/shared/OfflineIndicator";
import { RetryOverlay } from "@/frontend/components/shared/RetryOverlay";
import { RealtimeStatusIndicator } from "@/frontend/components/shared/RealtimeStatusIndicator";
import { ChannelHealthDashboard as ChannelHealthDashboardComponent } from "@/frontend/components/shared/ChannelHealthDashboard";
import {
  simulateWalletUpdate,
  simulateNewTransaction,
  simulateContractUpdate,
  simulateNewOffer,
  startHeartbeat,
  stopHeartbeat,
  recordMessageReceived,
  startDemoSimulation,
  stopDemoSimulation,
  _registerChannel,
  _unregisterChannel,
  getChannelHeartbeats,
  CHANNEL_STALE_PRESETS,
  adminMonetizationChannelName,
} from "@/backend/services/realtime";
import { ChannelHealthSparkline } from "@/frontend/components/shared/ChannelHealthSparkline";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@/frontend/hooks";

// ═══════════════════════════════════════════════════════════════════════
// Simulation Controls
// ═══════════════════════════════════════════════════════════════════════

function SimCard({
  title,
  description,
  icon: Icon,
  color,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: cn.bgCard, border: `1px solid ${cn.borderLight}` }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color}15` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm" style={{ color: cn.text }}>{title}</h3>
          <p className="text-xs mt-0.5" style={{ color: cn.textSecondary }}>{description}</p>
        </div>
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

function SimButton({
  label,
  onClick,
  active,
  destructive,
  disabled,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  destructive?: boolean;
  disabled?: boolean;
}) {
  const bg = active
    ? destructive ? "#EF444420" : "#22C55E20"
    : `${cn.text}08`;
  const color = active
    ? destructive ? "#EF4444" : "#22C55E"
    : cn.textSecondary;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center gap-2 disabled:opacity-40"
      style={{ background: bg, color }}
    >
      <ChevronRight className="w-3 h-3 shrink-0" />
      {label}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Per-Channel Heartbeat Simulation
// ═══════════════════════════════════════════════════════════════════════

function getHeartbeatPresetChannels() {
  return [
    { id: "wallet:demo-user", preset: "wallet" as const, label: "Wallet (30s)" },
    { id: "contracts:demo-user", preset: "contract" as const, label: "Contract (45s)" },
    { id: adminMonetizationChannelName(), preset: "admin" as const, label: "Admin (120s)" },
    { id: "general:notifications", preset: "default" as const, label: "Default (60s)" },
  ];
}

function ChannelSimCard({ info }: { info: ConnectivityDebugInfo }) {
  const [registered, setRegistered] = useState<Set<string>>(new Set());

  const handleRegister = useCallback((channelId: string, preset: keyof typeof CHANNEL_STALE_PRESETS) => {
    _registerChannel(channelId, CHANNEL_STALE_PRESETS[preset]);
    setRegistered((prev) => new Set(prev).add(channelId));
  }, []);

  const handleUnregister = useCallback((channelId: string) => {
    _unregisterChannel(channelId);
    setRegistered((prev) => {
      const next = new Set(prev);
      next.delete(channelId);
      return next;
    });
  }, []);

  const handleUnregisterAll = useCallback(() => {
    for (const ch of getHeartbeatPresetChannels()) {
      _unregisterChannel(ch.id);
    }
    setRegistered(new Set());
  }, []);

  const handleRegisterAll = useCallback(() => {
    const presets = getHeartbeatPresetChannels();
    for (const ch of presets) {
      _registerChannel(ch.id, CHANNEL_STALE_PRESETS[ch.preset]);
    }
    setRegistered(new Set(presets.map((c) => c.id)));
  }, []);

  const handleTargetedMessage = useCallback((channelId: string) => {
    recordMessageReceived(channelId);
  }, []);

  return (
    <SimCard
      title="Per-Channel Heartbeat"
      description="Register/unregister mock channels and send targeted messages"
      icon={Layers}
      color="#00897B"
    >
      {/* Quick actions */}
      <div className="flex gap-2">
        <button
          data-testid="sim-register-all"
          onClick={handleRegisterAll}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] transition-all"
          style={{ background: "#22C55E15", color: "#22C55E" }}
        >
          <Plus className="w-3 h-3" /> Register All
        </button>
        <button
          data-testid="sim-unregister-all"
          onClick={handleUnregisterAll}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] transition-all"
          style={{ background: "#EF444415", color: "#EF4444" }}
        >
          <Minus className="w-3 h-3" /> Unregister All
        </button>
      </div>

      {/* Individual channel controls */}
      <div className="space-y-1.5">
        {getHeartbeatPresetChannels().map((ch) => {
          const isRegistered = registered.has(ch.id);
          const liveState = info.channelHeartbeats.find((h) => h.channelId === ch.id);
          const statusColor = liveState
            ? liveState.status === "healthy" ? "#22C55E"
              : liveState.status === "stale" ? "#F59E0B"
              : "#EF4444"
            : "#9CA3AF";

          return (
            <div
              key={ch.id}
              data-testid={`sim-channel-${ch.preset}`}
              className="rounded-lg p-2"
              style={{ background: `${cn.text}05` }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="inline-block w-2 h-2 rounded-full shrink-0"
                  style={{ background: statusColor }}
                />
                <span className="text-[10px] flex-1 truncate" style={{ color: cn.text }}>
                  {ch.label}
                </span>
                <span className="text-[9px] opacity-50 font-mono">{ch.id}</span>
              </div>

              {liveState && (
                <div className="flex items-center gap-2 mb-1.5 pl-3.5">
                  <span className="text-[9px]" style={{ color: statusColor }}>{liveState.status}</span>
                  <span className="text-[9px] opacity-40">
                    {Math.round((Date.now() - liveState.lastMessageTs) / 1000)}s ago
                    {liveState.consecutiveStaleChecks > 0 && ` · ${liveState.consecutiveStaleChecks}x stale`}
                  </span>
                </div>
              )}

              {/* Health history sparkline */}
              {isRegistered && (
                <div className="mb-1.5 pl-3.5" data-testid={`sim-sparkline-${ch.preset}`}>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-[8px] opacity-30" style={{ color: cn.textSecondary }}>
                      History
                    </span>
                  </div>
                  <ChannelHealthSparkline
                    channelId={ch.id}
                    windowMs={60_000}
                    height={8}
                    refreshMs={2_000}
                  />
                </div>
              )}

              <div className="flex gap-1">
                {!isRegistered ? (
                  <button
                    data-testid={`sim-register-${ch.preset}`}
                    onClick={() => handleRegister(ch.id, ch.preset)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px]"
                    style={{ background: "#22C55E15", color: "#22C55E" }}
                  >
                    <Plus className="w-2.5 h-2.5" /> Register
                  </button>
                ) : (
                  <>
                    <button
                      data-testid={`sim-unregister-${ch.preset}`}
                      onClick={() => handleUnregister(ch.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px]"
                      style={{ background: "#EF444415", color: "#EF4444" }}
                    >
                      <Minus className="w-2.5 h-2.5" /> Remove
                    </button>
                    <button
                      data-testid={`sim-msg-${ch.preset}`}
                      onClick={() => handleTargetedMessage(ch.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px]"
                      style={{ background: "#3B82F615", color: "#3B82F6" }}
                    >
                      <Send className="w-2.5 h-2.5" /> Message
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Channel count summary */}
      <div className="text-center pt-1" style={{ borderTop: `1px solid ${cn.borderLight}` }}>
        <span className="text-[9px]" style={{ color: cn.textSecondary }}>
          {info.channelHeartbeats.length} channel{info.channelHeartbeats.length !== 1 ? "s" : ""} registered ·
          Aggregate: <span style={{ color: info.heartbeatStatus === "healthy" ? "#22C55E" : info.heartbeatStatus === "stale" ? "#F59E0B" : "#EF4444" }}>
            {info.heartbeatStatus}
          </span>
        </span>
      </div>
    </SimCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Live Debug Data Display
// ═══════════════════════════════════════════════════════════════════════

function DebugDataRow({ label, value, color }: { label: string; value: string; color?: string }) {
  const testId = `debug-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")}`;
  return (
    <div className="flex items-center justify-between py-1" data-testid={testId}>
      <span className="text-[11px]" style={{ color: cn.textSecondary }}>{label}</span>
      <span
        className="text-[11px] font-mono"
        style={{ color: color || cn.text }}
        data-testid={`${testId}-value`}
      >
        {value}
      </span>
    </div>
  );
}

function LiveDebugSection({ info }: { info: ConnectivityDebugInfo }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: cn.bgCard, border: `1px solid ${cn.borderLight}` }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Bug className="w-4 h-4" style={{ color: "#F59E0B" }} />
        <h3 className="text-sm" style={{ color: cn.text }}>Live Debug Data</h3>
        <span className="text-[10px] ml-auto px-1.5 py-0.5 rounded" style={{ background: "#22C55E20", color: "#22C55E" }}>
          LIVE
        </span>
      </div>

      <div className="space-y-0.5">
        <p className="text-[9px] uppercase tracking-wider mt-1 mb-1" style={{ color: cn.textSecondary, opacity: 0.5 }}>
          Network
        </p>
        <DebugDataRow
          label="Online"
          value={info.isOnline ? "true" : "false"}
          color={info.isOnline ? "#22C55E" : "#EF4444"}
        />
        <DebugDataRow label="Connection Type" value={info.connectionType} />

        <p className="text-[9px] uppercase tracking-wider mt-2 mb-1" style={{ color: cn.textSecondary, opacity: 0.5 }}>
          Lie-Fi Probe
        </p>
        <DebugDataRow
          label="Running"
          value={info.probeRunning ? "true" : "false"}
          color={info.probeRunning ? "#22C55E" : "#9CA3AF"}
        />
        <DebugDataRow label="Interval" value={info.probeIntervalLabel} />
        <DebugDataRow
          label="In Backoff"
          value={info.probeInBackoff ? "true" : "false"}
          color={info.probeInBackoff ? "#F59E0B" : undefined}
        />
        <DebugDataRow label="Failures" value={String(info.probeConsecutiveFailures)} />
        <DebugDataRow
          label="Data Saver"
          value={info.dataSaverEnabled ? "ON" : "off"}
          color={info.dataSaverEnabled ? "#F59E0B" : undefined}
        />
        <DebugDataRow
          label="Paused (Saver)"
          value={info.probePausedForDataSaver ? "true" : "false"}
        />

        <p className="text-[9px] uppercase tracking-wider mt-2 mb-1" style={{ color: cn.textSecondary, opacity: 0.5 }}>
          Realtime
        </p>
        <DebugDataRow
          label="Channel Status"
          value={info.realtimeStatus}
          color={
            info.realtimeStatus === "connected" ? "#22C55E"
            : info.realtimeStatus === "connecting" ? "#F59E0B"
            : "#EF4444"
          }
        />
        <DebugDataRow
          label="Heartbeat"
          value={info.heartbeatStatus}
          color={
            info.heartbeatStatus === "healthy" ? "#22C55E"
            : info.heartbeatStatus === "stale" ? "#F59E0B"
            : info.heartbeatStatus === "dead" ? "#EF4444"
            : undefined
          }
        />
        <DebugDataRow label="Last Msg" value={`${info.timeSinceLastMessageSec}s ago`} />
        <DebugDataRow
          label="HB Running"
          value={info.heartbeatRunning ? "true" : "false"}
        />

        {/* Per-Channel Heartbeats */}
        {info.channelHeartbeats.length > 0 && (
          <>
            <p className="text-[9px] uppercase tracking-wider mt-2 mb-1" style={{ color: cn.textSecondary, opacity: 0.5 }}>
              Channels ({info.channelHeartbeats.length})
            </p>
            {info.channelHeartbeats.map((ch) => {
              const elapsed = Math.round((Date.now() - ch.lastMessageTs) / 1000);
              const staleLabel = ch.staleMs >= 60_000
                ? `${Math.round(ch.staleMs / 60_000)}m`
                : `${Math.round(ch.staleMs / 1_000)}s`;
              return (
                <DebugDataRow
                  key={ch.channelId}
                  label={ch.channelId}
                  value={`${ch.status} · stale:${staleLabel} · ${elapsed}s`}
                  color={
                    ch.status === "healthy" ? "#22C55E"
                    : ch.status === "stale" ? "#F59E0B"
                    : ch.status === "dead" ? "#EF4444"
                    : undefined
                  }
                />
              );
            })}
          </>
        )}

        <p className="text-[9px] uppercase tracking-wider mt-2 mb-1" style={{ color: cn.textSecondary, opacity: 0.5 }}>
          Retry
        </p>
        <DebugDataRow
          label="Active Retries"
          value={String(info.activeRetries)}
          color={info.activeRetries > 0 ? "#F59E0B" : undefined}
        />
        {info.lastRetryInfo && (
          <>
            <DebugDataRow label="Attempt" value={`#${info.lastRetryInfo.attempt}`} />
            <DebugDataRow label="Delay" value={`${info.lastRetryInfo.delayMs}ms`} />
            <DebugDataRow label="Error" value={info.lastRetryInfo.error} />
          </>
        )}

        <div className="pt-1 mt-1" style={{ borderTop: `1px solid ${cn.borderLight}` }}>
          <DebugDataRow label="Updated" value={new Date(info.lastUpdated).toLocaleTimeString()} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Component Previews
// ═══════════════════════════════════════════════════════════════════════

function ComponentPreview() {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: cn.bgCard, border: `1px solid ${cn.borderLight}` }}
    >
      <h3 className="text-sm mb-3" style={{ color: cn.text }}>Component Preview</h3>

      <div className="space-y-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: cn.textSecondary, opacity: 0.5 }}>
            OfflineIndicator
          </p>
          <OfflineIndicator />
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: cn.textSecondary, opacity: 0.5 }}>
            RetryOverlay
          </p>
          <RetryOverlay />
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: cn.textSecondary, opacity: 0.5 }}>
            RealtimeStatusIndicator (dot)
          </p>
          <RealtimeStatusIndicator variant="dot" />
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: cn.textSecondary, opacity: 0.5 }}>
            RealtimeStatusIndicator (badge)
          </p>
          <RealtimeStatusIndicator variant="badge" />
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: cn.textSecondary, opacity: 0.5 }}>
            RealtimeStatusIndicator (full)
          </p>
          <RealtimeStatusIndicator variant="full" />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════════════

export default function ConnectivityDemoPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.connectivityDemo", "Connectivity Demo"));

  const info = useConnectivityDebug();
  const [demoRunning, setDemoRunning] = useState(false);
  const [heartbeatActive, setHeartbeatActive] = useState(false);

  // Enable global channel health toasts on this page for testing
  useGlobalChannelHealthToast();

  const handleGoOffline = useCallback(() => {
    _forceOnline(false);
    window.dispatchEvent(new Event("offline"));
  }, []);

  const handleGoOnline = useCallback(() => {
    _forceOnline(true);
    window.dispatchEvent(new Event("online"));
  }, []);

  const handleSimulateLieFi = useCallback(() => {
    _forceOnline(false);
  }, []);

  const handleSimulateWalletEvent = useCallback(() => {
    simulateWalletUpdate({
      user_id: "demo-user",
      balance: Math.floor(Math.random() * 100000) + 10000,
      pending_due: Math.floor(Math.random() * 5000),
    });
  }, []);

  const handleSimulateTransaction = useCallback(() => {
    const types = ["earning", "purchase", "bonus", "refund", "commission"];
    simulateNewTransaction({
      type: types[Math.floor(Math.random() * types.length)],
      amount: Math.floor(Math.random() * 10000) + 500,
      description: `Demo transaction at ${new Date().toLocaleTimeString()}`,
      wallet_id: "demo-wallet",
    });
  }, []);

  const handleSimulateContractUpdate = useCallback(() => {
    const statuses = ["accepted", "rejected", "counter_offered", "completed"];
    simulateContractUpdate({
      contract_number: `CTR-2026-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      agreed_price: Math.floor(Math.random() * 15000) + 3000,
    });
  }, []);

  const handleSimulateOffer = useCallback(() => {
    simulateNewOffer({
      contract_id: `CTR-2026-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`,
      offered_by_name: ["Mock_CareFirst Agency", "HomeCare BD", "NursePlus", "CareNet Pro"][
        Math.floor(Math.random() * 4)
      ],
      points_per_day: Math.floor(Math.random() * 5000) + 4000,
      status: "pending",
    });
  }, []);

  const handleToggleDemo = useCallback(() => {
    if (demoRunning) {
      stopDemoSimulation();
      setDemoRunning(false);
    } else {
      startDemoSimulation();
      setDemoRunning(true);
    }
  }, [demoRunning]);

  const handleToggleHeartbeat = useCallback(() => {
    if (heartbeatActive) {
      stopHeartbeat();
      setHeartbeatActive(false);
    } else {
      startHeartbeat({ staleMs: 15_000, checkIntervalMs: 5_000 }); // Faster for demo
      setHeartbeatActive(true);
    }
  }, [heartbeatActive]);

  const handleRecordMessage = useCallback(() => {
    recordMessageReceived();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #DB869A, #5FB865)" }}
          >
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl" style={{ color: cn.text }}>Connectivity Lab</h1>
            <p className="text-xs" style={{ color: cn.textSecondary }}>
              Interactive testing for offline infrastructure, heartbeat, and Data Saver detection
            </p>
          </div>
        </div>
      </div>

      {/* Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

        {/* Network State Simulation */}
        <SimCard
          title="Network State"
          description="Toggle device online/offline state"
          icon={info.isOnline ? Wifi : WifiOff}
          color={info.isOnline ? "#22C55E" : "#EF4444"}
        >
          <SimButton
            label="Go Offline"
            onClick={handleGoOffline}
            active={!info.isOnline}
            destructive
          />
          <SimButton
            label="Go Online"
            onClick={handleGoOnline}
            active={info.isOnline}
          />
          <SimButton
            label="Simulate Lie-Fi (internal offline, browser online)"
            onClick={handleSimulateLieFi}
          />
        </SimCard>

        {/* Realtime Events */}
        <SimCard
          title="Realtime Events"
          description="Fire mock Supabase Realtime events"
          icon={Radio}
          color="#7B5EA7"
        >
          <SimButton label="Simulate Wallet Update" onClick={handleSimulateWalletEvent} />
          <SimButton label="Simulate Transaction" onClick={handleSimulateTransaction} />
          <SimButton label="Simulate Contract Update" onClick={handleSimulateContractUpdate} />
          <SimButton label="Simulate New Offer" onClick={handleSimulateOffer} />
          <SimButton
            label={demoRunning ? "Stop Auto-Demo (every 45s)" : "Start Auto-Demo (every 45s)"}
            onClick={handleToggleDemo}
            active={demoRunning}
          />
        </SimCard>

        {/* Heartbeat Controls */}
        <SimCard
          title="WebSocket Heartbeat"
          description="Test application-level ping/pong health checks"
          icon={Heart}
          color="#DB869A"
        >
          <SimButton
            label={heartbeatActive ? "Stop Heartbeat Monitor" : "Start Heartbeat Monitor (fast: 15s/5s)"}
            onClick={handleToggleHeartbeat}
            active={heartbeatActive}
          />
          <SimButton
            label="Record Message (reset staleness)"
            onClick={handleRecordMessage}
          />
          <div className="px-3 py-1.5 rounded-lg text-[10px] space-y-0.5" style={{ background: `${cn.text}05` }}>
            <div className="flex justify-between" style={{ color: cn.textSecondary }}>
              <span>Status:</span>
              <span style={{
                color: info.heartbeatStatus === "healthy" ? "#22C55E"
                  : info.heartbeatStatus === "stale" ? "#F59E0B"
                  : "#EF4444"
              }}>
                {info.heartbeatStatus}
              </span>
            </div>
            <div className="flex justify-between" style={{ color: cn.textSecondary }}>
              <span>Last msg:</span>
              <span>{info.timeSinceLastMessageSec}s ago</span>
            </div>
            <div className="flex justify-between" style={{ color: cn.textSecondary }}>
              <span>Running:</span>
              <span>{info.heartbeatRunning ? "Yes" : "No"}</span>
            </div>
          </div>
        </SimCard>

        {/* Per-Channel Heartbeat Simulation */}
        <ChannelSimCard info={info} />

        {/* Channel Health Dashboard */}
        <ChannelHealthDashboardComponent />

        {/* Data Saver Info */}
        <SimCard
          title="Data Saver Detection"
          description="Shows navigator.connection.saveData state (toggle in browser settings)"
          icon={BatteryLow}
          color="#F59E0B"
        >
          <div className="px-3 py-2 rounded-lg text-xs" style={{ background: `${cn.text}05`, color: cn.textSecondary }}>
            <p>
              Data Saver is{" "}
              <span style={{ color: info.dataSaverEnabled ? "#F59E0B" : "#22C55E" }}>
                {info.dataSaverEnabled ? "ENABLED" : "disabled"}
              </span>
            </p>
            <p className="mt-1 opacity-70">
              {info.dataSaverEnabled
                ? "Lie-fi probes are being skipped to save data."
                : "Lie-fi probes are running normally."}
            </p>
            <p className="mt-1 opacity-50">
              Probe paused for saver: {info.probePausedForDataSaver ? "Yes" : "No"}
            </p>
          </div>
        </SimCard>

        {/* Component Preview */}
        <ComponentPreview />

        {/* Live Debug Data */}
        <LiveDebugSection info={info} />
      </div>

      {/* Footer hint */}
      <div className="text-center pb-4">
        <p className="text-[11px]" style={{ color: cn.textSecondary, opacity: 0.5 }}>
          Press <kbd className="px-1 py-0.5 rounded text-[10px]" style={{ background: `${cn.text}10` }}>Ctrl+Shift+D</kbd> to
          toggle the floating debug panel &middot; Triple-tap on touch devices
        </p>
      </div>
    </div>
  );
}
