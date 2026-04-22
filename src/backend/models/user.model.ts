/** Supported platform roles */
export type Role = "caregiver" | "guardian" | "patient" | "agency" | "admin" | "moderator" | "shop" | "channel_partner";

/** Base user record shared across all roles */
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: Role;
  activeRole: Role;
  verified: boolean;
  createdAt: string;
}

/** Auth credentials for login */
export interface LoginCredentials {
  phone: string;
  otp?: string;
  password?: string;
}

/** Auth state managed by AuthContext */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
