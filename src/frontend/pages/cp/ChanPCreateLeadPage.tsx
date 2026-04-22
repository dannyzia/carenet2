/**
 * Channel Partner Create Lead Page
 * Two-step form (role selection → dynamic fields), duplicate validation
 */

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { createLead, type CreateLeadInput } from "@/backend/services/channelPartnerService";
import { CP_LEAD_ROLES } from "@/backend/utils/channelPartnerConstants";

export default function ChanPCreateLeadPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CreateLeadInput>>({
    leadRole: "guardian",
  });

  const handleRoleSelect = (role: string) => {
    setFormData({ ...formData, leadRole: role as any });
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await createLead(formData as CreateLeadInput);
    setLoading(false);

    if (result.success) {
      navigate("/cp/leads");
    } else {
      setError(result.error || t("cp.createLead.error"));
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t("cp.createLead.title")}</h1>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        <div className={`flex-1 h-2 rounded ${step >= 1 ? "bg-pink-600" : "bg-gray-200"}`} />
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? "bg-pink-600 text-white" : "bg-gray-200"}`}>1</div>
        <div className={`flex-1 h-2 rounded ${step >= 2 ? "bg-pink-600" : "bg-gray-200"}`} />
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? "bg-pink-600 text-white" : "bg-gray-200"}`}>2</div>
        <div className="flex-1 h-2 rounded bg-gray-200" />
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t("cp.createLead.selectRole")}</h2>
          <div className="grid grid-cols-2 gap-4">
            {CP_LEAD_ROLES.map((role) => (
              <button
                key={role}
                onClick={() => handleRoleSelect(role)}
                className="p-4 border-2 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition text-left"
              >
                <span className="text-2xl block mb-2">
                  {role === "guardian" && "👨‍👩‍👧"}
                  {role === "agency" && "🏢"}
                  {role === "caregiver" && "👩‍⚕️"}
                  {role === "shop" && "🏪"}
                </span>
                <span className="font-medium capitalize">{t(`cp.roles.${role}`)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">{t("cp.createLead.leadInfo")}</h2>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-pink-600 hover:underline"
            >
              {t("cp.createLead.back")}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">{t("cp.createLead.name")}</label>
            <input
              type="text"
              required
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("cp.createLead.phone")}</label>
            <input
              type="tel"
              required
              value={formData.phone || ""}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("cp.createLead.email")}</label>
            <input
              type="email"
              value={formData.email || ""}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("cp.createLead.district")}</label>
            <input
              type="text"
              required
              value={formData.district || ""}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
          >
            {loading ? t("cp.createLead.creating") : t("cp.createLead.create")}
          </button>
        </form>
      )}
    </div>
  );
}
