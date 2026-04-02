import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { loadCustomLanguagesIntoI18n, getAllLanguages, setDiscoveredLanguages } from "./languageManager";

/**
 * CareNet i18n configuration — Auto-Discovery Edition
 *
 * Uses Vite's import.meta.glob to auto-discover all locale folders at build time.
 * Just run `npm run translate -- --lang=hi` and the new language appears automatically —
 * no manual imports, no code changes needed.
 *
 * Language detection priority:
 *   1. localStorage("carenet-lang")
 *   2. navigator.language (matches any discovered locale)
 *   3. Fallback to "en"
 *
 * Three language sources (merged at runtime):
 *   1. File-based (auto-discovered from src/locales/*)    — build-time, via import.meta.glob
 *   2. Admin-uploaded (stored in localStorage)             — runtime, via languageManager
 *   3. English fallback                                    — always present
 */

// ─── Auto-discover all locale JSON files at build time ───────────
// Vite resolves this at compile time — zero runtime cost.
// Pattern: src/locales/{lang}/{namespace}.json
const localeModules = import.meta.glob("@/locales/*/*.json", { eager: true }) as Record<
  string,
  { default: Record<string, unknown> }
>;

/** Known namespaces */
const NAMESPACES = ["common", "auth", "caregiver", "guardian"] as const;

/**
 * Parse all discovered locale modules into i18next resources.
 * Returns: { en: { common: {...}, auth: {...} }, bn: { common: {...} }, hi: { ... }, ... }
 */
function buildResources(): Record<string, Record<string, unknown>> {
  const resources: Record<string, Record<string, unknown>> = {};
  const discoveredLangs = new Set<string>();

  for (const [path, module] of Object.entries(localeModules)) {
    // Path format: /src/locales/{lang}/{namespace}.json
    const match = path.match(/\/locales\/([^/]+)\/([^/]+)\.json$/);
    if (!match) continue;

    const [, lang, namespace] = match;
    discoveredLangs.add(lang);

    if (!resources[lang]) resources[lang] = {};
    resources[lang][namespace] = module.default || module;
  }

  // Register discovered languages with the language manager
  setDiscoveredLanguages([...discoveredLangs]);

  return resources;
}

// ─── Language detection ──────────────────────────────────────────

const STORAGE_KEY = "carenet-lang";

function detectLanguage(availableLangs: string[]): string {
  // 1. Check localStorage
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && availableLangs.includes(stored)) return stored;

  // Also check admin-uploaded custom languages
  if (stored) {
    const allLangs = getAllLanguages();
    if (allLangs.some((l) => l.code === stored)) return stored;
  }

  // 2. Check browser language — match against all discovered locales
  const browserLang = navigator.language?.toLowerCase() || "";
  // Exact match first (e.g. "zh-tw" -> "zh-TW")
  const exactMatch = availableLangs.find((l) => l.toLowerCase() === browserLang);
  if (exactMatch) return exactMatch;
  // Prefix match (e.g. "bn-BD" -> "bn")
  const prefixMatch = availableLangs.find((l) => browserLang.startsWith(l.toLowerCase()));
  if (prefixMatch) return prefixMatch;

  // 3. Default to English
  return "en";
}

// ─── Initialize i18next ──────────────────────────────────────────

const resources = buildResources();
const discoveredLangs = Object.keys(resources);

// Register empty resource bundles for languages without locale folders,
// so i18next recognizes them and falls back to English.
const ALL_SUPPORTED_LANG_CODES = [
  "en", "bn", "hi", "ur", "ar", "es", "fr", "de", "pt", "ja", "ko", "zh", "zh-TW",
  "th", "vi", "id", "ms", "ta", "te", "mr", "gu", "kn", "ml", "pa", "ne", "si", "my",
  "ru", "tr", "it", "nl", "pl", "sv", "da", "no", "fi", "el", "he", "fa", "sw", "am", "zu",
];

for (const code of ALL_SUPPORTED_LANG_CODES) {
  if (!resources[code]) {
    resources[code] = {};
    for (const ns of NAMESPACES) {
      resources[code][ns] = {};
    }
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: detectLanguage(Object.keys(resources)),
  fallbackLng: "en",
  defaultNS: "common",
  ns: [...NAMESPACES],

  interpolation: {
    escapeValue: false,
  },

  react: {
    useSuspense: false,
  },
});

// Load any admin-uploaded custom languages into i18next
loadCustomLanguagesIntoI18n();

/**
 * Change language and persist to localStorage.
 * Accepts any language code (file-based or admin-uploaded).
 */
export function changeLanguage(lang: string) {
  localStorage.setItem(STORAGE_KEY, lang);
  void i18n.changeLanguage(lang);
  document.documentElement.lang = lang;
  // Set text direction for RTL languages
  const rtlLangs = ["ar", "he", "fa", "ur"];
  document.documentElement.dir = rtlLangs.includes(lang) ? "rtl" : "ltr";
}

/**
 * Get current language code.
 */
export function getCurrentLanguage(): string {
  return i18n.language || "en";
}

/**
 * Get all language codes currently loaded in i18next
 * (file-based + admin-uploaded).
 */
export function getLoadedLanguages(): string[] {
  return Object.keys(i18n.store.data);
}

export default i18n;
