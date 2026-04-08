/**
 * CareNet Real-time Subscription Manager
 * ───────────────────────────────────────
 * Provides real-time updates for wallet balances, care contracts, and bids.
 *
 * When USE_SUPABASE is true:
 *   Uses Supabase Realtime channels (postgres_changes)
 *
 * When USE_SUPABASE is false:
 *   Uses a local EventEmitter that can be triggered manually
 *   for development and demos (see simulateWalletUpdate / simulateContractUpdate)
 *
 * Includes application-level heartbeat monitoring that detects silent
 * channel disconnections.
 */

import { USE_SUPABASE, getSupabaseClient } from "./supabase";
import { isDemoSession } from "./_sb";
import { isOnline, onOnlineChange } from "@/backend/utils/onlineState";

/** Postgres schema used for realtime `postgres_changes` (matches `sbData()` routing). */
export function getRealtimeDataSchema(): "public" | "demo" {
  return isDemoSession() ? "demo" : "public";
}

/** Channel name for `subscribeToMonetization` (keep UI health hooks in sync). */
export function monetizationChannelName(userId: string): string {
  return `monetization:${getRealtimeDataSchema()}:${userId}`;
}

/** Channel name for `subscribeToAllMonetization`. */
export function adminMonetizationChannelName(): string {
  return `admin:monetization:${getRealtimeDataSchema()}`;
}

// ─── Event types ───
export type RealtimeEvent =
  | { table: "wallets"; type: "UPDATE"; payload: Record<string, unknown> }
  | { table: "wallet_transactions"; type: "INSERT"; payload: Record<string, unknown> }
  | { table: "care_contracts"; type: "UPDATE"; payload: Record<string, unknown> }
  | { table: "care_contract_bids"; type: "INSERT"; payload: Record<string, unknown> };

type Listener = (event: RealtimeEvent) => void;

// ─── Local event bus for mock mode ───
const listeners = new Set<Listener>();

function emit(event: RealtimeEvent) {
  recordMessageReceived(); // Track for heartbeat staleness
  listeners.forEach((fn) => {
    try { fn(event); } catch (e) { console.error("[Realtime] listener error:", e); }
  });
}

// ─── Connection Health Status ───

export type ConnectionStatus = "connected" | "connecting" | "disconnected";

type StatusListener = (status: ConnectionStatus) => void;
const statusListeners = new Set<StatusListener>();
let _currentStatus: ConnectionStatus = USE_SUPABASE ? "connecting" : "connected";

function setConnectionStatus(status: ConnectionStatus) {
  if (status === _currentStatus) return;
  _currentStatus = status;
  statusListeners.forEach((fn) => {
    try { fn(status); } catch (e) { console.error("[Realtime] status listener error:", e); }
  });
}

export function getConnectionStatus(): ConnectionStatus {
  return _currentStatus;
}

export function onConnectionStatusChange(listener: StatusListener): () => void {
  statusListeners.add(listener);
  listener(_currentStatus);
  return () => { statusListeners.delete(listener); };
}

// ─── Channel tracking for health monitoring ───
let _activeChannelCount = 0;

function trackChannelConnected() {
  _activeChannelCount++;
  setConnectionStatus("connected");
  if (_activeChannelCount === 1 && !_heartbeatRunning) {
    startHeartbeat();
  }
}

function trackChannelDisconnected() {
  _activeChannelCount = Math.max(0, _activeChannelCount - 1);
  if (_activeChannelCount === 0 && USE_SUPABASE) {
    setConnectionStatus("disconnected");
    stopHeartbeat();
  }
}

// ═══════════════════════════════════════════════════════════════════════
// WebSocket Heartbeat / Ping-Pong Health Check
// ═══════════════════════════════════════════════════════════════════════

export interface HeartbeatConfig {
  staleMs?: number;
  pongTimeoutMs?: number;
  checkIntervalMs?: number;
}

