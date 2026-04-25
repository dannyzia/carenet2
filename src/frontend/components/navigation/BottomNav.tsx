import React from "react";
import { Link, useLocation } from "react-router";
import { Home, ChevronLeft, User, MessageSquare, Menu } from "lucide-react";
import { cn, type Role, roleConfig } from "@/frontend/theme/tokens";
import { useTranslation } from "react-i18next";
import { useTransitionNavigate } from "@/frontend/hooks/useTransitionNavigate";
import { features } from "@/config/features";
import { useAuth } from "@/frontend/auth/AuthContext";
import { roleDashboardPath, roleMessagesPath, roleMarketplaceHubPath, rolePath } from "@/backend/navigation/roleAppPaths";
import { roleFromPath } from "@/backend/navigation/pathToRole";

export interface BottomNavProps {
  unreadMessages: number;
  unreadNotifications: number;
  isRoleSidebarOpen?: boolean;
  "aria-label"?: string;
}

/**
 * BottomNav — universal 5-tab bottom navigation for ALL screens.
 *
 * Tab order: Home | Back | Persona | Messages | Menu
 *
 * Everything is i18n-driven — labels come from `common.bottomNav.*` keys.
 * Destinations are resolved dynamically based on the current role segment.
 */

export function BottomNav({ unreadMessages, unreadNotifications, isRoleSidebarOpen = false, "aria-label": ariaLabel }: BottomNavProps) {
  const location = useLocation();
  const navigate = useTransitionNavigate();
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const role = roleFromPath(location.pathname);
  const currentRole = user?.activeRole ?? null;
  const rolePrimary = role ? `var(--${roleConfig[role].cssVar})` : "var(--cn-pink)";

  /* Resolve dynamic destinations based on detected role */
  const homePath = currentRole ? roleDashboardPath(currentRole) : "/";
  const messagesPath = currentRole ? roleMessagesPath(currentRole) : "/messages";

  /* Tab definitions — order: Home | Back | Persona | Messages | Menu */
  const tabs = [
    { key: "home", labelKey: "home", icon: Home, action: "link", to: homePath },
    { key: "back", labelKey: "back", icon: ChevronLeft, action: "back", to: "" },
    { key: "persona", labelKey: "persona", icon: User, action: "persona", to: "" },
    { key: "messages", labelKey: "messages", icon: MessageSquare, action: "link", to: messagesPath },
    { key: "menu", labelKey: "menu", icon: Menu, action: "menu", to: "" },
  ];

  /* Shared button/link styles */
  const cellStyle: React.CSSProperties = { minHeight: "56px", paddingTop: "6px", paddingBottom: "6px" };
  const cellClass = "flex-1 flex flex-col items-center justify-center gap-0.5 relative";
  const iconStyle = (active: boolean): React.CSSProperties => ({
    width: "22px", height: "22px",
    color: active ? rolePrimary : cn.textSecondary,
  });
  const labelStyle = (active: boolean): React.CSSProperties => ({
    color: active ? rolePrimary : cn.textSecondary,
    fontWeight: active ? 600 : 400,
  });

  const handlePersonaClick = () => {
    window.dispatchEvent(new CustomEvent("toggle-rolesidebar"));
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{
        backgroundColor: cn.bgHeader,
        borderColor: cn.borderLight,
        boxShadow: "0 -2px 10px rgba(0,0,0,0.06)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        /* Ensure bar background fills the gesture inset (no dead band above system nav) */
        minHeight: "calc(3.5rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="flex items-stretch justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const label = t(`bottomNav.${tab.labelKey}`);

          if (tab.action === "persona") {
            return (
              <button
                key={tab.key}
                type="button"
                onClick={handlePersonaClick}
                disabled={!currentRole}
                data-persona-button
                className={[
                  "flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all",
                  "cn-touch-target",
                  isRoleSidebarOpen ? "opacity-100" : "opacity-60 hover:opacity-100"
                ].join(" ")}
                aria-label={
                  currentRole
                    ? t("a11y.openPersonaMenu", { role: t(`roles.${currentRole}`) })
                    : t("a11y.personaMenuDisabled")
                }
                aria-pressed={isRoleSidebarOpen ? "true" : "false"}
              >
                <Icon className="w-6 h-6" aria-hidden="true" />
                <span className="text-[10px] font-medium">{t(`bottomNav.${tab.labelKey}`)}</span>
              </button>
            );
          }

          if (tab.action === "back") {
            return (
              <button
                key={tab.key}
                onClick={() => navigate(-1)}
                className={`${cellClass} bg-transparent border-0`}
                style={cellStyle}
              >
                <Icon className="shrink-0" style={iconStyle(false)} />
                <span className="text-[10px] leading-tight" style={labelStyle(false)}>
                  {label}
                </span>
              </button>
            );
          }

          if (tab.action === "menu") {
            return (
              <button
                key={tab.key}
                onClick={() => window.dispatchEvent(new CustomEvent("toggle-sidebar"))}
                className={`${cellClass} bg-transparent border-0`}
                style={cellStyle}
              >
                <Icon className="shrink-0" style={iconStyle(false)} />
                <span className="text-[10px] leading-tight" style={labelStyle(false)}>
                  {label}
                </span>
              </button>
            );
          }

          const isActive = location.pathname === tab.to || (tab.to !== "/" && location.pathname.startsWith(tab.to));

          return (
            <Link
              key={tab.key}
              to={tab.to}
              className={`${cellClass} no-underline`}
              style={cellStyle}
            >
              {isActive && (
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] rounded-full"
                  style={{ width: "24px", background: rolePrimary }}
                />
              )}
              <span className="relative">
                <Icon className="shrink-0" style={iconStyle(isActive)} />
                {tab.key === "messages" && unreadMessages > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] rounded-full flex items-center justify-center text-[9px] text-white px-0.5"
                    style={{ background: cn.green }}
                  >
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </span>
              <span className="text-[10px] leading-tight" style={labelStyle(isActive)}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}