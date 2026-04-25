import i18n from "i18next";

/**
 * CareNet Dynamic Language Manager — Auto-Discovery Edition
 *
 * Language sources (all merged into one getAllLanguages() list):
 *   1. File-based  — auto-discovered from src/locales/* by import.meta.glob (set by i18n/index.ts)
 *   2. Admin-uploaded — stored in localStorage, loaded on init
 *
 * The LanguageSwitcher and all UI components call getAllLanguages() to get
 * the full list of available languages, regardless of source.
 */

const LANGS_META_KEY = "carenet-custom-langs";
const LANG_DATA_PREFIX = "carenet-lang-";
const ACTIVE_LANG_KEY = "carenet-lang";

export interface LanguageMeta {
  code: string;        // e.g. "hi", "ur", "my"
  name: string;        // Native name, e.g. "हिन्दी"
  nativeName: string;  // English name, e.g. "Hindi"
  addedAt: string;     // ISO date
  addedBy?: string;    // admin name (for custom uploads)
  namespaces: string[];
  source: "file" | "custom"; // where the language came from
}

/** All namespaces the system uses */
export const ALL_NAMESPACES = ["common", "auth", "caregiver", "guardian"] as const;

/**
 * Native name + English name map for auto-discovered languages.
 * The translate script generates locale folders; this map gives them display names.
 * Add entries here when adding new languages to the translate script.
 */
const LANGUAGE_DISPLAY_NAMES: Record<string, { name: string; nativeName: string }> = {
  en:      { name: "English",     nativeName: "English" },
  bn:      { name: "বাংলা",       nativeName: "Bangla" },
  hi:      { name: "हिन्दी",       nativeName: "Hindi" },
  ur:      { name: "اردو",        nativeName: "Urdu" },
  ar:      { name: "العربية",      nativeName: "Arabic" },
  es:      { name: "Español",     nativeName: "Spanish" },
  fr:      { name: "Français",    nativeName: "French" },
  de:      { name: "Deutsch",     nativeName: "German" },
  pt:      { name: "Português",   nativeName: "Portuguese" },
  ja:      { name: "日本語",       nativeName: "Japanese" },
  ko:      { name: "한국어",       nativeName: "Korean" },
  zh:      { name: "中文",         nativeName: "Chinese (Simplified)" },
  "zh-TW": { name: "繁體中文",     nativeName: "Chinese (Traditional)" },
  th:      { name: "ไทย",         nativeName: "Thai" },
  vi:      { name: "Tiếng Việt",  nativeName: "Vietnamese" },
  id:      { name: "Indonesia",   nativeName: "Indonesian" },
  ms:      { name: "Melayu",      nativeName: "Malay" },
  ta:      { name: "தமிழ்",       nativeName: "Tamil" },
  te:      { name: "తెలుగు",      nativeName: "Telugu" },
  mr:      { name: "मराठी",       nativeName: "Marathi" },
  gu:      { name: "ગુજરાતી",    nativeName: "Gujarati" },
  kn:      { name: "ಕನ್ನಡ",      nativeName: "Kannada" },
  ml:      { name: "മലയാളം",     nativeName: "Malayalam" },
  pa:      { name: "ਪੰਜਾਬੀ",     nativeName: "Punjabi" },
  ne:      { name: "नेपाली",      nativeName: "Nepali" },
  si:      { name: "සිංහල",      nativeName: "Sinhala" },
  my:      { name: "မြန်မာ",      nativeName: "Myanmar (Burmese)" },
  ru:      { name: "Русский",     nativeName: "Russian" },
  tr:      { name: "Türkçe",      nativeName: "Turkish" },
  it:      { name: "Italiano",    nativeName: "Italian" },
  nl:      { name: "Nederlands",  nativeName: "Dutch" },
  pl:      { name: "Polski",      nativeName: "Polish" },
  sv:      { name: "Svenska",     nativeName: "Swedish" },
  da:      { name: "Dansk",       nativeName: "Danish" },
  no:      { name: "Norsk",       nativeName: "Norwegian" },
  fi:      { name: "Suomi",       nativeName: "Finnish" },
  el:      { name: "Ελληνικά",    nativeName: "Greek" },
  he:      { name: "עברית",       nativeName: "Hebrew" },
  fa:      { name: "فارسی",       nativeName: "Persian (Farsi)" },
  sw:      { name: "Kiswahili",   nativeName: "Swahili" },
  am:      { name: "አማርኛ",       nativeName: "Amharic" },
  zu:      { name: "isiZulu",     nativeName: "Zulu" },
};

