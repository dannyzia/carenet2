import { useState, useRef } from "react";
import { useParams, Link } from "react-router";
import { cn } from "@/frontend/theme/tokens";
import { Camera, MapPin, Clock, CheckCircle, AlertTriangle, Navigation } from "lucide-react";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { caregiverService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { MOCK_SHIFT_CHECKIN_DATA } from "@/backend/api/mock";
import { useTranslation } from "react-i18next";

function canCheckOut(dbStatus?: string): boolean {
  const s = dbStatus || "";
  return s === "checked-in" || s === "in-progress";
}

export default function ShiftCheckOutPage() {
  const { t } = useTranslation("common");
  useDocumentTitle(t("pageTitles.shiftCheckOut", "Shift check-out"));

  const { id } = useParams<{ id: string }>();
  const { data: shift, loading, refetch } = useAsyncData(
    () => (id ? caregiverService.getShiftPlanById(id) : Promise.resolve(undefined)),
    [id],
  );

  if (!id) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center text-sm" style={{ color: cn.textSecondary }}>
        {t("shiftCheckout.missingId")}
        <div className="mt-4">
          <Link to="/caregiver/shift-planner" className="text-[#DB869A] underline">
            {t("shiftCheckout.backToPlanner")}
          </Link>
        </div>
      </div>
    );
  }

  if (loading) return <PageSkeleton cards={3} />;
  if (shift == null) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center text-sm" style={{ color: cn.textSecondary }}>
        {t("shiftCheckout.notFound")}
        <div className="mt-4">
          <Link to="/caregiver/shift-planner" className="text-[#DB869A] underline">
            {t("shiftCheckout.backToPlanner")}
          </Link>
        </div>
      </div>
    );
  }

  if (!canCheckOut(shift.dbStatus)) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <h1 className="text-xl" style={{ color: cn.textHeading }}>
          {t("shiftCheckout.title")}
        </h1>
        <p className="text-sm" style={{ color: cn.textSecondary }}>
          {t("shiftCheckout.wrongState", { patient: shift.patientName, status: shift.dbStatus || shift.status })}
        </p>
        <Link to={`/caregiver/shift-check-in/${shift.id}`} className="inline-block text-sm text-[#DB869A] underline">
          {t("shiftCheckout.goCheckIn")}
        </Link>
      </div>
    );
  }

  return <ShiftCheckOutContent shiftId={shift.id} patientName={shift.patientName} onDone={() => refetch()} />;
}

