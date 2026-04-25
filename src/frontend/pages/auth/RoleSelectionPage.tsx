import React from "react";
import { cn } from "@/frontend/theme/tokens";
import { roleCardGradient } from "@/frontend/theme/roleActionGradients";
import { useLocation } from "react-router";
import { useTransitionNavigate } from "@/frontend/hooks/useTransitionNavigate";
import { Users, Building2, Heart, Shield, User, ShoppingBag, Scale, ArrowRight, Handshake } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@/frontend/hooks";
import { useAuth } from "@/frontend/auth/AuthContext";
import type { Role } from "@/frontend/auth/types";
import { roleDashboardPath } from "@/backend/navigation/roleAppPaths";

const SELF_REGISTER_ROLES: Role[] = ["guardian", "caregiver", "patient", "agency", "shop", "channel_partner"];

const allRoles: { id: Role; icon: React.ElementType; titleKey: string; descKey: string }[] = [
  { id: "guardian", icon: Users, titleKey: "guardian", descKey: "guardianDesc" },
  { id: "patient", icon: User, titleKey: "patient", descKey: "patientDesc" },
  { id: "caregiver", icon: Heart, titleKey: "caregiver", descKey: "caregiverDesc" },
  { id: "agency", icon: Building2, titleKey: "agencyOwner", descKey: "agencyOwnerDesc" },
  { id: "shop", icon: ShoppingBag, titleKey: "shopOwner", descKey: "shopOwnerDesc" },
  { id: "channel_partner", icon: Handshake, titleKey: "channelPartner", descKey: "channelPartnerDesc" },
  { id: "moderator", icon: Scale, titleKey: "moderator", descKey: "moderatorDesc" },
  { id: "admin", icon: Shield, titleKey: "admin", descKey: "adminDesc" },
];

export default function RoleSelectionPage() {
  const navigate = useTransitionNavigate();
  const location = useLocation();
  const { t } = useTranslation(["auth", "common"]);
  useDocumentTitle(t("common:pageTitles.chooseRole", "Choose Your Role"));
  const { user, isAuthenticated, switchRole } = useAuth();
  const isNewUser = (location.state as any)?.newUser === true;
  const isRoleSwitch = isAuthenticated && !isNewUser;
  const visibleRoles = isRoleSwitch ? allRoles.filter((r) => user?.roles.includes(r.id)) : allRoles.filter((r) => SELF_REGISTER_ROLES.includes(r.id));

  const handleRoleSelect = (roleId: Role) => {
    if (isRoleSwitch && user) { switchRole(roleId); navigate(roleDashboardPath(roleId), { replace: true }); }
    else { navigate(`/auth/register/${roleId}`); }
  };

  return (
    <div className="min-h-screen flex flex-col p-6" style={{ backgroundColor: cn.bgPage }}>
      <div className="w-full max-w-2xl mx-auto mb-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 mx-auto" style={{ background: "var(--cn-gradient-caregiver)", boxShadow: "0px 4px 18px rgba(255, 143, 163, 0.35)" }}>
            <Heart className="w-10 h-10 text-white fill-current" />
          </div>
          <h1 className="mb-2 text-3xl" style={{ color: cn.text }}>{t("auth:roleSelection.title")}</h1>
          <p style={{ color: cn.textSecondary }}>{t("auth:roleSelection.subtitle")}</p>
        </div>
      </div>
      {!isRoleSwitch && (
        <div className="w-full max-w-2xl mx-auto mb-4 finance-card p-5">
          <p className="text-sm text-center" style={{ color: cn.textSecondary }}>{t("common:app.tagline")} — Select a role to begin registration with role-specific setup.</p>
        </div>
      )}
      {isRoleSwitch && user && (
        <div className="w-full max-w-2xl mx-auto mb-4 finance-card p-4">
          <p className="text-sm text-center" style={{ color: cn.textSecondary }}>Logged in as <strong style={{ color: cn.text }}>{user.name}</strong>. Select a role to switch to.</p>
        </div>
      )}
      <div className="w-full max-w-2xl mx-auto space-y-3 flex-1">
        {visibleRoles.map((role) => {
          const Icon = role.icon;
          const isCurrentRole = isRoleSwitch && user?.activeRole === role.id;
          return (
            <div key={role.id} className="finance-card p-5 hover:shadow-lg transition-all cursor-pointer hover:-translate-y-0.5" onClick={() => handleRoleSelect(role.id)} style={{ borderLeft: isCurrentRole ? `4px solid ${cn.green}` : undefined }}>
              <div className="flex items-center gap-4">
                <div
                  className="rounded-xl p-3 shrink-0"
                  style={{ background: roleCardGradient[role.id], boxShadow: "0px 4px 14px rgba(0,0,0,0.15)" }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base" style={{ color: cn.text }}>{t(`auth:roleSelection.${role.titleKey}`)}</h3>
                    {isCurrentRole && <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: cn.greenBg, color: cn.green }}>Current</span>}
                  </div>
                  <p className="text-sm" style={{ color: cn.textSecondary }}>{t(`auth:roleSelection.${role.descKey}`)}</p>
                </div>
                <ArrowRight className="w-5 h-5 shrink-0" style={{ color: cn.textSecondary }} />
              </div>
            </div>
          );
        })}
      </div>
      {!isRoleSwitch && (
        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: cn.textSecondary }}>
            {t("auth:register.haveAccount")}{" "}
            <button onClick={() => navigate("/auth/login")} className="hover:underline" style={{ color: cn.pink }}>{t("auth:register.signIn")}</button>
          </p>
        </div>
      )}
    </div>
  );
}
