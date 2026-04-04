# Admin Access Breakdown

**Role**: `super_admin` (stored in `profiles.role`)
**Access Level**: Global read/write across all tables via Supabase Service Role Key or admin-specific RLS policies.
**Audit**: Every admin action is logged to `system_audit_log` with `actor_id`, `ip_address`, and `user_agent`.

---

## Complete Table-by-Table Admin Access

| Table | Admin Capabilities |
| :--- | :--- |
| **`profiles`** | View full PII (unmasked PAN, phone, email), Verify/Reject GSTIN/PAN, Suspend/Reinstate users, View DQS breakdown, Reset handshake credits, Change persona_type, Update verification_status, Force subscription_status changes, View all alias columns (phone_number, address, postal_code). |
| **`subscriptions`** | View all subscription history, Override plan assignments, Manually activate/deactivate, View PhonePe transaction IDs, Adjust billing periods, Force status transitions (trial→active, active→expired), View all alias columns (plan, trial_starts_at, last_payment_id). |
| **`subscription_plans`** | Create/Edit/Delete plans, Adjust monthly pricing, Change handshake credit amounts, Toggle plan visibility (is_active), View plan adoption rates. |
| **`connections`** | View all handshake history (requester ↔ target), View requester_message content, Override connection status (force ACCEPT/REJECT/BLOCK), View connection_source and timestamps, Resolve handshake disputes, View expires_at and manually extend. |
| **`address_book`** | View all permanent connections across all users, View first_handshake_id linkage, Audit address_book entries for data consistency. |
| **`unmasking_audit`** | View all PII reveal events (who unmasked whom, when, via what trigger), View revealed_fields array, Audit retention_expires_at dates, Investigate privacy breaches, Export audit logs for compliance. |
| **`rfps`** | View all RFPs (including DRAFT and private), View request_type (PRODUCT/SERVICE/EQUIPMENT/PROJECT), View requirements JSON, View attachments, View project_location and project_address, Manually change status, View views_count and responses_count analytics, View all alias columns (requester_id, location, expiry_date). |
| **`rfp_responses`** | View all proposals and bid_amounts, View attachments_url, Manually change response status, Audit proposal_text for spam/fraud, View estimated_days and estimated_cost. |
| **`rfp_invitations`** | View all sent invitations, View invitee_id and status, Manually resend or cancel invitations, View invited_at and responded_at timestamps. |
| **`ads`** | **Moderation**: Approve/Reject/Suspend/Clear ads, Force status changes, View payment_status and budget_remaining, Override moderation_status, View rejection_reason and add notes, View all analytics (impressions, clicks, ctr, cpc), View location and radius_meters, View all alias columns (dealer_id, campaign_name, budget_total). |
| **`ad_analytics`** | View all ad interaction events, View viewer_id and viewer_lat/lng, View distance_meters from ad center, Export analytics for ad performance reports, Audit event_type distribution. |
| **`services`** | View all consultant service listings, View pricing (price_per_hour, price_per_project), View images array (max 5), View requires_site_visit flag, Manually deactivate fraudulent services, View category and subcategory distribution. |
| **`products`** | View all product listings, View specifications JSON, View images array (max 5), View min_order_quantity and price_per_unit, Manually deactivate fraudulent products, View seller_id linkage, View category and subcategory distribution. |
| **`equipment`** | View all equipment listings, View rental rates (daily/weekly/monthly), View images array (max 5), View location and features, View operator_included flag, Manually deactivate fraudulent listings, View category and type distribution. |
| **`project_professionals`** | View all PP credentials, View coa_number and coa_expiry_date, View portfolio_summary and total_projects, View awards and software_skills, View hourly_rate_min/max, Audit featured_project_ids, View designation and specialization distribution. |
| **`consultants`** | View all firm-level data, View services_offered array, View design_software stack, View ISO certifications, View largest_project_value and typical_project_size, View company_type and annual_turnover_range, View min_project_value and accepting_new_projects. |
| **`contractors`** | View all contractor data, View workforce_count and specializations, View fleet_size, View pf_registration_number and esic_registration_number, View license_class and license_expiry_date, View safety_incidents_last_year, View owned_equipment JSON, View concurrent_projects_capacity. |
| **`product_sellers`** | View all seller data, View business_type and brand_names, View delivery_radius_km and warehouse_locations, View credit_period_days and offers_credit, View total_skus and sku_capacity, View iso_certified, bis_certified, warranty_offered flags. |
| **`equipment_dealers`** | View all dealer data, View total_equipment_count and equipment_categories, View park_location and park_address, View rental_categories, View breakdown_support_24x7 and all_rc_updated flags, View hourly/daily rental availability. |
| **`company_personnel`** | View all personnel records across all GSTINs, View full_name, designation, qualification, specialty, View experience_years and detailed_bio, View email and phone (PII), Toggle is_active status, Audit company_gstin linkage to profiles. |
| **`portfolio_items`** | View all portfolio items across all users, View images array (max 5), View drawings_url, View title and description, Manually deactivate inappropriate content, Audit profile_id linkage. |
| **`invoices`** | View all billing records, View phonepe_transaction_id, View amount and currency, View billing_period_start/end, View invoice_pdf_url, View status (PAID/FAILED/REFUNDED), Reconcile with PhonePe webhook logs, Export for financial audits. |
| **`notifications`** | View all notifications sent to all users, View notification_type and type alias, View title, message, action_url, View metadata JSON, View read_at and is_read status, View sent_via_app/email/sms flags, Audit notification delivery failures. |
| **`notification_preferences`** | View all user preference settings, View all toggle states (email/SMS/push, per-type), View all alias columns (user_id, connection_requested, etc.), Audit preference changes, Reset preferences to defaults. |
| **`email_queue`** | View all queued/sent/failed emails, View to_email, subject, body_html, body, View status and attempts, View last_error for debugging, Manually retry failed emails, View notification_id linkage, Audit scheduled_at timestamps. |
| **`system_config`** | **Full Control**: Read/Write all key-value pairs, Adjust discovery_ranking_split weights, Change max_search_radius_km and default_search_radius_km, Adjust handshake_credits_monthly, Change trial_duration_hours and connection_expiry_days, Update dqs_recurrence_cron, View description for each config key. |
| **`system_audit_log`** | **Full Read Access**: View all audit entries, Filter by actor_id, action, target_type, target_id, View old_value and new_value JSON diffs, View ip_address and user_agent, Export logs (CSV/JSON), Investigate security incidents, Audit admin actions. |
| **`audit_purge_queue`** | View all GDPR purge requests, View profile_id and reason, View requested_by and approved_by, View status (PENDING/APPROVED/REJECTED/COMPLETED), Approve/Reject purge requests, Execute purges, View created_at and completed_at timestamps. |
| **`async_jobs`** | View all background jobs, View job_type and status (PENDING/RUNNING/COMPLETED/FAILED/RETRYING), View payload and result JSON, View attempts and max_attempts, View last_error for debugging, Manually retry failed jobs, View scheduled_at timestamps, Monitor QStash/pg_cron job health. |

