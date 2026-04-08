/**
 * useWallet — React hook for wallet data with real-time updates.
 *
 * Wraps walletService with loading/error state management,
 * real-time wallet change subscriptions, and optimistic UI
 * for buy/withdraw actions.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAriaToast } from "./useAriaToast";
import { useTranslation } from "react-i18next";
import { useOptimisticUndo } from "./useOptimisticUndo";
import {
  getMyWallet,
  getWalletTransactions,
  getAllWallets,
  buyPoints as buyPointsService,
  withdrawPoints as withdrawPointsService,
  adminCreditPoints as adminCreditService,
  adminDebitPoints as adminDebitService,
  adminToggleWalletFreeze as adminFreezeService,
  adminUpdateFeeConfig as adminFeeConfigService,
} from "@/backend/services/walletService";
import { subscribeToMonetization, subscribeToAllMonetization } from "@/backend/services/realtime";
import { formatPoints, POINT_PACKAGES } from "@/backend/utils/points";
import type { WalletSummary, PointTransaction } from "@/backend/utils/points";

interface UseWalletReturn {
  wallet: WalletSummary | null;
  transactions: PointTransaction[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  buyPoints: (packageId: string, paymentMethod: string) => Promise<boolean>;
  withdrawPoints: (amount: number, paymentMethod: string, account: string) => Promise<boolean>;
}

/**
 * Hook for user-facing wallet pages (Guardian, Caregiver, Agency).
 * Fetches wallet + transactions for the given role and subscribes to real-time updates.
 */
