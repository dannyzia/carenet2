/**
 * Admin Channel Partners List Page
 * Table with status, lead count, rate warnings, actions
 */

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { adminGetChanPList, type ChanPSummary } from "@/backend/services/channelPartnerService";

export default function AdminChannelPartnersPage() {
  const { t } = useTranslation();
  const [channelPartners, setChannelPartners] = useState<ChanPSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    async function loadData() {
      const data = await adminGetChanPList(
        statusFilter === "all" ? undefined : { status: statusFilter }
      );
      setChannelPartners(data);
      setLoading(false);
    }
    loadData();
  }, [statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t("admin.channelPartners.title")}</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
        >
          <option value="all">{t("admin.channelPartners.allStatuses")}</option>
          <option value="pending_approval">{t("admin.channelPartners.pendingApproval")}</option>
          <option value="active">{t("admin.channelPartners.active")}</option>
          <option value="suspended">{t("admin.channelPartners.suspended")}</option>
          <option value="deactivated">{t("admin.channelPartners.deactivated")}</option>
          <option value="rejected">{t("admin.channelPartners.rejected")}</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">{t("admin.channelPartners.name")}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{t("admin.channelPartners.referralCode")}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{t("admin.channelPartners.status")}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{t("admin.channelPartners.leads")}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{t("admin.channelPartners.totalPaid")}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{t("admin.channelPartners.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {channelPartners.map((cp) => (
              <tr key={cp.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{cp.name}</div>
                  <div className="text-sm text-gray-500">{cp.userId}</div>
                </td>
                <td className="px-4 py-3 font-mono text-sm">{cp.referralCode || "-"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={cp.status} />
                  {cp.hasExpiringRates && (
                    <span className="ml-2 text-xs text-yellow-600">⚠️ {t("admin.channelPartners.expiring")}</span>
                  )}
                </td>
                <td className="px-4 py-3">{cp.leadCount}</td>
                <td className="px-4 py-3">{cp.totalCommissionPaid.toLocaleString()} CP</td>
                <td className="px-4 py-3">
                  <Link
                    to={`/admin/channel-partners/${cp.id}`}
                    className="text-pink-600 hover:text-pink-700 font-medium"
                  >
                    {t("admin.channelPartners.view")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {channelPartners.length === 0 && (
          <div className="p-8 text-center text-gray-500">{t("admin.channelPartners.noResults")}</div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending_approval: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    suspended: "bg-orange-100 text-orange-800",
    deactivated: "bg-gray-100 text-gray-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100"}`}>
      {status.replace("_", " ")}
    </span>
  );
}
