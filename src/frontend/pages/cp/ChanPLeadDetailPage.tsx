/**
 * Channel Partner Lead Detail Page
 * Lead info, Resend Activation Link, Jobs, Commissions
 */

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router";
import { getMyLeads, getLeadJobs, resendActivationLink, type ChanPLead, type LeadJob } from "@/backend/services/channelPartnerService";

export default function ChanPLeadDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<ChanPLead | null>(null);
  const [jobs, setJobs] = useState<LeadJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      const leads = await getMyLeads();
      const foundLead = leads.find((l) => l.leadUserId === id);
      if (foundLead) {
        setLead(foundLead);
        const jobsData = await getLeadJobs(id);
        setJobs(jobsData);
      }
      setLoading(false);
    }
    loadData();
  }, [id]);

  const handleResendActivation = async () => {
    if (!id) return;
    setResending(true);
    setResendMessage(null);
    const result = await resendActivationLink(id);
    setResending(false);
    setResendMessage(result.success ? t("cp.leadDetail.activationResent") : result.error || t("cp.leadDetail.activationFailed"));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-red-600">{t("cp.leadDetail.notFound")}</h1>
        <Link to="/cp/leads" className="text-pink-600 hover:underline mt-4 inline-block">
          {t("cp.leadDetail.backToLeads")}
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{lead.leadName}</h1>
          <p className="text-gray-500 capitalize">{lead.leadRole}</p>
        </div>
        <Link to="/cp/leads" className="text-pink-600 hover:underline">
          {t("cp.leadDetail.backToLeads")}
        </Link>
      </div>

      {/* Lead Info Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">{t("cp.leadDetail.information")}</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-500">{t("cp.leadDetail.attribution")}</dt>
            <dd className="font-medium capitalize">{lead.attributionMethod.replace("_", " ")}</dd>
          </div>
          {lead.referralCodeUsed && (
            <div>
              <dt className="text-sm text-gray-500">{t("cp.leadDetail.referralCode")}</dt>
              <dd className="font-medium">{lead.referralCodeUsed}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm text-gray-500">{t("cp.leadDetail.joinedAt")}</dt>
            <dd className="font-medium">{new Date(lead.joinedAt).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">{t("cp.leadDetail.status")}</dt>
            <dd className="font-medium">
              {lead.isActive ? t("cp.leads.active") : t("cp.leads.inactive")}
            </dd>
          </div>
        </dl>

        {/* Activation Status */}
        {!lead.registrationCompletedAt && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <p className="text-yellow-800 font-medium">{t("cp.leadDetail.pendingActivation")}</p>
            <button
              onClick={handleResendActivation}
              disabled={resending}
              className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
            >
              {resending ? t("cp.leadDetail.resending") : t("cp.leadDetail.resendActivation")}
            </button>
            {resendMessage && (
              <p className={`mt-2 text-sm ${resendMessage.includes("failed") ? "text-red-600" : "text-green-600"}`}>
                {resendMessage}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">{t("cp.leadDetail.jobs")}</h2>
        {jobs.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium">{t("cp.leadDetail.placementId")}</th>
                <th className="px-4 py-2 text-left text-sm font-medium">{t("cp.leadDetail.invoiceAmount")}</th>
                <th className="px-4 py-2 text-left text-sm font-medium">{t("cp.leadDetail.paymentStatus")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {jobs.map((job) => (
                <tr key={job.placementId}>
                  <td className="px-4 py-2 font-mono text-sm">{job.placementId}</td>
                  <td className="px-4 py-2">
                    {job.invoiceAmount ? `${job.invoiceAmount.toLocaleString()} CP` : "-"}
                  </td>
                  <td className="px-4 py-2 capitalize">{job.paymentStatus || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">{t("cp.leadDetail.noJobs")}</p>
        )}
      </div>
    </div>
  );
}
