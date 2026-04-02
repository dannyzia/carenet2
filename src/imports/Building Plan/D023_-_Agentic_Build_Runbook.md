# D023 - Agentic Build Runbook

> **Purpose:** Pre-decided answers to every question that would cause an AI builder to pause and ask. Follow D022 phases in order. Do NOT stop to ask — use this document to resolve ambiguity.

---

## 1. Execution Rules

- Build phases **in order** (1 → 10). Within a phase, build tasks in order (1.1, 1.2, ...).
- After completing each phase, **verify it compiles** by checking imports resolve and types align.
- Do NOT ask "should I proceed to Phase N?" — just proceed.
- Do NOT ask "should I use X or Y?" — use the decision table below.
- Do NOT create `.md` files unless explicitly told to.
- If a task says EDIT, read the file first, then edit. If it says CREATE, write a new file.
- After creating any new file, immediately update the relevant barrel (`index.ts`) export.

---

## 2. Architecture Decisions (Pre-Decided)

| Question | Answer |
|----------|--------|
| Where do new model types go? | In the existing closest-domain model file, OR a new `*.model.ts` if it's a new domain (e.g., `upload`, `schedule`, `backup`). Always in `/src/backend/models/`. |
| Where do new service methods go? | In the existing closest-domain service file, OR a new `*.service.ts` if it's a new domain. Always in `/src/backend/services/`. |
| Where do new mock datasets go? | In the existing closest-domain mock file, OR a new `*Mocks.ts` if it's a new domain. Always in `/src/backend/api/mock/`. |
| Where do new hooks go? | `/src/frontend/hooks/`. One hook per feature concern. |
| Where do new shared components go? | `/src/frontend/components/shared/`. |
| Where do new pages go? | `/src/frontend/pages/{role}/` for role-specific, `/src/frontend/pages/shared/` for multi-role. |
| How do pages load data? | Always via `useAsyncData` hook wrapping a service call, with `PageSkeleton` as loading state. |
| How do pages handle errors? | `RetryOverlay` component from `/src/frontend/components/shared/RetryOverlay.tsx`. |
| What styling system? | Tailwind CSS v4 classes only. Use the pink/green gradient tokens from `/src/styles/theme.css`. |
| What about i18n? | All user-facing strings must use `useTranslation()` from `react-i18next`. Key format: `{feature}.{element}` (e.g., `upload.selectFile`, `incident.severity`). Add keys to the English namespace — other languages will fall back. |
| What about RTL? | Use logical CSS properties where possible (`ms-`, `me-`, `ps-`, `pe-` instead of `ml-`, `mr-`, `pl-`, `pr-`). The RTL flip is handled globally. |
| Should I add translations for all 42 languages? | No. Add English keys only. The i18n system handles fallback. |
| What icon library? | `lucide-react` only. |
| What chart library? | `recharts` only. |
| What about form validation? | Inline validation with state. No form library unless the form has 5+ fields, then use `react-hook-form`. |
| What about toasts/notifications? | Use `toast` from `sonner`. |
| What date library? | Use native `Intl.DateTimeFormat` or simple string formatting. No moment/dayjs unless already installed. |
| Modal or page for short interactions? | If < 3 fields or a confirmation: use a modal/bottom-sheet. If 3+ fields or complex flow: use a dedicated page. |
| What about optimistic UI? | Apply optimistic state for toggle/complete/delete actions. Revert on error with toast. |
| Camera / file upload pattern? | Always use the `FileUploadCapture` shared component (built in Phase 1). It handles both camera and file input. |
| GPS pattern? | Use `navigator.geolocation.getCurrentPosition()` wrapped in a promise. Mock with Dhaka coordinates `{ lat: 23.8103, lng: 90.4125 }` in dev/mock mode. |
| What if a page I need to edit doesn't exist yet? | Check `/src/frontend/pages/` first. If it truly doesn't exist, create it following the standard pattern (useAsyncData + PageSkeleton + service call). |
| What about responsive design? | Mobile-first. All new pages must work on 375px width. Use `md:` breakpoint for desktop enhancements. |
| What about animations? | Minimal. Use CSS transitions for state changes. No motion library unless the interaction specifically needs spring physics. |

---

## 3. Standard Page Template

Every new page follows this pattern:

```tsx
import { useTranslation } from "react-i18next";
import { useAsyncData } from "@/frontend/hooks";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { RetryOverlay } from "@/frontend/components/shared/RetryOverlay";
import { someService } from "@/backend/services";

export default function SomeNewPage() {
  const { t } = useTranslation();
  const { data, loading, error, retry } = useAsyncData(() => someService.getData());

  if (loading) return <PageSkeleton />;
  if (error) return <RetryOverlay onRetry={retry} />;

  return (
    <div className="p-4 space-y-4">
      {/* Page content */}
    </div>
  );
}
```

