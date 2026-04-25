/**
 * CareNet Mock Auth Service — Email + Password + TOTP MFA
 *
 * Simulates backend auth: email/password login, TOTP verification, registration.
 * All demo accounts use password "demo1234" and TOTP code "123456".
 */
import type { Role, User, RegisterData, ActivationStatus } from "./types";

/** True for one-click demo users and @carenet.demo accounts — stable ids for Dexie drafts / offline queue */
export function isDemoUser(user: Pick<User, "email" | "id">): boolean {
  return (
    user.email?.endsWith("@carenet.demo") === true ||
    user.id.startsWith("demo-") === true
  );
}

export const DEMO_PASSWORD = "demo1234";
export const DEMO_TOTP = "123456";
/** @deprecated Use DEMO_TOTP */
export const DEMO_OTP = DEMO_TOTP;

const MOCK_REGISTRY_KEY = "carenet-mock-registry";

function inferRoleFromEmail(email: string): Role {
  const local = email.split("@")[0].toLowerCase();
  if (local.startsWith("caregiver")) return "caregiver";
  if (local.startsWith("guardian")) return "guardian";
  if (local.startsWith("patient")) return "patient";
  if (local.startsWith("shopowner")) return "shop";
  if (local.startsWith("channelpartner") || local.startsWith("channel_partner") || local.startsWith("cp")) return "channel_partner";
  if (local === "agent1") return "admin";
  if (local === "agent") return "agency";
  return "guardian";
}

interface MockRegistry {
  emails: string[];
  phones: string[];
  users: Record<string, User>;
}

function loadMockRegistry(): MockRegistry {
  try {
    const raw = localStorage.getItem(MOCK_REGISTRY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        emails: parsed.emails || [],
        phones: parsed.phones || [],
        users: parsed.users || {},
      };
    }
  } catch { /* ignore */ }
  return { emails: [], phones: [], users: {} };
}

function saveMockRegistry(registry: MockRegistry) {
  localStorage.setItem(MOCK_REGISTRY_KEY, JSON.stringify(registry));
}

/** Demo accounts — one per role, plus a multi-role user */
const DEMO_USERS: User[] = [
  {
    id: "demo-caregiver-1",
    name: "Mock_Karim Uddin",
    email: "caregiver@carenet.demo",
    phone: "01712345678",
    roles: ["caregiver"],
    activeRole: "caregiver",
    district: "Dhaka",
    createdAt: "2024-06-15",
    mfaEnrolled: true,
    activationStatus: "approved",
    profile: { specialty: "Elderly Care", experience: 5, rating: 4.8 },
  },
  {
    id: "demo-guardian-1",
    name: "Mock_Rashed Hossain",
    email: "guardian@carenet.demo",
    phone: "01812345678",
    roles: ["guardian"],
    activeRole: "guardian",
    district: "Chittagong",
    createdAt: "2024-03-10",
    mfaEnrolled: true,
  },
  {
    id: "demo-patient-1",
    name: "Mock_Amina Begum",
    email: "patient@carenet.demo",
    phone: "01912345678",
    roles: ["patient"],
    activeRole: "patient",
    district: "Dhaka",
    createdAt: "2024-08-22",
    mfaEnrolled: true,
  },
  {
    id: "demo-agency-1",
    name: "Mock_CareFirst Agency",
    email: "agency@carenet.demo",
    phone: "01612345678",
    roles: ["agency"],
    activeRole: "agency",
    district: "Dhaka",
    createdAt: "2024-01-05",
    mfaEnrolled: true,
    profile: { agencyName: "Mock_CareFirst BD", license: "BD-AGN-2024-001" },
  },
  {
    id: "demo-admin-1",
    name: "Mock_Admin User",
    email: "admin@carenet.demo",
    phone: "01512345678",
    roles: ["admin"],
    activeRole: "admin",
    district: "Dhaka",
    createdAt: "2024-01-01",
    mfaEnrolled: true,
  },
  {
    id: "demo-moderator-1",
    name: "Mock_Mod User",
    email: "moderator@carenet.demo",
    phone: "01412345678",
    roles: ["moderator"],
    activeRole: "moderator",
    district: "Dhaka",
    createdAt: "2024-05-01",
    mfaEnrolled: true,
  },
  {
    id: "demo-shop-1",
    name: "Mock_MediMart Store",
    email: "shop@carenet.demo",
    phone: "01312345678",
    roles: ["shop"],
    activeRole: "shop",
    district: "Dhaka",
    createdAt: "2024-04-15",
    mfaEnrolled: true,
    profile: { shopName: "Mock_MediMart", category: "Medicines" },
  },
  {
    id: "demo-channel-partner-1",
    name: "Mock_Channel Partner",
    email: "channelpartner@carenet.demo",
    phone: "01212345678",
    roles: ["channel_partner"],
    activeRole: "channel_partner",
    district: "Dhaka",
    createdAt: "2024-02-01",
    mfaEnrolled: true,
    profile: { partnerName: "Mock Referral Hub", region: "Dhaka" },
  },
  {
    id: "demo-multi-1",
    name: "Mock_Multi-Role Demo",
    email: "multi@carenet.demo",
    phone: "01011111111",
    roles: ["guardian", "caregiver", "admin"],
    activeRole: "guardian",
    district: "Dhaka",
    createdAt: "2024-01-01",
    mfaEnrolled: true,
  },
];

