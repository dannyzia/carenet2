import { Heart, Users, User, Building2, ShoppingBag, Handshake } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@/frontend/hooks";
import { cn } from "@/frontend/theme/tokens";
import { useAuth } from "@/frontend/auth/AuthContext";
import { useTransitionNavigate } from "@/frontend/hooks/useTransitionNavigate";
import { DEMO_ACCOUNTS } from "@/frontend/auth/mockAuth";
import { roleCardGradient } from "@/frontend/theme/roleActionGradients";
import type { Role } from "@/frontend/auth/types";
import { roleDashboardPath } from "@/backend/navigation/roleAppPaths";

const roleLabels: Record<Role, string> = {
  caregiver: "Caregiver",
  guardian: "Guardian",
  patient: "Patient",
  agency: "Agency",
  admin: "Admin",
  moderator: "Moderator",
  shop: "Shop Owner",
  channel_partner: "Channel Partner",
};

const roleIcons: Record<string, React.ElementType> = {
  caregiver: Heart,
  guardian: Users,
  patient: User,
  agency: Building2,
  shop: ShoppingBag,
  channel_partner: Handshake,
};

const roleGradients: Record<Role, string> = {
  caregiver: "var(--cn-gradient-caregiver)",
  guardian: "var(--cn-gradient-guardian)",
  patient: "linear-gradient(135deg, #81D4FA, #0288D1)",
  agency: "linear-gradient(135deg, #80CBC4, #00897B)",
  admin: "linear-gradient(135deg, #B8A7FF, #8B7AE8)",
  moderator: "linear-gradient(135deg, #FFD180, #FFB74D)",
  shop: "linear-gradient(135deg, #FFAB91, #E64A19)",
  channel_partner: "var(--cn-gradient-channel-partner)",
};

export default function DemoAccessPage() {
  const { t } = useTranslation(["auth", "common"]);
  useDocumentTitle(t("auth:demoAccess.title", "Demo Access"));
  const { demoLogin } = useAuth();
  const navigate = useTransitionNavigate();

  const handleDemoLogin = async (role: Role) => {
    await demoLogin(role);
    navigate(roleDashboardPath(role), { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: cn.bgPage }}>
      <div className="w-full max-w-md mb-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 mx-auto" style={{ background: "var(--cn-gradient-patient)", boxShadow: "0px 4px 18px rgba(2, 136, 209, 0.35)" }}>
          <Heart className="w-10 h-10 text-white fill-current" />
        </div>
        <h1 className="mb-2 text-3xl" style={{ color: cn.text }}>{t("auth:demoAccess.title", "Experience the App")}</h1>
        <p className="text-sm" style={{ color: cn.textSecondary }}>{t("auth:demoAccess.subtitle", "Choose a role to explore CareNet with sample data")}</p>
      </div>

      <div className="w-full max-w-md space-y-3">
        {DEMO_ACCOUNTS.map((acc) => {
          const Icon = roleIcons[acc.role] ?? Users;
          return (
            <button
              key={acc.role}
              onClick={() => handleDemoLogin(acc.role)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md cn-touch-target finance-card"
              style={{ borderColor: cn.border }}
            >
              <div
                className="rounded-xl p-3 shrink-0"
                style={{ background: roleGradients[acc.role], boxShadow: "0px 4px 14px rgba(0,0,0,0.15)" }}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium" style={{ color: cn.text }}>{roleLabels[acc.role]}</p>
                <p className="text-xs truncate" style={{ color: cn.textSecondary }}>{acc.name}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs" style={{ color: cn.textSecondary }}>
          {t("auth:demoAccess.hint", "No account needed — data is pre-filled for demonstration purposes")}
        </p>
      </div>
    </div>
  );
}
