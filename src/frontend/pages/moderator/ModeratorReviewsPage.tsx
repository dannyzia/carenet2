import { useState } from "react";
import { cn } from "@/frontend/theme/tokens";
import { Star, CheckCircle, XCircle, Flag, Eye } from "lucide-react";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { moderatorService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  flagged: { color: "#EF4444", bg: "#EF444420", label: "Flagged" },
  pending: { color: "#E8A838", bg: "#FFB54D20", label: "Pending" },
  approved: { color: "#5FB865", bg: "#7CE57720", label: "Approved" },
  removed: { color: "#848484", bg: "#F3F4F6", label: "Removed" },
};

export default function ModeratorReviewsPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.moderatorReviews", "Moderator Reviews"));

  const { data: reviews, loading } = useAsyncData(() => moderatorService.getReviews());
  const [filter, setFilter] = useState("all");

  if (loading || !reviews) return <PageSkeleton cards={3} />;

  const filtered = reviews.filter(r => filter === "all" || r.status === filter);

  return (
    <>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#535353" }}>Review Moderation</h1>
          <p className="text-sm" style={{ color: "#848484" }}>Moderate user reviews and ratings</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {["all", "flagged", "pending", "approved", "removed"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className="px-4 py-2 rounded-lg text-sm capitalize transition-all"
              style={{ background: filter === f ? "#E8A838" : "white", color: filter === f ? "white" : "#535353", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.map(r => {
            const sc = statusConfig[r.status] ?? statusConfig.pending;
            return (
              <div key={r.id} className="finance-card p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-sm" style={{ color: "#535353" }}>{r.reviewer}</p>
                      <span className="text-xs" style={{ color: "#848484" }}>reviewed</span>
                      <p className="font-medium text-sm" style={{ color: "#7B5EA7" }}>{r.about}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-current" style={{ color: s <= r.rating ? "#E8A838" : "#E5E7EB" }} />)}
                      </div>
                      <span className="text-xs" style={{ color: "#848484" }}>{r.date}</span>
                    </div>
                  </div>
                  <span className="badge-pill" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                </div>

                <div className="p-3 rounded-lg mb-3" style={{ background: "#F9FAFB" }}>
                  <p className="text-sm" style={{ color: "#535353" }}>{r.text}</p>
                </div>

                {r.flagReason && (
                  <div className="flex items-start gap-2 p-3 rounded-lg mb-3" style={{ background: "#EF444410" }}>
                    <Flag className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#EF4444" }} />
                    <p className="text-xs" style={{ color: "#535353" }}><strong>Flag reason:</strong> {r.flagReason}</p>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <Link to="/moderator/sanctions" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white no-underline cn-touch-target" style={{ background: "#5FB865" }}>
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </Link>
                  <Link to="/moderator/sanctions" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white no-underline cn-touch-target" style={{ background: "#EF4444" }}>
                    <XCircle className="w-3.5 h-3.5" /> Remove
                  </Link>
                  <Link to={`/moderator/queue-detail/${r.id}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs no-underline cn-touch-target" style={{ borderColor: "#E5E7EB", color: "#535353" }}>
                    <Eye className="w-3.5 h-3.5" /> View Full
                  </Link>
                  <Link to="/moderator/escalations" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs no-underline cn-touch-target" style={{ borderColor: "#E8A838", color: "#E8A838" }}>
                    <Flag className="w-3.5 h-3.5" /> Escalate
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: "\n        .finance-card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }\n        .badge-pill { display: inline-flex; align-items: center; padding: 0.2rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 500; }\n      " }} />
    </>
  );
}