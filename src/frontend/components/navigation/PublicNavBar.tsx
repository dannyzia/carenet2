import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { LogIn, Bell, X } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { cn } from "@/frontend/theme/tokens";
import { useTheme } from "@/frontend/components/ThemeProvider";
import { Sun, Moon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/frontend/components/shared/LanguageSwitcher";
import { useUnreadCounts } from "@/frontend/hooks/useUnreadCounts";
import type { Role } from "@/frontend/theme/tokens";
import { AUTH_PUBLIC_SIGNUP_PATH } from "@/frontend/constants/authPublicPaths";

const ROLE_SEGMENTS: Role[] = ["caregiver", "guardian", "admin", "moderator", "patient", "agency", "shop"];

function roleForUnreadCounts(pathname: string): Role {
  const seg = pathname.split("/")[1];
  if (seg && ROLE_SEGMENTS.includes(seg as Role)) return seg as Role;
  return "guardian";
}

/** Desktop center nav — essential links only */
const navLinks: { labelKey: string; to: string; activePaths?: string[] }[] = [
  { labelKey: "marketplace", to: "/marketplace" },
];

// Mobile drawer — essential links only
const mobileNavLinks = [
  { to: "/marketplace", labelKey: "marketplace" },
  { to: "/agencies", labelKey: "agencies" },
  { to: "/shop", labelKey: "shop" },
];

/** i18n keys under common namespace (same labels as AuthenticatedLayout sidebar). */
const mobileBrowseLinks = [
  { to: "/agencies", labelKey: "sidebar.agencies" },
  { to: "/shop", labelKey: "sidebar.shop" },
];

const mobileSupportLinks = [
  { to: "/support/help", labelKey: "sidebar.helpCenter" },
  { to: "/privacy", labelKey: "sidebar.privacyPolicy" },
  { to: "/terms", labelKey: "sidebar.termsOfService" },
];

export function PublicNavBar() {
  const location = useLocation();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useTranslation("common");
  const unreadCounts = useUnreadCounts(roleForUnreadCounts(location.pathname));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setMenuOpen(false), [location.pathname]);

  // Listen for toggle event from BottomNav menu button
  useEffect(() => {
    const handler = () => setMenuOpen((o) => !o);
    window.addEventListener("toggle-sidebar", handler);
    window.addEventListener("toggle-public-sidebar", handler);
    return () => {
      window.removeEventListener("toggle-sidebar", handler);
      window.removeEventListener("toggle-public-sidebar", handler);
    };
  }, []);

  return (
    <>
      {/* ─── Top Header Bar ─── */}
      <header
        className="sticky top-0 z-50 pt-[env(safe-area-inset-top,0px)]"
        style={{
          backgroundColor: cn.bgHeader,
          boxShadow: scrolled ? cn.shadowHeader : "0 1px 3px rgba(0,0,0,0.08)",
          borderBottom: `1px solid ${cn.borderLight}`,
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          {/* Mobile menu: BottomNav “Menu” dispatches toggle-sidebar / toggle-public-sidebar */}

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 no-underline">
            <img src="/logo.png" alt="" className="w-8 h-8 rounded-xl object-contain" />
            <span className="text-base" style={{ color: cn.text }}>{t("app.name")}</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 ml-6 flex-1 justify-center">
            {navLinks.map(({ labelKey, to, activePaths }) => {
              const active = activePaths
                ? activePaths.includes(location.pathname)
                : location.pathname === to;
              return (
                <Link key={to} to={to} className="no-underline">
                  <button
                    className="px-4 py-1.5 rounded-lg text-sm transition-all"
                    style={{
                      color: active ? "#FEB4C5" : cn.text,
                      background: active ? "rgba(254,180,197,0.10)" : "transparent",
                      fontWeight: active ? 500 : 400,
                    }}
                  >
                    {t(`nav.${labelKey}`)}
                  </button>
                </Link>
              );
            })}
          </nav>

          {/* Right side — same rhythm as AuthenticatedLayout header */}
          <div className="flex items-center gap-2 ml-auto">
            <Link
              to="/notifications"
              className="relative p-2 rounded-lg hover:opacity-80 transition-all no-underline shrink-0"
              aria-label={t("a11y.notifications", "Notifications")}
            >
              <Bell className="w-5 h-5" style={{ color: cn.textSecondary }} aria-hidden />
              {unreadCounts.notifications > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] text-white px-1"
                  style={{ background: cn.pink }}
                  aria-label={t("a11y.unreadNotifications", { count: unreadCounts.notifications })}
                >
                  {unreadCounts.notifications > 9 ? "9+" : unreadCounts.notifications}
                </span>
              )}
            </Link>

            {/* Language — drawer has full list; keep compact in bar */}
            <div className="min-w-0 max-w-[min(140px,28vw)] sm:max-w-none">
              <LanguageSwitcher variant="compact" />
            </div>
            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:opacity-80"
              style={{ color: cn.textSecondary, background: "rgba(128,128,128,0.1)" }}
              aria-label={
                resolvedTheme === "dark"
                  ? t("a11y.switchToLight", "Switch to light mode")
                  : t("a11y.switchToDark", "Switch to dark mode")
              }
            >
              {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Divider — md+ only (auth hidden on phone/tablet portrait; use drawer) */}
            <div className="hidden md:block w-px h-6 mx-1" style={{ background: cn.borderLight }} />

            {/* Auth buttons — md+ only; mobile: drawer + BottomNav */}
            <Link to={AUTH_PUBLIC_SIGNUP_PATH} className="hidden md:flex no-underline">
              <Button
                size="sm"
                className="gap-1.5"
                style={{
                  color: cn.pinkLight,
                  borderColor: "rgba(254,180,197,0.3)",
                  background: "transparent",
                  border: "1px solid rgba(254,180,197,0.3)",
                }}
              >
                {t("nav.register")}
              </Button>
            </Link>
            <Link to="/auth/login" className="hidden md:flex no-underline">
              <Button
                size="sm"
                className="gap-1.5"
                style={{
                  background: "var(--cn-gradient-caregiver)",
                  color: "white",
                  boxShadow: "0 2px 10px rgba(254,180,197,0.35)",
                }}
              >
                <LogIn className="w-3.5 h-3.5" />
                {t("nav.login")}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Sidebar backdrop ─── */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[60] md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* ─── Sidebar drawer ─── */}
      <aside
        className="fixed left-0 top-0 z-[70] flex h-[100dvh] max-h-[100dvh] w-72 min-w-0 flex-col overflow-hidden pt-[env(safe-area-inset-top,0px)] md:hidden"
        style={{
          background: cn.bgSidebar,
          boxShadow: menuOpen ? "4px 0 24px rgba(0,0,0,0.18)" : "none",
          transform: menuOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 300ms ease-in-out",
        }}
      >
        {/* Sidebar header */}
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${cn.borderLight}` }}>
          <Link to="/" className="flex items-center gap-2 no-underline" onClick={() => setMenuOpen(false)}>
            <img src="/logo.png" alt="" className="w-9 h-9 rounded-xl object-contain" />
            <span className="text-lg" style={{ color: cn.text }}>{t("app.name")}</span>
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="p-2 rounded-lg hover:opacity-80"
            style={{ color: cn.textSecondary }}
            aria-label={t("a11y.closeMenu", "Close menu")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth buttons in drawer */}
        <div className="px-4 pt-4 pb-2 flex flex-col gap-2">
          <Link to={AUTH_PUBLIC_SIGNUP_PATH} onClick={() => setMenuOpen(false)} className="no-underline">
            <Button
              size="sm"
              className="w-full gap-1.5"
              style={{
                color: cn.pinkLight,
                background: "transparent",
                border: "1px solid rgba(254,180,197,0.3)",
              }}
            >
              {t("nav.register")}
            </Button>
          </Link>
          <Link to="/auth/login" onClick={() => setMenuOpen(false)} className="no-underline">
            <Button
              size="sm"
              className="w-full gap-1.5"
              style={{
                background: "var(--cn-gradient-caregiver)",
                color: "white",
              }}
            >
              <LogIn className="w-3.5 h-3.5" />
              {t("nav.login")}
            </Button>
          </Link>
        </div>

        {/* Scrollable nav links */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          {/* Main nav */}
          <div className="space-y-0.5">
            {mobileNavLinks.map(({ to, labelKey }) => {
              const active = location.pathname === to;
              return (
                <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm no-underline"
                  style={{
                    color: active ? "#FEB4C5" : cn.text,
                    background: active ? "rgba(254,180,197,0.10)" : "transparent",
                    fontWeight: active ? 500 : 400,
                  }}>
                  <span>{t(`nav.${labelKey}`)}</span>
                </Link>
              );
            })}
          </div>

          {/* Browse links */}
          <p className="px-3 pt-4 pb-1 text-[10px] uppercase tracking-wider" style={{ color: cn.textSecondary, opacity: 0.6 }}>
            {t("sidebar.section.browse")}
          </p>
          <div className="space-y-0.5">
            {mobileBrowseLinks.map(({ to, labelKey }) => {
              const active = location.pathname === to;
              return (
                <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm no-underline"
                  style={{
                    color: active ? "#FEB4C5" : cn.textSecondary,
                    background: active ? "rgba(254,180,197,0.10)" : "transparent",
                  }}>
                  <span>{t(labelKey)}</span>
                </Link>
              );
            })}
          </div>

          {/* Support links */}
          <p className="px-3 pt-4 pb-1 text-[10px] uppercase tracking-wider" style={{ color: cn.textSecondary, opacity: 0.6 }}>
            {t("sidebar.section.supportInfo")}
          </p>
          <div className="space-y-0.5">
            {mobileSupportLinks.map(({ to, labelKey }) => {
              const active = location.pathname === to;
              return (
                <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm no-underline"
                  style={{
                    color: active ? "#FEB4C5" : cn.textSecondary,
                    background: active ? "rgba(254,180,197,0.10)" : "transparent",
                  }}>
                  <span>{t(labelKey)}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Sidebar footer — language & theme (safe bottom clears gesture bar; drawer variant stays inside w-72) */}
        <div
          className="shrink-0 space-y-2 p-3"
          style={{
            borderTop: `1px solid ${cn.borderLight}`,
            paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))",
          }}
        >
          <LanguageSwitcher variant="drawer" />
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:opacity-80 transition-all text-sm"
            style={{ color: cn.textSecondary, background: "rgba(128,128,128,0.1)" }}
            aria-label={
              resolvedTheme === "dark"
                ? t("a11y.switchToLight", "Switch to light mode")
                : t("a11y.switchToDark", "Switch to dark mode")
            }
          >
            {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>
              {resolvedTheme === "dark"
                ? t("theme.lightMode", "Light mode")
                : t("theme.darkMode", "Dark mode")}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}