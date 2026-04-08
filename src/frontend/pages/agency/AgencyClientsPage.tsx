import { Link } from "react-router";
import { cn } from "@/frontend/theme/tokens";
import { Plus, User, MapPin, Heart } from "lucide-react";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { agencyService } from "@/backend/services/agency.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { useTranslation } from "react-i18next";

export default function AgencyClientsPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.agencyClients", "Agency Clients"));

  const { data: clients, loading } = useAsyncData(() => agencyService.getClients());

  if (loading || !clients) return <PageSkeleton cards={3} />;

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: "#535353" }}>Clients</h1>
            <p className="text-sm" style={{ color: "#848484" }}>{clients.length} active client families</p>
          </div>
          <Link
            to="/agency/client-intake"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm no-underline cn-touch-target"
            style={{ background: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #80CBC4 0%, #00897B 100%)" }}
          >
            <Plus className="w-4 h-4" />
            Add Client
          </Link>
        </div>
        <div className="space-y-4">
          {clients.map((c) => (
            <div key={c.id} className="finance-card p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ background: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FEB4C5 0%, #DB869A 100%)" }}
                  >
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: "#535353" }}>{c.name}</p>
                    <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: "#848484" }}>
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{c.type}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: "#00897B" }}>{c.spend}</p>
                    <p className="text-xs" style={{ color: "#848484" }}>total spend</p>
                  </div>
                  <span
                    className="badge-pill"
                    style={{
                      background: c.status === "active" ? "#7CE57720" : "#81D4FA20",
                      color: c.status === "active" ? "#5FB865" : "#0288D1",
                    }}
                  >
                    {c.status}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium" style={{ color: "#848484" }}>Patients under care:</p>
                {c.patients.map((p) => (
                  <div key={p} className="flex items-center gap-2 text-sm">
                    <Heart className="w-3.5 h-3.5" style={{ color: "#DB869A" }} />
                    <span style={{ color: "#535353" }}>{p}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Link
                  to="/agency/clients"
                  className="px-3 py-1.5 rounded-lg border text-xs no-underline cn-touch-target"
                  style={{ borderColor: "#E5E7EB", color: "#535353" }}
                >
                  View Details
                </Link>
                <Link
                  to="/agency/job-management"
                  className="px-3 py-1.5 rounded-lg text-white text-xs no-underline cn-touch-target"
                  style={{ background: "#00897B" }}
                >
                  Assign Caregiver
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html:
            ".finance-card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); } .badge-pill { display: inline-flex; align-items: center; padding: 0.2rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 500; }",
        }}
      />
    </>
  );
}
