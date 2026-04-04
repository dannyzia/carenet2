import { cn } from "@/frontend/theme/tokens";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "@/frontend/i18n";
import { getAllLanguages } from "@/frontend/i18n/languageManager";
import { Globe, ChevronDown } from "lucide-react";

interface LanguageSwitcherProps {
  /** "dropdown" (default) = select menu, "compact" = smaller select, "minimal" = globe icon with dropdown, "drawer" = full-width for narrow side panels */
  variant?: "dropdown" | "compact" | "minimal" | "drawer";
  className?: string;
}

/**
 * LanguageSwitcher — Dynamic dropdown supporting all built-in + admin-uploaded languages.
 * Persists preference to localStorage via changeLanguage().
 */
export function LanguageSwitcher({
  variant = "dropdown",
  className = "",
}: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation("common");
  const langLabel = t("language.selectLabel", "Interface language");
  const currentLang = i18n.language || "en";
  const languages = getAllLanguages();

  const handleChange = (code: string) => {
    changeLanguage(code);
  };

  if (variant === "drawer") {
    return (
      <div className={`relative flex w-full min-w-0 max-w-full items-stretch ${className}`}>
        <Globe className="pointer-events-none absolute left-2.5 top-1/2 z-[1] h-3.5 w-3.5 -translate-y-1/2" style={{ color: cn.green }} aria-hidden />
        <select
          value={currentLang}
          onChange={(e) => handleChange(e.target.value)}
          className="box-border min-h-[44px] w-full min-w-0 max-w-full cursor-pointer appearance-none rounded-lg border py-2 pl-8 pr-7 text-xs focus:outline-none"
          style={{
            borderColor: cn.border,
            color: cn.text,
            background: cn.bgCard,
          }}
          aria-label={langLabel}
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2" style={{ color: cn.textSecondary }} aria-hidden />
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className={`relative inline-flex items-center ${className}`}>
        <Globe className="w-4 h-4 absolute left-2 pointer-events-none" style={{ color: cn.textSecondary }} />
        <select
          value={currentLang}
          onChange={(e) => handleChange(e.target.value)}
          className="appearance-none bg-transparent pl-7 pr-6 py-2 rounded-lg text-xs cursor-pointer focus:outline-none cn-touch-target"
          style={{ color: cn.text }}
          aria-label={langLabel}
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3 h-3 absolute right-1.5 pointer-events-none" style={{ color: cn.textSecondary }} />
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`relative inline-flex items-center ${className}`}>
        <select
          value={currentLang}
          onChange={(e) => handleChange(e.target.value)}
          className="appearance-none px-2 pr-6 py-1.5 rounded-lg border text-xs cursor-pointer focus:outline-none cn-touch-target"
          style={{
            borderColor: cn.border,
            color: cn.text,
            background: cn.bgCard,
          }}
          aria-label={langLabel}
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3 h-3 absolute right-1.5 pointer-events-none" style={{ color: cn.textSecondary }} />
      </div>
    );
  }

  // Default: dropdown
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <Globe className="w-4 h-4 absolute left-3 pointer-events-none" style={{ color: cn.green }} />
      <select
        value={currentLang}
        onChange={(e) => handleChange(e.target.value)}
        className="appearance-none pl-9 pr-8 py-2.5 rounded-xl border text-sm cursor-pointer focus:outline-none cn-touch-target"
        style={{
          borderColor: cn.border,
          color: cn.text,
          background: cn.bgCard,
          minWidth: "140px",
        }}
        aria-label={langLabel}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name} ({lang.nativeName})
          </option>
        ))}
      </select>
      <ChevronDown className="w-4 h-4 absolute right-2.5 pointer-events-none" style={{ color: cn.textSecondary }} />
    </div>
  );
}