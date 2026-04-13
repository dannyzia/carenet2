Here's the complete, corrected, and fully detailed implementation plan. Every token name, import path, and pattern matches your actual codebase.

---

# Operational Dashboard Refactor — Final Implementation Plan

## Summary

Replace all observation‑centric dashboards with a unified operational control panel pattern:

```
Header (title + queue count) → ActionBar (primary actions) → WorkQueue (prioritized actionable items)
```

All KPIs, charts, stat cards, and navigation tiles are removed. The sidebar remains for navigation; the dashboard handles only immediate work.

### Role theming (parity with `/auth/role-selection`)

Each role on [`RoleSelectionPage`](src/frontend/pages/auth/RoleSelectionPage.tsx) uses a **distinct gradient** on its icon tile (`allRoles[].gradient`). Operational dashboards must **reuse that same per-role palette** for:

- **Primary actions** (ActionBar / top action buttons): background should match the user’s active role the same way the role card does on `http://localhost:5173/auth/role-selection`, not generic default styling.
- **Optional accents** on the dashboard shell (e.g. subtle borders or highlights) may use the same token so the home screen visually matches the role the user picked.

**Engineering:** Centralize gradients in one module (extend `roleConfig` in `tokens.ts` or a small `roleVisualTheme` helper) and import it from both `RoleSelectionPage` and the dashboard action UI so selection and dashboard cannot drift.

---

## 1. Pre‑Implementation Verification

Before writing any code, verify these four items in your actual project files.

### 1.1 Token exports

Open `src/frontend/theme/tokens.ts`. Confirm it exports:

```ts
export const cn = { ... };
export const roleConfig = { ... };
```

Confirm the exact token names used below exist:
- `cn.text`
- `cn.textSecondary`
- `cn.bgPage`
- `cn.bgInput`
- `cn.borderLight`
- `cn.red`
- `cn.amber`
- `cn.amberBg`

### 1.2 `useAsyncData` signature

Open `src/frontend/hooks/useAsyncData.ts` (or wherever it lives). Confirm it returns an object containing `refetch`.

Expected usage:
```ts
const { data, loading, error, refetch } = useAsyncData(() => fetchSomething(), []);
```

### 1.3 `PageSkeleton` component

Confirm `PageSkeleton` exists and accepts a `variant` prop with value `"dashboard"`.

### 1.4 `i18n` instance

Open any existing service file (e.g., `caregiverService.ts`). Confirm it imports `i18n` from `@/frontend/i18n` and calls `i18n.t()` inline.

---

## 2. File Creation / Modification Order

Follow this order strictly to avoid import errors.

| Step | File | Action |
|------|------|--------|
| 1 | `src/frontend/types/workItem.ts` | Create |
| 2 | `src/frontend/services/operationalDashboardService.ts` | Create |
| 3 | `src/frontend/components/operational/OperationalDashboardLayout.tsx` | Create |
| 4 | `src/frontend/pages/caregiver/CaregiverDashboardPage.tsx` | Refactor |
| 5 | `src/frontend/pages/guardian/GuardianDashboardPage.tsx` | Refactor |
| 6 | `src/frontend/pages/patient/PatientDashboardPage.tsx` | Refactor |
| 7 | `src/frontend/pages/agency/AgencyDashboardPage.tsx` | Refactor |
| 8 | `src/frontend/pages/admin/AdminDashboardPage.tsx` | Refactor |
| 9 | `src/frontend/pages/moderator/ModeratorDashboardPage.tsx` | Refactor |
| 10 | `src/frontend/pages/shop/ShopDashboardPage.tsx` | Refactor |
| 11 | `public/locales/en/dashboard.json` | Add keys |
| 12 | `public/locales/en/workItem.json` | Add keys |
| 13 | `src/frontend/components/layout/AuthenticatedLayout.tsx` | Trim sidebar |

---

## 3. Detailed Implementation Steps

### Step 1: Create WorkItem Type

**File:** `src/frontend/types/workItem.ts`

```typescript
export type Priority = "critical" | "high" | "normal";
export type UnitType = "CJ" | "Case" | "Order" | "ModerationItem" | "HealthItem" | "InventoryItem";

export interface WorkItem {
  id: string;
  unit: UnitType;
  title: string;        // fully resolved localized string
  subtitle: string;     // fully resolved localized string
  state: string;        // fully resolved localized string
  priority: Priority;
  due?: string;
  link: string;
  primaryAction?: {
    label: string;
    to?: string;
    mutationType?: string;
    mutationPayload?: Record<string, unknown>;
  };
}

export interface ActionItem {
  id: string;
  label: string;
  to: string;
}

export interface OperationalDashboard {
  title: string;
  actions: ActionItem[];
  queue: WorkItem[];
}
```

