import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/frontend/theme/tokens";
import { Button } from "@/frontend/components/ui/button";
import { useAsyncData } from "@/frontend/hooks";
import { packageEngagementService } from "@/backend/services";
import type { Role } from "@/frontend/auth/types";

interface PackageEngagementActionsProps {
  packageId: string;
  activeRole: Role;
}

export function PackageEngagementActions({ packageId, activeRole }: PackageEngagementActionsProps) {
  const { t } = useTranslation("common", { keyPrefix: "packageEngagement" });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isClient = activeRole === "guardian" || activeRole === "patient";
  const isCaregiver = activeRole === "caregiver";

  const { data: clientEng, loading: lc, refetch: rfClient } = useAsyncData(
    () => (isClient ? packageEngagementService.getClientEngagementForPackage(packageId) : Promise.resolve(null)),
    [packageId, isClient],
  );
  const { data: cgEng, loading: lg, refetch: rfCg } = useAsyncData(
    () => (isCaregiver ? packageEngagementService.getCaregiverEngagementForPackage(packageId) : Promise.resolve(null)),
    [packageId, isCaregiver],
  );

  const { data: clientEvents = [], loading: lev, refetch: rfClientEv } = useAsyncData(
    () =>
      clientEng?.id
        ? packageEngagementService.listClientEngagementEvents(clientEng.id)
        : Promise.resolve([]),
    [clientEng?.id ?? ""],
  );
  const { data: cgEvents = [], loading: cev, refetch: rfCgEv } = useAsyncData(
    () =>
      cgEng?.id
        ? packageEngagementService.listCaregiverEngagementEvents(cgEng.id)
        : Promise.resolve([]),
    [cgEng?.id ?? ""],
  );

  if (!isClient && !isCaregiver) return null;

  const startClient = async () => {
    setBusy(true);
    setError(null);
    try {
      await packageEngagementService.createClientInterest(packageId, { message: message.trim() || undefined });
      setMessage("");
      await rfClient();
      await rfClientEv();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorGeneric"));
    } finally {
      setBusy(false);
    }
  };

  const sendClientCounter = async () => {
    if (!clientEng?.id) return;
    setBusy(true);
    setError(null);
    try {
      await packageEngagementService.appendClientEngagementMessage(
        clientEng.id,
        "counter_offer",
        { message: message.trim() || undefined },
        "client",
      );
      setMessage("");
      await rfClient();
      await rfClientEv();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorGeneric"));
    } finally {
      setBusy(false);
    }
  };

  const startCaregiver = async () => {
    setBusy(true);
    setError(null);
    try {
      await packageEngagementService.applyToPackage(packageId, { message: message.trim() || undefined });
      setMessage("");
      await rfCg();
      await rfCgEv();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorGeneric"));
    } finally {
      setBusy(false);
    }
  };

  const sendCgCounter = async () => {
    if (!cgEng?.id) return;
    setBusy(true);
    setError(null);
    try {
      await packageEngagementService.appendCaregiverEngagementMessage(
        cgEng.id,
        "counter_offer",
        { message: message.trim() || undefined },
        "caregiver",
      );
      setMessage("");
      await rfCg();
      await rfCgEv();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorGeneric"));
    } finally {
      setBusy(false);
    }
  };

  if (isClient && (lc || lev)) {
    return <p className="text-sm" style={{ color: cn.textSecondary }}>{t("loading")}</p>;
  }
  if (isCaregiver && (lg || cev)) {
    return <p className="text-sm" style={{ color: cn.textSecondary }}>{t("loading")}</p>;
  }

  return (
    <div className="stat-card p-5 space-y-4">
      <h3 className="text-sm font-semibold" style={{ color: cn.text }}>{t("negotiationTitle")}</h3>
      {error && <p className="text-xs" style={{ color: cn.red }} role="alert">{error}</p>}

      {isClient && (
        <>
          {!clientEng ? (
            <div className="space-y-2">
              <p className="text-xs" style={{ color: cn.textSecondary }}>{t("clientIntro")}</p>
              <textarea
                className="w-full min-h-[72px] rounded-xl border text-sm p-3"
                style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}
                placeholder={t("messagePlaceholder")}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button type="button" disabled={busy} onClick={() => void startClient()} className="w-full">
                {t("expressInterest")}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: cn.textSecondary }}>
                {t("statusLabel")}: <strong style={{ color: cn.text }}>{clientEng.status}</strong>
              </p>
              <ul className="space-y-2 max-h-40 overflow-y-auto text-xs" style={{ color: cn.textSecondary }}>
                {clientEvents.map((ev) => (
                  <li key={ev.id} className="border-l-2 pl-2" style={{ borderColor: cn.borderLight }}>
                    <span className="font-medium" style={{ color: cn.text }}>{ev.author_role}</span>
                    {" · "}
                    {ev.event_kind}
                    {ev.payload?.message ? ` — ${String(ev.payload.message)}` : ""}
                  </li>
                ))}
              </ul>
              {["interested", "negotiating"].includes(clientEng.status) && (
                <>
                  <textarea
                    className="w-full min-h-[64px] rounded-xl border text-sm p-3"
                    style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}
                    placeholder={t("counterPlaceholder")}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <Button type="button" variant="secondary" disabled={busy} onClick={() => void sendClientCounter()} className="w-full">
                    {t("sendCounterOffer")}
                  </Button>
                </>
              )}
            </div>
          )}
        </>
      )}

      {isCaregiver && (
        <>
          {!cgEng ? (
            <div className="space-y-2">
              <p className="text-xs" style={{ color: cn.textSecondary }}>{t("caregiverIntro")}</p>
              <textarea
                className="w-full min-h-[72px] rounded-xl border text-sm p-3"
                style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}
                placeholder={t("applyNotePlaceholder")}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button type="button" disabled={busy} onClick={() => void startCaregiver()} className="w-full">
                {t("applyToPackage")}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: cn.textSecondary }}>
                {t("statusLabel")}: <strong style={{ color: cn.text }}>{cgEng.status}</strong>
              </p>
              <ul className="space-y-2 max-h-40 overflow-y-auto text-xs" style={{ color: cn.textSecondary }}>
                {cgEvents.map((ev) => (
                  <li key={ev.id} className="border-l-2 pl-2" style={{ borderColor: cn.borderLight }}>
                    <span className="font-medium" style={{ color: cn.text }}>{ev.author_role}</span>
                    {" · "}
                    {ev.event_kind}
                    {ev.payload?.message ? ` — ${String(ev.payload.message)}` : ""}
                  </li>
                ))}
              </ul>
              {["applied", "negotiating"].includes(cgEng.status) && (
                <>
                  <textarea
                    className="w-full min-h-[64px] rounded-xl border text-sm p-3"
                    style={{ borderColor: cn.border, color: cn.text, background: cn.bgInput }}
                    placeholder={t("counterPlaceholder")}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <Button type="button" variant="secondary" disabled={busy} onClick={() => void sendCgCounter()} className="w-full">
                    {t("sendCounterOffer")}
                  </Button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