const DEFAULT_HEARTBEAT: Required<HeartbeatConfig> = {
  staleMs: 60_000,
  pongTimeoutMs: 10_000,
  checkIntervalMs: 15_000,
};

let _heartbeatConfig: Required<HeartbeatConfig> = { ...DEFAULT_HEARTBEAT };
let _heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let _lastMessageTs = Date.now();
let _lastPingSentTs = 0;
let _pendingPong = false;
let _heartbeatRunning = false;
let _consecutiveStaleChecks = 0;

// ─── Per-channel heartbeat tracking ───

export interface ChannelHeartbeatState {
  channelId: string;
  staleMs: number;
  lastMessageTs: number;
  status: HeartbeatStatus;
  consecutiveStaleChecks: number;
}

// ─── Per-channel status history (ring buffer) ───

export interface ChannelStatusEntry {
  ts: number;
  status: HeartbeatStatus;
}

const HISTORY_MAX_ENTRIES = 120;

const _channelHistory = new Map<string, ChannelStatusEntry[]>();

function _recordHistory(channelId: string, status: HeartbeatStatus) {
  let arr = _channelHistory.get(channelId);
  if (!arr) {
    arr = [];
    _channelHistory.set(channelId, arr);
  }
  const now = Date.now();
  const last = arr.length > 0 ? arr[arr.length - 1] : null;
  if (last && last.status === status && now - last.ts < 1_000) return;
  arr.push({ ts: now, status });
  if (arr.length > HISTORY_MAX_ENTRIES) {
    arr.splice(0, arr.length - HISTORY_MAX_ENTRIES);
  }
}

export function getChannelHistory(channelId: string): ChannelStatusEntry[] {
  return [...(_channelHistory.get(channelId) ?? [])];
}

export function getAllChannelHistories(): Record<string, ChannelStatusEntry[]> {
  const result: Record<string, ChannelStatusEntry[]> = {};
  for (const [id, arr] of _channelHistory.entries()) {
    result[id] = [...arr];
  }
  return result;
}

export const CHANNEL_STALE_PRESETS = {
  wallet: 30_000,
  contract: 45_000,
  admin: 120_000,
  default: 60_000,
} as const;

const _channelHeartbeats = new Map<string, ChannelHeartbeatState>();

function _registerChannel(channelId: string, staleMs: number) {
  _channelHeartbeats.set(channelId, {
    channelId,
    staleMs,
    lastMessageTs: Date.now(),
    status: "healthy",
    consecutiveStaleChecks: 0,
  });
  _recordHistory(channelId, "healthy");
}

function _unregisterChannel(channelId: string) {
  _channelHeartbeats.delete(channelId);
  _channelHistory.delete(channelId);
}

// ─── Test helpers ───
export { _registerChannel, _unregisterChannel };

export function _resetHeartbeatState() {
  stopHeartbeat();
  _channelHeartbeats.clear();
  _channelHistory.clear();
  _currentHeartbeatStatus = "healthy";
  _heartbeatListeners.clear();
  _lastMessageTs = Date.now();
  _lastPingSentTs = 0;
  _pendingPong = false;
  _consecutiveStaleChecks = 0;
}

// ─── Heartbeat event ───
export type HeartbeatStatus = "healthy" | "stale" | "dead";
type HeartbeatListener = (status: HeartbeatStatus) => void;
const _heartbeatListeners = new Set<HeartbeatListener>();
let _currentHeartbeatStatus: HeartbeatStatus = "healthy";

function _setHeartbeatStatus(status: HeartbeatStatus) {
  if (status === _currentHeartbeatStatus) return;
  _currentHeartbeatStatus = status;
  _heartbeatListeners.forEach((fn) => {
    try { fn(status); } catch (e) { console.error("[Realtime] heartbeat listener error:", e); }
  });
}

function _recomputeAggregateStatus() {
  let worst: HeartbeatStatus = "healthy";
  for (const ch of _channelHeartbeats.values()) {
    if (ch.status === "dead") { worst = "dead"; break; }
    if (ch.status === "stale") worst = "stale";
  }
  _setHeartbeatStatus(worst);
}

