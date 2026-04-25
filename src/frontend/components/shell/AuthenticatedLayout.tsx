import { Link, Navigate, Outlet, useLocation } from "react-router";
import React, { useState, useEffect, Suspense } from "react";
import {
  Ticket,
  RefreshCw,
  Calendar, MessageSquare, DollarSign, Star,
  Briefcase, CreditCard, CheckCircle, BarChart2, Settings,
  Bell, Search, LogOut, X, ChevronRight, ShoppingBag,
  Flag, Home, ChevronDown, Sun, Moon,
  Shield, Radio,
  Building2,
  Globe,
  FileText,
} from "lucide-react";
import { useTheme } from "@/frontend/components/shared/ThemeProvider";
import { type Role, roleConfig, cn } from "@/frontend/theme/tokens";
import { useTranslation, type TFunction } from "react-i18next";
import { LanguageSwitcher } from "@/frontend/components/shared/LanguageSwitcher";
import { useAuth } from "@/backend/store/auth/AuthContext";
import { setStatusBarForRole } from "@/frontend/native/statusBar";
import { BottomNav } from "@/frontend/components/navigation/BottomNav";
import { OfflineIndicator } from "@/frontend/components/shared/OfflineIndicator";
import { NotificationPermissionPrompt } from "@/frontend/components/shared/NotificationPermissionPrompt";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { RealtimeStatusIndicator } from "@/frontend/components/shared/RealtimeStatusIndicator";
import { RetryOverlay } from "@/frontend/components/shared/RetryOverlay";
import { ConnectivityDebugPanel } from "@/frontend/components/shared/ConnectivityDebugPanel";
import { useTransitionNavigate } from "@/frontend/hooks/useTransitionNavigate";
import { useUnreadCounts } from "@/frontend/hooks/useUnreadCounts";
import { UnreadCountsContext } from "@/frontend/hooks/UnreadCountsContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/frontend/components/ui/collapsible";
import { features } from "@/config/features";
import { roleDashboardPath, roleMessagesPath } from "@/backend/navigation/roleAppPaths";
import { getRoleNavSections, type NavSection } from "@/backend/navigation/roleNavSections";
import { RoleSidebar } from "@/frontend/components/shell/RoleSidebar";

/* ─── Focus main content on route change (a11y) ─── */
function useFocusOnNavigate() {
  const location = useLocation();
  useEffect(() => {
    const main = document.getElementById("main-content");
    if (main) {
      main.focus({ preventScroll: true });
    }
  }, [location.pathname]);
}


// Flatten for backward compatibility (used by BottomNav role detection etc.)
// NOTE: This uses English fallback labels since it runs at module scope.
// BottomNav has its own i18n, so this is only for type compatibility.
const roleNavLinks: Record<Role, { label: string; path: string; icon: React.ElementType }[]> = Object.fromEntries(
  Object.entries(getRoleNavSections(((key: string) => key) as unknown as TFunction)).map(([role, sections]) => [
    role,
    sections.flatMap((s) => s.links.map((l) => ({ label: l.i18nKey, path: l.path, icon: l.icon }))),
  ])
) as Record<Role, { label: string; path: string; icon: React.ElementType }[]>;

/* ─── Demo user names per role ─── */
const roleUserNames: Record<Role, string> = {
  caregiver: "Mock_Karim Uddin",
  guardian: "Mock_Rashed Hossain",
  admin: "Admin",
  moderator: "Mock_Mod User",
  patient: "Patient User",
  agency: "Agency Manager",
  shop: "Shop Owner",
  channel_partner: "Channel Partner",
};

/**
 * AuthenticatedLayout — shell for all role-based (logged-in) pages.
 * Provides:
 *   - Desktop: persistent sidebar + header
 *   - Mobile: BottomNav “Menu” toggles sidebar + compact header (no duplicate hamburger)
 * Pages rendered via <Outlet /> should NOT wrap themselves in <Layout>.
 */
