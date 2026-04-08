# marketplace-expire-bids

Marks `care_contract_bids` with status `pending` or `countered` and `expires_at` in the past as `expired`.

## Schedule (pick one)

1. **Supabase Dashboard → Edge Functions → marketplace-expire-bids → Schedules**  
   Add a schedule (e.g. every 30 minutes) that sends `POST` with header  
   `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`.

2. **External cron** (GitHub Actions, cron on a server) calling the function URL with the same header.

3. **pg_cron + pg_net** (if enabled on your project): call the function URL from SQL on an interval.

## Manual test

```bash
curl -X POST "https://<PROJECT_REF>.supabase.co/functions/v1/marketplace-expire-bids" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{}"
```

Optional dry run: `{ "dry_run": true }`

Deploy: `supabase functions deploy marketplace-expire-bids --no-verify-jwt`
