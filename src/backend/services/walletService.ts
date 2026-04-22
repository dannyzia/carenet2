/**
 * CareNet Wallet Service
 * ──────────────────────
 * Provides wallet CRUD operations. When USE_SUPABASE is false,
 * returns mock data. When true, calls Supabase.
 */

import { USE_SUPABASE, getSupabaseClient } from "./supabase";
import { sbData, isDemoSession } from "./_sb";
import { agentDebugLog } from "@/debug/agentDebugLog";
import { isMissingRestRelation } from "@/backend/utils/supabasePostgrestErrors";
import { MOCK_WALLETS, MOCK_POINT_TRANSACTIONS } from "@/backend/utils/contracts";
import type { WalletSummary, PointTransaction } from "@/backend/utils/points";
import { withRetry } from "@/backend/utils/retry";
import { dedup } from "@/backend/utils/dedup";

// Retry config for read operations (more aggressive retries)
const READ_RETRY = { maxRetries: 3, baseDelayMs: 800, onRetry: (_e: unknown, a: number, d: number) => console.log(`[Wallet] Retry #${a} in ${d}ms`) };
// Retry config for write operations (fewer retries, user is waiting)
const WRITE_RETRY = { maxRetries: 2, baseDelayMs: 500 };

function shouldUseSupabase(): boolean {
  return USE_SUPABASE;
}

// ─── Get wallet for current user (by role) ───
export async function getMyWallet(role: string): Promise<WalletSummary | null> {
  if (!shouldUseSupabase()) {
    const walletId = role === "guardian" ? "guardian-1" : role === "agency" ? "agency-1" : "caregiver-1";
    const w = MOCK_WALLETS.find((w) => w.userId === walletId);
    return w || null;
  }

  return dedup(`wallet:${role}:${isDemoSession() ? "demo" : "pub"}`, () => withRetry(async () => {
    const { data: { user } } = await getSupabaseClient().auth.getUser();
    if (!user) return null;

    const { data, error } = await sbData().from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      // #region agent log
      agentDebugLog({
        hypothesisId: "H2",
        location: "walletService.ts:getMyWallet",
        message: "wallets query error",
        data: { code: error.code, message: error.message, details: error.details },
      });
      // #endregion
      if (isMissingRestRelation(error)) return null;
      throw error;
    }
    if (!data) return null;

    const d = data as Record<string, unknown>;
    return {
      userId: d.user_id as string,
      userRole: d.user_role as string,
      userName: "",
      balance: d.balance as number,
      pendingDue: d.pending_due as number,
      totalEarned: d.total_earned as number,
      totalSpent: d.total_spent as number,
      totalWithdrawn: d.total_withdrawn as number,
      status: d.status as WalletSummary["status"],
      feePercent: d.fee_percent as number,
      commissionPercent: d.commission_percent as number,
      registrationBonus: d.registration_bonus as number,
      frozenAmount: d.frozen_amount as number,
    };
  }, READ_RETRY));
}

// ─── Get transactions for a wallet ───
export async function getWalletTransactions(
  walletUserId: string,
  opts?: { type?: string; limit?: number; offset?: number }
): Promise<PointTransaction[]> {
  if (!shouldUseSupabase()) {
    let txs = MOCK_POINT_TRANSACTIONS.filter((t) => t.walletId === walletUserId);
    if (opts?.type) {
      txs = txs.filter((t) => t.type === opts.type);
    }
    return txs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(opts?.offset || 0, (opts?.offset || 0) + (opts?.limit || 50))
      .map((t) => ({
        ...t,
        type: t.type as PointTransaction["type"],
        status: t.status as PointTransaction["status"],
      }));
  }

  const dedupKey = `wallet-tx:${walletUserId}:${opts?.type || "all"}:${opts?.limit || 50}:${opts?.offset || 0}`;
  return dedup(dedupKey, () => withRetry(async () => {
    const sb = sbData();
    let query = sb.from("wallet_transactions")
      .select("*")
      .eq("wallet_id", walletUserId)
      .order("created_at", { ascending: false })
      .limit(opts?.limit || 50);

    if (opts?.type) {
      query = query.eq("type", opts.type);
    }

    return new Promise<PointTransaction[]>((resolve, reject) => {
      query.then((result) => {
        if (result.error) return reject(result.error);
        if (!result.data) return resolve([]);
        resolve(result.data.map((d: Record<string, unknown>) => ({
          id: d.id as string,
          walletId: d.wallet_id as string,
          type: d.type as PointTransaction["type"],
          amount: d.amount as number,
          balanceAfter: d.balance_after as number,
          description: d.description as string,
          counterparty: d.counterparty_name as string | undefined,
          contractId: d.contract_id as string | undefined,
          feeAmount: d.fee_amount as number | undefined,
          createdAt: d.created_at as string,
          status: d.status as PointTransaction["status"],
        })));
      });
    });
  }, READ_RETRY));
}

// ─── Buy points (BDT -> CarePoints) ───
export async function buyPoints(
  packageId: string,
  paymentMethod: string
): Promise<{ success: boolean; error?: string }> {
  if (!shouldUseSupabase()) {
    console.log(`[Mock] Buying package ${packageId} via ${paymentMethod}`);
    return { success: true };
  }

  return withRetry(async () => {
    const { error } = await getSupabaseClient().rpc("buy_points", {
      p_package_id: packageId,
      p_payment_method: paymentMethod,
    });

    if (error) return { success: false, error: (error as { message: string }).message };
    return { success: true };
  }, WRITE_RETRY);
}

