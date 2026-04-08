---
name: capacitor-mobile
description: CareNet 2 mobile skill for Capacitor configuration, native bridge helpers, safe-area behavior, push registration, back-button handling, and status-bar integration. Use when changes affect native or mobile behavior in this repo.
---

# Capacitor And Native Workflow

Read these files first:
- `capacitor.config.ts`
- `src/frontend/native/`
- `src/app/App.tsx`

Follow these rules:
- Keep native-only calls behind the current platform and capability helpers in `src/frontend/native/`.
- Preserve safe-area handling, hardware back-button behavior, and status bar integration.
- Recheck push, auth, deep-link, and permission flows when a change touches mobile boot or navigation.
- Prefer shared responsive UI patterns over mobile-only forks unless the native wrapper truly needs it.
- Avoid web-only APIs without platform guards.

When a change affects native shells:
1. Build the web bundle: `npm run build` or `npm run build:cap`.
2. Run `npx cap sync android` (or `npx cap sync` for both platforms).
3. Re-verify iOS and Android assumptions before finishing.
4. Check that offline startup assumptions still hold after the change.

Avoid:
- web-only APIs without `Capacitor.isNativePlatform()` guards
- breaking offline startup behavior
- adding mobile-specific state outside the existing helpers in `src/frontend/native/` unless necessary
- skipping `cap sync` after bundle changes