export function recordMessageReceived(channelId?: string) {
  const now = Date.now();
  _lastMessageTs = now;
  _consecutiveStaleChecks = 0;

  if (channelId) {
    const ch = _channelHeartbeats.get(channelId);
    if (ch) {
      ch.lastMessageTs = now;
      ch.consecutiveStaleChecks = 0;
      if (ch.status !== "healthy") {
        ch.status = "healthy";
        _recomputeAggregateStatus();
      }
      _recordHistory(channelId, "healthy");
    }
  } else {
    for (const ch of _channelHeartbeats.values()) {
      ch.lastMessageTs = now;
      ch.consecutiveStaleChecks = 0;
      ch.status = "healthy";
      _recordHistory(ch.channelId, "healthy");
    }
    if (_currentHeartbeatStatus !== "healthy") {
      _setHeartbeatStatus("healthy");
    }
  }
}

export function getHeartbeatStatus(): HeartbeatStatus {
  return _currentHeartbeatStatus;
}

export function getTimeSinceLastMessage(): number {
  return Date.now() - _lastMessageTs;
}

export function getChannelHeartbeats(): ChannelHeartbeatState[] {
  return Array.from(_channelHeartbeats.values());
}

export function onHeartbeatStatusChange(listener: HeartbeatListener): () => void {
  _heartbeatListeners.add(listener);
  return () => { _heartbeatListeners.delete(listener); };
}

async function _heartbeatCheck() {
  if (!isOnline() || _activeChannelCount === 0) {
    _consecutiveStaleChecks = 0;
    return;
  }

  const now = Date.now();

  // ─── Per-channel staleness check ───
  if (_channelHeartbeats.size > 0) {
    let anyStale = false;

    for (const ch of _channelHeartbeats.values()) {
      const elapsed = now - ch.lastMessageTs;

      if (elapsed < ch.staleMs) {
        if (ch.status !== "healthy") {
          ch.status = "healthy";
          ch.consecutiveStaleChecks = 0;
        }
        continue;
      }

      ch.consecutiveStaleChecks++;
      ch.status = "stale";
      anyStale = true;
      _recordHistory(ch.channelId, "stale");
    }

    _recomputeAggregateStatus();

    if (anyStale && !_pendingPong) {
      _pendingPong = true;
      _lastPingSentTs = now;

      const pongReceived = await _sendPing();
      _pendingPong = false;

      if (pongReceived) {
        const resetTs = Date.now();
        for (const ch of _channelHeartbeats.values()) {
          if (ch.status === "stale") {
            ch.lastMessageTs = resetTs;
            ch.consecutiveStaleChecks = 0;
            ch.status = "healthy";
            _recordHistory(ch.channelId, "healthy");
          }
        }
        _lastMessageTs = resetTs;
        _consecutiveStaleChecks = 0;
        _recomputeAggregateStatus();
      } else {
        for (const ch of _channelHeartbeats.values()) {
          if (ch.status === "stale") {
            ch.status = "dead";
            _recordHistory(ch.channelId, "dead");
          }
        }
        console.warn(
          `[Realtime] Heartbeat ping failed. Channels appear silently disconnected.`
        );
        _recomputeAggregateStatus();

        if (_currentStatus !== "disconnected") {
          setConnectionStatus("disconnected");
        }
        _attemptReconnect();
      }
    }
    return;
  }

  // ─── Fallback: global check (no per-channel data) ───
  const elapsed = now - _lastMessageTs;

  if (elapsed < _heartbeatConfig.staleMs) {
    if (_currentHeartbeatStatus !== "healthy") {
      _setHeartbeatStatus("healthy");
    }
    _consecutiveStaleChecks = 0;
    return;
  }

  _consecutiveStaleChecks++;
  _setHeartbeatStatus("stale");

  if (!_pendingPong) {
    _pendingPong = true;
    _lastPingSentTs = now;

    const pongReceived = await _sendPing();
    _pendingPong = false;

    if (pongReceived) {
      _lastMessageTs = Date.now();
      _consecutiveStaleChecks = 0;
      _setHeartbeatStatus("healthy");
    } else {
      console.warn(
        `[Realtime] Heartbeat ping failed after ${_consecutiveStaleChecks} stale checks. ` +
        `Channel appears silently disconnected.`
      );
      _setHeartbeatStatus("dead");

      if (_currentStatus !== "disconnected") {
        setConnectionStatus("disconnected");
      }
      _attemptReconnect();
    }
  }
}

