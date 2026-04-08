/**
 * Platform HTTP surface from `src/imports/packages-1.md` §1 (API SPEC).
 * Use these path builders with `apiClient` when a `/api` gateway exists.
 * Base URL: `VITE_API_URL` or `/api` (see `client.ts`).
 */

export const PLATFORM_API = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
    verifyOtp: "/auth/verify-otp",
    resendOtp: "/auth/resend-otp",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
  },
  users: {
    me: "/users/me",
    byId: (id: string) => `/users/${id}`,
    byRole: (role: string) => `/users?role=${encodeURIComponent(role)}`,
    kyc: "/users/kyc",
    documents: (id: string) => `/users/${id}/documents`,
    document: (userId: string, docId: string) => `/users/${userId}/documents/${docId}`,
    ratings: (id: string) => `/users/${id}/ratings`,
    history: (id: string) => `/users/${id}/history`,
  },
  contracts: {
    create: "/contracts",
    byId: (id: string) => `/contracts/${id}`,
    list: (type: "request" | "offer") => `/contracts?type=${type}`,
    publish: (id: string) => `/contracts/${id}/publish`,
    unpublish: (id: string) => `/contracts/${id}/unpublish`,
    clone: (id: string) => `/contracts/${id}/clone`,
    matches: (id: string) => `/contracts/${id}/matches`,
    validate: (id: string) => `/contracts/${id}/validate`,
    draftCreate: "/contracts/draft",
    drafts: "/contracts/drafts",
    draft: (id: string) => `/contracts/drafts/${id}`,
  },
  matching: {
    run: "/matching/run",
    byContract: (contractId: string) => `/matching/${contractId}`,
    top: (contractId: string) => `/matching/${contractId}/top`,
    refresh: (contractId: string) => `/matching/${contractId}/refresh`,
    explanations: (contractId: string) => `/matching/${contractId}/explanations`,
    score: "/matching/score",
    blacklist: "/matching/blacklist",
    history: "/matching/history",
    feedback: "/matching/feedback",
  },
  bids: {
    create: "/bids",
    byId: (id: string) => `/bids/${id}`,
    forContract: (contractId: string) => `/contracts/${contractId}/bids`,
    accept: (id: string) => `/bids/${id}/accept`,
    reject: (id: string) => `/bids/${id}/reject`,
    counter: (id: string) => `/bids/${id}/counter`,
    expire: (id: string) => `/bids/${id}/expire`,
    user: "/bids/user",
    withdraw: (id: string) => `/bids/${id}/withdraw`,
    message: (id: string) => `/bids/${id}/message`,
    messages: (id: string) => `/bids/${id}/messages`,
    lockPrice: (id: string) => `/bids/${id}/lock-price`,
  },
  bookings: {
    create: "/bookings",
    byId: (id: string) => `/bookings/${id}`,
    user: "/bookings/user",
    confirm: (id: string) => `/bookings/${id}/confirm`,
    cancel: (id: string) => `/bookings/${id}/cancel`,
    start: (id: string) => `/bookings/${id}/start`,
    complete: (id: string) => `/bookings/${id}/complete`,
    extend: (id: string) => `/bookings/${id}/extend`,
    pause: (id: string) => `/bookings/${id}/pause`,
  },
  operations: {
    checkIn: "/operations/check-in",
    checkOut: "/operations/check-out",
    dailyReport: "/operations/daily-report",
    reports: (bookingId: string) => `/operations/reports/${bookingId}`,
    incident: "/operations/incident",
    incidents: (bookingId: string) => `/operations/incidents/${bookingId}`,
    escalate: "/operations/escalate",
    replaceStaff: "/operations/replace-staff",
  },
  payments: {
    initiate: "/payments/initiate",
    confirm: "/payments/confirm",
    byId: (id: string) => `/payments/${id}`,
    history: "/payments/history",
    refund: "/payments/refund",
    webhook: "/payments/webhook",
    invoice: (bookingId: string) => `/payments/invoice/${bookingId}`,
  },
  reviews: {
    create: "/reviews",
    byId: (id: string) => `/reviews/${id}`,
    remove: (id: string) => `/reviews/${id}`,
    forUser: (id: string) => `/users/${id}/reviews`,
    flag: (id: string) => `/reviews/${id}/flag`,
    summary: (userId: string) => `/reviews/summary/${userId}`,
  },
  admin: {
    contracts: "/admin/contracts",
    contractsApprove: "/admin/contracts/approve",
    users: "/admin/users",
    usersSuspend: "/admin/users/suspend",
    reports: "/admin/reports",
    metrics: "/admin/metrics",
    matchingTune: "/admin/matching/tune",
  },
} as const;

/** Endpoint count per packages-1 §1.1–1.10 (admin lists 7 routes in doc). */
export const PLATFORM_API_ENDPOINT_COUNT = {
  auth: 8,
  users: 10,
  contracts: 14,
  matching: 10,
  bids: 14,
  bookings: 10,
  operations: 10,
  payments: 8,
  reviews: 6,
  admin: 7,
} as const;

export const PLATFORM_API_TOTAL =
  PLATFORM_API_ENDPOINT_COUNT.auth +
  PLATFORM_API_ENDPOINT_COUNT.users +
  PLATFORM_API_ENDPOINT_COUNT.contracts +
  PLATFORM_API_ENDPOINT_COUNT.matching +
  PLATFORM_API_ENDPOINT_COUNT.bids +
  PLATFORM_API_ENDPOINT_COUNT.bookings +
  PLATFORM_API_ENDPOINT_COUNT.operations +
  PLATFORM_API_ENDPOINT_COUNT.payments +
  PLATFORM_API_ENDPOINT_COUNT.reviews +
  PLATFORM_API_ENDPOINT_COUNT.admin;
