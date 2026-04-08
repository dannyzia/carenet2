/**
 * useContracts — React hook for contract data with real-time updates.
 *
 * Wraps contractService with loading/error state management
 * and subscribes to real-time contract/offer changes.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAriaToast } from "./useAriaToast";
import { useTranslation } from "react-i18next";
import { useOptimisticUndo } from "./useOptimisticUndo";
import {
  getMyContracts,
  getContract as getContractService,
  getAllContracts as getAllContractsService,
  submitOffer as submitOfferService,
  acceptOffer as acceptOfferService,
  rejectOffer as rejectOfferService,
} from "@/backend/services/contractService";
import { subscribeToMonetization, subscribeToAllMonetization } from "@/backend/services/realtime";
import { formatPoints } from "@/backend/utils/points";
import type { CareContract, ContractStatus, ContractType } from "@/backend/utils/contracts";

interface UseContractsReturn {
  contracts: CareContract[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for user-facing contract list pages.
 * Fetches contracts for the given role and subscribes to real-time updates.
 */
export function useContracts(
  role: string,
  opts?: { status?: ContractStatus; type?: ContractType }
): UseContractsReturn {
  const toast = useAriaToast();
  const { t } = useTranslation("common");
  const [contracts, setContracts] = useState<CareContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyContracts(role, opts);
      if (mountedRef.current) setContracts(data);
    } catch (e) {
      if (mountedRef.current) setError(e instanceof Error ? e.message : t("contracts.toasts.loadFailed"));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [role, opts?.status, opts?.type]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => { mountedRef.current = false; };
  }, [fetchData]);

  // Real-time subscription
  useEffect(() => {
    const userId = role === "guardian" ? "guardian-1" : role === "agency" ? "agency-1" : "caregiver-1";

    const unsub = subscribeToMonetization(userId, (event) => {
      if (event.table === "care_contracts" && event.type === "UPDATE") {
        const p = event.payload;
        const contractId = (p.contract_number || p.id) as string;
        setContracts((prev) => prev.map((c) => {
          if (c.id === contractId) {
            return {
              ...c,
              status: (p.status as CareContract["status"]) ?? c.status,
              agreedPrice: (p.agreed_price as number) ?? c.agreedPrice,
              totalValue: (p.total_value as number) ?? c.totalValue,
              platformRevenue: (p.platform_revenue as number) ?? c.platformRevenue,
            };
          }
          return c;
        }));
        toast.info(t("contracts.toasts.updated"), {
          description: t("contracts.toasts.updatedDesc", { id: contractId, status: p.status }),
        });
      }

      if (event.table === "care_contract_bids" && event.type === "INSERT") {
        const p = event.payload;
        toast.info(t("contracts.toasts.newOffer"), {
          description: t("contracts.toasts.newOfferDesc", { name: p.offered_by_name, rate: formatPoints((p.points_per_day as number) || 0) }),
          action: {
            label: t("btn.view"),
            onClick: () => {
              window.location.hash = `#/contracts/${p.contract_id}`;
            },
          },
        });
        // Refetch to get the latest offer data
        fetchData();
      }
    });

    return unsub;
  }, [role, fetchData]);

  return { contracts, loading, error, refetch: fetchData };
}

// ─── Single Contract Detail Hook ───

interface UseContractDetailReturn {
  contract: CareContract | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  submitOffer: (pointsPerDay: number, durationDays: number, message: string) => Promise<boolean>;
  acceptOffer: (offerId: string, message?: string) => Promise<boolean>;
  rejectOffer: (offerId: string, message?: string) => Promise<boolean>;
}

/**
 * Hook for single contract detail page with offer/counter-offer actions.
 */
