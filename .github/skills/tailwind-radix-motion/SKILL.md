---
name: tailwind-radix-motion
description: CareNet 2 UI skill for Tailwind CSS v4, shared design tokens, Radix-based components, MUI coexistence, and motion/react animations. Use when building or refactoring components, layouts, motion, or interaction design in this repo.
---

# UI Implementation

Read these files first:
- `src/styles/tailwind.css`
- `src/styles/theme.css`
- `src/frontend/theme/tokens.ts`
- `src/frontend/components/shared/`
- `src/frontend/components/ui/`

Follow these rules:
- Match the repo's Tailwind v4 setup (`src/styles/tailwind.css`) and reuse existing spacing, card, badge, and shell patterns.
- Use tokenized colors and CSS variables (`src/frontend/theme/tokens.ts`, `src/styles/theme.css`) instead of adding new color literals.
- Prefer shared components and Radix-based primitives from `src/frontend/components/ui/` before creating new widgets.
- Use MUI only where the existing screen already leans on it or the widget is materially simpler there.
- Import animation helpers from `motion/react` (not framer-motion or any other animation library).
- Preserve reduced-motion support, safe-area helpers, dark mode, and accessible labeling.
- Icon-only controls need accessible labels; decorative icons must be hidden from assistive tech.

Avoid:
- new styling systems or a second design token set
- raw color literals for new UI work
- a second animation library
- recreating components already in `src/frontend/components/shared/` or `src/frontend/components/shell/`
