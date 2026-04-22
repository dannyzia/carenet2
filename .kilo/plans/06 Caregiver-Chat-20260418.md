# Caregiver "Start Chat" — Implementation Plan

## Requirements

1. Caregiver can chat with **all agencies** (any user with `role = 'agency'` in profiles)
2. Caregiver can chat with **patient/guardian/fellow-caregiver** from active CJ assignments only
3. "New Chat" button in ChatPanel opens autocomplete modal with grouped suggestions
4. Conversation list filters out conversations from inactive/past jobs (except agency conversations which always show)
5. Feature flag `careSeekerCaregiverContactEnabled=false` still allows CJ-related chats and agency chats

---

## Corrected SQL Queries

### All agencies (no contract relationship needed)
```sql
SELECT id, name, role, avatar
FROM profiles
WHERE role = 'agency';
```

### Active job contacts (guardian, patient-users, fellow caregivers)

**Data model context**:
- `care_contracts` GAC rows: `owner_id` = guardian user (always). `party_role: "patient"` is a text label, not a user ID.
- `patients` table: has `guardian_id UUID REFERENCES auth.users(id)` linking back to guardian. `patients.id` may equal `auth.users.id` for patient-users who can log in.
- Not all patients are users — many are just care-recipient entities managed by their guardian.
- Only patient-users (with a matching `profiles` row where `role='patient'`) should appear as chat contacts.

```sql
-- Guardian: caregiver → CAC → assignment → active job → GAC → guardian (GAC owner)
SELECT DISTINCT p.id, p.name, p.role
FROM care_contracts cac
JOIN caregiving_job_caregiver_assignments cja
  ON cja.caregiver_agency_contract_id = cac.id
  AND cja.status = 'assigned'
JOIN caregiving_jobs cj
  ON cj.id = cja.caregiving_job_id
  AND cj.status = 'active'
JOIN care_contracts gac
  ON gac.id = cj.guardian_agency_contract_id
JOIN profiles p
  ON p.id = gac.owner_id
WHERE cac.owner_id = $1
  AND cac.contract_party_scope = 'caregiver_agency'
  AND p.id != $1

UNION

-- Patient-users: guardian → patients table → profiles where role='patient'
SELECT DISTINCT pp.id, pp.name, pp.role
FROM care_contracts cac
JOIN caregiving_job_caregiver_assignments cja
  ON cja.caregiver_agency_contract_id = cac.id
  AND cja.status = 'assigned'
JOIN caregiving_jobs cj
  ON cj.id = cja.caregiving_job_id
  AND cj.status = 'active'
JOIN care_contracts gac
  ON gac.id = cj.guardian_agency_contract_id
JOIN patients pt
  ON pt.guardian_id = gac.owner_id
JOIN profiles pp
  ON pp.id = pt.id
  AND pp.role = 'patient'
WHERE cac.owner_id = $1
  AND cac.contract_party_scope = 'caregiver_agency'

UNION

-- Fellow caregivers on same active jobs
SELECT DISTINCT p2.id, p2.name, p2.role
FROM care_contracts cac
JOIN caregiving_job_caregiver_assignments cja
  ON cja.caregiver_agency_contract_id = cac.id
  AND cja.status = 'assigned'
JOIN caregiving_jobs cj
  ON cj.id = cja.caregiving_job_id
  AND cj.status = 'active'
JOIN caregiving_job_caregiver_assignments cja2
  ON cja2.caregiving_job_id = cj.id
  AND cja2.status = 'assigned'
  AND cja2.caregiver_agency_contract_id != cac.id
JOIN care_contracts cac2
  ON cac2.id = cja2.caregiver_agency_contract_id
JOIN profiles p2
  ON p2.id = cac2.owner_id
WHERE cac.owner_id = $1
  AND cac.contract_party_scope = 'caregiver_agency';
```

---

## Implementation

### Phase 1: Backend — `caregiverContacts.service.ts` (new file)

**Path**: `src/backend/services/caregiverContacts.service.ts`

