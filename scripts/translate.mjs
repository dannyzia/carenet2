#!/usr/bin/env node
/**
 * CareNet Auto-Translation Script
 * ================================
 * Translates all English i18n JSON files to any language Google Translate supports.
 * Uses the FREE google-translate-api-x package (no API key needed).
 *
 * Usage:
 *   node scripts/translate.mjs                          # Translate to ALL configured languages
 *   node scripts/translate.mjs --lang=bn                # Translate to Bengali only
 *   node scripts/translate.mjs --lang=hi,ar,es          # Translate to multiple languages
 *   node scripts/translate.mjs --lang=bn --force        # Overwrite existing translations
 *   node scripts/translate.mjs --lang=bn --fill-identical --key-prefix=sidebar.  # Retranslate keys still equal to English (sync placeholders)
 *   node scripts/translate.mjs --fill-identical --key-prefix=sidebar. --key-prefix=roles.  # Multiple prefixes; omit --lang for all targets
 *   node scripts/translate.mjs --lang=bn --dry          # Preview without writing files
 *   node scripts/translate.mjs --list                   # List all supported languages
 *   node scripts/translate.mjs --verify --lang=bn       # Verify Bengali translations against Google
 *   node scripts/translate.mjs --verify                 # Verify ALL existing translations
 *   node scripts/translate.mjs --verify --threshold=60  # Flag translations with <60% similarity
 *
 * How it works:
 *   1. Reads all JSON files from src/locales/en/
 *   2. For each target language, reads existing translations (if any)
 *   3. Only translates MISSING keys (preserves your human-curated translations)
 *   4. Preserves i18next {{interpolation}} tokens
 *   5. Writes translated JSON to src/locales/{lang}/
 *
 * Verify mode:
 *   - Re-translates all English keys via Google Translate
 *   - Compares against your existing translations
 *   - Flags translations with low similarity (potential errors)
 *   - Generates a verification report
 *
 * Rate limiting:
 *   - Batches translations with delays to avoid Google's rate limits
 *   - For ~200 keys, takes about 30-60 seconds per language
 *
 * FREE: No API key, no billing, no limits for small batches like UI labels.
 */

import { translate } from "google-translate-api-x";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, basename } from "node:path";
import { existsSync } from "node:fs";

// ─── Configuration ───────────────────────────────────────────────

const LOCALES_DIR = join(process.cwd(), "src", "locales");
const SOURCE_LANG = "en";

/**
 * Target languages to translate to.
 * Add any Google Translate language code here!
 * Full list: https://cloud.google.com/translate/docs/languages
 */
const TARGET_LANGUAGES = {
  bn: "Bengali (Bangla)",
  hi: "Hindi",
  ur: "Urdu",
  ar: "Arabic",
  es: "Spanish",
  fr: "French",
  de: "German",
  pt: "Portuguese",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese (Simplified)",
  "zh-TW": "Chinese (Traditional)",
  th: "Thai",
  vi: "Vietnamese",
  id: "Indonesian",
  ms: "Malay",
  ta: "Tamil",
  te: "Telugu",
  mr: "Marathi",
  gu: "Gujarati",
  kn: "Kannada",
  ml: "Malayalam",
  pa: "Punjabi",
  ne: "Nepali",
  si: "Sinhala",
  my: "Myanmar (Burmese)",
  ru: "Russian",
  tr: "Turkish",
  it: "Italian",
  nl: "Dutch",
  pl: "Polish",
  sv: "Swedish",
  da: "Danish",
  no: "Norwegian",
  fi: "Finnish",
  el: "Greek",
  he: "Hebrew",
  fa: "Persian (Farsi)",
  sw: "Swahili",
  am: "Amharic",
  zu: "Zulu",
};

// Batch size & delay to respect rate limits
const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1500;

// ─── Helpers ─────────────────────────────────────────────────────

/** Flatten nested JSON: { a: { b: "hi" } } -> { "a.b": "hi" } */
function flattenJson(obj, prefix = "") {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenJson(value, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

/** Unflatten dot-notation keys back to nested JSON */
function unflattenJson(flat) {
  const result = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split(".");
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in current)) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
}

/**
 * Protect i18next interpolation tokens from translation.
 * Replaces {{name}} with numbered placeholders, translates, then restores.
 */
