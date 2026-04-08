---
name: spec-writing-carenet
description: CareNet 2 planning skill for writing feature briefs, implementation specs, and agent-ready plans that match this repo's routing, offline, i18n, mobile, and testing constraints. Use when planning a feature or preparing work for another agent in this project.
---

# Spec Writing For CareNet 2

Write specs around observable behavior, then anchor them to CareNet 2 constraints.

## What Every Spec Must Include

- **Goal** — the user-visible outcome
- **Affected route or screen** — which path in `src/app/routes.ts` is involved
- **Auth and role assumptions** — which roles see this, what `user.activeRole` values apply
- **Offline and realtime expectations** — does this feature need Dexie queueing? realtime updates?
- **Localization impact** — new strings needed in `en` and `bn`; any runtime-language considerations
- **Mobile / Capacitor impact** — does it touch native bridge, safe-area, push, back-button?
- **Required test coverage** — Vitest units + Playwright end-to-end flows

## Spec Format

```
## Goal
[one sentence: what the user can do after this ships]

## Route / Screen
[path or component; e.g. /patients/:id → PatientDetail]

## Auth / Roles
[which roles; what happens when unauthorized]

## Offline Behavior
[what happens with no connection; does it need the sync queue?]

## Realtime Behavior
[any postgres_changes subscriptions needed?]

## Localization
[new i18n keys needed; en + bn both required]

## Mobile
[any native implications; cap sync needed?]

## Acceptance Criteria
[numbered list of verifiable outcomes]

## Test Coverage
[Vitest: which hooks/utils; Playwright: which user journeys]

## Must Not Break
[explicit list of things that must keep working: mock mode, offline startup, existing roles, en/bn coverage]
```

## Style Rules
- Reference existing files and patterns in this repo rather than inventing new abstractions.
- Phrase acceptance criteria so they can be verified in both browser and hybrid (Capacitor) contexts.
- Include a "Must Not Break" section for every spec that touches auth, offline, i18n, or native flows.
