/**
 * Supabase Auth `redirect_to` for email confirmation, signup resend, and similar flows.
 * Must be listed under Dashboard → Authentication → URL Configuration → Redirect URLs.
 */
export function getAuthEmailRedirectTo(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const { origin } = window.location;
  if (!origin || origin === "null") return undefined;
  return `${origin}/auth/callback`;
}
