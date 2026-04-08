# RLS manual QA — marketplace (`care_contracts`, `care_contract_bids`)

Run in the browser console **while logged in** (Supabase client uses the session JWT).

## Guardian

- `supabase.from('care_contracts').select('id,status,owner_id')` — expect own rows + published requests from others, not other guardians’ drafts.
- `supabase.from('care_contract_bids').select('id,contract_id')` — only bids on requests you own.

## Agency

- `care_contracts` — published requests + your own offers.
- `care_contract_bids` — only your agency’s bids.

## Insert bid (agency)

- On a **draft** request: expect RLS error.
- On **published** / **bidding** / **matched**: expect success.

## Logged out

- Any `select` on these tables should return empty or error (no session).

## Invoices

- `invoices` / `payment_proofs`: only rows where `auth.uid()` is `from_party_id` or `to_party_id` (or proof submitter/receiver).

Record pass/fail and fix policies before shipping new marketplace features.