async function _sendPing(): Promise<boolean> {
  if (!USE_SUPABASE) {
    await new Promise((r) => setTimeout(r, 50));
    return true;
  }

  try {
    const sb = getSupabaseClient();

    return new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, _heartbeatConfig.pongTimeoutMs);

      const pingChannel = sb.channel("heartbeat-ping", {
        config: { presence: { key: "ping" } },
      });

      pingChannel
        .subscribe((status: string) => {
          clearTimeout(timeout);
          sb.removeChannel(pingChannel);
          resolve(status === "SUBSCRIBED");
        });
    });
  } catch {
    return false;
  }
}

function _attemptReconnect() {
  if (!USE_SUPABASE) return;

  try {
    const sb = getSupabaseClient();
    sb.realtime.disconnect();
    setTimeout(() => {
      sb.realtime.connect();
      setConnectionStatus("connecting");
      setTimeout(() => {
        if (isOnline() && _activeChannelCount > 0) {
          setConnectionStatus("connected");
          _lastMessageTs = Date.now();
          _setHeartbeatStatus("healthy");
        }
      }, 5000);
    }, 1000);
  } catch (e) {
    console.error("[Realtime] Reconnect failed:", e);
  }
}

export function startHeartbeat(config?: HeartbeatConfig): void {
  stopHeartbeat();
  _heartbeatConfig = { ...DEFAULT_HEARTBEAT, ...config };
  _lastMessageTs = Date.now();
  _consecutiveStaleChecks = 0;
  _heartbeatRunning = true;
  _setHeartbeatStatus("healthy");

  _heartbeatTimer = setInterval(_heartbeatCheck, _heartbeatConfig.checkIntervalMs);
}

export function stopHeartbeat(): void {
  _heartbeatRunning = false;
  if (_heartbeatTimer) {
    clearInterval(_heartbeatTimer);
    _heartbeatTimer = null;
  }
}

export function isHeartbeatRunning(): boolean {
  return _heartbeatRunning;
}

// ─── Public API ───

export function subscribeToMonetization(
  userId: string,
  onEvent: Listener
): () => void {
  if (!USE_SUPABASE) {
    listeners.add(onEvent);
    return () => { listeners.delete(onEvent); };
  }

  const sb = getSupabaseClient();
  const schema = getRealtimeDataSchema();
  const channelName = `monetization:${schema}:${userId}`;

  const channel = sb.channel(channelName)
    .on("postgres_changes", {
      event: "UPDATE",
      schema,
      table: "wallets",
      filter: `user_id=eq.${userId}`,
    }, (payload) => {
      recordMessageReceived(channelName);
      onEvent({ table: "wallets", type: "UPDATE", payload: payload.new });
    })
    .on("postgres_changes", {
      event: "INSERT",
      schema,
      table: "wallet_transactions",
    }, (payload) => {
      recordMessageReceived(channelName);
      onEvent({ table: "wallet_transactions", type: "INSERT", payload: payload.new });
    })
    .on("postgres_changes", {
      event: "UPDATE",
      schema,
      table: "care_contracts",
      filter: `owner_id=eq.${userId}`,
    }, (payload) => {
      recordMessageReceived(channelName);
      onEvent({ table: "care_contracts", type: "UPDATE", payload: payload.new });
    })
    .on("postgres_changes", {
      event: "INSERT",
      schema,
      table: "care_contract_bids",
    }, (payload) => {
      recordMessageReceived(channelName);
      onEvent({ table: "care_contract_bids", type: "INSERT", payload: payload.new });
    })
    .subscribe();
  trackChannelConnected();
  _registerChannel(channelName, CHANNEL_STALE_PRESETS.wallet);

  return () => {
    sb.removeChannel(channel);
    trackChannelDisconnected();
    _unregisterChannel(channelName);
  };
}

