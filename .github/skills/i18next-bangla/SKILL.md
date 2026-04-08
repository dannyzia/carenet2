---
name: i18next-bangla
description: CareNet 2 localization skill for i18next, committed English and Bangla locale files, runtime language discovery, and translation scripts. Use when adding strings, editing locale JSON, changing language behavior, or improving localization in this repo.
---

# Localization Workflow

Read these files first:
- `src/frontend/i18n/index.ts`
- `src/frontend/i18n/languageManager.ts`
- `src/locales/en/`
- `src/locales/bn/`
- `scripts/translate.mjs`
- `scripts/sync-i18n-keys.mjs`

Follow these rules:
- Add committed strings to both `src/locales/en/` and `src/locales/bn/` — never just one locale.
- Keep user-facing text out of components when it belongs in translations.
- Reuse `useTranslation()` and the existing language helpers.
- Preserve the runtime-added language path; do not hardcode assumptions that only two languages exist.
- Use the existing scripts for bulk key work: `npm run i18n:sync`, `npm run translate`, `npm run translate:verify`.
- Preserve locale-aware formatting for currency, dates, and labels where current helpers already exist.

When adding new copy:
1. Add the English key in the right namespace under `src/locales/en/`.
2. Add the Bangla translation in the matching file under `src/locales/bn/`.
3. Run `npm run translate:verify` to confirm no duplicate or dead keys were introduced.
4. Check for role-specific, mobile, and validation text too.

Avoid:
- hardcoding user-facing English strings in component JSX
- assuming only `en` and `bn` can exist at runtime
- creating new locale namespaces without checking existing ones first