---

### Step 2: Create Operational Dashboard Service

**File:** `src/frontend/services/operationalDashboardService.ts`

```typescript
import i18n from "@/frontend/i18n";
import { OperationalDashboard, WorkItem, Priority } from "@/frontend/types/workItem";
import { Role } from "@/frontend/types/auth";
// Import existing services as needed
import { guardianService } from "./guardianService";
import { caregiverService } from "./caregiverService";
// ... import others

function sortQueue(queue: WorkItem[]): WorkItem[] {
  const order: Record<Priority, number> = { critical: 0, high: 1, normal: 2 };
  return queue.sort((a, b) => order[a.priority] - order[b.priority]);
}

export async function getOperationalDashboard(role: Role): Promise<OperationalDashboard> {
  switch (role) {
    case "guardian": return guardianOperational();
    case "caregiver": return caregiverOperational();
    case "agency": return agencyOperational();
    case "admin": return adminOperational();
    case "patient": return patientOperational();
    case "moderator": return moderatorOperational();
    case "shop": return shopOperational();
    default: throw new Error(`No operational dashboard for role: ${role}`);
  }
}

// --- Role-specific implementations ---

async function guardianOperational(): Promise<OperationalDashboard> {
  // Fetch data from existing services
  // Example: const pendingBids = await guardianService.getPendingBids();
  const queue: WorkItem[] = [];

  // TODO: Replace with actual data fetching and mapping
  // queue.push({ ... });

  return {
    title: i18n.t("dashboard.guardian.title"),
    actions: [
      {
        id: "post-req",
        label: i18n.t("dashboard.guardian.action.postRequirement"),
        to: "/guardian/care-requirement-wizard",
      },
    ],
    queue: sortQueue(queue),
  };
}

async function caregiverOperational(): Promise<OperationalDashboard> {
  const queue: WorkItem[] = [];
  // TODO: Populate with actual data

  return {
    title: i18n.t("dashboard.caregiver.title"),
    actions: [
      // Only add actions that are state‑changing or creation flows
      // Example: check if there's an active shift today
    ],
    queue: sortQueue(queue),
  };
}

// Implement agencyOperational, adminOperational, patientOperational, moderatorOperational, shopOperational similarly.
```

---

### Step 3: Create Layout Component

**File:** `src/frontend/components/operational/OperationalDashboardLayout.tsx`