function protectTokens(text) {
  const tokens = [];
  const protected_ = text.replace(/\{\{(\w+)\}\}/g, (match) => {
    tokens.push(match);
    return `__PLACEHOLDER_${tokens.length - 1}__`;
  });
  return { protected: protected_, tokens };
}

function restoreTokens(text, tokens) {
  let result = text;
  for (let i = 0; i < tokens.length; i++) {
    // Handle various ways Google might mangle the placeholder
    const patterns = [
      `__PLACEHOLDER_${i}__`,
      `__placeholder_${i}__`,
      `__ PLACEHOLDER_${i} __`,
      `__ placeholder_${i} __`,
      `__PLACEHOLDER _${i}__`,
      `__ PLACEHOLDER _ ${i} __`,
      `__Placeholder_${i}__`,
      `__ Placeholder_${i} __`,
    ];
    for (const pattern of patterns) {
      result = result.replaceAll(pattern, tokens[i]);
    }
  }
  return result;
}

/** Sleep helper */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Colorful console output */
const C = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  magenta: "\x1b[35m",
};

function log(color, symbol, msg) {
  console.log(`${C[color]}${symbol}${C.reset} ${msg}`);
}

/**
 * Calculate similarity between two strings (Dice coefficient on bigrams).
 * Returns 0-100 percentage.
 */
function similarity(a, b) {
  if (a === b) return 100;
  if (!a || !b) return 0;
  const aNorm = a.toLowerCase().trim();
  const bNorm = b.toLowerCase().trim();
  if (aNorm === bNorm) return 100;

  const bigrams = (str) => {
    const set = new Map();
    for (let i = 0; i < str.length - 1; i++) {
      const bi = str.substring(i, i + 2);
      set.set(bi, (set.get(bi) || 0) + 1);
    }
    return set;
  };

  const aBi = bigrams(aNorm);
  const bBi = bigrams(bNorm);
  let intersection = 0;
  for (const [bi, count] of aBi) {
    intersection += Math.min(count, bBi.get(bi) || 0);
  }
  const aSize = aNorm.length - 1;
  const bSize = bNorm.length - 1;
  if (aSize + bSize === 0) return 100;
  return Math.round((2 * intersection) / (aSize + bSize) * 100);
}

// ─── Parse CLI args ──────────────────────────────────────────────

const args = process.argv.slice(2);
const flagForce = args.includes("--force");
/** When set, re-translate keys whose value still exactly matches English (e.g. i18n:sync placeholders). */
const flagFillIdentical = args.includes("--fill-identical");
const keyPrefixes = args
  .filter((a) => a.startsWith("--key-prefix="))
  .map((a) => a.replace("--key-prefix=", ""));
const flagDry = args.includes("--dry");
const flagList = args.includes("--list");
const flagVerify = args.includes("--verify");
const langArg = args.find((a) => a.startsWith("--lang="));
const thresholdArg = args.find((a) => a.startsWith("--threshold="));
const requestedLangs = langArg
  ? langArg.replace("--lang=", "").split(",").map((l) => l.trim())
  : null;
const verifyThreshold = thresholdArg ? parseInt(thresholdArg.replace("--threshold=", ""), 10) : 50;

// ─── List supported languages ────────────────────────────────────

if (flagList) {
  console.log(`\n${C.bold}${C.cyan}Supported Languages${C.reset}\n`);
  console.log(`${C.dim}Code    Language${C.reset}`);
  console.log(`${C.dim}${"─".repeat(40)}${C.reset}`);
  for (const [code, name] of Object.entries(TARGET_LANGUAGES)) {
    const existing = existsSync(join(LOCALES_DIR, code));
    const marker = existing ? `${C.green} (exists)${C.reset}` : "";
    console.log(`  ${C.cyan}${code.padEnd(8)}${C.reset}${name}${marker}`);
  }
  console.log(`\n${C.dim}Add any Google Translate language code to TARGET_LANGUAGES in this script.${C.reset}`);
  console.log(`${C.dim}Full list: https://cloud.google.com/translate/docs/languages${C.reset}\n`);
  process.exit(0);
}

// ─── Verify mode ─────────────────────────────────────────────────

