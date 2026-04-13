/**
 * Public “create an account” entry from the marketing shell (navbar Register, login Sign up).
 * Role is chosen on RoleSelectionPage, then the user is sent to `/auth/register/:role`.
 * Must stay aligned with [src/app/routes.ts](src/app/routes.ts).
 */
export const AUTH_PUBLIC_SIGNUP_PATH = "/auth/role-selection";
