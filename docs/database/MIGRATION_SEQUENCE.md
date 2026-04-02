# Migration Sequence Map

Purpose: ordered, non-conflicting migration plan for autonomous scaffolding.
Each file builds on the previous. No circular dependencies.

## Sequence

| Order | Filename | Section | Dependencies | Tables/Functions Created |
| --- | --- | --- | --- | --- |
| 0 | `20260331000000_initial_schema.sql` | Core | — | `profiles`, `connections`, `address_book`, `company_personnel`, `unmasking_audit`, `subscriptions`, `subscription_plans`, `searching_nearby_profiles()`, `dqs_recalculate()`, `update_updated_at_column()` |
| 1 | `20260331000001_rls_and_contact_function.sql` | RLS | `000000` | `has_accepted_handshake()`, `has_gstin_handshake()`, `get_visible_contact_info()`, RLS policies for profiles/connections/address_book/company_personnel/unmasking_audit/subscriptions/subscription_plans/role extensions |
| 2 | `20260331000002_role_extensions.sql` | Role Extensions | `000000` | `project_professionals`, `consultants`, `contractors`, `product_sellers`, `equipment_dealers` + RLS policies |
| 3 | `20260331000003_rfps.sql` | RFP System | `000000` | `rfps`, `rfp_responses`, `rfp_invitations` + RLS policies |
| 4 | `20260331000004_ads.sql` | Ads System | `000000`, `000001` | `ads`, `ad_analytics` + RLS policies |
| 5 | `20260331000005_notifications.sql` | Notifications | `000000` | `notifications`, `notification_preferences`, `email_queue` + RLS policies |
| 6 | `20260331000006_system_config.sql` | System Config | `000000` | `system_config`, `system_audit_log`, `audit_purge_queue`, `async_jobs` + RLS policies |
| 7 | `20260331000007_audit_and_ops.sql` | Audit & Ops | `000000` | `products`, `equipment`, unmasking_audit indexes, `prevent_audit_modification()`, `auto_populate_address_book()` |

## Naming Convention

- Format: `YYYYMMDDHHMMSS_description.sql`
- Timestamps are sequential, no collisions.
- Description is lowercase snake_case.

## Execution Order

```
000000 → 000001 → 000002 → 000003 → 000004 → 000005 → 000006 → 000007
```

## Rollback Policy

- Each migration file must be idempotent (`CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`).
- No DROP statements in forward migrations.
- Rollback requires a separate `down` migration file.