export type CareContractBidChangePayload = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  newRecord: Record<string, unknown> | null;
  oldRecord: Record<string, unknown> | null;
};

/**
 * Supabase Realtime: `care_contract_bids` rows for the given request contract IDs.
 * Requires `care_contract_bids` in `supabase_realtime` publication (see base migration).
 */
export function subscribeToCareContractBids(
  contractIds: string[],
  channelKey: string,
  onChange: (payload: CareContractBidChangePayload) => void
): () => void {
  if (!USE_SUPABASE || contractIds.length === 0) {
    return () => {};
  }

  const sb = getSupabaseClient();
  const schema = getRealtimeDataSchema();
  const filter =
    contractIds.length === 1
      ? `contract_id=eq.${contractIds[0]}`
      : `contract_id=in.(${contractIds.join(",")})`;

  const channelName = `bids:contracts:${schema}:${channelKey}`;
  const channel = sb
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema,
        table: "care_contract_bids",
        filter,
      },
      (payload) => {
        recordMessageReceived(channelName);
        onChange({
          eventType: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
          newRecord: (payload.new as Record<string, unknown>) ?? null,
          oldRecord: (payload.old as Record<string, unknown>) ?? null,
        });
      }
    )
    .subscribe();

  trackChannelConnected();
  _registerChannel(channelName, CHANNEL_STALE_PRESETS.contract);

  return () => {
    sb.removeChannel(channel);
    trackChannelDisconnected();
    _unregisterChannel(channelName);
  };
}

/**
 * Invoices + payment_proofs affecting the current user (payer or receiver).
 * Tables must be in `supabase_realtime` publication.
 */
export function subscribeToBillingForUser(userId: string, onChange: () => void): () => void {
  if (!USE_SUPABASE || !userId) {
    return () => {};
  }

  const sb = getSupabaseClient();
  const schema = getRealtimeDataSchema();
  const channelName = `billing:user:${schema}:${userId}`;
  const channel = sb
    .channel(channelName)
    .on(
      "postgres_changes",
      { event: "*", schema, table: "invoices", filter: `from_party_id=eq.${userId}` },
      () => {
        recordMessageReceived(channelName);
        onChange();
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema, table: "invoices", filter: `to_party_id=eq.${userId}` },
      () => {
        recordMessageReceived(channelName);
        onChange();
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema, table: "payment_proofs", filter: `submitted_by_id=eq.${userId}` },
      () => {
        recordMessageReceived(channelName);
        onChange();
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema, table: "payment_proofs", filter: `received_by_id=eq.${userId}` },
      () => {
        recordMessageReceived(channelName);
        onChange();
      }
    )
    .subscribe();

  trackChannelConnected();
  _registerChannel(channelName, CHANNEL_STALE_PRESETS.contract);

  return () => {
    sb.removeChannel(channel);
    trackChannelDisconnected();
    _unregisterChannel(channelName);
  };
}