/** Role -> demo email mapping (for quick-login buttons) */
export const DEMO_ACCOUNTS: { role: Role; email: string; name: string }[] = [
  { role: "caregiver", email: "caregiver@carenet.demo", name: "Mock_Karim Uddin" },
  { role: "guardian", email: "guardian@carenet.demo", name: "Mock_Rashed Hossain" },
  { role: "patient", email: "patient@carenet.demo", name: "Mock_Amina Begum" },
  { role: "agency", email: "agency@carenet.demo", name: "Mock_CareFirst Agency" },
  { role: "shop", email: "shop@carenet.demo", name: "Mock_MediMart Store" },
  { role: "channel_partner", email: "channelpartner@carenet.demo", name: "Mock_Channel Partner" },
];

/**
 * Mock email + password login.
 * Demo: any @carenet.demo email with password "demo1234" works.
 * Any other email with password length >= 8 also works (for testing).
 */
export async function mockLogin(
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; needsMfa?: boolean; error?: string }> {
  await delay(600);

  const normalizedEmail = email.trim().toLowerCase();

  // Check demo accounts first
  const demoUser = DEMO_USERS.find((u) => u.email === normalizedEmail);
  if (demoUser) {
    if (password !== DEMO_PASSWORD) {
      return { success: false, error: `Invalid password. Demo password: ${DEMO_PASSWORD}` };
    }
    // Demo users always have MFA enrolled → require TOTP
    return { success: true, user: { ...demoUser }, needsMfa: true };
  }

  // Check previously registered mock users
  const registry = loadMockRegistry();
  const registered = registry.users[normalizedEmail];
  if (registered) {
    if (password.length < 8) {
      return { success: false, error: "Invalid email or password" };
    }
    return { success: true, user: { ...registered }, needsMfa: registered.mfaEnrolled };
  }

  // Legacy: email registered before users map existed — infer role from email
  if (registry.emails.includes(normalizedEmail)) {
    const role = inferRoleFromEmail(normalizedEmail);
    const migrated: User = {
      id: `user-${Date.now()}`,
      name: normalizedEmail.split("@")[0],
      email: normalizedEmail,
      roles: [role],
      activeRole: role,
      mfaEnrolled: false,
      createdAt: new Date().toISOString(),
    };
    registry.users[normalizedEmail] = migrated;
    saveMockRegistry(registry);
    if (password.length < 8) {
      return { success: false, error: "Invalid email or password" };
    }
    return { success: true, user: { ...migrated }, needsMfa: false };
  }

  // For non-demo: any email with password >= 8 chars succeeds
  if (password.length < 8) {
    return { success: false, error: "Invalid email or password" };
  }

  // New/unknown user — infer role from email pattern
  const role = inferRoleFromEmail(normalizedEmail);
  const newUser: User = {
    id: `user-${Date.now()}`,
    name: normalizedEmail.split("@")[0],
    email: normalizedEmail,
    roles: [role],
    activeRole: role,
    mfaEnrolled: true,
    createdAt: new Date().toISOString(),
  };
  return { success: true, user: newUser, needsMfa: true };
}