// ─── File-based (auto-discovered) languages ──────────────────────

/** Set by i18n/index.ts after import.meta.glob discovery */
let discoveredLangCodes: string[] = [];

/**
 * Called by i18n/index.ts to register which language folders were discovered.
 */
export function setDiscoveredLanguages(codes: string[]) {
  discoveredLangCodes = codes;
}

/**
 * Get file-based languages (auto-discovered from src/locales/*).
 */
export function getFileBasedLanguages(): LanguageMeta[] {
  // Only show en + bn in the language switcher — these have committed, reviewed translations.
  // Admin-uploaded custom languages are handled separately via getCustomLanguages().
  const uiLanguageCodes = new Set(["en", "bn"]);

  return discoveredLangCodes
    .filter((code) => uiLanguageCodes.has(code))
    .map((code) => {
      const display = LANGUAGE_DISPLAY_NAMES[code] || { name: code, nativeName: code };
      return {
        code,
        name: display.name,
        nativeName: display.nativeName,
        addedAt: "2024-01-01",
        namespaces: [...ALL_NAMESPACES],
        source: "file" as const,
      };
    });
}

// ─── Admin-uploaded (custom) languages ───────────────────────────

/**
 * Get all custom language metadata from localStorage.
 */
export function getCustomLanguages(): LanguageMeta[] {
  try {
    const raw = localStorage.getItem(LANGS_META_KEY);
    const langs = raw ? JSON.parse(raw) : [];
    return langs.map((l: any) => ({ ...l, source: "custom" }));
  } catch {
    return [];
  }
}

/**
 * Get ALL available languages (file-based + admin-uploaded).
 * Deduplicates by code — file-based takes precedence over custom.
 */
export function getAllLanguages(): LanguageMeta[] {
  const fileBased = getFileBasedLanguages();
  const custom = getCustomLanguages();

  // Merge: file-based first, then custom languages not already in file-based
  const seen = new Set(fileBased.map((l) => l.code));
  const merged = [...fileBased];
  for (const lang of custom) {
    if (!seen.has(lang.code)) {
      merged.push(lang);
      seen.add(lang.code);
    }
  }

  return merged;
}

/**
 * Get translation data for a custom language.
 */
