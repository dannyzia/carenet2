/**
 * CareNet Points System — Monetization Engine
 * ─────────────────────────────────────────────
 * All monetary transactions on CareNet use a point-based wallet system.
 * Points can be purchased with BDT and redeemed/withdrawn.
 *
 * Default platform fee: 2.5% from ALL parties per transaction.
 * Default commission: 25% of earnings (configurable at approval time).
 */

/* ─── Conversion Rate ─── */
export const POINTS_PER_BDT = 10; // 1 BDT = 10 CarePoints
export const BDT_PER_POINT = 1 / POINTS_PER_BDT; // 0.1 BDT per point

/* ─── Platform Fee Defaults ─── */
export const DEFAULT_PLATFORM_FEE_PERCENT = 2.5; // 2.5% from each party
export const DEFAULT_COMMISSION_PERCENT = 25; // 25% of earnings

/* ─── Point Tiers (bonus on purchase) ─── */
export const POINT_PACKAGES = [
  { id: "pk-1", bdt: 500, points: 5000, bonus: 0, label: "Starter" },
  { id: "pk-2", bdt: 1000, points: 10500, bonus: 500, label: "Basic" },
  { id: "pk-3", bdt: 2500, points: 27500, bonus: 2500, label: "Standard" },
  { id: "pk-4", bdt: 5000, points: 57500, bonus: 7500, label: "Premium" },
  { id: "pk-5", bdt: 10000, points: 120000, bonus: 20000, label: "Enterprise" },
] as const;

/* ─── Formatters ─── */
const BANGLA_DIGITS = ["\u09E6", "\u09E7", "\u09E8", "\u09E9", "\u09EA", "\u09EB", "\u09EC", "\u09ED", "\u09EE", "\u09EF"];

function toBanglaDigits(str: string): string {
  return str.replace(/[0-9]/g, (d) => BANGLA_DIGITS[parseInt(d)]);
}

export function formatPoints(points: number, opts?: { bangla?: boolean; compact?: boolean }): string {
  const { bangla = false, compact = false } = opts || {};
  const abs = Math.abs(points);
  const sign = points < 0 ? "-" : "";

  let formatted: string;
  if (compact && abs >= 100000) {
    if (abs >= 10000000) {
      formatted = (abs / 10000000).toFixed(1).replace(/\.0$/, "") + "M";
    } else if (abs >= 100000) {
      formatted = (abs / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    } else {
      formatted = abs.toLocaleString("en-IN");
    }
  } else {
    formatted = abs.toLocaleString("en-IN");
  }

  const result = `${sign}${formatted} CP`;
  return bangla ? toBanglaDigits(result) : result;
}

export function pointsToBDT(points: number): number {
  return points * BDT_PER_POINT;
}

export function bdtToPoints(bdt: number): number {
  return bdt * POINTS_PER_BDT;
}

export function calculatePlatformFee(amount: number, feePercent: number = DEFAULT_PLATFORM_FEE_PERCENT): number {
  return Math.round(amount * (feePercent / 100));
}

export function calculateCommission(earnings: number, commissionPercent: number = DEFAULT_COMMISSION_PERCENT): number {
  return Math.round(earnings * (commissionPercent / 100));
}

/* ─── Transaction Types ─── */
export type PointTransactionType =
  | "purchase"        // BDT -> Points
  | "withdrawal"      // Points -> BDT
  | "contract_payment"// Guardian pays for service
  | "earning"         // Caregiver/Agency earns
  | "platform_fee"    // 2.5% deduction
  | "commission"      // 25% deduction
  | "cp_commission"   // Channel Partner commission
  | "admin_credit"    // Admin gifts points
  | "admin_debit"     // Admin withholds points
  | "bonus"           // Registration bonus, promo
  | "refund"          // Dispute refund
  | "transfer";       // Between wallets

export type WalletStatus = "active" | "frozen" | "suspended";

export interface WalletSummary {
  userId: string;
  userRole: string;
  userName: string;
  balance: number;          // Current available points
  pendingDue: number;       // Platform fees owed (shown as "due")
  totalEarned: number;      // Lifetime earned
  totalSpent: number;       // Lifetime spent
  totalWithdrawn: number;   // Lifetime withdrawn to BDT
  status: WalletStatus;
  feePercent: number;       // Configurable per-user fee (default 2.5%)
  commissionPercent: number;// Configurable per-user commission (default 25%)
  registrationBonus: number;// Points given at registration
  frozenAmount: number;     // Points withheld by admin
}

export interface PointTransaction {
  id: string;
  walletId: string;
  type: PointTransactionType;
  amount: number;           // Positive = credit, negative = debit
  balanceAfter: number;
  description: string;
  counterparty?: string;
  contractId?: string;
  feeAmount?: number;       // Fee deducted from this transaction
  createdAt: string;
  status: "completed" | "pending" | "failed" | "reversed";
}
