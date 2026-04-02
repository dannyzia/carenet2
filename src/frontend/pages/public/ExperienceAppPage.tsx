import { useState, type ElementType } from "react";
import { Link } from "react-router";
import {
  Users,
  Building2,
  Heart,
  Shield,
  User,
  ShoppingBag,
  Scale,
  ArrowRight,
  Info,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@/frontend/hooks";
import { useTransitionNavigate } from "@/frontend/hooks/useTransitionNavigate";
import { cn } from "@/frontend/theme/tokens";
import { useAuth } from "@/frontend/auth/AuthContext";
import { DEMO_ACCOUNTS, isDemoUser } from "@/frontend/auth/mockAuth";
import type { Role } from "@/frontend/auth/types";
import { EXPERIENCE_LOCAL_DRAFT_RETENTION_DAYS } from "@/lib/experienceSandbox";
import { Button } from "@/frontend/components/ui/button";

const roleVisual: Record<
  Role,
  { icon: ElementType; gradient: string }
> = {
  guardian: {
    icon: Users,
    gradient: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FFB3C1 0%, #FF8FA3 100%)",
  },
  patient: {
    icon: User,
    gradient: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #B8A7FF 0%, #8B7AE8 100%)",
  },
  caregiver: {
    icon: Heart,
    gradient: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #A8E063 0%, #7CE577 100%)",
  },
  agency: {
    icon: Building2,
    gradient: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #8EC5FC 0%, #5B9FFF 100%)",
  },
  shop: {
    icon: ShoppingBag,
    gradient: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #00BCD4 0%, #0097A7 100%)",
  },
  moderator: {
    icon: Scale,
    gradient: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FFD180 0%, #FFB74D 100%)",
  },
  admin: {
    icon: Shield,
    gradient: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #B8A7FF 0%, #8B7AE8 100%)",
  },
};

const roleTitleKey: Record<Role, string> = {
  guardian: "guardian",
  patient: "patient",
  caregiver: "caregiver",
  agency: "agencyOwner",
  shop: "shopOwner",
  moderator: "moderator",
  admin: "admin",
};

const roleDescKey: Record<Role, string> = {
  guardian: "guardianDesc",
  patient: "patientDesc",
  caregiver: "caregiverDesc",
  agency: "agencyOwnerDesc",
  shop: "shopOwnerDesc",
  moderator: "moderatorDesc",
  admin: "adminDesc",
};

export default function ExperienceAppPage() {
  const { t } = useTranslation(["common", "auth"]);
  const navigate = useTransitionNavigate();
  const { demoLogin, user, isAuthenticated } = useAuth();
  const [entering, setEntering] = useState<Role | null>(null);

  useDocumentTitle(t("common:pageTitles.experienceApp", "Experience the App"));

  const days = EXPERIENCE_LOCAL_DRAFT_RETENTION_DAYS;
  const showLiveSessionWarning = isAuthenticated && user && !isDemoUser(user);

  const handlePickRole = async (role: Role) => {
    setEntering(role);
    try {
      await demoLogin(role);
      navigate(`/${role}/dashboard`, { replace: true });
    } finally {
      setEntering(null);
    }
  };

  return (
    <div className="min-h-screen px-4 py-10 sm:py-14" style={{ backgroundColor: cn.bgPage }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 mx-auto"
            style={{
              background: "var(--cn-gradient-caregiver)",
              boxShadow: "0px 4px 18px rgba(255, 143, 163, 0.35)",
            }}
          >
            <Sparkles className="w-8 h-8 text-white" aria-hidden />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold mb-2" style={{ color: cn.text }}>
            {t("common:experience.title")}
          </h1>
          <p className="text-sm sm:text-base" style={{ color: cn.textSecondary }}>
            {t("common:experience.subtitle")}
          </p>
        </div>

        <section
          className="rounded-xl border p-4 sm:p-5 mb-6 flex gap-3 text-left"
          style={{
            borderColor: cn.borderLight,
            background: cn.bgInput,
          }}
          aria-labelledby="experience-info-heading"
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{
              background: "rgba(2, 136, 209, 0.12)",
              color: "#0288D1",
            }}
            aria-hidden
          >
            <Info className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="min-w-0 space-y-2 text-sm">
            <h2 id="experience-info-heading" className="text-sm font-semibold leading-tight" style={{ color: cn.text }}>
              {t("common:experience.infoTitle", "Good to know")}
            </h2>
            <p className="leading-relaxed" style={{ color: cn.textSecondary }}>
              {t("common:experience.disclaimerLead")}
            </p>
            <p className="leading-relaxed text-xs sm:text-sm" style={{ color: cn.textSecondary }}>
              {t("common:experience.disclaimerRetention", { days })}
            </p>
          </div>
        </section>

        {showLiveSessionWarning && (
          <div
            className="rounded-xl border p-4 mb-6 text-sm"
            style={{ borderColor: cn.borderLight, background: cn.bgInput, color: cn.textSecondary }}
          >
            {t("common:experience.replacesSession")}
          </div>
        )}

        <p className="text-sm font-medium mb-3" style={{ color: cn.text }}>
          {t("common:experience.selectPrompt")}
        </p>

        <ul className="space-y-3 list-none p-0 m-0">
          {DEMO_ACCOUNTS.map(({ role, name }) => {
            const meta = roleVisual[role];
            const Icon = meta.icon;
            const busy = entering === role;
            return (
              <li key={role}>
                <button
                  type="button"
                  disabled={!!entering}
                  onClick={() => handlePickRole(role)}
                  className="w-full finance-card p-4 sm:p-5 flex items-center gap-4 text-left transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none border-0 cursor-pointer"
                  style={{ background: cn.bgPage }}
                >
                  <div
                    className="rounded-xl p-3 shrink-0"
                    style={{
                      background: meta.gradient,
                      boxShadow: "0px 4px 14px rgba(0,0,0,0.15)",
                    }}
                  >
                    <Icon className="w-6 h-6 text-white" aria-hidden />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-medium" style={{ color: cn.text }}>
                      {t(`auth:roleSelection.${roleTitleKey[role]}`)}
                    </h2>
                    <p className="text-sm line-clamp-2" style={{ color: cn.textSecondary }}>
                      <span className="font-medium" style={{ color: cn.text }}>{name}</span>
                      {" — "}
                      {t(`auth:roleSelection.${roleDescKey[role]}`)}
                    </p>
                  </div>
                  {busy ? (
                    <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" style={{ color: cn.pink }} />
                  ) : (
                    <ArrowRight className="w-5 h-5 shrink-0" style={{ color: cn.textSecondary }} aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 text-center">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/home" className="no-underline" style={{ color: cn.textSecondary }}>
              {t("common:nav.home")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