export function useWallet(role: string, userIdOverride?: string): UseWalletReturn {
  const toast = useAriaToast();
  const { t } = useTranslation("common");
  const { successWithUndo } = useOptimisticUndo();
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const walletUserId = userIdOverride || (role === "guardian" ? "guardian-1" : role === "agency" ? "agency-1" : "caregiver-1");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [w, txs] = await Promise.all([
        getMyWallet(role),
        getWalletTransactions(walletUserId, { limit: 50 }),
      ]);
      if (mountedRef.current) {
        setWallet(w);
        setTransactions(txs);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : t("wallet.toasts.loadFailed"));
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [role, walletUserId]);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => { mountedRef.current = false; };
  }, [fetchData]);

  // Real-time subscription
  useEffect(() => {
    const unsub = subscribeToMonetization(walletUserId, (event) => {
      if (event.table === "wallets" && event.type === "UPDATE") {
        // Update wallet balance in-place
        const p = event.payload;
        setWallet((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            balance: (p.balance as number) ?? prev.balance,
            pendingDue: (p.pending_due as number) ?? prev.pendingDue,
            totalEarned: (p.total_earned as number) ?? prev.totalEarned,
            totalSpent: (p.total_spent as number) ?? prev.totalSpent,
            frozenAmount: (p.frozen_amount as number) ?? prev.frozenAmount,
            status: (p.status as WalletSummary["status"]) ?? prev.status,
          };
        });
        toast.info(t("wallet.toasts.balanceUpdated"), {
          description: t("wallet.toasts.newBalance", { amount: formatPoints((p.balance as number) || 0) }),
        });
      }

      if (event.table === "wallet_transactions" && event.type === "INSERT") {
        // Prepend new transaction
        const p = event.payload;
        const newTx: PointTransaction = {
          id: (p.id as string) || `rt-${Date.now()}`,
          walletId: (p.wallet_id as string) || walletUserId,
          type: (p.type as PointTransaction["type"]) || "transfer",
          amount: (p.amount as number) || 0,
          balanceAfter: (p.balance_after as number) || 0,
          description: (p.description as string) || "Transaction",
          counterparty: p.counterparty_name as string | undefined,
          contractId: p.contract_id as string | undefined,
          feeAmount: p.fee_amount as number | undefined,
          createdAt: (p.created_at as string) || new Date().toISOString(),
          status: (p.status as PointTransaction["status"]) || "completed",
        };
        setTransactions((prev) => [newTx, ...prev]);

        const isCredit = newTx.amount > 0;
        toast.info(isCredit ? t("wallet.toasts.pointsReceived") : t("wallet.toasts.pointsDeducted"), {
          description: isCredit
            ? t("wallet.toasts.pointsReceivedDesc", { amount: formatPoints(newTx.amount), description: newTx.description })
            : t("wallet.toasts.pointsDeductedDesc", { amount: formatPoints(newTx.amount), description: newTx.description }),
        });
      }
    });

    return unsub;
  }, [walletUserId]);

  // ─── Optimistic Buy Points ───
  const buyPoints = useCallback(async (packageId: string, paymentMethod: string) => {
    const pkg = POINT_PACKAGES.find((p) => p.id === packageId);
    const snapshotWallet = wallet;
    const snapshotTxs = transactions;

    if (pkg && wallet) {
      const totalPoints = pkg.points + pkg.bonus;
      // Optimistic: update balance and prepend a pending purchase transaction
      const optimisticTx: PointTransaction = {
        id: `opt-buy-${Date.now()}`,
        walletId: wallet.userId,
        type: "purchase",
        amount: totalPoints,
        balanceAfter: wallet.balance + totalPoints,
        description: `${pkg.label} package via ${paymentMethod}`,
        createdAt: new Date().toISOString(),
        status: "pending",
      };
      setWallet((prev) => prev ? {
        ...prev,
        balance: prev.balance + totalPoints,
        totalSpent: prev.totalSpent + pkg.bdt,
      } : prev);
      setTransactions((prev) => [optimisticTx, ...prev]);
    }

    const result = await buyPointsService(packageId, paymentMethod);
    if (result.success) {
      successWithUndo(
        t("wallet.toasts.purchaseSuccess"),
        t("undo.pointsPurchased"),
        () => { setWallet(snapshotWallet); setTransactions(snapshotTxs); },
        { description: pkg ? t("wallet.toasts.addedToWallet", { amount: formatPoints(pkg.points + pkg.bonus) }) : undefined }
      );
      // Reconcile with server state
      await fetchData();
      return true;
    }
    // Roll back on failure
    setWallet(snapshotWallet);
    setTransactions(snapshotTxs);
    toast.error(t("wallet.toasts.purchaseFailed"), { description: result.error });
    return false;
  }, [wallet, transactions, fetchData]);

  // ─── Optimistic Withdraw Points ───
  const withdrawPoints = useCallback(async (amount: number, paymentMethod: string, account: string) => {
    const snapshotWallet = wallet;
    const snapshotTxs = transactions;

    if (wallet && amount <= wallet.balance) {
      const optimisticTx: PointTransaction = {
        id: `opt-wd-${Date.now()}`,
        walletId: wallet.userId,
        type: "withdrawal",
        amount: -amount,
        balanceAfter: wallet.balance - amount,
        description: `Withdrawal to ${paymentMethod} (${account})`,
        createdAt: new Date().toISOString(),
        status: "pending",
      };
      setWallet((prev) => prev ? {
        ...prev,
        balance: prev.balance - amount,
        totalWithdrawn: prev.totalWithdrawn + amount,
      } : prev);
      setTransactions((prev) => [optimisticTx, ...prev]);
    }

    const result = await withdrawPointsService(amount, paymentMethod, account);
    if (result.success) {
      successWithUndo(
        t("wallet.toasts.withdrawInitiated"),
        t("undo.withdrawal"),
        () => { setWallet(snapshotWallet); setTransactions(snapshotTxs); },
        { description: t("wallet.toasts.withdrawDesc", { amount: formatPoints(amount), method: paymentMethod }) }
      );
      // Reconcile with server state
      await fetchData();
      return true;
    }
    // Roll back on failure
    setWallet(snapshotWallet);
    setTransactions(snapshotTxs);
    toast.error(t("wallet.toasts.withdrawFailed"), { description: result.error });
    return false;
  }, [wallet, transactions, fetchData]);

  return { wallet, transactions, loading, error, refetch: fetchData, buyPoints, withdrawPoints };
}

// ─── Admin Wallet Hook ───