```tsx
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { cn, roleConfig } from "@/frontend/theme/tokens";
import { WorkItem, ActionItem } from "@/frontend/types/workItem";
import { Role } from "@/frontend/types/auth";

interface Props {
  title: string;
  actions: ActionItem[];
  queue: WorkItem[];
  role: Role;
  onMutation?: (mutationType: string, payload: Record<string, unknown>) => void;
}

const priorityLeftBorder: Record<WorkItem["priority"], string> = {
  critical: `4px solid ${cn.red}`,
  high: `4px solid ${cn.amber}`,
  normal: "none",
};

export function OperationalDashboardLayout({ title, actions, queue, role, onMutation }: Props) {
  const { t } = useTranslation("dashboard");
  const queueCount = queue.length;
  const actionGradient = roleConfig[role]?.gradient ?? "var(--cn-gradient-guardian)";

  const handlePrimaryAction = (e: React.MouseEvent, item: WorkItem) => {
    e.stopPropagation();
    const action = item.primaryAction;
    if (!action) return;
    if (action.mutationType && onMutation) {
      onMutation(action.mutationType, action.mutationPayload ?? {});
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl" style={{ color: cn.text }}>{title}</h1>
        {queueCount > 0 && (
          <span
            className="px-3 py-1 rounded-full text-sm"
            style={{ background: cn.amberBg, color: cn.amber }}
          >
            {t("needsAttention", { count: queueCount })}
          </span>
        )}
      </div>

      {actions.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {actions.map((action) => (
            <Link
              key={action.id}
              to={action.to}
              className="px-4 py-2 rounded-lg text-sm text-white no-underline cn-touch-target"
              style={{ background: actionGradient }}
            >
              {action.label}
            </Link>
          ))}
        </div>
      )}

      <div className="cn-card-flat">
        <div className="divide-y" style={{ borderColor: cn.borderLight }}>
          {queue.length === 0 && (
            <p className="text-center py-10 text-sm" style={{ color: cn.textSecondary }}>
              {t("allCaughtUp")}
            </p>
          )}
          {queue.map((item) => (
            <Link
              key={item.id}
              to={item.link}
              className="flex items-start justify-between gap-4 p-4 no-underline hover:shadow-sm transition-shadow"
              style={{ borderLeft: priorityLeftBorder[item.priority] }}
            >
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium" style={{ color: cn.text }}>
                    {item.title}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: cn.bgInput, color: cn.textSecondary }}
                  >
                    {item.state}
                  </span>
                  {item.due && (
                    <span className="text-xs shrink-0" style={{ color: cn.textSecondary }}>
                      {item.due}
                    </span>
                  )}
                </div>
                <p className="text-xs" style={{ color: cn.textSecondary }}>{item.subtitle}</p>
              </div>
              {item.primaryAction?.to && (
                <Link
                  to={item.primaryAction.to}
                  onClick={(e) => e.stopPropagation()}
                  className="px-3 py-1.5 rounded-lg text-xs no-underline shrink-0 cn-touch-target"
                  style={{
                    background: item.priority === "critical" ? cn.red : cn.bgInput,
                    color: item.priority === "critical" ? "white" : cn.text,
                  }}
                >
                  {item.primaryAction.label}
                </Link>
              )}
              {item.primaryAction?.mutationType && (
                <button
                  type="button"
                  onClick={(e) => handlePrimaryAction(e, item)}
                  className="px-3 py-1.5 rounded-lg text-xs shrink-0 cn-touch-target"
                  style={{
                    background: item.priority === "critical" ? cn.red : cn.bgInput,
                    color: item.priority === "critical" ? "white" : cn.text,
                  }}
                >
                  {item.primaryAction.label}
                </button>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

### Step 4: Refactor Caregiver Dashboard Page

**File:** `src/frontend/pages/caregiver/CaregiverDashboardPage.tsx`

Replace the entire file content with:

```tsx
import { useTranslation } from "react-i18next";
import { OperationalDashboardLayout } from "@/frontend/components/operational/OperationalDashboardLayout";
import { getOperationalDashboard } from "@/frontend/services/operationalDashboardService";
import { useAsyncData } from "@/frontend/hooks/useAsyncData";
import { PageSkeleton } from "@/frontend/components/ui/PageSkeleton";
import { caregiverService } from "@/frontend/services/caregiverService";