async function runVerify() {
  console.log(`\n${C.bold}${C.magenta}CareNet Translation Verifier${C.reset}`);
  console.log(`${C.dim}Compares existing translations against Google Translate${C.reset}`);
  console.log(`${C.dim}Similarity threshold: ${verifyThreshold}% (flag with --threshold=N)${C.reset}\n`);

  const enDir = join(LOCALES_DIR, SOURCE_LANG);
  const files = (await readdir(enDir)).filter((f) => f.endsWith(".json"));

  // Determine which languages to verify
  let langsToVerify;
  if (requestedLangs) {
    langsToVerify = requestedLangs.filter((l) => l !== SOURCE_LANG);
  } else {
    // Auto-detect: verify all existing locale folders except English
    const allDirs = await readdir(LOCALES_DIR);
    langsToVerify = allDirs.filter(
      (d) => d !== SOURCE_LANG && existsSync(join(LOCALES_DIR, d))
    );
  }

  if (langsToVerify.length === 0) {
    log("red", "x", "No languages to verify. Generate translations first.");
    process.exit(1);
  }

  log("blue", "i", `Verifying: ${langsToVerify.join(", ")}`);
  log("blue", "i", `Threshold: ${verifyThreshold}% — translations below this will be flagged\n`);

  const allIssues = [];

  for (const lang of langsToVerify) {
    const langName = TARGET_LANGUAGES[lang] || lang;
    console.log(`${C.bold}${C.magenta}--- ${langName} (${lang}) ---${C.reset}`);

    const langDir = join(LOCALES_DIR, lang);
    if (!existsSync(langDir)) {
      log("yellow", "!", `No translations found for ${lang}, skipping`);
      continue;
    }

    let langIssues = [];

    for (const file of files) {
      const namespace = basename(file, ".json");
      const enPath = join(enDir, file);
      const targetPath = join(langDir, file);

      if (!existsSync(targetPath)) {
        log("yellow", "!", `${namespace}.json — missing, skipping`);
        continue;
      }

      const enContent = JSON.parse(await readFile(enPath, "utf-8"));
      const enFlat = flattenJson(enContent);
      const existingContent = JSON.parse(await readFile(targetPath, "utf-8"));
      const existingFlat = flattenJson(existingContent);

      // Get keys that have existing translations
      const keysToVerify = Object.entries(enFlat).filter(([key]) => key in existingFlat);

      if (keysToVerify.length === 0) {
        log("dim", " ", `${namespace}.json — no existing translations to verify`);
        continue;
      }

      log("cyan", ">", `${namespace}.json — verifying ${keysToVerify.length} keys`);

      // Translate English via Google in batches and compare
      const batches = [];
      for (let i = 0; i < keysToVerify.length; i += BATCH_SIZE) {
        batches.push(keysToVerify.slice(i, i + BATCH_SIZE));
      }

      for (let bIdx = 0; bIdx < batches.length; bIdx++) {
        const batch = batches[bIdx];

        try {
          const protectedBatch = batch.map(([key, value]) => {
            const { protected: p, tokens } = protectTokens(String(value));
            return { key, original: value, protected: p, tokens };
          });

          const textsToTranslate = protectedBatch.map((b) => b.protected);
          const results = await translate(textsToTranslate, {
            from: SOURCE_LANG,
            to: lang,
          });

          const resultArray = Array.isArray(results) ? results : [results];
          for (let i = 0; i < protectedBatch.length; i++) {
            const { key, tokens } = protectedBatch[i];
            const googleTranslation = restoreTokens(resultArray[i]?.text || "", tokens);
            const existingTranslation = existingFlat[key];
            const sim = similarity(googleTranslation, String(existingTranslation));

            if (sim < verifyThreshold) {
              langIssues.push({
                file: namespace,
                key,
                english: protectedBatch[i].original,
                existing: existingTranslation,
                google: googleTranslation,
                similarity: sim,
              });
            }
          }

          const progress = Math.round(((bIdx + 1) / batches.length) * 100);
          process.stdout.write(`\r  ${C.dim}  Progress: ${progress}%${C.reset}`);

          if (bIdx < batches.length - 1) await sleep(BATCH_DELAY_MS);
        } catch (err) {
          log("red", "x", `\n  Batch ${bIdx + 1} failed: ${err.message}`);
        }
      }

      console.log(); // newline after progress
    }

    // Report issues for this language
    if (langIssues.length === 0) {
      log("green", "✓", `All translations look good! (above ${verifyThreshold}% similarity)\n`);
    } else {
      log("yellow", "!", `${langIssues.length} translations flagged (below ${verifyThreshold}% similarity):\n`);

      for (const issue of langIssues) {
        console.log(`  ${C.dim}${issue.file}.${issue.key}${C.reset}`);
        console.log(`    ${C.blue}EN:${C.reset}       ${issue.english}`);
        console.log(`    ${C.yellow}Existing:${C.reset} ${issue.existing}`);
        console.log(`    ${C.green}Google:${C.reset}   ${issue.google}`);
        console.log(`    ${C.red}Match:${C.reset}    ${issue.similarity}%`);
        console.log();
      }

      allIssues.push(...langIssues.map((i) => ({ lang, ...i })));
    }
  }

  // Write verification report
  if (allIssues.length > 0) {
    const reportPath = join(process.cwd(), "translation-verify-report.json");
    const report = {
      generatedAt: new Date().toISOString(),
      threshold: verifyThreshold,
      totalIssues: allIssues.length,
      issues: allIssues,
    };
    await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n", "utf-8");
    log("blue", "i", `Report written to translation-verify-report.json`);
  }

  // Summary
  console.log(`\n${C.bold}${C.magenta}Verification Complete${C.reset}`);
  log(allIssues.length === 0 ? "green" : "yellow", allIssues.length === 0 ? "✓" : "!", `${allIssues.length} translations flagged across all languages`);
  console.log();
}