export function useContractDetail(contractId: string | undefined): UseContractDetailReturn {
  const toast = useAriaToast();
  const { t } = useTranslation("common");
  const { successWithUndo } = useOptimisticUndo();
  const [contract, setContract] = useState<CareContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!contractId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getContractService(contractId);
      if (mountedRef.current) setContract(data);
    } catch (e) {
      if (mountedRef.current) setError(e instanceof Error ? e.message : t("contracts.toasts.loadFailed"));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => { mountedRef.current = false; };
  }, [fetchData]);

  // Real-time: listen for updates to this specific contract
  useEffect(() => {
    if (!contractId) return;

    // Use the "all" subscription since we don't know the userId context here
    const unsub = subscribeToAllMonetization((event) => {
      if (event.table === "care_contracts" && event.type === "UPDATE") {
        const p = event.payload;
        const evtId = (p.contract_number || p.id) as string;
        if (evtId === contractId) {
          setContract((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              status: (p.status as CareContract["status"]) ?? prev.status,
              agreedPrice: (p.agreed_price as number) ?? prev.agreedPrice,
              totalValue: (p.total_value as number) ?? prev.totalValue,
              platformRevenue: (p.platform_revenue as number) ?? prev.platformRevenue,
              partyAFee: (p.party_a_fee as number) ?? prev.partyAFee,
              partyBFee: (p.party_b_fee as number) ?? prev.partyBFee,
            };
          });
          toast.info(t("contracts.toasts.updatedRealtime"));
        }
      }

      if (event.table === "care_contract_bids" && event.type === "INSERT") {
        const p = event.payload;
        if (p.contract_id === contractId) {
          toast.info(t("contracts.toasts.newOfferOnContract"), {
            description: t("contracts.toasts.newOfferDesc", { name: p.offered_by_name, rate: formatPoints((p.points_per_day as number) || 0) }),
          });
          fetchData(); // Refetch to get fresh offer data
        }
      }
    });

    return unsub;
  }, [contractId, fetchData]);

  // ─── Optimistic UI helpers ───

  const submitOffer = useCallback(async (pointsPerDay: number, durationDays: number, message: string) => {
    if (!contractId) return false;

    // Optimistic: add a pending offer to the UI immediately
    const optimisticOffer = {
      id: `opt-${Date.now()}`,
      contractId,
      offeredBy: "current-user",
      offeredByName: "You",
      offeredByRole: "guardian" as const,
      pointsPerDay,
      totalPoints: pointsPerDay * durationDays,
      durationDays,
      message,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
    };
    const snapshot = contract;
    setContract((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        status: "negotiating",
        offers: [...prev.offers, optimisticOffer],
        currentOffer: optimisticOffer,
      };
    });

    const result = await submitOfferService({ contractId, pointsPerDay, durationDays, message });
    if (result.success) {
      successWithUndo(
        t("contracts.toasts.offerSubmitted"),
        t("undo.offerSubmitted"),
        () => setContract(snapshot),
        { description: t("contracts.toasts.offerSubmittedDesc", { rate: formatPoints(pointsPerDay), days: durationDays }) }
      );
      // Reconcile with server state (replace optimistic offer with real one)
      await fetchData();
      return true;
    }
    // Roll back on failure
    setContract(snapshot);
    toast.error(t("contracts.toasts.offerSubmitFailed"), { description: result.error });
    return false;
  }, [contractId, contract, fetchData]);

  const acceptOffer = useCallback(async (offerId: string, message?: string) => {
    // Optimistic: immediately mark the offer as accepted and contract as accepted
    const snapshot = contract;
    setContract((prev) => {
      if (!prev) return prev;
      const acceptedOffer = prev.offers.find((o) => o.id === offerId);
      const updatedOffers = prev.offers.map((o) =>
        o.id === offerId
          ? { ...o, status: "accepted" as const, respondedAt: new Date().toISOString(), responseMessage: message }
          : o.status === "pending"
            ? { ...o, status: "expired" as const }
            : o
      );
      return {
        ...prev,
        status: "accepted",
        agreedPrice: acceptedOffer?.pointsPerDay ?? prev.agreedPrice,
        totalValue: (acceptedOffer?.pointsPerDay ?? prev.agreedPrice) * prev.durationDays,
        offers: updatedOffers,
        currentOffer: undefined,
      };
    });

    const result = await acceptOfferService(offerId, message);
    if (result.success) {
      successWithUndo(
        t("contracts.toasts.offerAccepted"),
        t("undo.offerAccepted"),
        () => setContract(snapshot),
        { description: t("contracts.toasts.termsFinalized") }
      );
      // Reconcile with real server state
      await fetchData();
      return true;
    }
    // Roll back on failure
    setContract(snapshot);
    toast.error(t("contracts.toasts.offerAcceptFailed"), { description: result.error });
    return false;
  }, [contract, fetchData]);

  const rejectOffer = useCallback(async (offerId: string, message?: string) => {
    // Optimistic: immediately mark the offer as rejected
    const snapshot = contract;
    setContract((prev) => {
      if (!prev) return prev;
      const updatedOffers = prev.offers.map((o) =>
        o.id === offerId
          ? { ...o, status: "rejected" as const, respondedAt: new Date().toISOString(), responseMessage: message }
          : o
      );
      const hasPending = updatedOffers.some((o) => o.status === "pending");
      return {
        ...prev,
        status: hasPending ? prev.status : "negotiating",
        offers: updatedOffers,
        currentOffer: hasPending ? prev.currentOffer : undefined,
      };
    });

    const result = await rejectOfferService(offerId, message);
    if (result.success) {
      successWithUndo(
        t("contracts.toasts.offerRejected"),
        t("undo.offerRejected"),
        () => setContract(snapshot)
      );
      // Reconcile with real server state
      await fetchData();
      return true;
    }
    // Roll back on failure
    setContract(snapshot);
    toast.error(t("contracts.toasts.offerRejectFailed"), { description: result.error });
    return false;
  }, [contract, fetchData]);

  return { contract, loading, error, refetch: fetchData, submitOffer, acceptOffer, rejectOffer };
}

// ─── Admin Contracts Hook ───

interface UseAdminContractsReturn {
  contracts: CareContract[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for admin contracts overview page.
 */
export function useAdminContracts(
  opts?: { status?: ContractStatus; type?: ContractType; search?: string }
): UseAdminContractsReturn {
  const toast = useAriaToast();
  const { t } = useTranslation("common");
  const [contracts, setContracts] = useState<CareContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllContractsService(opts);
      if (mountedRef.current) setContracts(data);
    } catch (e) {
      if (mountedRef.current) setError(e instanceof Error ? e.message : t("contracts.toasts.loadFailed"));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [opts?.status, opts?.type, opts?.search]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => { mountedRef.current = false; };
  }, [fetchData]);

  // Real-time: watch all contract changes
  useEffect(() => {
    const unsub = subscribeToAllMonetization((event) => {
      if (event.table === "care_contracts" || event.table === "care_contract_bids") {
        // Just refetch for simplicity in admin view
        fetchData();
      }
    });
    return unsub;
  }, [fetchData]);

  return { contracts, loading, error, refetch: fetchData };
}