export function AuthenticatedLayout() {
  const location = useLocation();
  const navigate = useTransitionNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roleSidebarOpen, setRoleSidebarOpen] = useState(false);
  /** Secondary blocks default collapsed so role nav keeps vertical space (all roles). */
  const [sidebarBrowseOpen, setSidebarBrowseOpen] = useState(false);
  const [sidebarSupportOpen, setSidebarSupportOpen] = useState(false);
  const [sidebarAppOpen, setSidebarAppOpen] = useState(false);
  const { resolvedTheme, toggleTheme } = useTheme();
  const { t } = useTranslation("common");
  const { user, logout } = useAuth();

  // A11y: move focus to main content on route change
  useFocusOnNavigate();

  // Listen for toggle-sidebar events from BottomNav "Menu" tab
  useEffect(() => {
    const handler = () => setSidebarOpen((prev) => !prev);
    window.addEventListener("toggle-sidebar", handler);
    return () => window.removeEventListener("toggle-sidebar", handler);
  }, []);

  // Listen for toggle-rolesidebar events from BottomNav "Persona" tab
  useEffect(() => {
    const handler = () => setRoleSidebarOpen((prev) => !prev);
    window.addEventListener("toggle-rolesidebar", handler);
    return () => window.removeEventListener("toggle-rolesidebar", handler);
  }, []);

  // Detect role: prefer auth context, fallback to URL
  const segment = location.pathname.split("/")[1];
  const currentRole: Role = user?.activeRole || ((segment && segment in roleNavLinks) ? segment as Role : "guardian");
  const unreadCounts = useUnreadCounts(currentRole);
  const rCfg = roleConfig[currentRole];
  const rolePrimary = `var(--${rCfg.cssVar})`;
  const userName = user?.name || roleUserNames[currentRole];

  // Enforce role-based route ownership for role-prefixed pages.
  // Shared routes (e.g., /settings, /wallet, /billing) are intentionally allowed.
  const requestedRole = (segment && segment in roleNavLinks) ? (segment as Role) : null;
  const shouldRedirectToOwnDashboard =
    !!user &&
    !!requestedRole &&
    requestedRole !== user.activeRole &&
    !user.roles.includes(requestedRole);

  // Update native status bar color when role changes
  useEffect(() => {
    setStatusBarForRole(currentRole);
  }, [currentRole]);

  const handleLogout = () => {
    logout();
    navigate("/auth/login", { replace: true });
  };

  if (shouldRedirectToOwnDashboard && user) {
    return <Navigate to={roleDashboardPath(user.activeRole)} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: cn.bgPage }}>
      {/* Skip to main content — a11y */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:text-white focus:text-sm focus:outline-none"
        style={{ background: cn.pink }}
      >
        {t("a11y.skipToContent", "Skip to main content")}
      </a>

      {/* Offline status banner — full-width above everything */}
      <OfflineIndicator />

      {/* Retry backoff banner — shows when API calls are retrying */}
      <RetryOverlay />

      {/* Notification permission prompt — shows once on first login */}
      <NotificationPermissionPrompt />

      {/* Header — full-width, sticky, safe-area-top */}
      <header
        className="sticky top-0 z-30 border-b cn-safe-top"
        style={{ background: cn.bgHeader, boxShadow: cn.shadowHeader, borderColor: cn.borderLight }}
      >
        <div className="max-w-6xl mx-auto w-full h-14 px-4 sm:px-6 flex items-center gap-3">
          {/* Search — hidden on small screens */}
          <div role="search" className="flex-1 max-w-xs hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: cn.bgInput }}>
            <Search className="w-4 h-4 shrink-0" style={{ color: cn.textSecondary }} aria-hidden="true" />
            <input placeholder={t("sidebar.searchPlaceholder")} className="bg-transparent outline-none text-sm flex-1" style={{ color: cn.text }} aria-label={t("sidebar.searchPlaceholder")} />
          </div>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            <Link to="/notifications" className="relative p-2 rounded-lg hover:opacity-80 transition-all no-underline" aria-label={t("a11y.notifications", "Notifications")}>
              <Bell className="w-5 h-5" style={{ color: cn.textSecondary }} aria-hidden="true" />
              {unreadCounts.notifications > 0 && (
                unreadCounts.notifications <= 9 ? (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] text-white px-1"
                    style={{ background: cn.pink }}
                    aria-label={t("a11y.unreadNotifications", { count: unreadCounts.notifications })}
                  >
                    {unreadCounts.notifications}
                  </span>
                ) : (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] text-white px-1"
                    style={{ background: cn.pink }}
                    aria-label={t("a11y.unreadNotifications", { count: unreadCounts.notifications })}
                  >
                    9+
                  </span>
                )
              )}
            </Link>
            {/* Messages: BottomNav already provides tab + badge on mobile (md:hidden). */}
            <Link
              to={roleMessagesPath(currentRole)}
              className="relative hidden p-2 rounded-lg hover:opacity-80 transition-all no-underline md:flex"
              aria-label={t("a11y.messages", "Messages")}
            >
              <MessageSquare className="w-5 h-5" style={{ color: cn.textSecondary }} aria-hidden="true" />
              {unreadCounts.messages > 0 && (
                unreadCounts.messages <= 9 ? (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] text-white px-1"
                    style={{ background: cn.green }}
                    aria-label={t("a11y.unreadMessages", { count: unreadCounts.messages })}
                  >
                    {unreadCounts.messages}
                  </span>
                ) : (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] text-white px-1"
                    style={{ background: cn.green }}
                    aria-label={t("a11y.unreadMessages", { count: unreadCounts.messages })}
                  >
                    9+
                  </span>
                )
              )}
            </Link>
            <div className="flex items-center gap-2 pl-2 cursor-pointer">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                style={{ background: rCfg.gradient }}>
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block">
                <p className="text-sm leading-tight" style={{ color: cn.text }}>{userName}</p>
                <p className="text-xs leading-tight" style={{ color: cn.textSecondary }}>{t(`roles.${currentRole}`, rCfg.label)}</p>
              </div>
              <ChevronDown className="w-4 h-4 hidden md:block" style={{ color: cn.textSecondary }} />
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
      {/* Backdrop overlay when sidebar is open on mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ─── Sidebar (hidden on mobile, always visible on desktop) ─── */}
      <aside
        aria-label={t("a11y.sidebarNav", "Sidebar navigation")}
        className={`fixed left-0 z-50 flex w-64 min-h-0 flex-col overflow-hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:static md:h-auto md:max-h-none md:min-h-0 md:self-stretch md:translate-x-0`}
        style={{
          top: "calc(var(--cn-header-height) + env(safe-area-inset-top, 0px))",
          background: cn.bgSidebar,
          boxShadow: cn.shadowSidebar,
          bottom: "calc(var(--cn-bottom-nav-height) + env(safe-area-inset-bottom, 0px))",
          transition: "translate 300ms ease-in-out, transform 300ms ease-in-out",
        }}
      >
        <div className="shrink-0 p-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${cn.borderLight}` }}>
          <Link to="/" className="flex items-center gap-2 no-underline">
            <img src="/logo.png" alt="" className="w-9 h-9 rounded-xl object-contain" />
            <span className="text-lg" style={{ color: cn.text }}>CareNet</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1" style={{ color: cn.textSecondary }} aria-label={t("a11y.closeSidebar", "Close sidebar")}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile: logout must not depend on nested scroll (fixed aside + flex height quirks). */}
        <div className="shrink-0 border-b px-3 py-2 md:hidden" style={{ borderColor: cn.borderLight }}>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium"
            style={{ color: cn.red, background: "rgba(239,68,68,0.08)" }}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {t("nav.logout")}
          </button>
        </div>

        <div className="shrink-0 mx-4 mt-3 mb-1 px-3 py-1.5 rounded-lg text-center text-xs"
          style={{ background: rCfg.lightBg, color: rolePrimary }}>
          {t("sidebar.portal", { role: t(`roles.${currentRole}`, rCfg.label) })}
        </div>

        {/* One scroll region so Browse / Support / Logout stay reachable on short viewports (mobile). */}
        <div
          className="cn-scroll-mobile cn-safe-bottom flex min-h-0 flex-1 flex-col overflow-x-hidden overscroll-contain"
        >
        {/* ─── Browse (no repeat: home/notifications/messages live in header + logo) ─── */}
        <div className="shrink-0 border-t flex flex-col min-h-0" style={{ borderColor: cn.borderLight }}>
          <Collapsible className="group" open={sidebarBrowseOpen} onOpenChange={setSidebarBrowseOpen}>
            <CollapsibleTrigger
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left rounded-lg cn-touch-target hover:opacity-90"
              style={{ color: cn.textSecondary }}
            >
              <span className="text-[10px] uppercase tracking-wider px-1" style={{ opacity: 0.85 }}>
                {t("sidebar.section.browse")}
              </span>
              <ChevronDown className="w-4 h-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-none">
              <div className="space-y-0.5 px-1 pb-2">
                {[
                  { i18nKey: "sidebar.marketplace", path: "/marketplace", icon: Search },
                  { i18nKey: "sidebar.agencies", path: "/agencies", icon: Building2 },
                  { i18nKey: "sidebar.shop", path: "/shop", icon: ShoppingBag },
                ].map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path;
                  return (
                    <Link key={link.path} to={link.path} onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm no-underline"
                      style={{
                        color: isActive ? rolePrimary : cn.textSecondary,
                        background: isActive ? rCfg.lightBg : "transparent",
                      }}>
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1">{t(link.i18nKey)}</span>
                    </Link>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible className="group border-t" style={{ borderColor: cn.borderLight }} open={sidebarSupportOpen} onOpenChange={setSidebarSupportOpen}>
            <CollapsibleTrigger
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left rounded-lg cn-touch-target hover:opacity-90"
              style={{ color: cn.textSecondary }}
            >
              <span className="text-[10px] uppercase tracking-wider px-1" style={{ opacity: 0.85 }}>
                {t("sidebar.section.supportInfo")}
              </span>
              <ChevronDown className="w-4 h-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-none">
              <div className="space-y-0.5 px-1 pb-2">
                {[
                  { i18nKey: "sidebar.helpCenter", path: "/support/help", icon: Shield },
                  { i18nKey: "sidebar.submitTicket", path: "/support/ticket", icon: Ticket },
                  { i18nKey: "sidebar.refundRequest", path: "/support/refund", icon: RefreshCw },
                  { i18nKey: "sidebar.privacyPolicy", path: "/privacy", icon: Shield },
                  { i18nKey: "sidebar.termsOfService", path: "/terms", icon: FileText },
                ].map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path;
                  return (
                    <Link key={link.path} to={link.path} onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm no-underline"
                      style={{
                        color: isActive ? rolePrimary : cn.textSecondary,
                        background: isActive ? rCfg.lightBg : "transparent",
                      }}>
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{t(link.i18nKey)}</span>
                    </Link>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* ─── App controls (always visible) ─── */}
        <div className="shrink-0 border-t flex flex-col" style={{ borderColor: cn.borderLight }}>
          <div className="space-y-2 px-3 py-2">
            <div className="flex items-center gap-2 flex-wrap">
              <RealtimeStatusIndicator variant="badge" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <LanguageSwitcher variant="compact" className="flex-1 min-w-0" />
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:opacity-80 transition-all shrink-0"
                style={{ color: cn.textSecondary }}
                aria-label={resolvedTheme === "dark" ? t("a11y.switchToLight", "Switch to light mode") : t("a11y.switchToDark", "Switch to dark mode")}
                title={resolvedTheme === "dark" ? "Switch to light" : "Switch to dark"}
              >
                {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
            <Link
              to="/settings"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-2 py-2 rounded-lg hover:opacity-80 transition-all text-sm no-underline"
              style={{ color: cn.textSecondary }}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>{t("nav.settings")}</span>
            </Link>
          </div>
          <div className="hidden px-3 py-2 md:block" style={{ borderTop: `1px solid ${cn.borderLight}` }}>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm transition-all hover:opacity-80"
              style={{ color: cn.red }}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>{t("nav.logout")}</span>
            </button>
          </div>
        </div>
        </div>
      </aside>

      {/* ─── Main content area ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Page content rendered by router */}
        <main className="flex-1 p-4 md:p-6 cn-bottom-safe overflow-y-auto" id="main-content" tabIndex={-1} aria-label={t("a11y.mainContent", "Main content")}>
          <UnreadCountsContext.Provider value={unreadCounts}>
            <Suspense fallback={<PageSkeleton variant="dashboard" />}>
              <Outlet />
            </Suspense>
          </UnreadCountsContext.Provider>
        </main>
      </div>
      </div>

      {/* BottomNav — mobile only, OUTSIDE the flex row */}
      <BottomNav
        unreadMessages={unreadCounts.messages}
        unreadNotifications={unreadCounts.notifications}
        isRoleSidebarOpen={roleSidebarOpen}
        aria-label={t("a11y.bottomNav", "Bottom navigation")}
      />

      {/* RoleSidebar — overlay triggered by Persona tab */}
      <RoleSidebar isOpen={roleSidebarOpen} onClose={() => setRoleSidebarOpen(false)} />

      {/* Dev-only connectivity debug panel (Ctrl+Shift+D or triple-tap) */}
      <ConnectivityDebugPanel />
    </div>
  );
}