// ─── Main (Translate mode) ───────────────────────────────────────

async function main() {
  console.log(`\n${C.bold}${C.cyan}CareNet Translation Generator${C.reset}`);
  console.log(`${C.dim}Free Google Translate | No API Key Required${C.reset}\n`);

  // 1. Read all English source files
  const enDir = join(LOCALES_DIR, SOURCE_LANG);
  const files = (await readdir(enDir)).filter((f) => f.endsWith(".json"));

  if (files.length === 0) {
    log("red", "x", `No JSON files found in ${enDir}`);
    process.exit(1);
  }

  log("blue", "i", `Found ${files.length} source files: ${files.join(", ")}`);

  // 2. Determine target languages
  const langs = requestedLangs || Object.keys(TARGET_LANGUAGES);
  const validLangs = langs.filter((l) => {
    if (l === SOURCE_LANG) {
      log("yellow", "!", `Skipping source language: ${l}`);
      return false;
    }
    return true;
  });

  if (validLangs.length === 0) {
    log("red", "x", "No target languages specified.");
    process.exit(1);
  }

  log("blue", "i", `Translating to: ${validLangs.map((l) => `${l} (${TARGET_LANGUAGES[l] || l})`).join(", ")}`);
  if (flagForce) log("yellow", "!", "Force mode: will OVERWRITE existing translations");
  if (flagFillIdentical) {
    log(
      "yellow",
      "!",
      keyPrefixes.length
        ? `Fill-identical mode: keys under ${keyPrefixes.map((p) => `"${p}"`).join(", ")} that still match English will be re-translated`
        : "Fill-identical mode: any key whose value still exactly matches English will be re-translated"
    );
  }
  if (flagDry) log("yellow", "!", "Dry run: will NOT write any files");

  console.log();

  // 3. Process each language
  let totalTranslated = 0;
  let totalSkipped = 0;

  for (const lang of validLangs) {
    const langName = TARGET_LANGUAGES[lang] || lang;
    console.log(`${C.bold}${C.green}--- ${langName} (${lang}) ---${C.reset}`);

    const langDir = join(LOCALES_DIR, lang);
    if (!existsSync(langDir)) {
      if (!flagDry) await mkdir(langDir, { recursive: true });
      log("green", "+", `Created directory: src/locales/${lang}/`);
    }

    for (const file of files) {
      const namespace = basename(file, ".json");
      const enPath = join(enDir, file);
      const targetPath = join(langDir, file);

      // Read English source
      const enContent = JSON.parse(await readFile(enPath, "utf-8"));
      const enFlat = flattenJson(enContent);

      // Read existing translations (if any)
      let existingFlat = {};
      if (existsSync(targetPath)) {
        try {
          const existingContent = JSON.parse(await readFile(targetPath, "utf-8"));
          existingFlat = flattenJson(existingContent);
        } catch {
          log("yellow", "!", `Could not parse existing ${lang}/${file}, will regenerate`);
        }
      }

      function keyMatchesPrefix(key) {
        if (keyPrefixes.length === 0) return true;
        return keyPrefixes.some((p) => key.startsWith(p));
      }

      // Find keys that need translation
      const keysToTranslate = Object.entries(enFlat).filter(([key, enValue]) => {
        if (!keyMatchesPrefix(key)) return false;
        if (flagForce) return true;
        if (!(key in existingFlat)) return true;
        if (flagFillIdentical) {
          const ex = existingFlat[key];
          const enStr = String(enValue).trim();
          const exStr = String(ex).trim();
          return enStr !== "" && exStr === enStr;
        }
        return false;
      });

      if (keysToTranslate.length === 0) {
        totalSkipped += Object.keys(enFlat).length;
        log("dim", " ", `${namespace}.json - all ${Object.keys(enFlat).length} keys already translated`);
        continue;
      }

      log("cyan", ">", `${namespace}.json - translating ${keysToTranslate.length} keys (${Object.keys(enFlat).length - keysToTranslate.length} existing kept)`);

      // Translate in batches
      const translated = { ...existingFlat };
      const batches = [];
      for (let i = 0; i < keysToTranslate.length; i += BATCH_SIZE) {
        batches.push(keysToTranslate.slice(i, i + BATCH_SIZE));
      }

      for (let bIdx = 0; bIdx < batches.length; bIdx++) {
        const batch = batches[bIdx];

        try {
          // Protect interpolation tokens
          const protectedBatch = batch.map(([key, value]) => {
            const { protected: p, tokens } = protectTokens(String(value));
            return { key, original: value, protected: p, tokens };
          });

          // Translate the batch
          const textsToTranslate = protectedBatch.map((b) => b.protected);
          const results = await translate(textsToTranslate, {
            from: SOURCE_LANG,
            to: lang,
          });

          // Process results
          const resultArray = Array.isArray(results) ? results : [results];
          for (let i = 0; i < protectedBatch.length; i++) {
            const { key, tokens } = protectedBatch[i];
            const translatedText = resultArray[i]?.text || protectedBatch[i].original;
            translated[key] = restoreTokens(translatedText, tokens);
          }

          totalTranslated += batch.length;

          // Progress indicator
          const progress = Math.round(((bIdx + 1) / batches.length) * 100);
          process.stdout.write(`\r  ${C.dim}  Progress: ${progress}% (${Math.min((bIdx + 1) * BATCH_SIZE, keysToTranslate.length)}/${keysToTranslate.length})${C.reset}`);

          // Rate limit delay between batches
          if (bIdx < batches.length - 1) await sleep(BATCH_DELAY_MS);
        } catch (err) {
          log("red", "x", `\n  Batch ${bIdx + 1} failed: ${err.message}`);
          // On error, keep original English as fallback
          for (const [key, value] of batch) {
            translated[key] = value;
          }
        }
      }

      console.log(); // newline after progress

      // Write output
      if (!flagDry) {
        // Rebuild nested JSON preserving original key order from English source
        const output = unflattenJson(translated);
        await writeFile(targetPath, JSON.stringify(output, null, 2) + "\n", "utf-8");
        log("green", "+", `  Wrote src/locales/${lang}/${file}`);
      } else {
        log("yellow", "~", `  Would write src/locales/${lang}/${file}`);
      }
    }

    console.log();
  }

  // Summary
  console.log(`${C.bold}${C.green}Done!${C.reset}`);
  log("green", "+", `Translated: ${totalTranslated} keys`);
  log("dim", " ", `Skipped (already existed): ${totalSkipped} keys`);
  if (flagDry) log("yellow", "!", "Dry run - no files were written");
  console.log();
}

// ─── Entry point ─────────────────────────────────────────────────

if (flagVerify) {
  runVerify().catch((err) => {
    console.error(`${C.red}Fatal error:${C.reset}`, err.message);
    process.exit(1);
  });
} else {
  main().catch((err) => {
    console.error(`${C.red}Fatal error:${C.reset}`, err.message);
    process.exit(1);
  });
}