export function subscribeToAllMonetization(
  onEvent: Listener
): () => void {
  if (!USE_SUPABASE) {
    listeners.add(onEvent);
    return () => { listeners.delete(onEvent); };
  }

  const sb = getSupabaseClient();
  const schema = getRealtimeDataSchema();
  const adminChannelName = `admin:monetization:${schema}`;
  const channel = sb.channel(adminChannelName)
    .on("postgres_changes", {
      event: "*",
      schema,
      table: "wallets",
    }, (payload) => {
      recordMessageReceived(adminChannelName);
      onEvent({ table: "wallets", type: "UPDATE", payload: payload.new });
    })
    .on("postgres_changes", {
      event: "INSERT",
      schema,
      table: "wallet_transactions",
    }, (payload) => {
      recordMessageReceived(adminChannelName);
      onEvent({ table: "wallet_transactions", type: "INSERT", payload: payload.new });
    })
    .on("postgres_changes", {
      event: "*",
      schema,
      table: "care_contracts",
    }, (payload) => {
      recordMessageReceived(adminChannelName);
      onEvent({ table: "care_contracts", type: "UPDATE", payload: payload.new });
    })
    .on("postgres_changes", {
      event: "INSERT",
      schema,
      table: "care_contract_bids",
    }, (payload) => {
      recordMessageReceived(adminChannelName);
      onEvent({ table: "care_contract_bids", type: "INSERT", payload: payload.new });
    })
    .subscribe();

  trackChannelConnected();
  _registerChannel(adminChannelName, CHANNEL_STALE_PRESETS.admin);

  return () => {
    sb.removeChannel(channel);
    trackChannelDisconnected();
    _unregisterChannel(adminChannelName);
  };
}

// ─── Simulation helpers (dev/demo only) ───

export function simulateWalletUpdate(walletData: Record<string, unknown>) {
  emit({ table: "wallets", type: "UPDATE", payload: walletData });
}

export function simulateNewTransaction(txData: Record<string, unknown>) {
  emit({ table: "wallet_transactions", type: "INSERT", payload: txData });
}

export function simulateContractUpdate(contractData: Record<string, unknown>) {
  emit({ table: "care_contracts", type: "UPDATE", payload: contractData });
}

export function simulateNewOffer(offerData: Record<string, unknown>) {
  emit({ table: "care_contract_bids", type: "INSERT", payload: offerData });
}

// ─── Auto-simulation for demo ───
let _demoInterval: ReturnType<typeof setInterval> | null = null;

export function startDemoSimulation() {
  if (_demoInterval || USE_SUPABASE) return;

  const demoEvents = [
    () => simulateNewTransaction({
      type: "earning",
      amount: 8500,
      description: "Contract payment received from HealthCare Pro BD",
      wallet_id: "caregiver-1",
    }),
    () => simulateWalletUpdate({
      user_id: "guardian-1",
      balance: 86500,
      pending_due: 6150,
    }),
    () => simulateNewOffer({
      contract_id: "CTR-2026-0002",
      offered_by_name: "Mock_CareFirst Agency",
      points_per_day: 6800,
      status: "pending",
    }),
    () => simulateContractUpdate({
      contract_number: "CTR-2026-0003",
      status: "accepted",
      agreed_price: 7500,
    }),
  ];

  let idx = 0;
  _demoInterval = setInterval(() => {
    demoEvents[idx % demoEvents.length]();
    idx++;
  }, 45000);
}

export function stopDemoSimulation() {
  if (_demoInterval) {
    clearInterval(_demoInterval);
    _demoInterval = null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Dev / E2E Test Bridge — window.__careNetRealtime
// ═══════════════════════════════════════════════════════════════════════

const _realtimeBridge = {
  _registerChannel,
  _unregisterChannel,
  _resetHeartbeatState,
  recordMessageReceived,
  getChannelHeartbeats,
  getChannelHistory,
  getAllChannelHistories,
  getConnectionStatus,
  getHeartbeatStatus,
  getTimeSinceLastMessage,
  startHeartbeat,
  stopHeartbeat,
  isHeartbeatRunning,
  CHANNEL_STALE_PRESETS,
  simulateWalletUpdate,
  simulateNewTransaction,
  simulateContractUpdate,
  simulateNewOffer,
  startDemoSimulation,
  stopDemoSimulation,
};

if (typeof window !== "undefined") {
  (window as Record<string, unknown>).__careNetRealtime = _realtimeBridge;
}