// ─── Withdraw points (CarePoints -> BDT) ───
export async function withdrawPoints(
  amount: number,
  paymentMethod: string,
  accountNumber: string
): Promise<{ success: boolean; error?: string }> {
  if (!shouldUseSupabase()) {
    console.log(`[Mock] Withdrawing ${amount} CP to ${paymentMethod} ${accountNumber}`);
    return { success: true };
  }

  return withRetry(async () => {
    const { error } = await getSupabaseClient().rpc("withdraw_points", {
      p_amount: amount,
      p_payment_method: paymentMethod,
      p_account_number: accountNumber,
    });

    if (error) return { success: false, error: (error as { message: string }).message };
    return { success: true };
  }, WRITE_RETRY);
}

// ─── Admin: Get all wallets ───
export async function getAllWallets(): Promise<WalletSummary[]> {
  if (!shouldUseSupabase()) {
    return MOCK_WALLETS.map((w) => ({
      ...w,
      status: w.status as WalletSummary["status"],
    }));
  }

  return dedup("admin:all-wallets", () => withRetry(async () => {
    const sb = sbData();
    return new Promise<WalletSummary[]>((resolve, reject) => {
      sb.from("wallets")
        .select("*")
        .order("created_at", { ascending: false })
        .then((result) => {
          if (result.error) return reject(result.error);
          if (!result.data) return resolve([]);
          resolve(result.data.map((d: Record<string, unknown>) => ({
            userId: d.user_id as string,
            userRole: d.user_role as string,
            userName: "",
            balance: d.balance as number,
            pendingDue: d.pending_due as number,
            totalEarned: d.total_earned as number,
            totalSpent: d.total_spent as number,
            totalWithdrawn: d.total_withdrawn as number,
            status: d.status as WalletSummary["status"],
            feePercent: d.fee_percent as number,
            commissionPercent: d.commission_percent as number,
            registrationBonus: d.registration_bonus as number,
            frozenAmount: d.frozen_amount as number,
          })));
        });
    });
  }, READ_RETRY));
}

// ─── Admin: Credit points ───
export async function adminCreditPoints(
  walletId: string,
  amount: number,
  reason: string,
  reasonCategory: string
): Promise<{ success: boolean; error?: string }> {
  if (!shouldUseSupabase()) {
    console.log(`[Mock] Admin credit ${amount} CP to ${walletId}: ${reason} (${reasonCategory})`);
    return { success: true };
  }

  return withRetry(async () => {
    const { data: { user } } = await getSupabaseClient().auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { error } = await getSupabaseClient().rpc("admin_credit_points", {
      p_admin_id: user.id,
      p_wallet_id: walletId,
      p_amount: amount,
      p_reason: reason,
      p_reason_category: reasonCategory,
    });

    if (error) return { success: false, error: (error as { message: string }).message };
    return { success: true };
  }, WRITE_RETRY);
}

// ─── Admin: Debit/freeze points ───
export async function adminDebitPoints(
  walletId: string,
  amount: number,
  reason: string,
  reasonCategory: string,
  freeze: boolean = false
): Promise<{ success: boolean; error?: string }> {
  if (!shouldUseSupabase()) {
    console.log(`[Mock] Admin ${freeze ? "freeze" : "debit"} ${amount} CP from ${walletId}: ${reason}`);
    return { success: true };
  }

  return withRetry(async () => {
    const { data: { user } } = await getSupabaseClient().auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { error } = await getSupabaseClient().rpc("admin_debit_points", {
      p_admin_id: user.id,
      p_wallet_id: walletId,
      p_amount: amount,
      p_reason: reason,
      p_reason_category: reasonCategory,
      p_freeze: freeze,
    });

    if (error) return { success: false, error: (error as { message: string }).message };
    return { success: true };
  }, WRITE_RETRY);
}

// ─── Admin: Freeze/unfreeze wallet ───
export async function adminToggleWalletFreeze(
  walletId: string,
  freeze: boolean,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  if (!shouldUseSupabase()) {
    console.log(`[Mock] Admin ${freeze ? "freeze" : "unfreeze"} wallet ${walletId}: ${reason}`);
    return { success: true };
  }

  return withRetry(async () => {
    const { data: { user } } = await getSupabaseClient().auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { error } = await getSupabaseClient().rpc("admin_toggle_wallet_freeze", {
      p_admin_id: user.id,
      p_wallet_id: walletId,
      p_freeze: freeze,
      p_reason: reason,
    });

    if (error) return { success: false, error: (error as { message: string }).message };
    return { success: true };
  }, WRITE_RETRY);
}

// ─── Admin: Update fee config for a wallet ───
export async function adminUpdateFeeConfig(
  walletId: string,
  feePercent: number,
  commissionPercent: number
): Promise<{ success: boolean; error?: string }> {
  if (!shouldUseSupabase()) {
    console.log(`[Mock] Admin update fee for ${walletId}: fee=${feePercent}%, commission=${commissionPercent}%`);
    return { success: true };
  }

  return withRetry(async () => {
    const sb = sbData();
    const { error } = await sb.from("wallets")
      .update({ fee_percent: feePercent, commission_percent: commissionPercent })
      .eq("id", walletId)
      .single();

    if (error) return { success: false, error: (error as { message: string }).message };
    return { success: true };
  }, WRITE_RETRY);
}

// ─── Escrow: Credit provider wallet on payment verification ───
export async function creditEscrowEarning(
  invoiceId: string,
  providerUserId: string,
  amount: number
): Promise<{ success: boolean; error?: string }> {
  if (!shouldUseSupabase()) {
    console.log(`[Mock] Escrow credit ${amount} CP → ${providerUserId} for invoice ${invoiceId}`);
    return { success: true };
  }
  return withRetry(async () => {
    const { error } = await getSupabaseClient().rpc("credit_escrow_earning", {
      p_invoice_id: invoiceId, p_provider_user_id: providerUserId, p_amount: amount,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, WRITE_RETRY);
}