```typescript
export interface CaregiverContact {
  id: string;
  name: string;
  role: 'agency' | 'guardian' | 'patient' | 'caregiver';
  group: 'agencies' | 'active_job_contacts';
}

export const caregiverContactsService = {
  getAgencies(): Promise<CaregiverContact[]>,
  getActiveJobContacts(caregiverId: string): Promise<CaregiverContact[]>,
  getActiveJobParticipantIds(caregiverId: string): Promise<Set<string>>,
  searchContacts(caregiverId: string, query: string): Promise<CaregiverContact[]>,
}
```

- `getAgencies()` — `sb().from('profiles').select('id,name,role,avatar').eq('role','agency')`
- `getActiveJobContacts(caregiverId)` — the UNION query above
- `getActiveJobParticipantIds(caregiverId)` — returns just IDs (used for conversation filtering and feature flag bypass)
- `searchContacts(caregiverId, query)` — combines both + `.ilike('name', '%query%')` filter
- Mock: returns static lists from mock data

### Phase 2: Backend — Modify `message.service.ts`

#### 2a. Feature flag bypass in `getOrCreateConversation` (line 147)

Replace blanket block with CJ-aware check:
```typescript
if (!features.careSeekerCaregiverContactEnabled) {
  const otherRole = /* existing lookup */;
  if (otherRole === 'agency') { /* allow */ }
  else if (isCaregiverOrCareSeeker(me, other)) {
    const eligible = await caregiverContactsService.getActiveJobParticipantIds(myId);
    if (!eligible.has(otherUserId)) {
      throw new Error("CARENET_BLOCK_CARE_SEEKER_CAREGIVER_CONVERSATION");
    }
  }
}
```

#### 2b. Filter inactive conversations in `getConversations` for caregiver

After `fetchConversations(myId)`, add filtering for caregiver role:
```typescript
if (role === 'caregiver') {
  const [agencyIds, activeContactIds] = await Promise.all([
    getAgencyProfileIds(),
    caregiverContactsService.getActiveJobParticipantIds(myId),
  ]);
  return convos.filter(c => agencyIds.has(c.participantId) || activeContactIds.has(c.participantId));
}
```

This requires exposing the other participant's user ID on `ConversationItem`:
- **Recommendation**: Add optional `participantId?: string` to `ConversationItem` — populate it in `mapConversation()` where `otherId` is already computed.

### Phase 3: Frontend — `NewChatModal.tsx` (new component)

**Path**: `src/frontend/components/shared/NewChatModal.tsx`

- Dialog/modal overlay with search input
- Debounced search (300ms) calling `caregiverContactsService.searchContacts()`
- Grouped results: "Agencies" section + "Active Job Contacts" section
- Each result shows avatar, name, role badge
- Keyboard navigation (arrow keys + enter)
- Selecting a contact calls `onSelectContact(contact)`

### Phase 4: Frontend — Modify `ChatPanel.tsx`

- Add `Plus` icon button in header (caregiver-only, alongside "Messages" title)
- Add `newChatOpen` state
- Render `<NewChatModal>` when open
- `handleStartNewChat(contact)`: calls `messageService.getOrCreateConversation(contact.id)`, refreshes conversation list, selects new conversation

### Phase 5: i18n

Add keys to `src/locales/en/chat.json` and `src/locales/bn/chat.json`:
- `chat.newChat` / `chat.newChatTitle` / `chat.searchContacts`
- `chat.noContactsFound`
- `chat.sectionAgencies` / `chat.sectionJobContacts`
- `chat.contactRole.*` labels

### Phase 6: Mock data

Update `src/backend/api/mock/messageMocks.ts`:
- Add mock agency contacts and active job contacts for the caregiver mock user
- Ensure `MOCK_CAREGIVER_CONVERSATIONS_UNIFIED` only includes active-job or agency conversations
- Mock `searchContacts` returns filtered subset

### Phase 7: Tests

- Unit: `caregiverContacts.service.test.ts` — agency fetch, active contacts, search
- Unit: `message.service.test.ts` — filtering logic, feature flag bypass
- Component: `NewChatModal.test.tsx` — search, selection
- E2E (Playwright): `caregiver-new-chat.spec.ts` — full flow

---

## Files Summary

