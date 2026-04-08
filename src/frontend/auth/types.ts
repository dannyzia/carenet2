/**
 * CareNet Auth Types — Email + Password + TOTP MFA
 */

export type Role =
  | "caregiver"
  | "guardian"
  | "patient"
  | "agency"
  | "admin"
  | "moderator"
  | "shop";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  roles: Role[];
  activeRole: Role;
  district?: string;
  createdAt: string;
  /** Whether TOTP MFA has been enrolled */
  mfaEnrolled?: boolean;
  /** Role-specific profile data */
  profile?: Record<string, any>;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  district?: string;
  role: Role;
  /** Role-specific fields */
  roleData?: Record<string, any>;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Sign in with email + password */
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; needsMfa?: boolean; error?: string }>;
  /** Verify TOTP MFA code after login */
  verifyMfa: (code: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  /** Enroll TOTP MFA — returns QR data URI and plain secret for display */
  enrollMfa: () => Promise<{ success: boolean; factorId?: string; qrCode?: string; secret?: string; error?: string }>;
  /** Register a new user */
  register: (data: RegisterData) => Promise<{
    success: boolean;
    user?: User;
    error?: string;
    /** Supabase returned a session (email confirmation disabled or already confirmed). */
    signedInWithoutEmailConfirmation?: boolean;
  }>;
  /** Request password reset email */
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  /** Reset password (after clicking email link) */
  resetPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  /** Switch active role (for multi-role users) */
  switchRole: (role: Role) => void;
  /** Log out and clear state */
  logout: () => void;
  /** Quick demo login — bypasses email/password/MFA; clears Supabase session when configured so Dexie keys stay stable */
  demoLogin: (role: Role) => Promise<void>;

  // Legacy aliases for backward compatibility with pages that haven't migrated
  /** @deprecated Use login() instead */
  requestOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  /** @deprecated Use login() + verifyMfa() instead */
  verifyOtp: (phone: string, code: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  /** @deprecated Alias for register() */
  registerUser: (data: any) => Promise<{
    success: boolean;
    error?: string;
    signedInWithoutEmailConfirmation?: boolean;
  }>;
}
