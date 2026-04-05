# Plan 03 — Auth Recovery & Google OAuth

> **Goal:** Add Google OAuth login, improve account recovery options, and make MFA required for real Supabase users.

> **Scope:** Authentication flows — login, registration, password recovery, account recovery.

---

## Requirements

### 1. Google OAuth Login
- Add "Continue with Google" button to LoginPage.tsx
- Wire up Supabase OAuth for Google provider
- Handle OAuth callback — auto-create profile on first login
- Users who sign up via Google skip email verification

### 2. Phone-Based Account Recovery
- Add "Find my account" flow on ForgotPasswordPage
- User enters phone number → system finds email, sends reset link
- Requires querying `profiles` table by phone (already has phone)

### 3. Admin Account Recovery
- For cases where user has no access to email or phone
- Admin can reset user password via Supabase Dashboard or API
- Document process for support team

### 4. Make MFA Required (from previous task)
- Force MFA enrollment during Supabase registration
- Block app access until MFA verified
- Redirect to MFA setup before dashboard access

---

## Files to Change

| File | Change |
|---|---|
| `src/frontend/pages/auth/LoginPage.tsx` | Add Google login button + OAuth handler |
| `src/frontend/pages/auth/ForgotPasswordPage.tsx` | Add "Find account by phone" tab |
| `src/frontend/auth/AuthContext.tsx` | Handle OAuth signup/profile creation, force MFA, protect routes |
| `src/frontend/pages/auth/MFASetupPage.tsx` | After registration success, verify MFA |
| `src/frontend/pages/auth/MFAVerifyPage.tsx` | Redirect if not enrolled |
| `src/frontend/auth/mockAuth.ts` | No changes needed |
| `src/locales/en/auth.json` + `bn/auth.json` | New strings for recovery flow |
| `supabase/migrations/` | (Optional) Enable Google OAuth in Dashboard — not code |

---

## UI/UX Design

### LoginPage.tsx — Google Button
- Add below existing demo/email login buttons
- Styled consistently with app theme
- Shows "Continue with Google" with Google icon

### ForgotPasswordPage.tsx — Two Tabs
- **Tab 1:** "Reset by Email" (existing)
- **Tab 2:** "Find my account" (new) — user enters phone → shows email → sends reset

### MFA Flow
- **New user registers → auto-enrolled in MFA → must verify before app access**
- **Existing users:** Prompt to set up MFA on next login (optional, not enforced yet)

---

## Supabase Setup (Not Code — Dashboard)

1. **Enable Google OAuth:**
   - Go to Authentication → Providers → Google
   - Enable provider
   - Enter Client ID and Client Secret from Google Cloud Console
   - Set redirect URL: `https://[your-project].supabase.co/auth/v1/callback`

2. **Configure Site URL:**
   - Authentication → URL Configuration
   - Site URL: `http://localhost:5173` (dev) or `https://carenet.app` (prod)

---

## Development Steps

### Step 1 — Add Google OAuth to LoginPage

```tsx
// Add imports
import { supabase } from "@/backend/services/supabase";

// Add handler
const handleGoogleLogin = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) setError(error.message);
};

// Add button in JSX:
// <button onClick={handleGoogleLogin} className="...">Continue with Google</button>
```

### Step 2 — Handle OAuth Callback

- Create `/auth/callback` route (or use existing)
- On callback, check if new user → create profile if needed
- Already handled by Supabase trigger + existing flow

### Step 3 — Add Phone Recovery to ForgotPasswordPage

- Add tab switcher (Email / Phone)
- Phone tab: Input phone → Query profiles → Show email → Send reset
- Add i18n strings

### Step 4 — Make MFA Required

- In AuthContext.register(): Auto-enroll MFA after signup
- Return `needsMfa: true` + MFA data to page
- Redirect to MFA verify before dashboard
- Login flow already checks MFA enrollment

### Step 5 — Protect Routes

- Add route guard: If user has `!mfaEnrolled`, redirect to MFA setup
- Apply to all dashboard routes

---

## Risk

| Risk | Mitigation |
|---|---|
| Google OAuth misconfigured | Test with localhost first |
| Phone recovery exposes email | Only show email after SMS/email verification |
| MFA enrollment fails | Allow retry, don't block registration |
| Existing users skip MFA | Make optional for now, prompt on next login |

---

## Out of Scope (Future)

- SMS OTP verification (vs TOTP)
- Biometric login (fingerprint/face)
- Passwordless login via magic link
- Social login beyond Google (Facebook, Apple)
- CAPTCHA to prevent abuse

---

## Acceptance Criteria

- [ ] Google login button appears on LoginPage
- [ ] Clicking Google button redirects to Google, returns with authenticated session
- [ ] New Google users have profiles created automatically
- [ ] "Find account by phone" works on ForgotPasswordPage
- [ ] New registrations must verify MFA before app access
- [ ] Existing users are not blocked (MFA remains optional)
- [ ] Build passes