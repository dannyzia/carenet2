import { cn } from "@/frontend/theme/tokens";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { caregiverService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import React from "react";
import { Link } from "react-router";
import { Upload, Download, CheckCircle, Clock, AlertCircle, FileText, Eye, Trash2, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

const statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  verified: { color: "#5FB865", bg: "#7CE57720", icon: CheckCircle, label: "Verified" },
  pending: { color: "#E8A838", bg: "#FFB54D20", icon: Clock, label: "Pending" },
  rejected: { color: "#EF4444", bg: "#EF444420", icon: AlertCircle, label: "Rejected" },
};

export default function CaregiverDocumentsPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.caregiverDocuments", "Caregiver Documents"));

  const { data: docs, loading: lD } = useAsyncData(() => caregiverService.getDocuments());
  const { data: required, loading: lR } = useAsyncData(() => caregiverService.getRequiredDocuments());

  if (lD || lR || !docs || !required) return <PageSkeleton cards={3} />;

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#535353" }}>Documents & Certificates</h1>
          <p className="text-sm" style={{ color: "#848484" }}>Manage your verification documents</p>
        </div>

        {/* Status Banner */}
        <div className="p-4 rounded-xl flex items-center gap-3" style={{ background: "#7CE57720", border: "1px solid #7CE57740" }}>
          <CheckCircle className="w-5 h-5 shrink-0" style={{ color: "#5FB865" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#535353" }}>Profile Verified ✓</p>
            <p className="text-xs" style={{ color: "#848484" }}>4 of 6 documents verified. 2 pending review.</p>
          </div>
        </div>

        {/* Required Docs Alert */}
        {required.some(r => r.urgent) && (
          <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: "#EF444410", border: "1px solid #EF444430" }}>
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#EF4444" }} />
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: "#535353" }}>Action Required</p>
              {required.filter(r => r.urgent).map(r => (
                <p key={r.name} className="text-xs" style={{ color: "#848484" }}>• {r.name} — {r.due}</p>
              ))}
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div className="finance-card p-5">
          <h2 className="font-semibold mb-4" style={{ color: "#535353" }}>Upload New Document</h2>
          <div
            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all"
            style={{ borderColor: "#E5E7EB", background: "#F9FAFB" }}>
            <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: "#848484" }} />
            <p className="text-sm font-medium" style={{ color: "#535353" }}>Drop files here or click to upload</p>
            <p className="text-xs mt-1" style={{ color: "#848484" }}>PDF, JPG, PNG — Max 10MB</p>
            <button className="mt-4 px-5 py-2 rounded-lg text-white text-sm"
              style={{ background: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FEB4C5 0%, #DB869A 100%)" }}>
              <Plus className="inline w-4 h-4 mr-1" /> Select File
            </button>
          </div>
        </div>

        {/* Documents List */}
        <div className="finance-card p-5">
          <h2 className="font-semibold mb-4" style={{ color: "#535353" }}>My Documents</h2>
          <div className="space-y-3">
            {docs.map(doc => {
              const sc = statusConfig[doc.status];
              const StatusIcon = sc.icon;
              return (
                <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl" style={{ background: "#F9FAFB" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#FEB4C520" }}>
                      <FileText className="w-5 h-5" style={{ color: "#DB869A" }} />
                    </div>
                    <div>
                      <p className="font-medium text-sm" style={{ color: "#535353" }}>{doc.name}</p>
                      <div className="flex items-center gap-3 text-xs mt-0.5" style={{ color: "#848484" }}>
                        <span>{doc.type}</span>
                        <span>•</span>
                        <span>{doc.size}</span>
                        {doc.expiry && <><span>•</span><span>Expires: {doc.expiry}</span></>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="badge-pill" style={{ background: sc.bg, color: sc.color }}>
                      <StatusIcon className="w-3 h-3 mr-1" /> {sc.label}
                    </span>
                    <div className="flex gap-1">
                      <Link
                        to={`/documents/view/${doc.id}`}
                        className="p-1.5 rounded-lg hover:bg-white transition-all inline-flex"
                        aria-label="View document"
                      >
                        <Eye className="w-4 h-4" style={{ color: "#848484" }} />
                      </Link>
                      <button className="p-1.5 rounded-lg hover:bg-white transition-all"><Download className="w-4 h-4" style={{ color: "#848484" }} /></button>
                      <button className="p-1.5 rounded-lg hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" style={{ color: "#EF4444" }} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: "\n        .finance-card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }\n        .badge-pill { display: inline-flex; align-items: center; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.7rem; font-weight: 500; }\n      " }} />
    </>
  );
}