# CareNet Seed Data

## UUID Reference (use these across ALL files)

### Users (created by `00_seed_auth_users.sql`)
| ID | Name | Role | Phone |
|----|------|------|-------|
| `00000000-0000-0000-0000-000000000001` | Karim Uddin | caregiver | 01712345678 |
| `00000000-0000-0000-0000-000000000002` | Rashed Hossain | guardian | 01812345678 |
| `00000000-0000-0000-0000-000000000003` | Amina Begum | patient | 01912345678 |
| `00000000-0000-0000-0000-000000000004` | CareFirst Agency | agency | 01612345678 |
| `00000000-0000-0000-0000-000000000005` | Admin User | admin | 01512345678 |
| `00000000-0000-0000-0000-000000000006` | Mod User | moderator | 01412345678 |
| `00000000-0000-0000-0000-000000000007` | MediMart Store | shop | 01312345678 |
| `00000000-0000-0000-0000-000000000008` | Multi-Role Demo | guardian | 01011111111 |

### Patients
| ID | Name | Guardian |
|----|------|----------|
| `10000000-0000-0000-0000-000000000001` | Amina Begum | Rashed Hossain |
| `10000000-0000-0000-0000-000000000002` | Rafiq Ahmed | Rashed Hossain |
| `10000000-0000-0000-0000-000000000003` | Fatima Khatun | Multi-Role Demo |

### Placements
| ID | Patient | Guardian | Agency | Caregiver |
|----|---------|----------|--------|-----------|
| `20000000-0000-0000-0000-000000000001` | Amina Begum | Rashed | CareFirst | Karim |
| `20000000-0000-0000-0000-000000000002` | Fatima Khatun | Multi-Role | CareFirst | Karim |

### Shifts
| ID | Prefix |
|----|--------|
| `30000000-0000-0000-0000-00000000XXXX` | Shift IDs |

### Jobs
| ID | Prefix |
|----|--------|
| `40000000-0000-0000-0000-00000000XXXX` | Job IDs |

### Shop Products
| ID | Prefix |
|----|--------|
| `50000000-0000-0000-0000-00000000XXXX` | Product IDs |

### Invoices
| ID | Prefix |
|----|--------|
| `60000000-0000-0000-0000-00000000XXXX` | Invoice IDs |

### Care Contracts (UCCF)
| ID | Prefix |
|----|--------|
| `70000000-0000-0000-0000-00000000XXXX` | Care Contract IDs |

### Conversations
| ID | Prefix |
|----|--------|
| `80000000-0000-0000-0000-00000000XXXX` | Conversation IDs |

### Other entities
| ID Prefix | Entity |
|-----------|--------|
| `90000000-...` | Support tickets |
| `A0000000-...` | Blog posts |
| `A1000000-...` | Notifications |
| `B0000000-...` | Incidents |
| `C0000000-...` | Care notes |

---

## Import Order

Run all SQL files in order in the **Supabase SQL Editor**:

1. `00_seed_auth_users.sql` — Creates auth.users → triggers auto-create profiles + wallets
2. `01_seed_data.sql` — Inserts all domain data (patients, shifts, invoices, etc.)
3. `02_views_and_rpcs.sql` — Creates 19 views + 4 RPCs for aggregation-heavy dashboard methods
4. `03_moderation_tables.sql` — Creates 6 moderation tables + triggers + seed data for moderator role
5. `04_rls_policies.sql` — Enables RLS on all 36 tables with role-based access policies

Then apply notification and hardening migrations from `supabase/migrations/` in filename order (see root `deployment.md` steps 7–19), including `20260403120000_section15_v2_tables.sql` when using v2.0 Section 15 pages.

> **Why SQL instead of CSV?** Supabase's CSV importer cannot handle PostgreSQL array literals
> (e.g., `{diabetes,hypertension}`) or JSONB columns. The SQL file handles these natively.
>
> The original 28 CSV files are kept for reference but should NOT be used for import.

---

## Views & RPCs (02_views_and_rpcs.sql)

| Name | Type | Purpose |
|------|------|---------|
| `admin_platform_stats` | View | Live counts for admin dashboard header cards |
| `admin_user_growth_monthly` | View | Month-by-month user sign-ups by role |
| `admin_revenue_monthly` | View | Monthly platform revenue from paid invoices |
| `admin_payments_monthly` | View | Monthly income vs payouts for financial chart |
| `admin_pending_items` | View | Aggregated counts of items needing admin attention |
| `admin_recent_activity` | View | Recent platform activity feed |
| `agency_performance_summary` | View | Per-agency metrics: placements, rating, on-time %, incidents |
| `agency_revenue_monthly` | View | Per-agency monthly revenue |
| `agency_monthly_overview` | View | Per-agency clients / caregivers / revenue by month |
| `caregiver_earnings_monthly` | View | Per-caregiver monthly earnings from wallet transactions |
| `caregiver_tax_report` | View | Per-caregiver monthly income for tax reporting |
| `shift_monitoring_live` | View | Active shifts with check-in/location data for monitoring |
| `shop_sales_monthly` | View | Monthly shop sales aggregation |
| `shop_category_breakdown` | View | Sales by product category |
| `get_admin_dashboard()` | RPC | Returns full admin dashboard JSON in one call |
| `get_agency_dashboard(id)` | RPC | Returns agency dashboard JSON with performance + charts |
| `get_caregiver_earnings(id)` | RPC | Returns caregiver earnings + tax chart JSON |
| `get_guardian_spending(id)` | RPC | Returns guardian spending chart JSON |

## Moderation Tables (03_moderation_tables.sql)

| Table | Purpose |
|-------|---------|
| `moderation_queue` | Items flagged for moderator review |
| `flagged_content` | Specific content flagged by users or system |
| `moderator_sanctions` | Warnings, mutes, suspensions, bans |
| `moderator_escalations` | Items escalated to admin/senior mods |
| `contract_disputes` | Disputes between parties on care contracts |
| `dispute_messages` | Conversation thread within a dispute |

## RLS Policy Summary (04_rls_policies.sql)

| Role | Access |
|------|--------|
| **admin** | Full read/write on all tables |
| **moderator** | Read most tables + write moderation/flagged/sanctions/escalations |
| **agency** | Own caregivers, placements, shifts, jobs, invoices, document verification |
| **guardian** | Own patients, placements, view shifts, invoices, billing proofs |
| **caregiver** | Own shifts, notes, documents, prescriptions (via placements), reviews |
| **patient** | Own vitals, prescriptions, events, profile |
| **shop** | Own products, orders |
| **anon** | Read-only: blog posts, shop products, agencies, caregiver profiles, jobs |