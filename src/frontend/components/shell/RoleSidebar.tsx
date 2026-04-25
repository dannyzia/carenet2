import React, { useState, useEffect, useRef, useMemo, useContext, memo } from "react";
import { Link, useLocation } from "react-router";
import { X, ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/backend/store/auth/AuthContext";
import { roleConfig, cn, type Role } from "@/frontend/theme/tokens";
import { getRoleNavSections } from "@/backend/navigation/roleNavSections";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/frontend/components/ui/collapsible";
import { UnreadCountsContext } from "@/frontend/hooks/UnreadCountsContext";
import { usePendingProofCount } from "@/frontend/hooks/usePendingProofCount";
import { usePendingActivationCount } from "@/frontend/hooks/usePendingActivationCount";

export interface RoleSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleSidebar = memo(function RoleSidebar({ isOpen, onClose }: RoleSidebarProps) {
  const { user } = useAuth();
  const { t } = useTranslation("common");
  const location = useLocation();

  // Resolve role data — always guard against null
  const currentRole = (user?.activeRole as Role) ?? null;
  const rCfg = currentRole ? roleConfig[currentRole] : null;
  const rolePrimary = rCfg ? `var(--${rCfg.cssVar})` : "var(--cn-pink)";
  const userName = user?.name ?? "";
  const roleLabel = currentRole ? t(`roles.${currentRole}`, rCfg?.label ?? "") : "";

  // Compute nav sections — memoized
  const navSections = useMemo(
    () => (currentRole ? getRoleNavSections(t)[currentRole] : []),
    [t, currentRole]
  );

  // Collapsible section state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Badge data — from context and hooks
  const unreadCounts = useContext(UnreadCountsContext);
  const unreadMessages = unreadCounts?.messages ?? 0;
  const pendingProofCount = usePendingProofCount();
  const pendingActivationCount = usePendingActivationCount();

  // Refs for focus management
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const announcerRef = useRef<HTMLDivElement>(null);

  // Screen-reader live region announcer — update on open/close
  useEffect(() => {
    if (!announcerRef.current) return;
    announcerRef.current.textContent = isOpen
      ? t("a11y.roleSidebarOpened", "Role menu opened")
      : t("a11y.roleSidebarClosed", "Role menu closed");
  }, [isOpen, t]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Focus management — move focus in, restore focus out
  useEffect(() => {
    if (isOpen) {
      // Focus the close button when sidebar opens.
      // If for any reason closeBtnRef is unavailable, fall back to the first
      // focusable element inside the sidebar.
      setTimeout(() => {
        if (closeBtnRef.current) {
          closeBtnRef.current.focus();
        } else if (sidebarRef.current) {
          const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
          const first = sidebarRef.current.querySelector<HTMLElement>(FOCUSABLE);
          first?.focus();
        }
      }, 50);
    } else {
      // Restore focus to the Persona button that opened this sidebar.
      (document.querySelector("[data-persona-button]") as HTMLElement | null)?.focus();
    }
  }, [isOpen]);

  // Focus trap — Tab and Shift+Tab cycle inside sidebar
  useEffect(() => {
    if (!isOpen || !sidebarRef.current) return;
    const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const els = Array.from(
        sidebarRef.current!.querySelectorAll<HTMLElement>(FOCUSABLE)
      );
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  return (
    <>
      {/* Screen-reader live region (always in DOM, visually hidden) */}
      <div
        ref={announcerRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Backdrop (only when isOpen) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.40)" }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        ref={sidebarRef}
        role="dialog"
        aria-modal={isOpen}
        aria-hidden={!isOpen}
        aria-label={t("a11y.roleNav", "Role navigation")}
        className={[
          "fixed left-0 md:left-64 z-50 flex w-64 flex-col overflow-hidden",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        style={{
          top: "calc(var(--cn-header-height) + env(safe-area-inset-top, 0px))",
          bottom: "calc(var(--cn-bottom-nav-height) + env(safe-area-inset-bottom, 0px))",
          background: cn.bgSidebar,
          boxShadow: cn.shadowSidebar,
        }}
      >
        {/* Header */}
        <div
          className="shrink-0 p-4 flex items-center gap-3"
          style={{ borderBottom: `1px solid ${cn.borderLight}` }}
        >
          {/* Avatar div */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm shrink-0 select-none"
            style={{ background: rCfg?.gradient ?? "linear-gradient(135deg, #ec4899, #8b5cf6)" }}
            aria-hidden="true"
          >
            {userName.charAt(0).toUpperCase() || "?"}
          </div>
          {/* User info column */}
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate" style={{ color: cn.text }}>{userName}</p>
            <p className="text-xs truncate" style={{ color: cn.textSecondary }}>{roleLabel}</p>
          </div>
          {/* Close button */}
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label={t("a11y.closeRoleSidebar", "Close role sidebar")}
            className="p-1.5 rounded-lg hover:opacity-80 transition-all shrink-0"
            style={{ color: cn.textSecondary }}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Empty state */}
        {navSections.length === 0 && (
          <div className="flex-1 flex items-center justify-center p-6">
            <p className="text-sm text-center" style={{ color: cn.textSecondary }}>
              {t("sidebar.noNavItems", "No items available")}
            </p>
          </div>
        )}

        {/* Nav scroll area */}
        {navSections.length > 0 && (
          <nav
            aria-label={t("a11y.roleNav", "Role navigation")}
            className="flex-1 overflow-y-auto overflow-x-hidden cn-scroll-mobile cn-safe-bottom px-3 py-3"
          >
            {navSections.map((section, sIdx) => {
              const isMain = sIdx === 0;
              const sectionOpen = section.sectionKey ? (collapsedSections[section.sectionKey] ?? false) : false;
              const setActive = (open: boolean) => {
                if (section.sectionKey) setCollapsedSections((prev) => ({ ...prev, [section.sectionKey!]: open }));
              };
              const isActiveInSection = section.links.some((l) => location.pathname === l.path);

              const sectionContent = (
                <div className="space-y-0.5">
                  {section.links.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.path;
                    return (
                      <Link key={link.path} to={link.path} onClick={onClose}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm no-underline"
                        style={{
                          background: isActive ? rCfg?.lightBg : "transparent",
                          color: isActive ? rolePrimary : cn.text,
                          fontWeight: isActive ? 500 : 400,
                        }}>
                        <Icon className="shrink-0" style={{ width: "1.125rem", height: "1.125rem" }} />
                        <span className="flex-1">{t(`sidebar.${link.i18nKey}`)}</span>
                        {link.i18nKey === "messages" && unreadMessages > 0 && (
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white shrink-0"
                            style={{ background: cn.green }}
                          >
                            {unreadMessages > 9 ? "9+" : unreadMessages}
                          </span>
                        )}
                        {link.i18nKey === "billing" && pendingProofCount > 0 && (
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white shrink-0"
                            style={{ background: cn.pink }}
                          >
                            {pendingProofCount}
                          </span>
                        )}
                        {link.i18nKey === "roleActivations" && pendingActivationCount > 0 && (
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white shrink-0"
                            style={{ background: cn.pink }}
                          >
                            {pendingActivationCount > 9 ? "9+" : pendingActivationCount}
                          </span>
                        )}
                        {isActive && !(link.i18nKey === "billing" && pendingProofCount > 0) && !(link.i18nKey === "roleActivations" && pendingActivationCount > 0) && <ChevronRight className="w-4 h-4 ml-auto" />}
                      </Link>
                    );
                  })}
                </div>
              );

              if (isMain || !section.sectionKey) {
                return (
                  <div key={sIdx}>
                    {section.sectionKey && (
                      <p
                        className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider"
                        style={{ color: cn.textSecondary, opacity: 0.6 }}
                      >
                        {t(`sidebar.section.${section.sectionKey}`)}
                      </p>
                    )}
                    {sectionContent}
                  </div>
                );
              }

              return (
                <div key={sIdx} className="mt-3">
                  <Collapsible
                    className="group"
                    open={isActiveInSection || sectionOpen}
                    onOpenChange={setActive}
                  >
                    <CollapsibleTrigger
                      className="flex w-full items-center justify-between gap-2 px-3 py-1 text-left cn-touch-target hover:opacity-90"
                      style={{ color: cn.textSecondary }}
                    >
                      <span className="text-[10px] uppercase tracking-wider" style={{ opacity: 0.6 }}>
                        {t(`sidebar.section.${section.sectionKey}`)}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-none">
                      {sectionContent}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              );
            })}
          </nav>
        )}
      </aside>
    </>
  );
});
