/**
 * Maps `packages-1.md` §1 platform HTTP spec to **current** CareNet 2 implementation.
 * There is no standalone Node `/api` gateway in this repo: the SPA talks to Supabase
 * and in-memory mocks via `src/backend/services/`. Use {@link PLATFORM_API} when a
 * gateway is added so routes stay aligned with the spec.
 */
export const PLATFORM_SPEC_TO_APP = {
  auth: "Supabase Auth + `AuthContext` (OTP flows mockable); not exposed as `/auth/*` REST",
  users: "`profiles` / user metadata via Supabase; partial overlap with `/users/*` spec",
  contracts: "`marketplace.service` + `care_contracts` table; UCCF mappers in `domain/uccf/`",
  matching: "Not implemented as `/matching/*`; marketplace listing filters only",
  bids: "`marketplace.service` bid methods + `care_contract_bids`; not `/bids/*` HTTP",
  bookings: "Placements/booking flows partial elsewhere; not full `/bookings/*` API",
  operations: "Not implemented as `/operations/*` (check-in, incidents, etc.)",
  payments: "Wallet/billing mocks partial; not `/payments/*` gateway",
  reviews: "Reviews UI/data partial; not full `/reviews/*` surface",
  admin: "Admin mocks partial; not `/admin/*` gateway",
} as const;