**New:**
| File | Purpose |
|------|---------|
| `src/backend/services/caregiverContacts.service.ts` | Fetch eligible chat contacts for caregiver |
| `src/frontend/components/shared/NewChatModal.tsx` | Autocomplete search modal |
| `e2e/carenet/caregiver-new-chat.spec.ts` | E2E test |

**Modified:**
| File | Change |
|------|--------|
| `src/backend/services/message.service.ts` | CJ-aware feature flag + conversation filtering |
| `src/backend/models/message.model.ts` | Add optional `participantId` to `ConversationItem` |
| `src/frontend/components/shared/ChatPanel.tsx` | Add "New Chat" button + modal wiring |
| `src/backend/api/mock/messageMocks.ts` | Mock contacts data |
| `src/locales/en/chat.json` + `src/locales/bn/chat.json` | i18n keys |

**No schema changes needed.**

---

## Remaining Work (Phase 2)

### Item 1: Patient-user query via patients table

#### Schema Facts

```
patients table:
  id          UUID PK DEFAULT gen_random_uuid()    -- NOT always auth.users.id
  guardian_id UUID FK → auth.users(id)             -- the guardian who registered this patient
  name        TEXT NOT NULL
  status      TEXT CHECK IN ('active','inactive','discharged')
  ...other clinical columns

profiles table:
  id    UUID PK FK → auth.users(id)                -- always an auth user
  role  TEXT CHECK IN (...'patient'...)             -- 'patient' is a valid role
```

**Key relationships:**
- `patients.guardian_id` → `auth.users(id)` (guardian registered this patient)
- `care_contracts` (GAC): `owner_id` = guardian. **No `patient_id` column.**
- `caregiving_jobs`: **No `patient_id` column.** Links to GAC via `guardian_agency_contract_id`.
- `placements`: Has both `patient_id` (FK → patients) AND `caregiving_job_id` (FK → caregiving_jobs). **This is the bridge.**
- Patient entities may or may not be chat-capable users. Only those with `patients.id = profiles.id` AND `profiles.role = 'patient'` can chat.
- For self-monitoring patient-role users: `patients.id = auth.users.id` (application-enforced, not a FK constraint).

#### Implementation Strategy

Add a **Step 3b** in `caregiverContacts.service.ts` `getActiveJobContacts()`, after the guardians query and before the fellows query.

**Approach A — Through `placements` table (recommended):**

The `placements` table directly links `caregiving_job_id` to `patient_id`. This avoids the need to traverse GAC → guardian → patients.

```typescript
// Step 3b: Get patient-users via placements on active jobs
const { data: patientData, error: patientError } = await sbData()
  .from("placements")
  .select(`
    patient_id,
    patients!inner(
      id,
      name,
      profiles!inner(id, name, role, avatar)
    )
  `)
  .in("caregiving_job_id", jobIdsArray)
  .eq("patients.status", "active")
  .not("patient_id", "is", null);

// Filter to only patient-role users (profiles.role = 'patient')
const patients = (patientData || [])
  .map((pl: any) => pl.patients?.profiles)
  .filter((p: any) => p?.role === "patient" && p?.id !== cgId)
  .map((p: any) => mapContact(p, "active_job_contacts"));
```

**Caveat**: The `patients → profiles` join assumes `patients.id = profiles.id` for self-monitoring patients. PostgREST won't traverse this as a foreign key since there's no FK constraint between them. You may need to:
1. First get `patient_id` values from placements
2. Then query `profiles` directly: `SELECT id, name, role, avatar FROM profiles WHERE id IN (patient_ids) AND role = 'patient'`

**Approach B — Through GAC → guardian → patients → profiles (matches plan SQL):**

