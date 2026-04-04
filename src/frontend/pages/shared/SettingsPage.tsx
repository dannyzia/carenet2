import { User, Lock, Bell, Eye, HelpCircle, LogOut, ChevronRight, Shield, Globe, Palette, Database, Sun, Moon, Monitor, FileText } from "lucide-react";
import { Link } from "react-router";
import { useTheme } from "@/frontend/components/shared/ThemeProvider";
import { cn } from "@/frontend/theme/tokens";
import { useDocumentTitle } from "@/frontend/hooks";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/frontend/components/shared/LanguageSwitcher";
import { useAuth } from "@/frontend/auth/AuthContext";
import { useTransitionNavigate } from "@/frontend/hooks/useTransitionNavigate";
import { RefreshCw } from "lucide-react";
import { NotificationPreferences } from "@/frontend/components/shared/NotificationPreferences";
import { useState } from "react";

export default function SettingsPage() {
  const { t } = useTranslation("common");
  useDocumentTitle(t("pageTitles.settings", "Settings"));
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useTransitionNavigate();
  const [showNotifPrefs, setShowNotifPrefs] = useState(false);
  const handleLogout = () => { logout(); navigate("/auth/login", { replace: true }); };

  const settingsGroups = [
    { title: "Account & Profile", items: [
      { label: "Profile Information", icon: User, desc: "Change your name, email, and profile photo.", color: "text-blue-500", bg: "bg-blue-50" },
      { label: "Security & Password", icon: Lock, desc: "Update your password and manage sessions.", color: "text-purple-500", bg: "bg-purple-50" },
      { label: "Two-Factor Auth", icon: Shield, desc: "Enable additional security for your account.", color: "text-green-500", bg: "bg-green-50" },
    ]},
    { title: "App Preferences", items: [
      { label: "Notifications", icon: Bell, desc: "Manage how and when you receive alerts.", color: "text-orange-500", bg: "bg-orange-50" },
      { label: "Privacy Settings", icon: Eye, desc: "Control who can see your information.", color: "text-indigo-500", bg: "bg-indigo-50" },
      { label: "Language & Region", icon: Globe, desc: "Select your preferred language and location.", color: "text-sky-500", bg: "bg-sky-50" },
      { label: "Theme Customization", icon: Palette, desc: "Switch between light, dark, and custom themes.", color: "text-pink-500", bg: "bg-pink-50" },
    ]},
    { title: "Support & Legal", items: [
      { label: "Help & Support", icon: HelpCircle, desc: "Get help from our customer support team.", color: "text-gray-500", bg: "bg-gray-100" },
      { label: "Data Usage", icon: Database, desc: "Request your data or manage data privacy.", color: "text-gray-500", bg: "bg-gray-100" },
      { label: "Privacy Policy", icon: Shield, desc: "Read our privacy policy.", color: "text-gray-500", bg: "bg-gray-100", path: "/privacy" },
      { label: "Terms of Service", icon: FileText, desc: "Read our terms of service.", color: "text-gray-500", bg: "bg-gray-100", path: "/terms" },
    ]},
  ];

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div><h1 className="text-2xl font-bold text-gray-800">Settings</h1><p className="text-gray-500">Manage your account preferences and app configurations.</p></div>
        {settingsGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-4">
            <h2 className="text-xs uppercase tracking-widest pl-1" style={{ color: cn.textSecondary }}>{group.title}</h2>
            <div className="finance-card overflow-hidden">
              <div className="divide-y" style={{ borderColor: cn.borderLight }}>
                {group.items.map((item, iIdx) => {
                  const hasPath = item.path;
                  const itemClick = item.label === "Notifications" ? () => setShowNotifPrefs(!showNotifPrefs) : undefined;
                  return hasPath ? (
                    <Link key={iIdx} to={item.path} className="p-4 flex items-center justify-between hover:opacity-90 transition-all cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.bg} ${item.color}`}><item.icon className="w-5 h-5" /></div>
                        <div><h3 className="text-sm" style={{ color: cn.text }}>{item.label}</h3><p className="text-xs" style={{ color: cn.textSecondary }}>{item.desc}</p></div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
                    </Link>
                  ) : (
                    <div key={iIdx} className="p-4 flex items-center justify-between hover:opacity-90 transition-all cursor-pointer group" onClick={itemClick}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.bg} ${item.color}`}><item.icon className="w-5 h-5" /></div>
                        <div><h3 className="text-sm" style={{ color: cn.text }}>{item.label}</h3><p className="text-xs" style={{ color: cn.textSecondary }}>{item.desc}</p></div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
        {showNotifPrefs && (<div className="space-y-4"><h2 className="text-xs uppercase tracking-widest pl-1" style={{ color: cn.textSecondary }}>Notification Preferences</h2><div className="finance-card p-5"><NotificationPreferences inline /></div></div>)}
        <div className="space-y-4">
          <h2 className="text-xs uppercase tracking-widest pl-1" style={{ color: cn.textSecondary }}>Theme</h2>
          <div className="finance-card p-4">
            <div className="flex gap-3">
              {([{ key: "light" as const, label: "Light", icon: Sun }, { key: "dark" as const, label: "Dark", icon: Moon }, { key: "system" as const, label: "System", icon: Monitor }]).map(opt => {
                const Icon = opt.icon; const isActive = theme === opt.key;
                return (<button key={opt.key} onClick={() => setTheme(opt.key)} className="flex-1 flex flex-col items-center gap-2 py-3 rounded-xl transition-all" style={{ background: isActive ? cn.pinkBg : "transparent", color: isActive ? cn.pink : cn.textSecondary, border: isActive ? `2px solid ${cn.pink}` : `2px solid transparent` }}><Icon className="w-5 h-5" /><span className="text-xs">{opt.label}</span></button>);
              })}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-xs uppercase tracking-widest pl-1" style={{ color: cn.textSecondary }}>Language / ভাষা</h2>
          <div className="finance-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><Globe className="w-5 h-5" style={{ color: cn.green }} /><div><p className="text-sm" style={{ color: cn.text }}>Display Language</p><p className="text-xs" style={{ color: cn.textSecondary }}>Choose your preferred language</p></div></div>
              <LanguageSwitcher variant="dropdown" />
            </div>
          </div>
        </div>
        {user && user.roles.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs uppercase tracking-widest pl-1" style={{ color: cn.textSecondary }}>Active Role</h2>
            <div className="finance-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><RefreshCw className="w-5 h-5" style={{ color: cn.pink }} /><div><p className="text-sm" style={{ color: cn.text }}>Current: <strong>{user.activeRole.charAt(0).toUpperCase() + user.activeRole.slice(1)}</strong></p><p className="text-xs" style={{ color: cn.textSecondary }}>{user.roles.length > 1 ? `You have ${user.roles.length} roles` : "Single role account"}</p></div></div>
                <button onClick={() => navigate("/auth/role-selection")} className="px-3 py-2 rounded-xl text-sm border cn-touch-target" style={{ borderColor: cn.pink, color: cn.pink }}>Switch Role</button>
              </div>
            </div>
          </div>
        )}
        <div className="p-4 rounded-2xl flex items-center justify-between" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white text-red-500 flex items-center justify-center shadow-sm"><LogOut className="w-5 h-5" /></div>
            <div><h3 className="text-sm font-bold text-red-600">Logout</h3><p className="text-xs text-red-400">Sign out of your account on this device.</p></div>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 rounded-xl bg-white text-red-500 text-xs font-bold shadow-sm border border-red-100 hover:bg-red-50 transition-all cn-touch-target">Confirm Logout</button>
        </div>
      </div>
    </>
  );
}