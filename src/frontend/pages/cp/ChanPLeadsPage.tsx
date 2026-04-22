/**
 * Channel Partner Leads List Page
 * Table with search/filter, Create New Lead button
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { useAuth } from "@/frontend/auth/AuthContext";
import { getMyLeads, type ChanPLead } from "@/backend/services/channelPartnerService";
import { useCpRealtime } from "@/frontend/hooks/useCpRealtime";

export default function ChanPLeadsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [leads, setLeads] = useState<ChanPLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const mountedRef = useRef(true);

  const loadLeads = useCallback(async () => {
    const data = await getMyLeads();
    if (mountedRef.current) {
      setLeads(data);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void (async () => {
      await loadLeads();
      if (mountedRef.current) {
        setLoading(false);
      }
    })();
    return () => {
      mountedRef.current = false;
    };
  }, [loadLeads]);

  useCpRealtime(
    "channel_partner_leads",
    "INSERT",
    user?.myChanPId ? `channel_partner_id=eq.${user.myChanPId}` : "",
    Boolean(user?.myChanPId),
    loadLeads,
  );

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch = lead.leadName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || lead.leadRole === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [leads, searchTerm, roleFilter]);

  const activeCount = leads.filter((l) => l.isActive).length;
  const pendingCount = leads.filter((l) => !l.registrationCompletedAt).length;

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
        <h1 className="text-2xl font-bold">{t("cp.leads.title")}</h1>
        <Link
          to="/cp/create-lead"
          className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition"
        >
          {t("cp.leads.createNew")}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-2xl font-bold">{leads.length}</p>
          <p className="text-sm text-gray-500">{t("cp.leads.totalLeads")}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-2xl font-bold">{activeCount}</p>
          <p className="text-sm text-gray-500">{t("cp.leads.activeLeads")}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-2xl font-bold">{pendingCount}</p>
          <p className="text-sm text-gray-500">{t("cp.leads.pendingActivation")}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder={t("cp.leads.searchPlaceholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
        >
          <option value="all">{t("cp.leads.allRoles")}</option>
          <option value="guardian">{t("cp.roles.guardian")}</option>
          <option value="agency">{t("cp.roles.agency")}</option>
          <option value="caregiver">{t("cp.roles.caregiver")}</option>
          <option value="shop">{t("cp.roles.shop")}</option>
        </select>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">{t("cp.leads.name")}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">{t("cp.leads.role")}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">{t("cp.leads.status")}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">{t("cp.leads.joined")}</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">{t("cp.leads.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredLeads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{lead.leadName}</td>
                <td className="px-4 py-3 capitalize">{lead.leadRole}</td>
                <td className="px-4 py-3">
                  {lead.isActive ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {t("cp.leads.active")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {t("cp.leads.inactive")}
                    </span>
                  )}
                  {!lead.registrationCompletedAt && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {t("cp.leads.pending")}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(lead.joinedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <Link
                    to={`/cp/leads/${lead.leadUserId}`}
                    className="text-pink-600 hover:text-pink-700 font-medium"
                  >
                    {t("cp.leads.view")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredLeads.length === 0 && (
          <div className="p-8 text-center text-gray-500">{t("cp.leads.noLeads")}</div>
        )}
      </div>
    </div>
  );
}