---

## Admin-Specific API Endpoints

| Endpoint | Method | Tables Accessed | Purpose |
|----------|--------|----------------|---------|
| `/api/admin/dashboard` | GET | profiles, connections, rfps, ads, subscriptions | Platform overview metrics |
| `/api/admin/identity/pending` | GET | profiles | Pending verification queue |
| `/api/admin/identity/:id/approve` | POST | profiles | Approve identity verification |
| `/api/admin/identity/:id/reject` | POST | profiles | Reject identity verification |
| `/api/admin/users/:id` | GET, PATCH | profiles, role extensions | View/edit any user profile |
| `/api/admin/users/:id/suspend` | POST | profiles | Suspend user account |
| `/api/admin/users/:id/reinstate` | POST | profiles | Reinstate suspended user |
| `/api/admin/companies` | GET | profiles, company_personnel | GSTIN-based company explorer |
| `/api/admin/companies/:gstin` | GET | profiles, company_personnel | Single company detail |
| `/api/admin/ads/:id` | GET, PATCH | ads, ad_analytics, profiles | Ad detail + force state change |
| `/api/admin/moderation/history` | GET | system_audit_log, ads | Moderation action history |
| `/api/admin/audit` | GET | system_audit_log | Full audit log explorer |
| `/api/admin/audit/unmasking` | GET | unmasking_audit | PII reveal tracking |
| `/api/admin/audit/purge` | GET, POST | audit_purge_queue | GDPR purge management |
| `/api/admin/config` | GET, PUT | system_config | Global system configuration |
| `/api/admin/config/dqs` | GET, PUT, POST | profiles, system_config | DQS algorithm weights |
| `/api/admin/config/plans` | GET, PUT | subscriptions, system_config | Subscription plan management |
| `/api/admin/jobs` | GET | async_jobs | Background job monitor |
| `/api/admin/payments` | GET, POST | subscriptions, invoices | Payment reconciliation |

---

## Security Controls

1. **Auth Guard**: All admin routes use `requireAdmin()` which checks `role = 'super_admin'`
2. **RLS Bypass**: Admin queries use Supabase Service Role Key (bypasses row-level security)
3. **Audit Trail**: Every admin action writes to `system_audit_log` with `actor_id`, `action`, `target_type`, `target_id`, `old_value`, `new_value`, `ip_address`, `user_agent`
4. **PII Access**: Admin can view unmasked PII that is hidden from regular users
5. **No Self-Admin**: A user cannot elevate their own role; only existing super_admin can grant access
6. **GDPR Compliance**: Admin purge requests require approval before execution; all purges are logged