interface UseAdminWalletsReturn {
  wallets: WalletSummary[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  creditPoints: (walletId: string, amount: number, reason: string, category: string) => Promise<boolean>;
  debitPoints: (walletId: string, amount: number, reason: string, category: string, freeze?: boolean) => Promise<boolean>;
  toggleFreeze: (walletId: string, freeze: boolean, reason: string) => Promise<boolean>;
  updateFeeConfig: (walletId: string, fee: number, commission: number) => Promise<boolean>;
  getTransactions: (walletUserId: string, opts?: { limit?: number }) => Promise<PointTransaction[]>;
}

/**
 * Hook for admin wallet management page.
 * Fetches all wallets and subscribes to real-time updates across all wallets.
 */
export function useAdminWallets(): UseAdminWalletsReturn {
  const toast = useAriaToast();
  const { t } = useTranslation("common");
  const [wallets, setWallets] = useState<WalletSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllWallets();
      if (mountedRef.current) setWallets(data);
    } catch (e) {
      if (mountedRef.current) setError(e instanceof Error ? e.message : t("wallet.toasts.loadFailed"));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => { mountedRef.current = false; };
  }, [fetchData]);

  // Real-time: watch all wallet changes for admin
  useEffect(() => {
    const unsub = subscribeToAllMonetization((event) => {
      if (event.table === "wallets" && event.type === "UPDATE") {
        const p = event.payload;
        setWallets((prev) => prev.map((w) => {
          if (w.userId === p.user_id) {
            return {
              ...w,
              balance: (p.balance as number) ?? w.balance,
              pendingDue: (p.pending_due as number) ?? w.pendingDue,
              frozenAmount: (p.frozen_amount as number) ?? w.frozenAmount,
              status: (p.status as WalletSummary["status"]) ?? w.status,
            };
          }
          return w;
        }));
        toast.info(t("wallet.toasts.walletUpdated"), {
          description: t("wallet.toasts.balanceChanged", { userId: p.user_id }),
        });
      }
    });
    return unsub;
  }, []);

  const creditPoints = useCallback(async (walletId: string, amount: number, reason: string, category: string) => {
    const result = await adminCreditService(walletId, amount, reason, category);
    if (result.success) {
      toast.success(t("wallet.toasts.credited", { amount: formatPoints(amount) }), { description: reason });
      await fetchData();
      return true;
    }
    toast.error(t("wallet.toasts.creditFailed"), { description: result.error });
    return false;
  }, [fetchData]);

  const debitPoints = useCallback(async (walletId: string, amount: number, reason: string, category: string, freeze = false) => {
    const result = await adminDebitService(walletId, amount, reason, category, freeze);
    if (result.success) {
      toast.success(freeze ? t("wallet.toasts.froze", { amount: formatPoints(amount) }) : t("wallet.toasts.debited", { amount: formatPoints(amount) }), { description: reason });
      await fetchData();
      return true;
    }
    toast.error(freeze ? t("wallet.toasts.freezeFailed") : t("wallet.toasts.debitFailed"), { description: result.error });
    return false;
  }, [fetchData]);

  const toggleFreeze = useCallback(async (walletId: string, freeze: boolean, reason: string) => {
    const result = await adminFreezeService(walletId, freeze, reason);
    if (result.success) {
      toast.success(freeze ? t("wallet.toasts.walletFrozen") : t("wallet.toasts.walletUnfrozen"), { description: reason });
      await fetchData();
      return true;
    }
    toast.error(t("wallet.toasts.actionFailed"), { description: result.error });
    return false;
  }, [fetchData]);

  const updateFeeConfig = useCallback(async (walletId: string, fee: number, commission: number) => {
    const result = await adminFeeConfigService(walletId, fee, commission);
    if (result.success) {
      toast.success(t("wallet.toasts.feeUpdated"), { description: t("wallet.toasts.feeUpdatedDesc", { fee, commission }) });
      await fetchData();
      return true;
    }
    toast.error(t("wallet.toasts.updateFailed"), { description: result.error });
    return false;
  }, [fetchData]);

  const getTx = useCallback(async (walletUserId: string, opts?: { limit?: number }) => {
    return getWalletTransactions(walletUserId, opts);
  }, []);

  return {
    wallets, loading, error, refetch: fetchData,
    creditPoints, debitPoints, toggleFreeze, updateFeeConfig,
    getTransactions: getTx,
  };
}