/**
 * Verify TOTP code. Demo code: "123456".
 */
export async function mockVerifyTotp(
  code: string
): Promise<{ success: boolean; error?: string }> {
  await delay(500);
  if (code === DEMO_TOTP) {
    return { success: true };
  }
  return { success: false, error: `Invalid code. Demo TOTP: ${DEMO_TOTP}` };
}

/**
 * Register a new user (mock).
 */
export async function mockRegister(
  data: RegisterData
): Promise<{ success: boolean; user?: User; error?: string }> {
  await delay(1000);

  // Demo accounts are login-only; registration is never permitted.
  if (data.email.trim().toLowerCase().endsWith("@carenet.demo")) {
    return {
      success: false,
      error: "Demo accounts cannot be registered. Use the demo login on the Sign In page.",
    };
  }

  const normalizedEmail = data.email.trim().toLowerCase();
  const normalizedPhone = (data.phone || "").trim();

  const existing = DEMO_USERS.find((u) => u.email === normalizedEmail);
  if (existing) {
    return { success: false, error: "This email is already registered. Sign in instead." };
  }

  const registry = loadMockRegistry();
  if (registry.emails.includes(normalizedEmail)) {
    return { success: false, error: "This email is already registered. Sign in instead." };
  }
  if (normalizedPhone && registry.phones.includes(normalizedPhone)) {
    return { success: false, error: "This phone number is already registered." };
  }

  // Auto-approve low-risk roles (guardian, patient)
  const initialStatus: ActivationStatus =
    data.role === 'guardian' || data.role === 'patient' ? 'approved' : 'profile_incomplete';

  const newUser: User = {
    id: `user-${Date.now()}`,
    name: data.name,
    email: normalizedEmail,
    phone: data.phone,
    roles: [data.role],
    activeRole: data.role,
    district: data.district,
    mfaEnrolled: false,
    createdAt: new Date().toISOString(),
    profile: data.roleData,
    activationStatus: initialStatus,
  };

  registry.emails.push(normalizedEmail);
  if (normalizedPhone) registry.phones.push(normalizedPhone);
  registry.users[normalizedEmail] = newUser;
  saveMockRegistry(registry);

  return { success: true, user: newUser };
}

/**
 * Mock forgot password — sends reset link to email.
 */
export async function mockForgotPassword(
  email: string
): Promise<{ success: boolean; error?: string }> {
  await delay(800);
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail.includes("@")) {
    return { success: false, error: "Invalid email address" };
  }
  console.log(`[MockAuth] Password reset email sent to ${normalizedEmail}`);
  return { success: true };
}

/**
 * Mock reset password.
 */
export async function mockResetPassword(
  password: string
): Promise<{ success: boolean; error?: string }> {
  await delay(800);
  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" };
  }
  return { success: true };
}

/**
 * Get demo user by role (for quick-login).
 */
export function getDemoUserByRole(role: Role): User {
  const found = DEMO_USERS.find(
    (u) => u.activeRole === role || u.roles.includes(role)
  );
  if (found) return { ...found, activeRole: role, activationStatus: 'approved' };

  return {
    id: `demo-${role}`,
    name: `Demo ${role}`,
    email: `${role}@carenet.demo`,
    roles: [role],
    activeRole: role,
    mfaEnrolled: true,
    createdAt: new Date().toISOString(),
    activationStatus: 'approved',
  };
}