```typescript
// Step 3b: Get patient-users via guardian → patients → profiles
// Already have guardianIds from the guardians query
const guardianIds = (guardianData || [])
  .map((j: any) => j.care_contracts?.owner_id)
  .filter(Boolean);

if (guardianIds.length > 0) {
  // Get patients registered by these guardians
  const { data: ptData } = await sbData()
    .from("patients")
    .select("id, name")
    .in("guardian_id", guardianIds)
    .eq("status", "active");

  // Check which patients have profiles with role='patient'
  const patientEntityIds = (ptData || []).map((pt: any) => pt.id);
  if (patientEntityIds.length > 0) {
    const { data: patientProfiles } = await sbData()
      .from("profiles")
      .select("id, name, role, avatar")
      .in("id", patientEntityIds)
      .eq("role", "patient");

    const patientContacts = (patientProfiles || [])
      .filter((p: any) => p.id !== cgId)
      .map((p: any) => mapContact(p, "active_job_contacts"));
  }
}
```

**Recommendation**: Use Approach B (through guardian → patients → profiles). It's more explicit and doesn't depend on the `placements.caregiving_job_id` column being populated (it was added via ALTER TABLE and may be nullable for older data). Both approaches need a 2-step query since PostgREST can't traverse `patients.id → profiles.id` as a foreign key.

#### Files to Modify

- `src/backend/services/caregiverContacts.service.ts` — add Step 3b in `getActiveJobContacts()`
- `src/backend/api/mock/caregiverMocks.ts` — already has mock patient contacts, no changes needed

#### RLS Consideration

The caregiver has RLS access to read patients via:
```sql
CREATE POLICY "patients_select_caregiver" ON public.patients
  AS PERMISSIVE FOR SELECT USING (
    EXISTS (SELECT 1 FROM placements WHERE placements.patient_id = patients.id
            AND placements.caregiver_id = (SELECT auth.uid())
            AND placements.status = 'active')
  );
```
This means the caregiver can only see patients where they have an active placement. The `patients` query must go through `placements` or the RLS policy will block it. **Approach B may fail RLS** if there's no active placement linking the caregiver to the patient — even though they share an active caregiving job.

**Revised recommendation**: Use Approach A (through placements) since it respects the existing RLS policy. Fall back to Approach B only if placements data is sparse.

---

### Item 2: Tests

#### 2a. Service Unit Test — ✅ ALREADY EXISTS AND PASSING (12/12)

**File**: `src/backend/services/__tests__/caregiverContacts.service.test.ts` (123 lines)

Coverage:
- `getAgenciesForCaregiver`: returns agency profiles, includes agency metadata
- `getActiveJobContacts`: returns active job contacts, includes guardians/patients/caregivers, includes contact metadata
- `getActiveJobParticipantIds`: returns set of participant IDs, returns unique IDs matching active job contacts
- `searchContacts`: returns all when empty query, filters by name case-insensitively, filters guardians/caregivers by name, returns empty for no matches

Uses inline mock data via `demoOfflineDelayAndPick` mock — self-contained, does not import from caregiverMocks.

**No action needed for this item.**

#### 2b. Component Test (Priority: Low)

**File**: `src/frontend/components/shared/__tests__/NewChatModal.test.tsx`

```typescript
// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NewChatModal } from "../NewChatModal";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "newChat": "New Chat",
        "searchContacts": "Search contacts...",
        "loading": "Loading...",
        "noContactsFound": "No contacts found.",
        "noContactsAvailable": "No contacts available.",
        "section.agencies": "Agencies",
        "section.jobContacts": "Active Job Contacts",
        "contactRole.agency": "Agency",
        "contactRole.guardian": "Guardian",
        "contactRole.patient": "Patient",
        "contactRole.caregiver": "Fellow Caregiver",
      };
      return map[key] || key;
    },
    i18n: { language: "en" },
  }),
}));

vi.mock("@/backend/store", () => ({
  useAuth: () => ({ user: { id: "caregiver-1", activeRole: "caregiver" } }),
}));

vi.mock("@/backend/services/caregiverContacts.service", () => ({
  caregiverContactsService: {
    searchContacts: vi.fn(async (_id: string, query: string) => {
      if (query === "fail") throw new Error("test error");
      return [
        { id: "a1", name: "Test Agency", role: "agency", group: "agencies", avatar: "TA" },
        { id: "g1", name: "Test Guardian", role: "guardian", group: "active_job_contacts", avatar: "TG" },
      ];
    }),
  },
}));

describe("NewChatModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSelectContact: vi.fn(),
    accentColor: "#FF0000",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders search input when open", () => {
    render(<NewChatModal {...defaultProps} />);
    expect(screen.getByPlaceholderText("Search contacts...")).toBeTruthy();
  });

  it("renders nothing when closed", () => {
    render(<NewChatModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByPlaceholderText("Search contacts...")).toBeNull();
  });

  it("shows contacts after loading", async () => {
    render(<NewChatModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("Test Agency")).toBeTruthy();
      expect(screen.getByText("Test Guardian")).toBeTruthy();
    });
  });

  it("groups contacts into Agencies and Active Job Contacts sections", async () => {
    render(<NewChatModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("Agencies")).toBeTruthy();
      expect(screen.getByText("Active Job Contacts")).toBeTruthy();
    });
  });

  it("calls onSelectContact when a contact is clicked", async () => {
    render(<NewChatModal {...defaultProps} />);
    await waitFor(() => screen.getByText("Test Agency"));
    fireEvent.click(screen.getByText("Test Agency"));
    expect(defaultProps.onSelectContact).toHaveBeenCalledWith(
      expect.objectContaining({ id: "a1", role: "agency" })
    );
  });

  it("calls onClose when backdrop is clicked", () => {
    render(<NewChatModal {...defaultProps} />);
    const backdrop = document.querySelector(".bg-black\/50");
    if (backdrop) fireEvent.click(backdrop);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
```

