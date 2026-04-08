---
applyTo: "src/locales/**"
---

You are editing CareNet 2 locale files.

- Always update both `src/locales/en/` and `src/locales/bn/` together. Never update one without the other.
- Do not delete keys from locale files unless the corresponding component usage is also removed.
- Preserve the existing namespace structure — do not merge or split namespace files without an explicit instruction.
- After making changes, run `npm run translate:verify` to check for missing or dead keys.
- Remember: the app can load additional admin-managed languages at runtime. Do not hardcode assumptions that only `en` and `bn` can exist.
- Use `npm run i18n:sync` when adding many keys to keep both locales in sync.
- Use `npm run translate` to generate Bangla translations when a Bangla string is missing.