export function getCustomLanguageData(code: string): Record<string, any> | null {
  try {
    const raw = localStorage.getItem(LANG_DATA_PREFIX + code);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Add or update a custom language.
 * Called by admin after uploading translation JSON.
 */
export function addCustomLanguage(
  meta: Omit<LanguageMeta, "addedAt" | "namespaces" | "source">,
  translations: Record<string, any>
): { success: boolean; error?: string } {
  // Validate
  if (!meta.code || meta.code.length < 2 || meta.code.length > 5) {
    return { success: false, error: "Language code must be 2-5 characters (e.g. 'hi', 'ur', 'zh-CN')" };
  }
  if (!meta.name || !meta.nativeName) {
    return { success: false, error: "Language name and native name are required" };
  }

  // Determine which namespaces are present
  const namespaces = ALL_NAMESPACES.filter((ns) => translations[ns] && Object.keys(translations[ns]).length > 0);
  if (namespaces.length === 0) {
    return { success: false, error: "Translation file must contain at least one namespace (common, auth, caregiver, guardian)" };
  }

  // Save translation data
  localStorage.setItem(LANG_DATA_PREFIX + meta.code, JSON.stringify(translations));

  // Update metadata
  const existing = getCustomLanguages();
  const idx = existing.findIndex((l) => l.code === meta.code);
  const langMeta: LanguageMeta = {
    ...meta,
    addedAt: new Date().toISOString(),
    namespaces,
    source: "custom",
  };
  if (idx >= 0) {
    existing[idx] = langMeta;
  } else {
    existing.push(langMeta);
  }
  localStorage.setItem(LANGS_META_KEY, JSON.stringify(existing));

  // Register with i18next
  registerLanguageWithI18n(meta.code, translations);

  return { success: true };
}

/**
 * Remove a custom language.
 */
export function removeCustomLanguage(code: string): boolean {
  // Don't allow removing file-based languages
  if (discoveredLangCodes.includes(code)) return false;

  const existing = getCustomLanguages().filter((l) => l.code !== code);
  localStorage.setItem(LANGS_META_KEY, JSON.stringify(existing));
  localStorage.removeItem(LANG_DATA_PREFIX + code);

  // If this was the active language, switch to English
  if (i18n.language === code) {
    i18n.changeLanguage("en");
    localStorage.setItem(ACTIVE_LANG_KEY, "en");
  }

  return true;
}

/**
 * Register a language's translations with i18next at runtime.
 */
export function registerLanguageWithI18n(code: string, translations: Record<string, any>) {
  for (const ns of ALL_NAMESPACES) {
    if (translations[ns]) {
      i18n.addResourceBundle(code, ns, translations[ns], true, true);
    }
  }
}

/**
 * Load all custom languages into i18next on app startup.
 * Called once from i18n/index.ts.
 */
export function loadCustomLanguagesIntoI18n() {
  const customs = getCustomLanguages();
  for (const lang of customs) {
    const data = getCustomLanguageData(lang.code);
    if (data) {
      registerLanguageWithI18n(lang.code, data);
    }
  }
}

/**
 * Generate a translation template JSON for admins to download.
 * Uses English as the source — values are kept so translators can see what to translate.
 */
export function generateTranslationTemplate(): Record<string, any> {
  const template: Record<string, any> = {};
  for (const ns of ALL_NAMESPACES) {
    const enBundle = i18n.getResourceBundle("en", ns);
    if (enBundle) {
      template[ns] = enBundle;
    }
  }
  return template;
}

/**
 * Validate an uploaded translation file.
 * Returns { valid, errors, namespacesCovered, totalKeys, translatedKeys }.
 */
export function validateTranslationFile(data: any): {
  valid: boolean;
  errors: string[];
  namespacesCovered: string[];
  totalKeys: number;
  translatedKeys: number;
} {
  const errors: string[] = [];
  let totalKeys = 0;
  let translatedKeys = 0;
  const namespacesCovered: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["File must be a JSON object"], namespacesCovered: [], totalKeys: 0, translatedKeys: 0 };
  }

  for (const ns of ALL_NAMESPACES) {
    if (!data[ns]) continue;
    if (typeof data[ns] !== "object") {
      errors.push(`Namespace "${ns}" must be an object`);
      continue;
    }
    namespacesCovered.push(ns);

    // Count keys recursively
    const countKeys = (obj: any, enObj: any) => {
      for (const key of Object.keys(enObj || {})) {
        if (typeof enObj[key] === "object" && enObj[key] !== null) {
          countKeys(obj?.[key], enObj[key]);
        } else {
          totalKeys++;
          if (obj?.[key] && typeof obj[key] === "string" && obj[key].trim().length > 0) {
            translatedKeys++;
          }
        }
      }
    };

    const enBundle = i18n.getResourceBundle("en", ns);
    countKeys(data[ns], enBundle);
  }

  if (namespacesCovered.length === 0) {
    errors.push("No valid namespaces found. File must contain at least one of: " + ALL_NAMESPACES.join(", "));
  }

  return {
    valid: errors.length === 0 && namespacesCovered.length > 0,
    errors,
    namespacesCovered,
    totalKeys,
    translatedKeys,
  };
}

/**
 * Get display name info for a language code.
 * Useful for UI components that need native/English names.
 */
export function getLanguageDisplayName(code: string): { name: string; nativeName: string } {
  return LANGUAGE_DISPLAY_NAMES[code] || { name: code, nativeName: code };
}

/**
 * @deprecated Use getFileBasedLanguages() instead.
 * Kept for backward compatibility with AdminLanguageManagementPage.
 */
export const BUILT_IN_LANGUAGES: LanguageMeta[] = [
  { code: "en", name: "English", nativeName: "English", addedAt: "2024-01-01", namespaces: [...ALL_NAMESPACES], source: "file" },
  { code: "bn", name: "বাংলা", nativeName: "Bangla", addedAt: "2024-01-01", namespaces: [...ALL_NAMESPACES], source: "file" },
];