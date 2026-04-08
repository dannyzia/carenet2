import { useState, useRef, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router";
import { cn } from "@/frontend/theme/tokens";
import { Camera, MapPin, Clock, CheckCircle, AlertTriangle, Navigation } from "lucide-react";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { caregiverService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { loadMockBarrel } from "@/backend/api/mock/loadMockBarrel";
import { useInAppMockDataset } from "@/backend/services/_sb";
import { CARE_SITE_GEOFENCE_MAX_M, metersBetween } from "@/frontend/utils/shiftSiteGeofence";
import { useTranslation } from "react-i18next";

export default function ShiftCheckInPage() {
  const { t, t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.shiftCheckIn", "Shift Check In"));

  const { id } = useParams<{ id: string }>();
  const { data: shifts, loading } = useAsyncData(() => caregiverService.getShiftPlans());

  const shiftId = useMemo(() => {
    if (!shifts?.length) return "";
    if (id) return id;
    const open = shifts.find((s) => s.dbStatus === "scheduled" || s.status === "upcoming");
    return open?.id ?? shifts[0]!.id;
  }, [id, shifts]);

  if (loading || !shifts) return <PageSkeleton cards={3} />;
  if (!shiftId) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center text-sm" style={{ color: cn.textSecondary }}>
        {t("shiftCheckIn.noShifts")}
      </div>
    );
  }

  const plan = shifts.find((s) => s.id === shiftId);
  if (plan && (plan.dbStatus === "checked-in" || plan.dbStatus === "in-progress")) {
    return (
      <div className="max-w-lg mx-auto space-y-3">
        <h1 className="text-xl" style={{ color: cn.textHeading }}>{t("shiftCheckIn.alreadyCheckedInTitle")}</h1>
        <p className="text-sm" style={{ color: cn.textSecondary }}>{t("shiftCheckIn.alreadyCheckedInBody")}</p>
        <Link
          to={`/caregiver/shift-checkout/${shiftId}`}
          className="inline-block text-sm font-medium text-[#DB869A] underline"
        >
          {t("shiftCheckIn.goCheckOut")}
        </Link>
      </div>
    );
  }

  return <ShiftCheckInContent shiftId={shiftId} />;
}

function ShiftCheckInContent({ shiftId }: { shiftId: string }) {
  const { t } = useTranslation("common");
  const [step, setStep] = useState<"ready" | "selfie" | "gps" | "done">("ready");
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [geoMode, setGeoMode] = useState<"init" | "mock" | "live">("init");
  const [mockSite, setMockSite] = useState<{ lat: number; lng: number; address: string } | null>(null);

  useEffect(() => {
    if (!useInAppMockDataset()) {
      setGeoMode("live");
      return;
    }
    let cancelled = false;
    void loadMockBarrel().then((m) => {
      if (!cancelled) {
        setMockSite(m.MOCK_SHIFT_CHECKIN_DATA.expectedLocation);
        setGeoMode("mock");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (geoMode === "init") {
    return <PageSkeleton cards={2} />;
  }

  const liveGeo = geoMode === "live";

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
      if (liveGeo || !mockSite) {
        setGpsError(
          t("shiftCheckIn.geolocationRequired", {
            defaultValue: "Turn on location services or use a browser that supports GPS.",
          }),
        );
        return;
      }
      const mockGps = {
        lat: mockSite.lat + (Math.random() - 0.5) * 0.001,
        lng: mockSite.lng + (Math.random() - 0.5) * 0.001,
      };
      setGps(mockGps);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        if (liveGeo || !mockSite) {
          setGpsError(
            t("shiftCheckIn.gpsUnavailable", {
              defaultValue: "Could not read GPS. Enable location and try again.",
            }),
          );
          return;
        }
        setGps({ lat: mockSite.lat + 0.0005, lng: mockSite.lng + 0.0003 });
        setGpsError("Using approximate location (GPS unavailable in preview)");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSubmit = async () => {
    if (!selfieUrl || !gps) return;
    setSubmitting(true);
    try {
      await caregiverService.startShift(shiftId, selfieUrl, gps);
      setStep("done");
    } finally {
      setSubmitting(false);
    }
  };

  const distanceMeters = !liveGeo && gps && mockSite ? metersBetween(gps, mockSite) : null;
  const withinRange = liveGeo ? gps !== null : distanceMeters !== null && distanceMeters <= CARE_SITE_GEOFENCE_MAX_M;

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div>
        <h1 className="text-xl" style={{ color: cn.textHeading }}>Shift Check-In</h1>
        <p className="text-sm mt-0.5" style={{ color: cn.textSecondary }}>Verify your identity and location to start your shift</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {["Selfie", "GPS", "Confirm"].map((label, i) => {
          const stepIdx = i;
          const currentIdx = step === "ready" ? -1 : step === "selfie" ? 0 : step === "gps" ? 1 : 2;
          const done = currentIdx > stepIdx || step === "done";
          const active = currentIdx === stepIdx;
          return (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-1.5 flex-1">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{
                  background: done ? cn.green : active ? cn.pink : cn.bgInput,
                  color: done || active ? "white" : cn.textSecondary,
                }}>
                  {done ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className="text-xs" style={{ color: active ? cn.pink : cn.textSecondary }}>{label}</span>
              </div>
              {i < 2 && <div className="h-0.5 flex-1 rounded" style={{ background: done ? cn.green : cn.border }} />}
            </div>
          );
        })}
      </div>

      {/* Step: Ready */}
      {step === "ready" && (
        <div className="finance-card p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: cn.pinkBg }}>
            <Camera className="w-8 h-8" style={{ color: cn.pink }} />
          </div>
          <div>
            <p style={{ color: cn.textHeading }}>Ready to check in?</p>
            <p className="text-sm mt-1" style={{ color: cn.textSecondary }}>
              You'll need to take a selfie and verify your GPS location.
            </p>
          </div>
          <div className="text-xs p-3 rounded-xl" style={{ background: cn.bgInput, color: cn.textSecondary }}>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" style={{ color: cn.green }} />
              <span>
                {liveGeo
                  ? t("shiftCheckIn.liveAddressHint", {
                      defaultValue: "You will confirm GPS at the care site in the next step.",
                    })
                  : mockSite!.address}
              </span>
            </div>
          </div>
          <button onClick={() => { setStep("selfie"); }} className="w-full py-3 rounded-xl text-white text-sm" style={{ background: "var(--cn-gradient-caregiver)" }}>
            Start Check-In
          </button>
        </div>
      )}

      {/* Step: Selfie */}
      {step === "selfie" && (
        <div className="finance-card p-6 text-center space-y-4">
          <Camera className="w-10 h-10 mx-auto" style={{ color: cn.pink }} />
          <p style={{ color: cn.textHeading }}>Take a selfie</p>
          <p className="text-sm" style={{ color: cn.textSecondary }}>This verifies your identity at check-in.</p>
          {selfieUrl ? (
            <img src={selfieUrl} alt="Selfie" className="w-32 h-32 rounded-full mx-auto object-cover border-4" style={{ borderColor: cn.green }} />
          ) : (
            <button onClick={() => cameraRef.current?.click()} className="w-full py-3 rounded-xl text-white text-sm flex items-center justify-center gap-2" style={{ background: "var(--cn-gradient-caregiver)" }}>
              <Camera className="w-4 h-4" /> Capture Selfie
            </button>
          )}
          <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleCaptureSelfie} />
          {selfieUrl && (
            <button onClick={() => setStep("gps")} className="w-full py-3 rounded-xl text-white text-sm" style={{ background: "var(--cn-gradient-caregiver)" }}>
              Continue
            </button>
          )}
        </div>
      )}

      {/* Step: GPS */}
      {step === "gps" && (
        <div className="finance-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Navigation className="w-6 h-6" style={{ color: cn.green }} />
            <div>
              <p style={{ color: cn.textHeading }}>Verify Location</p>
              <p className="text-xs" style={{ color: cn.textSecondary }}>
                {liveGeo
                  ? t("shiftCheckIn.liveGpsOnly", { defaultValue: "Capture your GPS at the care location." })
                  : t("shiftCheckIn.mockGeofenceHint", {
                      defaultValue: "Must be within {{m}}m of {{address}}",
                      m: CARE_SITE_GEOFENCE_MAX_M,
                      address: mockSite!.address,
                    })}
              </p>
            </div>
          </div>

          {!gps ? (
            <button onClick={handleGetLocation} className="w-full py-3 rounded-xl text-white text-sm flex items-center justify-center gap-2" style={{ background: "var(--cn-gradient-caregiver)" }}>
              <MapPin className="w-4 h-4" /> Get My Location
            </button>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-xl text-sm" style={{ background: withinRange ? "rgba(95,184,101,0.1)" : "rgba(239,68,68,0.1)" }}>
                <div className="flex items-center gap-2">
                  {withinRange ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-red-500" />}
                  <span style={{ color: withinRange ? cn.green : "var(--cn-red)" }}>
                    {liveGeo
                      ? t("shiftCheckIn.gpsCaptured", { defaultValue: "Location captured" })
                      : withinRange
                        ? t("shiftCheckIn.withinRange", {
                            defaultValue: "Within range ({{m}}m)",
                            m: distanceMeters,
                          })
                        : t("shiftCheckIn.outOfRange", {
                            defaultValue: "Out of range ({{m}}m — max {{max}}m)",
                            m: distanceMeters,
                            max: CARE_SITE_GEOFENCE_MAX_M,
                          })}
                  </span>
                </div>
              </div>
              {gpsError && <p className="text-xs" style={{ color: cn.textSecondary }}>{gpsError}</p>}
              <div className="text-xs" style={{ color: cn.textSecondary }}>
                GPS: {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}
              </div>
              <button onClick={handleSubmit} disabled={submitting || !withinRange} className="w-full py-3 rounded-xl text-white text-sm disabled:opacity-50" style={{ background: "var(--cn-gradient-caregiver)" }}>
                {submitting ? "Checking in..." : "Confirm Check-In"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step: Done */}
      {step === "done" && (
        <div className="finance-card p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: "rgba(95,184,101,0.15)" }}>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <p style={{ color: cn.textHeading }}>Checked In Successfully!</p>
          <p className="text-sm" style={{ color: cn.textSecondary }}>
            Your shift has started. Time: {new Date().toLocaleTimeString()}
          </p>
          <div className="flex items-center justify-center gap-4 text-xs" style={{ color: cn.textSecondary }}>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date().toLocaleTimeString()}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Verified</span>
            <span className="flex items-center gap-1"><Camera className="w-3 h-3" /> Captured</span>
          </div>
        </div>
      )}
    </div>
  );
}
