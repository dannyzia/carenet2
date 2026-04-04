import { useRef, useState, useCallback } from "react";
import { Link } from "react-router";
import { ShieldAlert, Phone, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { patientService } from "@/backend/services";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { Button } from "@/frontend/components/ui/button";
import { useTranslation } from "react-i18next";

const HOLD_MS = 3000;

export default function EmergencySOSPage() {
  const { t } = useTranslation("common");
  useDocumentTitle(t("pageTitles.emergencySos", "Emergency SOS"));

  const { data: emergency, loading } = useAsyncData(() => patientService.getEmergencyData());
  const [progress, setProgress] = useState(0);
  const [sent, setSent] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef<number>(0);

  const clearHold = useCallback(() => {
    if (holdTimer.current) {
      clearInterval(holdTimer.current);
      holdTimer.current = null;
    }
    setProgress(0);
  }, []);

  const finishSos = useCallback(async () => {
    clearHold();
    let lat: number | undefined;
    let lng: number | undefined;
    if (navigator.geolocation) {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
            resolve();
          },
          () => resolve(),
          { timeout: 8000 },
        );
      });
    }
    try {
      await patientService.triggerSos({ note: "emergency_sos_page_hold", lat, lng });
      setSent(true);
      toast.success(t("emergencySos.sentToast"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("emergencySos.sendFailed"));
    }
  }, [clearHold, t]);

  const onHoldStart = useCallback(() => {
    if (sent) return;
    startTime.current = Date.now();
    holdTimer.current = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const p = Math.min(1, elapsed / HOLD_MS);
      setProgress(p);
      if (p >= 1) {
        void finishSos();
      }
    }, 32);
  }, [sent, finishSos]);

  const onHoldEnd = useCallback(() => {
    if (progress < 1) clearHold();
  }, [progress, clearHold]);

  if (loading || !emergency) return <PageSkeleton cards={2} />;

  if (sent) {
    return (
      <div className="max-w-lg mx-auto space-y-6 text-center py-10 px-4">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <CheckCircle className="size-10 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t("emergencySos.sentTitle")}</h1>
        <p className="text-sm text-gray-600">{t("emergencySos.sentBody")}</p>
        <Button asChild variant="outline">
          <Link to="/patient/dashboard">{t("emergencySos.backHome")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-8 py-6 px-4" data-testid="emergency-sos-page">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-red-700">{t("emergencySos.title")}</h1>
        <p className="text-sm text-gray-600">{t("emergencySos.instructions")}</p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="relative size-40">
          <svg className="size-40 -rotate-90" viewBox="0 0 100 100" aria-hidden>
            <circle cx="50" cy="50" r="44" fill="none" stroke="#FECACA" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#DC2626"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${progress * 276.46} 276.46`}
            />
          </svg>
          <button
            type="button"
            className="absolute inset-0 m-auto size-28 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl active:scale-95 transition-transform"
            onPointerDown={onHoldStart}
            onPointerUp={onHoldEnd}
            onPointerLeave={onHoldEnd}
            onPointerCancel={onHoldEnd}
            aria-label={t("emergencySos.holdLabel")}
          >
            <ShieldAlert className="size-14" />
          </button>
        </div>
        <p className="text-xs text-gray-500">{t("emergencySos.holdHint")}</p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Phone className="size-4 text-red-500" />
          {t("emergencySos.quickDial")}
        </h2>
        <div className="grid gap-2">
          {emergency.contacts.slice(0, 4).map((c, i) => (
            <a
              key={i}
              href={`tel:${c.phone.replace(/\s/g, "")}`}
              className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2 text-sm no-underline text-gray-800 hover:bg-gray-50"
            >
              <span>{c.name}</span>
              <span className="text-red-600 font-medium">{c.phone}</span>
            </a>
          ))}
        </div>
      </div>

      <Button asChild variant="ghost" className="w-full">
        <Link to="/patient/emergency">{t("emergencySos.openHub")}</Link>
      </Button>
    </div>
  );
}
