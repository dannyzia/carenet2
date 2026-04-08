import { useState } from "react";
import { cn } from "@/frontend/theme/tokens";
import { Star, User } from "lucide-react";
import { useAriaToast } from "@/frontend/hooks/useAriaToast";
import { useTranslation } from "react-i18next";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { guardianService } from "@/backend/services/guardian.service";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";

export default function ShiftRatingPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.shiftRating", "Shift Rating"));

  const toast = useAriaToast();
  const { data: placementDetail, loading } = useAsyncData(() => guardianService.getPlacementDetail("current"));

  const initialShifts = (placementDetail?.shiftHistory ?? [])
    .filter(s => s.status === "completed" || s.status === "late")
    .slice(0, 5)
    .map((s, i) => ({
      id: `sh-${i}`,
      caregiver: s.caregiver,
      date: s.date,
      time: s.time,
      patient: "Your Patient",
      rated: false as boolean,
      rating: undefined as number | undefined,
    }));

  const [shifts, setShifts] = useState<typeof initialShifts>([]);
  const [initialized, setInitialized] = useState(false);

  if (loading) return <PageSkeleton />;

  if (!initialized && initialShifts.length > 0) {
    setShifts(initialShifts);
    setInitialized(true);
  }
  const [ratingShiftId, setRatingShiftId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmitRating = () => {
    if (rating === 0 || !ratingShiftId) return;
    setShifts(prev => prev.map(s => s.id === ratingShiftId ? { ...s, rated: true, rating } : s));
    toast.success("Rating submitted! Thank you for your feedback.");
    setRatingShiftId(null);
    setRating(0);
    setComment("");
  };

  const ratedCount = shifts.filter(s => s.rated).length;
  const avgRating = shifts.filter(s => s.rated && s.rating != null).reduce((acc, s) => acc + (s.rating ?? 0), 0) / (ratedCount || 1);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl" style={{ color: cn.textHeading }}>Rate Shifts</h1>
        <p className="text-sm mt-0.5" style={{ color: cn.textSecondary }}>Provide feedback on your caregiver's shifts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="finance-card p-3 text-center">
          <p className="text-lg" style={{ color: cn.pink }}>{shifts.filter(s => !s.rated).length}</p>
          <p className="text-xs" style={{ color: cn.textSecondary }}>Unrated</p>
        </div>
        <div className="finance-card p-3 text-center">
          <p className="text-lg" style={{ color: cn.green }}>{ratedCount}</p>
          <p className="text-xs" style={{ color: cn.textSecondary }}>Rated</p>
        </div>
        <div className="finance-card p-3 text-center">
          <p className="text-lg flex items-center justify-center gap-1" style={{ color: "var(--cn-amber)" }}>
            <Star className="w-4 h-4 fill-current" />{avgRating.toFixed(1)}
          </p>
          <p className="text-xs" style={{ color: cn.textSecondary }}>Average</p>
        </div>
      </div>

      {/* Shift List */}
      <div className="space-y-3">
        {shifts.map(shift => (
          <div key={shift.id} className="finance-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: cn.pinkBg }}>
                  <User className="w-4 h-4" style={{ color: cn.pink }} />
                </div>
                <div>
                  <p className="text-sm" style={{ color: cn.textHeading }}>{shift.caregiver}</p>
                  <p className="text-xs" style={{ color: cn.textSecondary }}>{shift.date} · {shift.time}</p>
                  <p className="text-xs" style={{ color: cn.textSecondary }}>Patient: {shift.patient}</p>
                </div>
              </div>
              {shift.rated ? (
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ background: "rgba(95,184,101,0.1)" }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5" style={{ color: i < (shift.rating ?? 0) ? "var(--cn-amber)" : cn.border, fill: i < (shift.rating ?? 0) ? "var(--cn-amber)" : "none" }} />
                  ))}
                </div>
              ) : (
                <button onClick={() => setRatingShiftId(shift.id)}
                  className="px-4 py-2 rounded-xl text-white text-xs" style={{ background: "var(--cn-gradient-guardian)" }}>
                  Rate Shift
                </button>
              )}
            </div>

            {/* Inline Rating Form */}
            {ratingShiftId === shift.id && (
              <div className="mt-4 pt-4 space-y-3" style={{ borderTop: `1px solid ${cn.border}` }}>
                <div className="flex items-center justify-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(star)}>
                      <Star className="w-8 h-8 transition-all" style={{
                        color: star <= (hoverRating || rating) ? "var(--cn-amber)" : cn.border,
                        fill: star <= (hoverRating || rating) ? "var(--cn-amber)" : "none",
                        transform: star <= (hoverRating || rating) ? "scale(1.1)" : "scale(1)",
                      }} />
                    </button>
                  ))}
                </div>
                <textarea value={comment} onChange={e => setComment(e.target.value)}
                  rows={2} placeholder="Add a comment (optional)..."
                  className="w-full px-4 py-3 rounded-xl border text-sm resize-none" style={{ background: cn.bgInput, borderColor: cn.border, color: cn.text }} />
                <div className="flex gap-2">
                  <button onClick={() => { setRatingShiftId(null); setRating(0); setComment(""); }}
                    className="flex-1 py-2 rounded-xl text-sm" style={{ color: cn.textSecondary }}>Cancel</button>
                  <button onClick={handleSubmitRating} disabled={rating === 0}
                    className="flex-1 py-2 rounded-xl text-white text-sm disabled:opacity-50" style={{ background: "var(--cn-gradient-guardian)" }}>
                    Submit Rating
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}