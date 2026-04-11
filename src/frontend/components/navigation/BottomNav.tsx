import React from "react";
import { Link, useLocation } from "react-router";
import {
  Home, ChevronLeft, Search, MessageSquare, Menu,
} from "lucide-react";
import { cn, type Role, roleConfig } from "@/frontend/theme/tokens";
import { useTranslation } from "react-i18next";
import { useTransitionNavigate } from "@/frontend/hooks/useTransitionNavigate";
import { features } from "@/config/features";
import { useAuth } from "@/frontend/auth/AuthContext";

export interface BottomNavProps {
  unreadMessages?: number;
  unreadNotifications?: number;
  "aria-label"?: string;
}

/**
 * BottomNav — universal 5-tab bottom navigation for ALL screens.
 *
 * Tab order: Home | Back | Search | Messages | Menu
 *
 * Everything is i18n-driven — labels come from `common.bottomNav.*` keys.
 * Destinations are resolved dynamically based on the current role segment.
 */

function detectRole(pathname: string): Role | null {
  const segment = pathname.split("/")[1];
  const roles: Role[] = ["caregiver", "guardian", "admin", "moderator", "patient", "agency", "shop"];
  if (segment && roles.includes(segment as Role)) return segment as Role;
  return null;
}

export function BottomNav({ unreadMessages = 0, unreadNotifications = 0, ...rest }: BottomNavProps) {
  const location = useLocation();
  const navigate = useTransitionNavigate();
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const role = detectRole(location.pathname);
  const rolePrimary = role ? `var(--${roleConfig[role].cssVar})` : "var(--cn-pink)";

  /* Resolve dynamic destinations based on detected role */
  const homePath = role ? `/${role}/dashboard` : "/";
  const effectiveRole = role ?? user?.activeRole ?? null;
  const searchPath =
    effectiveRole === "guardian" || effectiveRole === "patient"
      ? !features.careSeekerCaregiverContactEnabled
        ? `/${effectiveRole}/marketplace-hub?tab=packages`
        : `/${effectiveRole}/search`
      : role
        ? `/${role}/search`
        : "/global-search";
  const messagesPath = role ? `/${role}/messages` : "/messages";

  /* Tab definitions — order: Home | Back | Search | Messages | Menu */
  const tabs: { key: string; labelKey: string; icon: React.ElementType; action: "link" | "back" | "menu"; to: string }[] = [
    { key: "home",     labelKey: "home",     icon: Home,          action: "link", to: homePath },
    { key: "back",     labelKey: "back",     icon: ChevronLeft,   action: "back", to: "" },
    { key: "search",   labelKey: "search",   icon: Search,        action: "link", to: searchPath },
    { key: "messages", labelKey: "messages",  icon: MessageSquare, action: "link", to: messagesPath },
    { key: "menu",     labelKey: "menu",      icon: Menu,          action: "menu", to: "" },
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
        {tabs.map((item) => {
          const Icon = item.icon;
          const label = t(`bottomNav.${item.labelKey}`);

          /* ── Back button ── */
          if (item.action === "back") {
            return (
              <button
                key={item.key}
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

          /* ── Menu button — opens sidebar ── */
          if (item.action === "menu") {
            return (
              <button
                key={item.key}
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

          /* ── Regular link tab ── */
          const isActive = location.pathname === item.to ||
            (item.to !== "/" && location.pathname.startsWith(item.to));

          return (
            <Link
              key={item.key}
              to={item.to}
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
                {item.key === "messages" && unreadMessages > 0 && (
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