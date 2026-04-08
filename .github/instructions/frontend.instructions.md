---
applyTo: "src/frontend/**"
---

You are working on the frontend layer for CareNet 2.

- Use Tailwind v4 configured in `src/styles/tailwind.css`. Match existing patterns — no new CSS frameworks.
- Use design tokens from `src/frontend/theme/tokens.ts` and CSS variables from `src/styles/theme.css`. No raw color literals.
- Reuse components from `src/frontend/components/shared/`, `shell/`, and `ui/` before creating new ones.
- Use Radix-based primitives for interactive controls before reaching for custom implementations.
- Use MUI only where the existing surface already leans on it.
- Import animations from `motion/react` only. No framer-motion or other animation libraries.
- Preserve reduced-motion support, dark-mode behavior, safe-area helpers, and touch-target sizes.
- Keep accessibility in view: icon-only controls need labels; decorative icons must be hidden from assistive tech.
- Do not hardcode user-facing strings in JSX — use `useTranslation()` and add keys to both `src/locales/en/` and `src/locales/bn/`.
- Read auth and role state only through `useAuth()` and `user.activeRole`.
- Import routing APIs from `react-router` only — never `react-router-dom`.
