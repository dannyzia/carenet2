/**
 * Admin Channel Partner Detail Page
 * 5 tabs: Info, Rates, Leads, Commissions, Audit
 */

import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router";
import { adminGetChanPDetail, adminApproveChanP, adminRejectChanP, adminSuspendChanP, adminDeactivateChanP, adminSetChanPRate, adminRenewChanPRate, adminAssignLead, adminReverseCommission, type ChanPDetail, type RateInput } from "@/backend/services/channelPartnerService";

export default function AdminChannelPartnerDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<ChanPDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showNoRatesWarning, setShowNoRatesWarning] = useState(false);
  const [approveWithRates, setApproveWithRates] = useState(true);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showAssignLeadModal, setShowAssignLeadModal] = useState(false);
  const [showReverseCommissionModal, setShowReverseCommissionModal] = useState(false);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [selectedCommissionId, setSelectedCommissionId] = useState<string | null>(null);
  const [newRate, setNewRate] = useState({ leadRole: "guardian" as const, rate: 0, expiresAt: "", reason: "" });
  const [renewExpiresAt, setRenewExpiresAt] = useState("");
  const [assignLeadUserId, setAssignLeadUserId] = useState("");
  const [reverseReason, setReverseReason] = useState("");
  const [reason, setReason] = useState("");

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await adminGetChanPDetail(id);
      setDetail(data);
    } catch (error) {
      console.error('Failed to load CP detail:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async () => {
    // Check if CP has any active rates configured
    const hasActiveRates = detail.rates && detail.rates.length > 0 && detail.rates.some(r => !r.effectiveTo);
    
    if (!hasActiveRates) {
      // Show blocking modal if no rates configured
      setShowNoRatesWarning(true);
    }
    setShowApproveModal(true);
  };

  const confirmApprove = async () => {
    if (!id) return;
    setActionLoading(true);
    
    try {
      let result;
      if (approveWithRates) {
        // Default rates for approval
        const initialRates: RateInput[] = [
          { leadRole: "guardian", rate: 15, expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), reason: "Initial approval" },
          { leadRole: "agency", rate: 20, expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), reason: "Initial approval" },
          { leadRole: "caregiver", rate: 10, expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), reason: "Initial approval" },
          { leadRole: "shop", rate: 12.5, expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), reason: "Initial approval" },
        ];
        result = await adminApproveChanP(id, initialRates);
        if (result.success) {
          setShowApproveModal(false);
          await loadData();
        } else {
          alert(result.error);
        }
      } else {
        // Approve without rates
        result = await adminApproveChanP(id, []);
        if (result.success) {
          setShowApproveModal(false);
          setShowNoRatesWarning(false);
          setApproveWithRates(true);
          await loadData();
        } else {
          alert(result.error);
        }
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!id || !reason) return;
    setActionLoading(true);
    try {
      const result = await adminRejectChanP(id, reason);
      if (result.success) {
        setShowRejectModal(false);
        setReason("");
        await loadData();
      } else {
        alert(result.error);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!id || !reason) return;
    setActionLoading(true);
    try {
      const result = await adminSuspendChanP(id, reason);
      if (result.success) {
        setShowSuspendModal(false);
        setReason("");
        await loadData();
      } else {
        alert(result.error);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!id || !reason) return;
    setActionLoading(true);
    try {
      const result = await adminDeactivateChanP(id, reason);
      if (result.success) {
        setShowDeactivateModal(false);
        setReason("");
        await loadData();
      } else {
        alert(result.error);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetRate = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const result = await adminSetChanPRate(id, newRate.leadRole, newRate.rate, newRate.expiresAt, newRate.reason);
      if (result.success) {
        setShowRateModal(false);
        setNewRate({ leadRole: "guardian", rate: 0, expiresAt: "", reason: "" });
        await loadData();
      } else {
        alert(result.error);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenewRate = async () => {
    if (!id || !selectedRateId) return;
    setActionLoading(true);
    try {
      const result = await adminRenewChanPRate(selectedRateId, renewExpiresAt);
      if (result.success) {
        setShowRenewModal(false);
        setSelectedRateId(null);
        setRenewExpiresAt("");
        await loadData();
      } else {
        alert(result.error);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignLead = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const result = await adminAssignLead(id, assignLeadUserId);
      if (result.success) {
        setShowAssignLeadModal(false);
        setAssignLeadUserId("");
        await loadData();
      } else {
        alert(result.error);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleReverseCommission = async () => {
    if (!selectedCommissionId || !reverseReason) return;
    setActionLoading(true);
    try {
      const result = await adminReverseCommission(selectedCommissionId, reverseReason);
      if (result.success) {
        setShowReverseCommissionModal(false);
        setSelectedCommissionId(null);
        setReverseReason("");
        await loadData();
      } else {
        alert(result.error);
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-red-600">{t("admin.cpDetail.notFound")}</h1>
        <Link to="/admin/channel-partners" className="text-pink-600 hover:underline mt-4 inline-block">
          {t("admin.cpDetail.backToList")}
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{detail.businessName || t("admin.cpDetail.unnamed")}</h1>
          <p className="text-gray-500">{detail.id}</p>
        </div>
        <Link to="/admin/channel-partners" className="text-pink-600 hover:underline">
          {t("admin.cpDetail.backToList")}
        </Link>
      </div>

      {/* Status & Actions */}
      <div className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            detail.status === "active" ? "bg-green-100 text-green-800" :
            detail.status === "pending_approval" ? "bg-yellow-100 text-yellow-800" :
            detail.status === "suspended" ? "bg-orange-100 text-orange-800" :
            detail.status === "rejected" ? "bg-red-100 text-red-800" :
            "bg-gray-100 text-gray-800"
          }`}>
            {detail.status.replace("_", " ")}
          </span>
        </div>
        <div className="flex gap-2">
          {detail.status === "pending_approval" && (
            <>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {t("admin.cpDetail.approve")}
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {t("admin.cpDetail.reject")}
              </button>
            </>
          )}
          {detail.status === "active" && (
            <>
              <button
                onClick={() => setShowSuspendModal(true)}
                disabled={actionLoading}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {t("admin.cpDetail.suspend")}
              </button>
              <button
                onClick={() => setShowDeactivateModal(true)}
                disabled={actionLoading}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                {t("admin.cpDetail.deactivate")}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-6">
          {["info", "rates", "leads", "commissions", "audit"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab
                  ? "border-pink-600 text-pink-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t(`admin.cpDetail.tabs.${tab}`)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === "info" && (
          <dl className="grid grid-cols-2 gap-4">
            <div><dt className="text-sm text-gray-500">{t("admin.cpDetail.userId")}</dt><dd className="font-medium">{detail.userId}</dd></div>
            <div><dt className="text-sm text-gray-500">{t("admin.cpDetail.referralCode")}</dt><dd className="font-medium">{detail.referralCode || "-"}</dd></div>
            <div><dt className="text-sm text-gray-500">{t("admin.cpDetail.phone")}</dt><dd className="font-medium">{detail.phone || "-"}</dd></div>
            <div><dt className="text-sm text-gray-500">{t("admin.cpDetail.reapplicationCount")}</dt><dd className="font-medium">{detail.reapplicationCount}</dd></div>
            <div><dt className="text-sm text-gray-500">{t("admin.cpDetail.createdAt")}</dt><dd className="font-medium">{new Date(detail.createdAt).toLocaleDateString()}</dd></div>
            <div><dt className="text-sm text-gray-500">{t("admin.cpDetail.approvedAt")}</dt><dd className="font-medium">{detail.approvedAt ? new Date(detail.approvedAt).toLocaleDateString() : "-"}</dd></div>
          </dl>
        )}

        {activeTab === "rates" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Commission Rates</h3>
              <button
                onClick={() => setShowRateModal(true)}
                disabled={actionLoading}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
              >
                Set New Rate
              </button>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">{t("admin.cpDetail.role")}</th><th className="px-4 py-2 text-left">{t("admin.cpDetail.rate")}</th><th className="px-4 py-2 text-left">{t("admin.cpDetail.expires")}</th><th className="px-4 py-2 text-left">{t("admin.cpDetail.status")}</th><th className="px-4 py-2 text-left">Actions</th></tr></thead>
              <tbody className="divide-y">
                {detail.rates.map((rate) => (
                  <tr key={rate.id}>
                    <td className="px-4 py-2 capitalize">{rate.leadRole}</td>
                    <td className="px-4 py-2">{rate.rate}%</td>
                    <td className="px-4 py-2">{new Date(rate.expiresAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2">{rate.effectiveTo ? t("admin.cpDetail.expired") : t("admin.cpDetail.active")}</td>
                    <td className="px-4 py-2">
                      {!rate.effectiveTo && (
                        <button
                          onClick={() => { setSelectedRateId(rate.id); setShowRenewModal(true); }}
                          disabled={actionLoading}
                          className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        >
                          Renew
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "leads" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Leads</h3>
              <button
                onClick={() => setShowAssignLeadModal(true)}
                disabled={actionLoading}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
              >
                Assign Lead
              </button>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">{t("admin.cpDetail.leadName")}</th><th className="px-4 py-2 text-left">{t("admin.cpDetail.leadRole")}</th><th className="px-4 py-2 text-left">{t("admin.cpDetail.attribution")}</th><th className="px-4 py-2 text-left">{t("admin.cpDetail.status")}</th></tr></thead>
              <tbody className="divide-y">
                {detail.leads.map((lead) => (
                  <tr key={lead.id}><td className="px-4 py-2">{lead.leadName}</td><td className="px-4 py-2 capitalize">{lead.leadRole}</td><td className="px-4 py-2 capitalize">{lead.attributionMethod.replace("_", " ")}</td><td className="px-4 py-2">{lead.isActive ? t("admin.cpDetail.active") : t("admin.cpDetail.inactive")}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "commissions" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Commissions</h3>
            <table className="w-full">
              <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">{t("admin.cpDetail.lead")}</th><th className="px-4 py-2 text-left">{t("admin.cpDetail.invoice")}</th><th className="px-4 py-2 text-left">{t("admin.cpDetail.amount")}</th><th className="px-4 py-2 text-left">{t("admin.cpDetail.status")}</th><th className="px-4 py-2 text-left">Actions</th></tr></thead>
              <tbody className="divide-y">
                {detail.commissions.map((comm) => (
                  <tr key={comm.id}>
                    <td className="px-4 py-2">{comm.leadName}</td>
                    <td className="px-4 py-2 font-mono text-sm">{comm.invoiceId}</td>
                    <td className="px-4 py-2">{comm.cpCommissionAmount.toLocaleString()} CP</td>
                    <td className="px-4 py-2 capitalize">{comm.status}</td>
                    <td className="px-4 py-2">
                      {comm.status === "credited" && (
                        <button
                          onClick={() => { setSelectedCommissionId(comm.id); setShowReverseCommissionModal(true); }}
                          disabled={actionLoading}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          Reverse
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "audit" && (
          <table className="w-full">
            <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">{t("admin.cpDetail.time")}</th><th className="px-4 py-2 text-left">{t("admin.cpDetail.action")}</th><th className="px-4 py-2 text-left">{t("admin.cpDetail.severity")}</th></tr></thead>
            <tbody className="divide-y">
              {detail.auditTrail.map((entry, i) => (
                <tr key={i}><td className="px-4 py-2">{new Date(entry.time).toLocaleString()}</td><td className="px-4 py-2">{entry.action}</td><td className="px-4 py-2 capitalize">{entry.severity}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">{t("admin.cpDetail.approveTitle")}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {t("admin.cpDetail.approveWithRatesQuestion")}
            </p>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => { setApproveWithRates(true); setShowNoRatesWarning(false); }}
                className={`flex-1 px-4 py-2 rounded-lg ${approveWithRates ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                {t("admin.cpDetail.yesSetRates")}
              </button>
              <button
                onClick={() => { setApproveWithRates(false); }}
                className={`flex-1 px-4 py-2 rounded-lg ${!approveWithRates ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                {t("admin.cpDetail.noSetRatesLater")}
              </button>
            </div>
            {!approveWithRates && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  {t("admin.cpDetail.noRatesWarning")}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowApproveModal(false); setApproveWithRates(true); }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                {t("admin.cpDetail.cancel")}
              </button>
              <button
                onClick={confirmApprove}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? t("admin.cpDetail.processing") : t("admin.cpDetail.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Set New Commission Rate</h3>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Lead Role</label>
                <select
                  value={newRate.leadRole}
                  onChange={(e) => setNewRate({ ...newRate, leadRole: e.target.value as any })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="guardian">Guardian</option>
                  <option value="caregiver">Caregiver</option>
                  <option value="agency">Agency</option>
                  <option value="shop">Shop</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Commission Rate (%)</label>
                <input
                  type="number"
                  value={newRate.rate}
                  onChange={(e) => setNewRate({ ...newRate, rate: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg"
                  min="0"
                  max="100"
                  step="0.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expires At</label>
                <input
                  type="date"
                  value={newRate.expiresAt}
                  onChange={(e) => setNewRate({ ...newRate, expiresAt: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <textarea
                  value={newRate.reason}
                  onChange={(e) => setNewRate({ ...newRate, reason: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg h-24"
                  placeholder="Reason for rate change..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowRateModal(false); setNewRate({ leadRole: "guardian", rate: 0, expiresAt: "", reason: "" }); }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSetRate}
                disabled={actionLoading || !newRate.rate || !newRate.expiresAt}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Set Rate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignLeadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Assign Lead to Channel Partner</h3>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Lead User ID</label>
                <input
                  type="text"
                  value={assignLeadUserId}
                  onChange={(e) => setAssignLeadUserId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Enter user ID to assign..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowAssignLeadModal(false); setAssignLeadUserId(""); }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignLead}
                disabled={actionLoading || !assignLeadUserId}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReverseCommissionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Reverse Commission</h3>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Reason for Reversal</label>
                <textarea
                  value={reverseReason}
                  onChange={(e) => setReverseReason(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg h-24"
                  placeholder="Please provide a reason for reversing this commission..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowReverseCommissionModal(false); setSelectedCommissionId(null); setReverseReason(""); }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleReverseCommission}
                disabled={actionLoading || !reverseReason || reverseReason.length < 10}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Reverse Commission"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRenewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Renew Rate Expiry</h3>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">New Expiry Date</label>
                <input
                  type="date"
                  value={renewExpiresAt}
                  onChange={(e) => setRenewExpiresAt(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowRenewModal(false); setSelectedRateId(null); setRenewExpiresAt(""); }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleRenewRate}
                disabled={actionLoading || !renewExpiresAt}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Renew"}
              </button>
            </div>
          </div>
        </div>
      )}

      {(showRejectModal || showSuspendModal || showDeactivateModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {showRejectModal && t("admin.cpDetail.rejectTitle")}
              {showSuspendModal && t("admin.cpDetail.suspendTitle")}
              {showDeactivateModal && t("admin.cpDetail.deactivateTitle")}
            </h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("admin.cpDetail.reasonPlaceholder")}
              className="w-full px-4 py-2 border rounded-lg h-32 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setShowSuspendModal(false);
                  setShowDeactivateModal(false);
                  setReason("");
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                {t("admin.cpDetail.cancel")}
              </button>
              <button
                onClick={showRejectModal ? handleReject : showSuspendModal ? handleSuspend : handleDeactivate}
                disabled={!reason || reason.length < 10 || actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? t("admin.cpDetail.processing") : t("admin.cpDetail.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
