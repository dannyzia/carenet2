/**
 * API endpoint constants organized by service domain.
 * Used with apiClient.get/post/put/delete.
 */
export const API = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    verifyOtp: "/auth/verify-otp",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
  },
  users: {
    me: "/users/me",
    profile: (id: string) => `/users/${id}/profile`,
    updateRole: "/users/me/role",
  },
  caregivers: {
    list: "/caregivers",
    detail: (id: string) => `/caregivers/${id}`,
    search: "/caregivers/search",
    jobs: "/caregivers/jobs",
    shifts: "/caregivers/shifts",
    earnings: "/caregivers/earnings",
  },
  patients: {
    list: "/patients",
    detail: (id: string) => `/patients/${id}`,
    vitals: (id: string) => `/patients/${id}/vitals`,
    medications: (id: string) => `/patients/${id}/medications`,
  },
  guardians: {
    patients: "/guardians/patients",
    requirements: "/guardians/requirements",
    placements: "/guardians/placements",
  },
  agencies: {
    list: "/agencies",
    detail: (id: string) => `/agencies/${id}`,
    caregivers: (id: string) => `/agencies/${id}/caregivers`,
    jobs: (id: string) => `/agencies/${id}/jobs`,
  },
  placements: {
    list: "/placements",
    detail: (id: string) => `/placements/${id}`,
    create: "/placements",
  },
  shifts: {
    list: "/shifts",
    checkIn: (id: string) => `/shifts/${id}/check-in`,
    checkOut: (id: string) => `/shifts/${id}/check-out`,
  },
  payments: {
    transactions: "/payments/transactions",
    wallet: "/payments/wallet",
    payout: "/payments/payout",
  },
  notifications: {
    list: "/notifications",
    markRead: (id: string) => `/notifications/${id}/read`,
    preferences: "/notifications/preferences",
  },
  messages: {
    threads: "/messages/threads",
    thread: (id: string) => `/messages/threads/${id}`,
    send: "/messages/send",
  },
  shop: {
    products: "/shop/products",
    product: (id: string) => `/shop/products/${id}`,
    cart: "/shop/cart",
    wishlist: "/shop/wishlist",
    orders: "/shop/orders",
  },
} as const;

/** Full platform route registry from `packages-1.md` §1 (UCCF platform API). */
export { PLATFORM_API, PLATFORM_API_TOTAL } from "./platformEndpoints";