#### 2c. E2E Test (Priority: Low)

**File**: `e2e/carenet/caregiver-new-chat.spec.ts`

Follow existing pattern from `auth.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";
import { demoLogin, captureConsoleErrors, goto } from "./helpers";

test.describe("Caregiver New Chat", () => {
  test("can open New Chat modal and see contacts", async ({ page }) => {
    const errors = captureConsoleErrors(page);
    await demoLogin(page, "caregiver");
    await goto(page, "/caregiver/messages");

    // Should see the New Chat button
    const newChatBtn = page.getByRole("button", { name: /new chat/i });
    await expect(newChatBtn).toBeVisible();

    // Click to open modal
    await newChatBtn.click();

    // Modal should appear with search input
    await expect(page.getByPlaceholder(/search contacts/i)).toBeVisible();

    // Should show grouped sections after loading
    await expect(page.getByText("Agencies")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Active Job Contacts")).toBeVisible({ timeout: 5000 });

    // Click an agency contact
    const firstAgency = page.locator("text=HealthCare Pro BD").first();
    if (await firstAgency.isVisible()) {
      await firstAgency.click();
      // Modal should close
      await expect(page.getByPlaceholder(/search contacts/i)).not.toBeVisible();
    }

    expect(errors()).toHaveLength(0);
  });

  test("can search contacts by name", async ({ page }) => {
    const errors = captureConsoleErrors(page);
    await demoLogin(page, "caregiver");
    await goto(page, "/caregiver/messages");

    await page.getByRole("button", { name: /new chat/i }).click();
    const searchInput = page.getByPlaceholder(/search contacts/i);
    await expect(searchInput).toBeVisible();

    // Type a search query
    await searchInput.fill("Fatema");

    // Should show filtered results
    await page.waitForTimeout(500); // debounce
    const results = page.locator("button.cn-touch-target");
    const count = await results.count();
    expect(count).toBeGreaterThan(0);

    expect(errors()).toHaveLength(0);
  });

  test("other roles do not see New Chat button", async ({ page }) => {
    const errors = captureConsoleErrors(page);
    await demoLogin(page, "guardian");
    await goto(page, "/guardian/messages");

    const newChatBtn = page.getByRole("button", { name: /new chat/i });
    await expect(newChatBtn).not.toBeVisible();

    expect(errors()).toHaveLength(0);
  });
});
```

#### Recommended Implementation Order

1. ~~**Service unit test**~~ — ✅ Already exists, 12/12 passing
2. **Patient-user query** (`caregiverContacts.service.ts` Step 3b) — add the placements-based patient lookup
3. **Component test** (`NewChatModal.test.tsx`) — validates rendering and interactions
4. **E2E test** (`caregiver-new-chat.spec.ts`) — validates full flow in browser, run last
