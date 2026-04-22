/**
 * Channel Partner Commissions Page
 * Ledger table with filters, totals row, Confirm Receipt buttons
 */

import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getMyCommissions, confirmPayoutReceipt, type ChanPCommission } from "@/backend/services/channelPartnerService";

export default function ChanPCommissionsPage() {
  const { t } = useTranslation();
  const [commissions, setCommissions] = useState<ChanPCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    async function loadCommissions() {
      const data = await getMyCommissions();
      setCommissions(data);
      setLoading(false);
    }
    loadCommissions();
  }, []);

  const filteredCommissions = useMemo(() => {
    if (statusFilter === "all") return commissions;
    return commissions.filter((c) => c.status === statusFilter);
  }, [commissions, statusFilter]);

  const totals = useMemo(() => {
    return filteredCommissions.reduce(
      (acc, c) => ({
        invoiceAmount: acc.invoiceAmount + c.invoiceAmount,
        platformCommission: acc.platformCommission + c.platformCommissionAmount,
        cpCommission: acc.cpCommission + c.cpCommissionAmount,
      }),
      { invoiceAmount: 0, platformCommission: 0, cpCommission: 0 }
    );
  }, [filteredCommissions]);

  const handleConfirmReceipt = async (commissionId: string) => {
    setConfirming(commissionId);
    const result = await confirmPayoutReceipt(commissionId);
    if (result.success) {
      setCommissions((prev) =>
        prev.map((c) => (c.id === commissionId ? { ...c, status: "paid" } : c))
      );
    }
    setConfirming(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t("cp.commissions.title")}</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-2xl font-bold">{totals.cpCommission.toLocaleString()}</p>
          <p className="text-sm text-gray-500">{t("cp.commissions.totalCpCommission")}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-2xl font-bold">
            {commissions.filter((c) => c.status === "credited").length}
          </p>
          <p className="text-sm text-gray-500">{t("cp.commissions.pendingConfirmation")}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-2xl font-bold">
            {commissions.filter((c) => c.status === "paid").length}
          </p>
          <p className="text-sm text-gray-500">{t("cp.commissions.confirmed")}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
        >
          <option value="all">{t("cp.commissions.allStatuses")}</option>
          <option value="pending">{t("cp.commissions.pending")}</option>
          <option value="credited">{t("cp.commissions.credited")}</option>
          <option value="paid">{t("cp.commissions.paid")}</option>
          <option value="reversed">{t("cp.commissions.reversed")}</option>
        </select>
      </div>

      {/* Commissions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">{t("cp.commissions.lead")}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{t("cp.commissions.invoiceAmount")}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{t("cp.commissions.rate")}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{t("cp.commissions.commission")}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{t("cp.commissions.status")}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{t("cp.commissions.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredCommissions.map((commission) => (
              <tr key={commission.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{commission.leadName}</div>
                  <div className="text-sm text-gray-500 capitalize">{commission.leadRole}</div>
                </td>
                <td className="px-4 py-3">{commission.invoiceAmount.toLocaleString()} CP</td>
                <td className="px-4 py-3">{commission.cpCommissionRate}%</td>
                <td className="px-4 py-3 font-medium">{commission.cpCommissionAmount.toLocaleString()} CP</td>
                <td className="px-4 py-3">
                  <StatusBadge status={commission.status} />
                </td>
                <td className="px-4 py-3">
                  {commission.status === "credited" && (
                    <button
                      onClick={() => handleConfirmReceipt(commission.id)}
                      disabled={confirming === commission.id}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      {confirming === commission.id ? t("cp.commissions.confirming") : t("cp.commissions.confirm")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-semibold">
            <tr>
              <td className="px-4 py-3">{t("cp.commissions.totals")}</td>
              <td className="px-4 py-3">{totals.invoiceAmount.toLocaleString()} CP</td>
              <td className="px-4 py-3">-</td>
              <td className="px-4 py-3">{totals.cpCommission.toLocaleString()} CP</td>
              <td className="px-4 py-3" colSpan={2} />
            </tr>
          </tfoot>
        </table>
        {filteredCommissions.length === 0 && (
          <div className="p-8 text-center text-gray-500">{t("cp.commissions.noCommissions")}</div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    credited: "bg-blue-100 text-blue-800",
    paid: "bg-green-100 text-green-800",
    reversed: "bg-red-100 text-red-800",
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100"}`}>
      {status}
    </span>
  );
}
