# Plan 02 — Unique Email & Multi-Account Prevention

> **Goal:** Prevent users from creating multiple accounts by enforcing email and phone uniqueness at every layer (DB, backend, frontend).
>
> **Scope:** Registration flow only. Login, demo flow, and existing functionality untouched.

---

## Requirements

1. `profiles.email` must be `UNIQUE` at the DB level — belt-and-suspenders with `auth.users`.
2. `profiles.phone` must be `NOT NULL` and `UNIQUE` — phone is the strongest real-world identifier for this demographic.
3. Phone becomes a required field on the Register form.
4. Client-side pre-check: before calling `register()`, query whether the email or phone already exists (Supabase) or check mock store.
5. Mock mode must also enforce uniqueness (in-memory set of registered emails/phones).
6. Supabase dashboard should require email confirmation (document, not code).

---

## Files to Change

| File | Change |
|---|---|
| `supabase/migrations/YYYYMMDD_unique_email_phone.sql` | **NEW** — migration: `UNIQUE` constraints on `profiles.email` and `profiles.phone`, make `phone NOT NULL` |
| `src/frontend/pages/auth/RegisterPage.tsx` | Phone required, pre-check email/phone uniqueness before submit |
| `src/frontend/auth/AuthContext.tsx` | `register()` — add pre-flight uniqueness check (Supabase query or mock) |
| `src/frontend/auth/mockAuth.ts` | `mockRegister()` — track registered emails/phones in memory, reject duplicates |
| `src/frontend/auth/types.ts` | `RegisterData.phone` → required (remove `?`) |
| `src/locales/en/auth.json` + `src/locales/bn/auth.json` | New error strings: email taken, phone taken, phone required |

---

## Development Steps

### Step 1 — Supabase Migration

**New file:** `supabase/migrations/20260404_unique_email_phone.sql`

```sql
-- Make phone mandatory
ALTER TABLE profiles ALTER COLUMN phone SET NOT NULL;

-- Add unique constraints
ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
ALTER TABLE profiles ADD CONSTRAINT profiles_phone_unique UNIQUE (phone);

-- Update trigger to include email from auth.users
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email, phone, role, active_role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'guardian'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'guardian')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Step 2 — `types.ts`: Phone Required

```ts
// Before: phone?: string;
// After:  phone: string;
```

### Step 3 — `mockAuth.ts`: In-Memory Uniqueness

- Track registered emails and phones in arrays (persisted to `localStorage` under a key like `carenet-mock-registry`).
- `mockRegister()` checks both arrays before creating a user.
- On success, push the email and phone into the registry.

### Step 4 — `AuthContext.tsx register()`: Pre-Flight Check

- **Supabase path:** Before `supabase.auth.signUp()`, query `profiles` for existing email or phone:
  ```ts
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .or(`email.eq.${email},phone.eq.${phone}`)
    .limit(1);
  ```
  If a row comes back, return `{ success: false, error: "..." }` before calling `signUp`.
- **Mock path:** `mockRegister()` already handles it after Step 3.

### Step 5 — `RegisterPage.tsx`: Phone Required + UX

- Remove "(Optional)" from phone label.
- Add `required` attribute to phone input.
- Show real-time error from the pre-flight check.
- Clear error when user edits the conflicting field.

### Step 6 — i18n Strings

Add to both `en` and `bn` locale files:

| Key | EN | BN |
|---|---|---|
| `auth:register.emailTaken` | "This email is already registered. Sign in instead." | "এই ইমেইলটি ইতিমধ্যে নিবন্ধিত। পরিবর্তে সাইন ইন করুন।" |
| `auth:register.phoneTaken` | "This phone number is already registered." | "এই ফোন নম্বরটি ইতিমধ্যে নিবন্ধিত।" |
| `auth:register.phoneRequired` | "Phone number is required" | "ফোন নম্বর আবশ্যক" |

---

## UX / UI

- Phone field: label changes from "Phone Number (Optional)" to "Phone Number", red border on empty submit.
- On pre-flight conflict: error banner at the bottom of the form (same style as existing `error` state), with a link to the login page if email is taken.
- No new components — reuse existing input + error patterns.

---

## Out of Scope (Future)

- CAPTCHA / bot protection
- Device fingerprinting
- IP-based rate limiting
- Admin multi-account detection dashboard
- SMS OTP verification on signup

---

## Risk

- **Migration risk:** Existing rows with duplicate emails or empty phones will cause `UNIQUE` / `NOT NULL` to fail. Run a data audit query before applying; clean up duplicates manually or via a pre-migration script.
- **Phone as unique:** Users sharing a phone (family members) will be blocked. This is intentional for CareNet's use case — each person must have a distinct number.