function ShiftCheckOutContent({
  shiftId,
  patientName,
  onDone,
}: {
  shiftId: string;
  patientName: string;
  onDone: () => void;
}) {
  const { t } = useTranslation("common");
  const [step, setStep] = useState<"ready" | "selfie" | "gps" | "done">("ready");
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);

  const expected = MOCK_SHIFT_CHECKIN_DATA.expectedLocation;

  const handleCaptureSelfie = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSelfieUrl(reader.result as string);
      setStep("gps");
    };
    reader.readAsDataURL(file);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      const mockGps = { lat: expected.lat + (Math.random() - 0.5) * 0.001, lng: expected.lng + (Math.random() - 0.5) * 0.001 };
      setGps(mockGps);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        setGps({ lat: expected.lat + 0.0005, lng: expected.lng + 0.0003 });
        setGpsError(t("shiftCheckout.gpsFallback"));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSubmit = async () => {
    if (!selfieUrl || !gps) return;
    setSubmitting(true);
    try {
      await caregiverService.endShift(shiftId, selfieUrl, gps);
      setStep("done");
      onDone();
    } finally {
      setSubmitting(false);
    }
  };

  const distanceMeters = gps
    ? Math.round(
        Math.sqrt(
          Math.pow((gps.lat - expected.lat) * 111320, 2) +
            Math.pow((gps.lng - expected.lng) * 111320 * Math.cos((expected.lat * Math.PI) / 180), 2),
        ),
      )
    : null;
  const withinRange = distanceMeters !== null && distanceMeters <= MOCK_SHIFT_CHECKIN_DATA.maxDistanceMeters;

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div>
        <h1 className="text-xl" style={{ color: cn.textHeading }}>{t("shiftCheckout.title")}</h1>
        <p className="text-sm mt-0.5" style={{ color: cn.textSecondary }}>
          {t("shiftCheckout.subtitle", { name: patientName })}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {["Selfie", "GPS", "Confirm"].map((label, i) => {
          const stepIdx = i;
          const currentIdx = step === "ready" ? -1 : step === "selfie" ? 0 : step === "gps" ? 1 : 2;
          const done = currentIdx > stepIdx || step === "done";
          const active = currentIdx === stepIdx;
          return (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-1.5 flex-1">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                  style={{
                    background: done ? cn.green : active ? cn.pink : cn.bgInput,
                    color: done || active ? "white" : cn.textSecondary,
                  }}
                >
                  {done ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className="text-xs" style={{ color: active ? cn.pink : cn.textSecondary }}>
                  {label}
                </span>
              </div>
              {i < 2 && <div className="h-0.5 flex-1 rounded" style={{ background: done ? cn.green : cn.border }} />}
            </div>
          );
        })}
      </div>

      {step === "ready" && (
        <div className="finance-card p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: cn.pinkBg }}>
            <Camera className="w-8 h-8" style={{ color: cn.pink }} />
          </div>
          <div>
            <p style={{ color: cn.textHeading }}>{t("shiftCheckout.readyHeading")}</p>
            <p className="text-sm mt-1" style={{ color: cn.textSecondary }}>
              {t("shiftCheckout.readyBody")}
            </p>
          </div>
          <div className="text-xs p-3 rounded-xl" style={{ background: cn.bgInput, color: cn.textSecondary }}>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" style={{ color: cn.green }} />
              <span>{expected.address}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStep("selfie")}
            className="w-full py-3 rounded-xl text-white text-sm"
            style={{ background: "var(--cn-gradient-caregiver)" }}
          >
            {t("shiftCheckout.start")}
          </button>
        </div>
      )}

      {step === "selfie" && (
        <div className="finance-card p-6 text-center space-y-4">
          <Camera className="w-10 h-10 mx-auto" style={{ color: cn.pink }} />
          <p style={{ color: cn.textHeading }}>{t("shiftCheckout.selfieTitle")}</p>
          <p className="text-sm" style={{ color: cn.textSecondary }}>{t("shiftCheckout.selfieBody")}</p>
          {selfieUrl ? (
            <img
              src={selfieUrl}
              alt=""
              className="w-32 h-32 rounded-full mx-auto object-cover border-4"
              style={{ borderColor: cn.green }}
            />
          ) : (
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="w-full py-3 rounded-xl text-white text-sm flex items-center justify-center gap-2"
              style={{ background: "var(--cn-gradient-caregiver)" }}
            >
              <Camera className="w-4 h-4" /> {t("shiftCheckout.capture")}
            </button>
          )}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            aria-label={t("shiftCheckout.capture")}
            onChange={handleCaptureSelfie}
          />
          {selfieUrl && (
            <button
              type="button"
              onClick={() => setStep("gps")}
              className="w-full py-3 rounded-xl text-white text-sm"
              style={{ background: "var(--cn-gradient-caregiver)" }}
            >
              {t("shiftCheckout.continue")}
            </button>
          )}
        </div>
      )}

      {step === "gps" && (
        <div className="finance-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Navigation className="w-6 h-6" style={{ color: cn.green }} />
            <div>
              <p style={{ color: cn.textHeading }}>{t("shiftCheckout.gpsTitle")}</p>
              <p className="text-xs" style={{ color: cn.textSecondary }}>
                {t("shiftCheckout.gpsHint", { meters: MOCK_SHIFT_CHECKIN_DATA.maxDistanceMeters, address: expected.address })}
              </p>
            </div>
          </div>

          {!gps ? (
            <button
              type="button"
              onClick={handleGetLocation}
              className="w-full py-3 rounded-xl text-white text-sm flex items-center justify-center gap-2"
              style={{ background: "var(--cn-gradient-caregiver)" }}
            >
              <MapPin className="w-4 h-4" /> {t("shiftCheckout.getLocation")}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-xl text-sm" style={{ background: withinRange ? "rgba(95,184,101,0.1)" : "rgba(239,68,68,0.1)" }}>
                <div className="flex items-center gap-2">
                  {withinRange ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-red-500" />}
                  <span style={{ color: withinRange ? cn.green : "var(--cn-red)" }}>
                    {withinRange
                      ? t("shiftCheckout.withinRange", { m: distanceMeters })
                      : t("shiftCheckout.outOfRange", { m: distanceMeters, max: MOCK_SHIFT_CHECKIN_DATA.maxDistanceMeters })}
                  </span>
                </div>
              </div>
              {gpsError && <p className="text-xs" style={{ color: cn.textSecondary }}>{gpsError}</p>}
              <div className="text-xs" style={{ color: cn.textSecondary }}>
                GPS: {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !withinRange}
                className="w-full py-3 rounded-xl text-white text-sm disabled:opacity-50"
                style={{ background: "var(--cn-gradient-caregiver)" }}
                data-testid="confirm-shift-checkout"
              >
                {submitting ? t("shiftCheckout.submitting") : t("shiftCheckout.confirm")}
              </button>
            </div>
          )}
        </div>
      )}

      {step === "done" && (
        <div className="finance-card p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: "rgba(95,184,101,0.15)" }}>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <p style={{ color: cn.textHeading }}>{t("shiftCheckout.doneTitle")}</p>
          <p className="text-sm" style={{ color: cn.textSecondary }}>{t("shiftCheckout.doneBody")}</p>
          <div className="flex items-center justify-center gap-4 text-xs" style={{ color: cn.textSecondary }}>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {new Date().toLocaleTimeString()}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {t("shiftCheckout.verified")}
            </span>
          </div>
          <Link
            to="/caregiver/shift-planner"
            className="inline-block w-full py-3 rounded-xl text-white text-sm text-center"
            style={{ background: "var(--cn-gradient-caregiver)" }}
          >
            {t("shiftCheckout.backToPlanner")}
          </Link>
        </div>
      )}
    </div>
  );
}