// ─── Legacy aliases (backward compat) ───────────────────────────

/** @deprecated Use mockLogin instead */
export async function mockRequestOtp(
  phone: string
): Promise<{ success: boolean; error?: string }> {
  await delay(600);
  return { success: true };
}

/** @deprecated Use mockLogin + mockVerifyTotp instead */
export async function mockVerifyOtp(
  phone: string,
  code: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  if (code !== DEMO_TOTP) {
    return { success: false, error: "Invalid code" };
  }
  const found = DEMO_USERS.find((u) => u.phone === phone);
  if (found) return { success: true, user: { ...found } };
  return {
    success: true,
    user: {
      id: `user-${Date.now()}`,
      name: "",
      email: "",
      phone,
      roles: [],
      activeRole: "guardian",
      createdAt: new Date().toISOString(),
    },
  };
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Mock activation service helpers ───────────────────────────────

/**
 * Mock: submit profile for review (profile_incomplete -> pending_approval)
 */
export async function mockSubmitProfileForReview(
  profileId: string
): Promise<{ success: boolean; error?: string }> {
  await delay(500);
  const registry = loadMockRegistry();
  const user = Object.values(registry.users).find((u) => u.id === profileId);
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  if (user.activationStatus !== 'profile_incomplete') {
    return { success: false, error: 'Profile must be incomplete to submit' };
  }
  user.activationStatus = 'pending_approval';
  saveMockRegistry(registry);
  return { success: true };
}

/**
 * Mock: reopen for editing (rejected -> profile_incomplete)
 */
export async function mockReopenForEditing(
  profileId: string
): Promise<{ success: boolean; error?: string }> {
  await delay(500);
  const registry = loadMockRegistry();
  const user = Object.values(registry.users).find((u) => u.id === profileId);
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  if (user.activationStatus !== 'rejected') {
    return { success: false, error: 'Profile must be rejected to reopen' };
  }
  user.activationStatus = 'profile_incomplete';
  user.activationNote = undefined;
  saveMockRegistry(registry);
  return { success: true };
}

/**
 * Mock: approve activation (pending_approval -> approved)
 */
export async function mockApproveUser(
  profileId: string,
  reviewerName: string,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  await delay(500);
  const registry = loadMockRegistry();
  const user = Object.values(registry.users).find((u) => u.id === profileId);
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  if (user.activationStatus !== 'pending_approval') {
    return { success: false, error: 'Profile must be pending to approve' };
  }
  user.activationStatus = 'approved';
  user.activationNote = undefined;
  saveMockRegistry(registry);
  console.log(`[MockAuth] User ${profileId} approved by ${reviewerName}`);
  return { success: true };
}

/**
 * Mock: reject activation (pending_approval -> rejected)
 */
export async function mockRejectUser(
  profileId: string,
  reviewerName: string,
  note: string
): Promise<{ success: boolean; error?: string }> {
  await delay(500);
  const registry = loadMockRegistry();
  const user = Object.values(registry.users).find((u) => u.id === profileId);
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  if (user.activationStatus !== 'pending_approval') {
    return { success: false, error: 'Profile must be pending to reject' };
  }
  user.activationStatus = 'rejected';
  user.activationNote = note;
  saveMockRegistry(registry);
  console.log(`[MockAuth] User ${profileId} rejected by ${reviewerName}: ${note}`);
  return { success: true };
}

/**
 * Mock: get my activation status from registry
 */
export function mockGetMyActivationStatus(
  profileId: string
): { activationStatus: ActivationStatus; activationNote?: string } | null {
  const registry = loadMockRegistry();
  const user = Object.values(registry.users).find((u) => u.id === profileId);
  if (!user) return null;
  return {
    activationStatus: user.activationStatus || 'approved',
    activationNote: user.activationNote,
  };
}