---

## 4. Standard Service Method Template

Every new mock service method follows this pattern:

```ts
async getSomething(id: string): Promise<SomeType> {
  await delay(300 + Math.random() * 200); // simulate network
  const item = someMockData.find(x => x.id === id);
  if (!item) throw new Error("Not found");
  return structuredClone(item);
}

async createSomething(input: CreateInput): Promise<SomeType> {
  await delay(300 + Math.random() * 200);
  const newItem: SomeType = { id: crypto.randomUUID(), ...input, createdAt: new Date().toISOString() };
  // In real impl: Supabase insert
  return newItem;
}
```

---

## 5. Standard Hook Template

```ts
import { useAsyncData } from "./useAsyncData";
import { someService } from "@/backend/services";

export function useSomeFeature(id?: string) {
  const { data, loading, error, retry, setData } = useAsyncData(
    () => someService.getData(id!),
    { enabled: !!id }
  );

  const doAction = async (input: ActionInput) => {
    // Optimistic update
    setData(prev => /* optimistic state */);
    try {
      await someService.doAction(input);
    } catch {
      retry(); // revert
      toast.error(t("common.error"));
    }
  };

  return { data, loading, error, retry, doAction };
}
```

---

## 6. Standard Mock Data Template

```ts
import { SomeType } from "@/backend/models";

export const someMockData: SomeType[] = [
  { id: "1", /* ... realistic Bangladesh-context data ... */ },
  { id: "2", /* ... */ },
  // At least 3-5 items per dataset
];
```

---

## 7. Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Model file | `{domain}.model.ts` | `upload.model.ts` |
| Service file | `{domain}.service.ts` | `upload.service.ts` |
| Mock file | `{domain}Mocks.ts` | `uploadMocks.ts` |
| Hook file | `use{Feature}.ts` | `useFileUpload.ts` |
| Shared component | `{PascalCase}.tsx` | `FileUploadCapture.tsx` |
| Page file | `{Role}{Feature}Page.tsx` | `CaregiverIncidentReportPage.tsx` |
| Shared page | `{Feature}Page.tsx` | `DailySchedulePage.tsx` |
| Route path | `{role}/{feature}` kebab-case | `caregiver/incident-report` |
| i18n key | `{feature}.{element}` | `upload.selectFile` |

---

## 8. Mock Data Content Guidelines

- Use Bangladeshi names: Fatima, Rahim, Kamal, Nasreen, Shahida, Arif, Taslima, Rashed, etc.
- Use Bangladeshi locations: Dhaka, Chittagong, Sylhet, Gulshan, Dhanmondi, Uttara, Banani, etc.
- Currency is BDT (৳). Format: `৳{amount}`.
- Phone format: `+880 1XXX-XXXXXX`.
- Dates: ISO format in data, display with `Intl.DateTimeFormat`.
- Use realistic care scenarios: elderly care, post-surgery recovery, diabetes management, stroke rehabilitation.

---

## 9. Verification Checklist (Per Phase)

After completing each phase, mentally verify:

- [ ] All new files have barrel exports updated
- [ ] All new types are exported from `/src/backend/models/index.ts`
- [ ] All new services are exported from `/src/backend/services/index.ts`
- [ ] All new hooks are exported from `/src/frontend/hooks/index.ts`
- [ ] All new pages have routes in `/src/app/routes.ts`
- [ ] All imports use the correct path aliases (`@/backend/...`, `@/frontend/...`)
- [ ] All user-facing strings use `t()` from i18n
- [ ] No hardcoded image URLs (use unsplash_tool or existing assets)
- [ ] Mobile-first layout verified (no horizontal overflow at 375px)

---

## 10. When Stuck

| Situation | Action |
|-----------|--------|
| Import path unclear | Read the barrel `index.ts` to confirm export exists |
| Component API unclear | Read the component file to see its props |
| Page already exists but structure unclear | Read the page file before editing |
| Service method pattern unclear | Read an existing service file for the pattern |
| Route structure unclear | Read `/src/app/routes.ts` |
| Package might be missing | Read `/package.json` before importing |
| Not sure if something compiles | Re-read the file after editing to verify |

---

## 11. Do NOT

- Do NOT ask "shall I proceed?"
- Do NOT ask "which approach do you prefer?"
- Do NOT create README or documentation files
- Do NOT refactor existing working code unless the task requires it
- Do NOT change the theme tokens
- Do NOT add new npm packages unless strictly necessary (check package.json first)
- Do NOT write tests (unless explicitly asked)
- Do NOT modify protected files listed in system instructions