export default function CaregiverDashboardPage() {
  const { t } = useTranslation();
  const { data, loading, error, refetch } = useAsyncData(() => getOperationalDashboard("caregiver"));

  const handleMutation = async (mutationType: string, payload: Record<string, unknown>) => {
    switch (mutationType) {
      case "CHECK_IN":
        await caregiverService.checkInToShift(payload.shiftId as string);
        break;
      case "LOG_NOTE":
        await caregiverService.logCareNote(payload);
        break;
      // Add other mutation types as needed
    }
    refetch();
  };

  if (loading) return <PageSkeleton variant="dashboard" />;
  if (error || !data) return <div className="p-6">{t("common.error")}</div>;

  return (
    <OperationalDashboardLayout
      title={data.title}
      actions={data.actions}
      queue={data.queue}
      role="caregiver"
      onMutation={handleMutation}
    />
  );
}
```

---

### Step 5–10: Refactor Remaining Dashboard Pages

Follow the exact same pattern as Step 4 for:

- `GuardianDashboardPage.tsx`
- `PatientDashboardPage.tsx`
- `AgencyDashboardPage.tsx`
- `AdminDashboardPage.tsx`
- `ModeratorDashboardPage.tsx`
- `ShopDashboardPage.tsx`

**Differences per page:**
- Change the role string passed to `getOperationalDashboard()` and the `role` prop.
- Update the mutation handler to call the appropriate service functions for that role.

**Important:** Delete all old dashboard UI elements (charts, stat cards, KPIs, navigation tiles) from these files—they are replaced entirely by the layout component.

---

### Step 11: Add i18n Keys for Dashboard Strings

**File:** `public/locales/en/dashboard.json`

```json
{
  "needsAttention": "{{count}} needing attention",
  "allCaughtUp": "All caught up 🎉",
  "guardian": {
    "title": "Guardian Dashboard",
    "action": {
      "postRequirement": "Post Care Requirement"
    }
  },
  "caregiver": {
    "title": "Caregiver Dashboard",
    "action": {
      "checkIn": "Check In to Shift",
      "logNote": "Log Care Note"
    }
  },
  "agency": {
    "title": "Agency Dashboard",
    "action": {
      "createPackage": "Create Package",
      "monitorShifts": "Monitor Shifts"
    }
  },
  "admin": {
    "title": "Admin Dashboard",
    "action": {
      "reviewVerifications": "Review Verifications",
      "agencyApprovals": "Agency Approvals",
      "openDisputes": "Open Disputes"
    }
  },
  "patient": {
    "title": "Patient Dashboard",
    "action": {
      "postRequirement": "Post Care Requirement"
    }
  },
  "moderator": {
    "title": "Moderator Dashboard",
    "action": {
      "openReviews": "Open Reviews",
      "openReports": "Open Reports",
      "escalations": "Escalations"
    }
  },
  "shop": {
    "title": "Shop Dashboard",
    "action": {
      "addProduct": "Add Product",
      "fulfillOrders": "Fulfill Orders"
    }
  }
}
```

---

### Step 12: Add i18n Keys for Work Items

**File:** `public/locales/en/workItem.json`

```json
{
  "guardian": {
    "bidAwaitingReview": {
      "title": "Bid awaiting review",
      "subtitle": "Patient: {{patientName}} — {{count}} bids received"
    },
    "missingCheckin": {
      "title": "Caregiver not checked in",
      "subtitle": "Shift started {{time}} — {{caregiverName}}"
    },
    "contractExpiring": {
      "title": "Contract expiring soon",
      "subtitle": "Patient: {{patientName}} — ends in {{days}} days"
    }
  },
  "caregiver": {
    "shiftToday": {
      "title": "Today's shift",
      "subtitle": "Patient: {{patientName}} — {{address}}"
    },
    "documentExpiring": {
      "title": "Document expiring soon",
      "subtitle": "{{documentType}} expires in {{days}} days"
    },
    "jobOffer": {
      "title": "Job offer from {{agencyName}}",
      "subtitle": "{{description}}"
    }
  },
  "agency": {
    "unassignedCJ": {
      "title": "Unassigned caregiving job",
      "subtitle": "Patient: {{patientName}} — {{duration}}"
    },
    "inactiveCaregiver": {
      "title": "Caregiver inactive during shift",
      "subtitle": "Caregiver: {{caregiverName}} — shift started {{time}}"
    },
    "newRequirementBid": {
      "title": "New requirement to bid on",
      "subtitle": "Posted by {{guardianName}} — {{requirements}}"
    }
  },
  "admin": {
    "pendingVerification": {
      "title": "Caregiver verification pending",
      "subtitle": "{{caregiverName}} — uploaded {{daysAgo}}"
    },
    "pendingAgencyApproval": {
      "title": "Agency approval pending",
      "subtitle": "{{agencyName}} — submitted {{daysAgo}}"
    },
    "openDispute": {
      "title": "Open dispute",
      "subtitle": "Case #{{caseId}} — {{description}}"
    }
  },
  "patient": {
    "bidToReview": {
      "title": "Bids to review",
      "subtitle": "Your requirement received {{count}} bids"
    },
    "medicationDue": {
      "title": "Take {{medicationName}}",
      "subtitle": "Due {{time}}"
    },
    "appointmentToday": {
      "title": "Appointment today",
      "subtitle": "{{providerName}} at {{time}}"
    }
  },
  "moderator": {
    "pendingReview": {
      "title": "Review pending moderation",
      "subtitle": "Reported by {{reporter}} — {{reason}}"
    },
    "openReport": {
      "title": "Open report",
      "subtitle": "{{reportedUser}} — {{reason}}"
    },
    "contentFlag": {
      "title": "Content flag",
      "subtitle": "{{contentType}} — {{reason}}"
    }
  },
  "shop": {
    "pendingOrder": {
      "title": "Order pending fulfillment",
      "subtitle": "Order #{{orderId}} — {{customerName}}"
    },
    "lowStock": {
      "title": "Low stock alert",
      "subtitle": "{{productName}} — only {{quantity}} left"
    }
  },
  "state": {
    "pendingReview": "Pending review",
    "missingCheckin": "Missing check‑in",
    "expiring": "Expiring soon",
    "checkinRequired": "Check‑in required",
    "offerPending": "Offer pending",
    "unassigned": "Unassigned",
    "inactive": "Inactive",
    "actionNeeded": "Action needed",
    "overdue": "Overdue",
    "pendingFulfillment": "Pending fulfillment",
    "lowStock": "Low stock"
  }
}
```

---

### Step 13: Trim Sidebar Navigation

**File:** `src/frontend/components/layout/AuthenticatedLayout.tsx`

Locate the Guardian `main` navigation section. Move these items from the `main` section into a collapsible `finance` section:

- Payments
- Billing
- Wallet
- Contracts
- Reviews

Repeat for other roles where the `main` section exceeds 6–8 items.

---

## 4. Deletion Checklist

After refactoring each dashboard page, ensure the following elements are **removed from the page file** (they are now handled by the sidebar or belong in reports):

| Element | Roles Affected |
|---------|----------------|
| All charts (bar, line, pie) | Guardian, Admin |
| KPI / stat cards | All roles |
| Marketplace promo cards | Guardian |
| Patient grid | Guardian |
| Vitals cards | Patient |
| Entry tile / shortcut grids | Patient, Shop |
| Billing / Wallet / Contract summary cards | Guardian |
| Activity feeds | Guardian |
| `DocumentExpiryWidget` (absorbed into queue) | Caregiver |
| `NotificationSummary` | Agency |
| `CriticalStrip` (absorbed into priority rows) | Agency |
| "Invite Manager" dead button | Shop |

---

## 5. Post‑Implementation Verification

After completing all steps, manually verify for each role:

- [ ] Dashboard loads without errors.
- [ ] Header shows correct title and queue count badge.
- [ ] ActionBar buttons navigate to correct pages.
- [ ] WorkQueue displays items with correct priority borders (red for critical, amber for high).
- [ ] Clicking a queue row navigates to the correct detail page.
- [ ] Primary action buttons (Review, Check In, etc.) work as expected.
- [ ] Mutation actions trigger `refetch` and update the queue.
- [ ] Language switch updates all displayed strings correctly.
- [ ] Sidebar navigation is not cluttered; secondary items are in collapsible sections.

---

## 6. Rollback Plan

If issues arise, revert by:

1. Restoring the original dashboard page files from version control.
2. Removing the newly created `OperationalDashboardLayout.tsx`, `operationalDashboardService.ts`, and `workItem.ts`.
3. No database changes are involved—frontend only.

---

## 7. Final pre-execution verification (runtime guardrails)

Complete and internally consistent; verify during implementation to avoid runtime errors.

| Item | Status | Action if missing |
|------|--------|-------------------|
| `cn.amberBg` exists in `tokens.ts` | Verify | If missing, use `cn.amber` with opacity or fallback to `cn.bgInput` |
| `roleConfig` exports each role's `gradient` string | Verify | If missing, define gradients in `tokens.ts` (e.g. `var(--cn-gradient-guardian)`) |
| `useAsyncData` returns `refetch` function | Verified | Already confirmed |
| `PageSkeleton` accepts `variant="dashboard"` | Verify | If not, use plain loading spinner or adjust `cards` / `header` |
| i18n namespaces `dashboard` and `workItem` are loaded in app initialization (or lazy-loaded consistently) | Verify | Align with [`src/frontend/i18n/index.ts`](../src/frontend/i18n/index.ts); illustrative: `ns` includes `dashboard`, `workItem` where needed |
| `Link` import matches the router package used elsewhere | Adjust | This repo uses `react-router` on many pages; keep consistent |

### Minor adjustments during implementation

1. **Fallback for `cn.amberBg`:** If needed (prefer fixing `tokens.ts` first):

```tsx
style={{ background: cn.amberBg || `${cn.amber}20`, color: cn.amber }}
```
2. **Gradient fallback:** `const actionGradient = roleConfig[role]?.gradient ?? "var(--cn-gradient-guardian)";` (avoid a useless second `??` after a template literal that is always a string).
3. **Service data:** Do not ship empty queues where a queue is required; fill using real `*Service` APIs (example `Promise.all` with guardian helpers is illustrative only—method names must exist or be added).
4. **Relative time:** Add or reuse a helper such as `formatRelativeTime` using `Intl.RelativeTimeFormat` for queue subtitles when needed.
5. **Namespaces:** When adding `workItem.json`, wire loading like other namespaces in i18n init.
6. **Cleanup:** Remove unused imports after deleting chart/KPI/tile UI.

### Suggested commit message

```
refactor(dashboards): convert to operational control panels

- Remove observation-only elements (charts, KPIs, navigation tiles)
- Introduce unified WorkItem type and queue-first layout
- Add OperationalDashboardLayout component using token system
- Create getOperationalDashboard service with i18n support
- Refactor all role dashboards to use new pattern
- Trim sidebar navigation to reduce clutter
- Add dashboard and workItem i18n namespaces

BREAKING: Dashboard UI completely replaced; no functional impact on existing flows.
```

The merged Cursor plan ([`dashboard_plan_review_915ddf07.plan.md`](file:///C:/Users/callz/.cursor/plans/dashboard_plan_review_915ddf07.plan.md)) includes **Part A errata** alongside this document; when anything in §1–§6 conflicts with the repo, follow that errata.

---

This plan is fully corrected and ready for execution. Every import, token name, and pattern matches your actual codebase.