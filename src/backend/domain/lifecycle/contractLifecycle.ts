/**
 * Care contract lifecycle from `src/imports/packages-1.md` §3 (FULL STATE MACHINE)
 * plus failure states. Pure functions — persistence lives in services/DB.
 */

/** Primary flow (spec YAML id="state_machine") */
export type PrimaryLifecycleState =
  | "draft"
  | "published"
  | "matched"
  | "bidding"
  | "locked"
  | "booked"
  | "active"
  | "completed"
  | "rated";

/** Failure / anomaly states (spec id="failure") */
export type FailureLifecycleState =
  | "cancelled"
  | "no_show"
  | "replacement_required"
  | "escalated"
  | "refunded";

export type LifecycleState = PrimaryLifecycleState | FailureLifecycleState;

const PRIMARY_ORDER: PrimaryLifecycleState[] = [
  "draft",
  "published",
  "matched",
  "bidding",
  "locked",
  "booked",
  "active",
  "completed",
  "rated",
];

const FAILURE: FailureLifecycleState[] = [
  "cancelled",
  "no_show",
  "replacement_required",
  "escalated",
  "refunded",
];

/** States that do not transition further in the happy path */
const TERMINAL: ReadonlySet<LifecycleState> = new Set<LifecycleState>(["rated", ...FAILURE]);

/**
 * Directed edges: allowed transitions. Spec narrative; extend as product rules tighten.
 */
const ALLOWED: ReadonlyMap<LifecycleState, ReadonlySet<LifecycleState>> = new Map([
  ["draft", new Set<LifecycleState>(["published", "cancelled"])],
  ["published", new Set<LifecycleState>(["matched", "bidding", "cancelled"])],
  ["matched", new Set<LifecycleState>(["bidding", "cancelled"])],
  ["bidding", new Set<LifecycleState>(["locked", "cancelled"])],
  ["locked", new Set<LifecycleState>(["booked", "cancelled"])],
  ["booked", new Set<LifecycleState>(["active", "cancelled", "no_show"])],
  ["active", new Set<LifecycleState>(["completed", "replacement_required", "escalated", "cancelled"])],
  ["completed", new Set<LifecycleState>(["rated", "refunded"])],
  ["rated", new Set()],
  ["cancelled", new Set()],
  ["no_show", new Set<LifecycleState>(["replacement_required", "escalated", "cancelled", "refunded"])],
  ["replacement_required", new Set<LifecycleState>(["active", "escalated", "cancelled"])],
  ["escalated", new Set<LifecycleState>(["active", "cancelled", "refunded"])],
  ["refunded", new Set()],
]);

export function isTerminalState(s: LifecycleState): boolean {
  return TERMINAL.has(s);
}

/** Re-open listing (align with marketplace.service.repostCareRequest). */
const REPUBLISH_FROM: ReadonlySet<LifecycleState> = new Set([
  "cancelled",
  "locked",
  "booked",
  "active",
  "completed",
  "rated",
  "bidding",
  "matched",
  "no_show",
  "replacement_required",
  "escalated",
  "refunded",
]);

export function canTransition(from: LifecycleState, to: LifecycleState): boolean {
  if (to === "published" && REPUBLISH_FROM.has(from)) return true;
  const next = ALLOWED.get(from);
  return next ? next.has(to) : false;
}

export function assertTransition(from: LifecycleState, to: LifecycleState): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid lifecycle transition: ${from} → ${to}`);
  }
}

/** Next primary state in the default ordering (single step); undefined if at end or not primary */
export function nextPrimaryState(current: PrimaryLifecycleState): PrimaryLifecycleState | undefined {
  const i = PRIMARY_ORDER.indexOf(current);
  if (i < 0 || i >= PRIMARY_ORDER.length - 1) return undefined;
  return PRIMARY_ORDER[i + 1];
}

export const lifecycleConstants = {
  PRIMARY_ORDER,
  FAILURE_STATES: FAILURE,
  TERMINAL_STATES: TERMINAL,
} as const;
