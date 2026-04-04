---
id: SCREENS
layer: interface
type: declarative
owner: system
mutable: true
criticality: high
depends_on:
  - DASHBOARDS
  - STATE_MACHINES
  - FLOW_DOCUMENTATION
  - UI-001
provides:
  - screen_specifications
  - route_mapping
  - backend_endpoint_mapping
version: 2.1
last_updated: 2026-04-04
---

# SCREENS.md — Modular Screen Registry

Authoritative list of every user-facing screen in the BuonDesizn B2B Marketplace.
Screens are organized by **functional module**, not by role. Each module lists which roles use it and any role-specific variations.

> **Design Principle**: One component, multiple role configurations. The @engineer builds each screen once and varies content based on `persona_type`.

---

## Module 1: Auth & Onboarding (All Roles)

### SCR-G01 — Landing Page
- **Route**: `/`
- **Roles**: Guest
- **Data Sources**: `profiles` (aggregated counts), `connections` (count)
- **API Endpoints**: `GET /api/stats`, `GET /api/profiles/featured`
- **Key Elements**: Global search bar (Location, Role, Keyword), Role sliders (PP, C, CON, PS, ED), Trust indicators, CTA to signup/login

### SCR-G02 — Discover (Guest Mode)
- **Route**: `/discover`
- **Roles**: Guest
- **Data Sources**: `searching_nearby_profiles()` RPC, `profiles`, `profiles.dqs_score`
- **API Endpoints**: `GET /api/search/profiles?role=&lat=&lng=&r=&q=`
- **Key Elements**: Profile cards (masked), Role filter pills, Radius selector, Map panel (Leaflet), Infinite scroll (20/page)

### SCR-G03 — Masked Profile Preview
- **Route**: `/profiles/:id`
- **Roles**: Guest
- **Data Sources**: `profiles` (PII fields omitted server-side)
- **API Endpoints**: `GET /api/profiles/:id`
- **Key Elements**: Portfolio, Services, About section, Email/Phone shown as `***`, "View Contact" triggers login modal

### SCR-G04 — Login / Signup
- **Route**: `/auth/login`, `/auth/signup`
- **Roles**: Guest
- **Data Sources**: Supabase Auth
- **API Endpoints**: Supabase Auth API (`/auth/v1/*`)
- **Key Elements**: Email/password login, Signup form with role selection (PP, C, CON, PS, ED), Redirect to onboarding after signup

### SCR-O01 — Onboarding (Role Selection & Verification)
- **Route**: `/onboarding`
- **Roles**: All (post-signup)
- **Data Sources**: `profiles`, Supabase Auth user
- **API Endpoints**: `PATCH /api/profiles`, `POST /api/profiles/verify`
- **Key Elements**: Primary role confirmation, PAN input (individual) or GSTIN input (company), Auto-enters 48-hour trial, 30 handshake credits granted, Redirect to `/dashboard`

### SCR-O02 — Profile Setup Wizard
- **Route**: `/onboarding/profile`
- **Roles**: All (post-signup)
- **Data Sources**: `profiles`, role extension tables
- **API Endpoints**: `PATCH /api/profiles`, `PATCH /api/profiles/:role`
- **Key Elements**: Display Name, Designation, Organisation Name, Email (pre-filled), Mobile, Mode of Contact, About Myself (500 chars), Logo/Photo upload (5MB max), Location with Leaflet pin-drop

---

## Module 2: Dashboard (All Roles)

### SCR-S01 — Dashboard
- **Route**: `/dashboard`
- **Roles**: All (authenticated)
- **Data Sources**: Role-specific metrics (see table below)
- **API Endpoints**: `GET /api/dashboard/metrics`, `GET /api/dashboard/activity`
- **Key Elements**: 4-card metric summary, Recent activity feed, Trial countdown banner (if `trial`), Hard lock overlay (if `hard_locked`)
- **Responsive**: Sidebar (desktop), Bottom nav (mobile, 5 items)

| Role | Metric Card 1 | Metric Card 2 | Metric Card 3 | Metric Card 4 |
|------|--------------|--------------|--------------|--------------|
| PP | Open RFPs | Responses Received | Active Connections | Handshake Credits |
| C | Open RFPs | Responses Sent | Active Connections | Handshake Credits |
| CON | Open RFPs | RFQ Responses Submitted | Active Connections | Handshake Credits |
| PS | Products Listed | Enquiries Received | Active Ads | Handshake Credits |
| ED | Equipment Listed | Requests Received | Active Ads | Handshake Credits |

---

## Module 3: Profile & Settings (All Roles)

### SCR-S02 — My Profile
- **Route**: `/profile`
- **Roles**: All
- **Data Sources**: `profiles`, role extension table (varies by role)
- **API Endpoints**: `GET /api/profiles/me`, `PATCH /api/profiles/me`
- **Key Elements**: Display Name, Designation, Organisation Name, Email (read-only), Mobile, Mode of Contact, About Myself, Logo upload (5MB), Location + Leaflet map, PAN (immutable after save), GSTIN (editable via change-request)
- **Role Extensions**:
  - **PP**: `project_professionals` fields (designation, experience, specialization, coa_number)
  - **C**: `consultants` fields (services_offered, iso certifications, largest_project_value)
  - **CON**: `contractors` fields (staff count, owned equipment, license class, fleet size)
  - **PS**: `product_sellers` fields (business_type, delivery_radius, credit_period)
  - **ED**: `equipment_dealers` fields (total_equipment_count, park_location, rental_categories)

### SCR-S03 — My Plan
- **Route**: `/plan`
- **Roles**: All
- **Data Sources**: `subscriptions`, `profiles.handshake_credits`, `profiles.subscription_status`
- **API Endpoints**: `GET /api/profile/rate-limits`, `POST /api/subscriptions/upgrade`
- **Key Elements**: Current plan, Handshake credits remaining, Trial countdown (48h), Monthly reset date, PhonePe payment CTA, Subscription status indicator

### SCR-SET01 — Notification Preferences
- **Route**: `/settings/notifications`
- **Roles**: All
- **Data Sources**: `notification_preferences`
- **API Endpoints**: `GET /api/notifications/preferences`, `PATCH /api/notifications/preferences`
- **Key Elements**: Email/SMS toggles, Per-type notification toggles

### SCR-SET02 — Contact Preferences
- **Route**: `/settings/contact`
- **Roles**: All
- **Data Sources**: `profiles`
- **API Endpoints**: `PATCH /api/profiles/me`
- **Key Elements**: Mode of Contact (Email/Call/Both), Business hours

### SCR-SET03 — Privacy & Data
- **Route**: `/settings/privacy`
- **Roles**: All
- **Data Sources**: `profiles`, `connections`, `address_book`
- **API Endpoints**: `GET /api/profiles/me/data-export`, `DELETE /api/profiles/me`
- **Key Elements**: Profile visibility toggle, Data export, Account deletion request, Blocked users list

### SCR-SET04 — Billing & Invoices
- **Route**: `/settings/billing`
- **Roles**: All
- **Data Sources**: `subscriptions`, `invoices`
- **API Endpoints**: `GET /api/subscriptions/invoices`
- **Key Elements**: Payment history, Invoice download, Subscription plan details, Next billing date

### SCR-SET05 — Integrations
- **Route**: `/settings/integrations`
- **Roles**: All
- **Data Sources**: `profiles`
- **API Endpoints**: `PATCH /api/profiles/me`
- **Key Elements**: LinkedIn URL, Website URL, Social media links

### SCR-SET06 — GSTIN Change Request
- **Route**: `/settings/gstin`
- **Roles**: All (company profiles only)
- **Data Sources**: `profiles`
- **API Endpoints**: `POST /api/profiles/gstin-change-request`
- **Key Elements**: Current GSTIN display, New GSTIN input, Reason for change, Status tracker

### SCR-S07 — Change Password
- **Route**: `/settings/password`
- **Roles**: All
- **Data Sources**: Supabase Auth
- **API Endpoints**: Supabase Auth API
- **Key Elements**: Current password, New password, Confirm password

---

## Module 4: Discovery (All Roles)

### SCR-S06 — Discover (Find Products & Services)
- **Route**: `/discover`
- **Roles**: All (authenticated)
- **Data Sources**: `searching_nearby_profiles()` RPC, `profiles`, `connections` (for button state)
- **API Endpoints**: `GET /api/search/profiles`, `POST /api/connections`, `GET /api/connections?target_id=`
- **Key Elements**: Search controls (Role filter, Keyword, Radius 10/25/50/100km, Location auto-detect/pin-drop), Map panel (Leaflet 40%), Results feed (60%, 20/page infinite scroll), Profile cards (masked/unmasked), Connection button (8-state matrix), Empty state, Loading skeletons
- **URL Params**: `?role=&lat=&lng=&r=&q=`

---

## Module 5: Connections & Handshakes (All Roles)

### SCR-S04 — Address Book
- **Route**: `/address-book`
- **Roles**: All
- **Data Sources**: `address_book` JOIN `profiles`
- **API Endpoints**: `GET /api/address-book`
- **Key Elements**: List of ACCEPTED connections with full PII (phone, email, LinkedIn), Search/filter contacts, Connection date, Role badge, "View Full Profile" link

### SCR-S08 — Handshake Request (Modal)
- **Route**: `/connections/request` (modal)
- **Roles**: All
- **Data Sources**: `profiles.handshake_credits`, `connections`
- **API Endpoints**: `POST /api/connections`
- **Key Elements**: Target profile summary, Credit cost display (1 credit), Confirmation dialog, Error states (insufficient credits, hard_locked)

### SCR-S09 — Incoming Handshakes
- **Route**: `/connections/incoming`
- **Roles**: All
- **Data Sources**: `connections WHERE target_id = me AND status = 'REQUESTED'`
- **API Endpoints**: `GET /api/connections`, `PATCH /api/connections/:id/accept`, `PATCH /api/connections/:id/reject`
- **Key Elements**: List of REQUESTED connections, Target profile summary, Accept/Decline buttons, 30-day expiry countdown

### SCR-S10 — Connection Detail
- **Route**: `/connections/:id`
- **Roles**: All
- **Data Sources**: `connections`, `profiles`, `address_book`
- **API Endpoints**: `GET /api/connections/:id`
- **Key Elements**: Connection state (REQUESTED/ACCEPTED/REJECTED/EXPIRED/BLOCKED), Unmasked PII (if ACCEPTED), Block option, Connection history

---

## Module 6: RFPs (PP, C, CON)
*RFPs can only be created by PP, C, and CON roles. PS/ED can only send connections.*

### SCR-RFP01 — My RFPs
- **Route**: `/rfps`
- **Roles**: PP, C, CON
- **Data Sources**: `rfps WHERE creator_id = me`
- **API Endpoints**: `GET /api/rfps`, `POST /api/rfps`, `POST /api/rfps/:id/publish`, `POST /api/rfps/:id/close`, `POST /api/rfps/:id/cancel`
- **Key Elements**: RFP list (DRAFT/OPEN/CLOSED/CANCELLED/EXPIRED), Request type badge (PRODUCT/SERVICE/EQUIPMENT/PROJECT), Create RFP button, Response count per RFP, Status filter, Publish draft, Close/Cancel open RFPs. Note: CLOSED and CANCELLED are terminal states — RFPs cannot be re-opened.

### SCR-RFP02 — Browse RFPs
- **Route**: `/rfps/browse`
- **Roles**: PP, C, CON
- **Data Sources**: `rfps WHERE status = 'OPEN'`, `rfp_responses WHERE responder_id = me`
- **API Endpoints**: `GET /api/rfps/browse`, `POST /api/rfps/:id/respond`
- **Key Elements**: Browse open RFPs, Filter by category/location, RFP detail preview, Submit Response button, Already responded indicator

### SCR-RFP03 — RFP Detail
- **Route**: `/rfps/:id`
- **Roles**: PP, C, CON
- **Data Sources**: `rfps`, `rfp_responses`
- **API Endpoints**: `GET /api/rfps/:id`, `GET /api/rfps/:id/responses`
- **Key Elements**: RFP subject, Sector, Category, Budget, Location (text + map), Timeline, Response list (creator view), Submit response form (responder view)

### SCR-RFP04 — Create/Edit RFP
- **Route**: `/rfps/new`, `/rfps/:id/edit`
- **Roles**: PP, C, CON
- **Data Sources**: `rfps`
- **API Endpoints**: `POST /api/rfps`, `PATCH /api/rfps/:id`
- **Key Elements**: Section 1: Subject, Sector, Category, Budget (INR); Section 2: Project Location, Pincode, State, City, Address + Leaflet map; Section 3: Work Commencement date, Work Completion date; Save as Draft, Publish (validates GSTIN, broadcasts)

### SCR-RFP05 — RFP Response Detail
- **Route**: `/rfps/:id/responses/:responseId`
- **Roles**: PP, C, CON (creator view)
- **Data Sources**: `rfp_responses`, `profiles` (responder)
- **API Endpoints**: `GET /api/rfps/:id/responses/:responseId`, `POST /api/rfps/:id/responses/:responseId/accept`
- **Key Elements**: RFQ response details, Response content, Shortlist/Accept/Reject actions. Accept creates a connection in ACCEPTED state at no credit cost, records an unmasking_audit entry, and unmasks responder PII.

### SCR-RFP06 — Portfolio / Work Samples
- **Route**: `/portfolio`
- **Roles**: PP, CON
- **Data Sources**: `portfolio_items`, Supabase Storage
- **API Endpoints**: `GET /api/profiles/me/portfolio`, `POST /api/profiles/me/portfolio`, `DELETE /api/profiles/me/portfolio/:id`
- **Key Elements**: Project gallery, Descriptions, Images, Add/Edit/Delete portfolio items

### SCR-RFP07 — My Projects (Deferred)
- **Route**: `/projects`
- **Roles**: PP, C, CON
- **Data Sources**: `projects` (Phase 1: empty state)
- **API Endpoints**: `GET /api/projects/me`
- **Key Elements**: Phase 1: "Coming Soon" empty state

---

## Module 7: Team Management (C, CON)

### SCR-TEAM01 — My Team
- **Route**: `/my-team`
- **Roles**: C, CON
- **Data Sources**: `company_personnel WHERE company_gstin = me.gstin`
- **API Endpoints**: `GET /api/company-personnel`, `POST /api/company-personnel`, `PATCH /api/company-personnel/:id`, `DELETE /api/company-personnel/:id`
- **Key Elements**: Table view (Name, Designation, Qualification, Specialty, Experience, Status), Add single entry form, Active/Inactive toggle

### SCR-TEAM02 — Firm Profile
- **Route**: `/firm`
- **Roles**: C
- **Data Sources**: `profiles`, `company_personnel`, GSTIN verification API
- **API Endpoints**: `GET /api/profiles/me`, `PATCH /api/profiles/me`
- **Key Elements**: GSTIN verification status, Firm name (from GSTIN API), Firm branding/logo, Linked PAN profiles list

### SCR-TEAM03 — Consultant Services
- **Route**: `/services`
- **Roles**: C
- **Data Sources**: `services WHERE profile_id = me`
- **API Endpoints**: `GET /api/services`, `POST /api/services`, `PUT /api/services/:id`, `DELETE /api/services/:id`
- **Key Elements**: Service cards (title, description, pricing, images max 5), Add/Edit/Delete services, Category filter, Hourly vs project pricing toggle, Site visit requirement flag

### SCR-TEAM04 — Contractor Equipment
- **Route**: `/my-equipment`
- **Roles**: CON
- **Data Sources**: `contractors.owned_equipment`
- **API Endpoints**: `PATCH /api/profiles/me` (via contractors extension)
- **Key Elements**: Equipment list, Equipment type, Condition, Availability

---

## Module 8: Catalog Management (PS, ED)

### SCR-CAT01 — My Products
- **Route**: `/products`
- **Roles**: PS
- **Data Sources**: `products WHERE seller_id = me`
- **API Endpoints**: `GET /api/products`, `DELETE /api/products/:id`
- **Key Elements**: Product list (Name, Price, Images, Status), Add Product button, Edit/Delete actions, Search/filter

### SCR-CAT02 — Add / Edit Product
- **Route**: `/products/new`, `/products/:id/edit`
- **Roles**: PS
- **Data Sources**: `products`
- **API Endpoints**: `POST /api/products`, `PUT /api/products/:id`
- **Key Elements**: Section 1: Product Name, Category, Type, Description, Area of Application; Section 2: Images (max 5, 5MB), Catalog PDF (10MB); Section 3: Model No., MOQ, Lead Time, Manufacturing Location, Size (LxBxH), UOM, Price/Unit (INR), Warranty, Product Tags; Section 4: Dynamic technical specs builder

### SCR-CAT03 — Product Detail (Public)
- **Route**: `/products/:id`
- **Roles**: All (PS seller sees edit mode)
- **Data Sources**: `products`, `profiles` (seller)
- **API Endpoints**: `GET /api/products/:id`
- **Key Elements**: Full specs, Images gallery, Pricing, Seller info (masked), Enquiry button, Technical specs table

### SCR-CAT04 — My Equipment
- **Route**: `/equipment`
- **Roles**: ED
- **Data Sources**: `equipment WHERE dealer_id = me`
- **API Endpoints**: `GET /api/equipment`, `DELETE /api/equipment/:id`
- **Key Elements**: Equipment list (Type, Availability, Rate, Status, Images), Add Equipment button, Edit/Delete actions, Search/filter

### SCR-CAT05 — Add / Edit Equipment
- **Route**: `/equipment/new`, `/equipment/:id/edit`
- **Roles**: ED
- **Data Sources**: `equipment`
- **API Endpoints**: `POST /api/equipment`, `PUT /api/equipment/:id`
- **Key Elements**: Section 1: Equipment Name, Category, Description, Hypothecated? (Y/N), RC Available? (Y/N); Section 2: Images (max 5, 5MB), Catalog PDF (10MB); Section 3: Monthly Rental Price (INR), Selling Price (INR), Current Location (text + Leaflet pin); Section 4: Dynamic performance specs builder

### SCR-CAT06 — Equipment Detail (Public)
- **Route**: `/equipment/:id`
- **Roles**: All (ED dealer sees edit mode)
- **Data Sources**: `equipment`, `profiles` (dealer)
- **API Endpoints**: `GET /api/equipment/:id`
- **Key Elements**: Full specs, Images, Rate card (rental + sale), Dealer info (masked), Request button, Performance specs table

### SCR-CAT07 — Enquiries / Requests
- **Route**: `/enquiries`
- **Roles**: PS (product enquiries), ED (equipment requests)
- **Data Sources**: `connections WHERE target_id = me AND connection_source IN ('SEARCH', 'AD_CLICK')`
- **API Endpoints**: `GET /api/connections`, `PATCH /api/connections/:id/accept`, `PATCH /api/connections/:id/reject`
- **Key Elements**: List of inbound enquiries/requests, Enquiry source filter (connection_source: SEARCH, AD_CLICK, RFP_RESPONSE, DIRECT), Respond, Accept handshake, Status filter (new/responded/accepted)

---

## Module 9: Ads (PS, ED)

### SCR-ADS01 — My Ads
- **Route**: `/ads`
- **Roles**: PS, ED
- **Data Sources**: `ads WHERE profile_id = me`, `ad_analytics`
- **API Endpoints**: `GET /api/ads/me`, `POST /api/ads`, `PUT /api/ads/:id`, `DELETE /api/ads/:id`, `POST /api/ads/:id/retry-payment`, `POST /api/ads/:id/refund-request`
- **Key Elements**: Ad list (status, impressions, clicks, spend), Create Ad button, Ad state (DRAFT/PENDING_PAYMENT/ACTIVE/PAUSED/EXPIRED/SUSPENDED), Payment retry, Refund request, Moderation status

### SCR-ADS02 — Create / Edit Ad
- **Route**: `/ads/new`, `/ads/:id/edit`
- **Roles**: PS, ED
- **Data Sources**: `ads`
- **API Endpoints**: `POST /api/ads`, `PUT /api/ads/:id`
- **Key Elements**: Ad title, Description, Image upload (max 5, 5MB), Target URL, Geo-targeting radius, Duration, Budget, Payment via PhonePe, Preview

---

## Module 10: Notifications (All Roles)

### SCR-S05 — My Notifications
- **Route**: `/notifications`
- **Roles**: All
- **Data Sources**: `notifications`, `notification_preferences`
- **API Endpoints**: `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`, `GET /api/notifications/preferences`
- **Key Elements**: Inbox list (unread first, paginated 20/page), Mark as read (single/all), Channel preference toggles (email/SMS). Notifications refresh via polling (not WebSocket) at configurable intervals.

---

## Module 11: System & Alerts (All Roles)

### SCR-SYS01 — 404 Not Found
- **Route**: `*` (catch-all)
- **Key Elements**: "Page not found" message, BuonDesizn branding, Back to Dashboard button

### SCR-SYS02 — 500 Server Error
- **Route**: `/500`
- **Key Elements**: Error message, Retry button, Support contact link, Error reference ID (Sentry)

### SCR-SYS03 — Hard Lock Screen
- **Route**: `/locked` (or overlay on any route)
- **Data Sources**: `profiles.subscription_status`
- **Key Elements**: "Your 48-hour trial has ended" message, "Upgrade to National Pro" CTA → `/plan`, Feature restriction list. Subscription expiry triggers hard_locked immediately — no grace period.

### SCR-SYS04 — Trial Expiry Warning
- **Route**: Banner on all authenticated pages
- **Data Sources**: `profiles.subscription_status`, `profiles.trial_started_at`
- **Key Elements**: Countdown timer (hours remaining), "Upgrade to National Pro" CTA, Dismiss option

### SCR-SYS05 — Payment Success
- **Route**: `/payment/success`
- **Data Sources**: `subscriptions`, PhonePe webhook
- **Key Elements**: Payment confirmation, Credits reset to 30, Subscription status: Active, Next reset date, Continue to Dashboard CTA

### SCR-SYS06 — Payment Failure
- **Route**: `/payment/failed`
- **Data Sources**: `subscriptions`, PhonePe webhook
- **Key Elements**: Error message, Payment failure reason, Retry payment CTA, Support contact

### SCR-SYS07 — Payment Pending
- **Route**: `/payment/pending`
- **Data Sources**: `subscriptions`
- **Key Elements**: "Payment processing" message, Spinner, Auto-refresh status

### SCR-SYS08 — Email Verification Required
- **Route**: `/auth/verify-email`
- **Data Sources**: Supabase Auth
- **Key Elements**: Verification email sent message, Resend email button, Check spam folder tip

### SCR-SYS09 — Verification Pending
- **Route**: `/verification/pending`
- **Data Sources**: `profiles.verification_status`
- **Key Elements**: "Your profile is under review" message, Estimated review time, What to expect next

### SCR-SYS10 — Verification Rejected
- **Route**: `/verification/rejected`
- **Data Sources**: `profiles.verification_status`
- **Key Elements**: Rejection reason, What went wrong, Retry verification CTA, Support contact

### SCR-SYS11 — Session Expired
- **Route**: `/auth/session-expired`
- **Data Sources**: Supabase Auth
- **Key Elements**: "Session expired" message, Login again CTA

### SCR-SYS12 — Maintenance Mode
- **Route**: Full-page overlay on any route
- **Data Sources**: `system_config` (maintenance_mode flag)
- **Key Elements**: "System is under maintenance" message, Estimated restoration time (if available), BuonDesizn branding, No navigation available

### SCR-SYS13 — Rate Limited
- **Route**: `/rate-limited` (or overlay on any route)
- **Data Sources**: Rate limit headers / profile rate limit state
- **Key Elements**: "Too many requests" message, Retry-after countdown, What you can do while waiting, Support contact link

---

## Module 12: Admin (SUPER_ADMIN Only)

### SCR-A01 — Admin Dashboard
- **Route**: `/admin`
- **Data Sources**: `profiles`, `connections`, `rfps`, `ads`, `subscriptions`
- **API Endpoints**: `GET /api/admin/dashboard`
- **Key Elements**: Total users by role, Active vs trial vs hard_locked counts, Today's handshakes, RFP activity, Ad revenue, Pending verifications, Flagged ads

### SCR-A02 — Identity Review Queue
- **Route**: `/admin/identity`
- **Data Sources**: `profiles WHERE verification_status = 'PENDING_ADMIN'`
- **API Endpoints**: `GET /api/admin/identity/pending`, `POST /api/admin/identity/:id/approve`, `POST /api/admin/identity/:id/reject`
- **Key Elements**: Queue of PENDING_ADMIN profiles, GSTIN/PAN validation results, Approve/Reject with reason, Bulk actions

### SCR-A03 — User Detail (Admin View)
- **Route**: `/admin/users/:id`
- **Data Sources**: `profiles`, role extension tables, `connections`, `company_personnel`, `subscriptions`
- **API Endpoints**: `GET /api/admin/users/:id`, `PATCH /api/admin/users/:id`
- **Key Elements**: Full PII (no masking), Verification status, GSTIN/PAN details, Connection history, DQS breakdown, Subscription status, Activity log, Suspend user action

### SCR-A04 — User Suspension
- **Route**: `/admin/users/:id/suspend`
- **Data Sources**: `profiles`
- **API Endpoints**: `POST /api/admin/users/:id/suspend`, `POST /api/admin/users/:id/reinstate`
- **Key Elements**: Current status, Suspend with reason dropdown, Reinstate action, Suspension history log

### SCR-A05 — Company Explorer
- **Route**: `/admin/companies`
- **Data Sources**: `profiles` (with GSTIN), `company_personnel`
- **API Endpoints**: `GET /api/admin/companies`, `GET /api/admin/companies/:gstin`
- **Key Elements**: GSTIN search, Organization list, All linked personnel, Personnel count, Verification status per org

### SCR-A06 — Moderation Queue
- **Route**: `/admin/moderation`
- **Data Sources**: `ads WHERE moderation_status IN ('FLAGGED', 'SUSPENDED')`
- **API Endpoints**: `GET /api/moderation/queue`, `POST /api/moderation/:ad_id/clear`, `POST /api/moderation/:ad_id/reject`
- **Key Elements**: List of flagged/suspended ads, Ad image preview, Sightengine flag reasons, Clear/Reject actions, Bulk moderation

### SCR-A07 — Ad Detail (Admin)
- **Route**: `/admin/ads/:id`
- **Data Sources**: `ads`, `ad_analytics`, `profiles` (creator)
- **API Endpoints**: `GET /api/admin/ads/:id`, `PATCH /api/admin/ads/:id`
- **Key Elements**: Ad content, Payment status, Moderation history, Impression/click analytics, Creator details, Force state change

### SCR-A08 — Moderation History
- **Route**: `/admin/moderation/history`
- **Data Sources**: `system_audit_log` (moderation actions), `ads`
- **API Endpoints**: `GET /api/admin/moderation/history`
- **Key Elements**: Filter by date/status/action/admin, Before/after states, Export CSV

### SCR-A09 — Audit Explorer
- **Route**: `/admin/audit`
- **Data Sources**: `system_audit_log`
- **API Endpoints**: `GET /api/admin/audit`
- **Key Elements**: Full audit log, Filter by entity type/user/action/date range, Search, Export (CSV/JSON), Pagination (50/page)

### SCR-A10 — Unmasking Audit
- **Route**: `/admin/audit/unmasking`
- **Data Sources**: `unmasking_audit`
- **API Endpoints**: `GET /api/admin/audit/unmasking`
- **Key Elements**: Unmask events list, Who unmasked whom, Timestamp, Mechanism, Revealed fields list, Filter by date/user/mechanism

### SCR-A11 — Audit Purge Queue
- **Route**: `/admin/audit/purge`
- **Data Sources**: `audit_purge_queue`
- **API Endpoints**: `GET /api/admin/audit/purge`, `POST /api/admin/audit/purge/execute`
- **Key Elements**: Scheduled purge entries, Manual purge trigger, Purge history, Compliance status

### SCR-A12 — System Configuration
- **Route**: `/admin/config`
- **Data Sources**: `system_config`
- **API Endpoints**: `GET /api/admin/config`, `PUT /api/admin/config`
- **Key Elements**: Feature enable/disable toggles, Broadcast radius cap, Trial duration override, Maintenance mode toggle, DQS recalc trigger

### SCR-A13 — DQS Configuration
- **Route**: `/admin/config/dqs`
- **Data Sources**: `profiles.dqs_score`, `system_config`
- **API Endpoints**: `GET /api/admin/config/dqs`, `PUT /api/admin/config/dqs`, `POST /api/admin/dqs/recalc`
- **Key Elements**: Current formula weights, Weight adjustment sliders, Preview impact on rankings, Manual recalc trigger, Last recalc timestamp

### SCR-A14 — Subscription Plans
- **Route**: `/admin/config/plans`
- **Data Sources**: `subscriptions`, `system_config`
- **API Endpoints**: `GET /api/admin/config/plans`, `PUT /api/admin/config/plans`
- **Key Elements**: Plan details, Credit amounts, Monthly pricing, Trial duration, Auto-renewal settings

### SCR-A15 — Job Queue Monitor
- **Route**: `/admin/jobs`
- **Data Sources**: QStash job status, pg_cron history
- **API Endpoints**: `GET /api/admin/jobs`
- **Key Elements**: QStash job status list, pg_cron job history, Failed jobs, Retry triggers, Last run timestamps

### SCR-A16 — Payment Reconciliation
- **Route**: `/admin/payments`
- **Data Sources**: `subscriptions`, PhonePe webhook log
- **API Endpoints**: `GET /api/admin/payments`, `POST /api/admin/payments/reconcile`
- **Key Elements**: PhonePe webhook log, Unmatched payments, Failed payment retries, Manual reconciliation, Refund processing

---

## SCREEN COUNT SUMMARY

| Module | Screens | Roles |
|--------|---------|-------|
| Auth & Onboarding | 6 | All |
| Dashboard | 1 | All (role-specific metrics) |
| Profile & Settings | 8 | All |
| Discovery | 1 | All |
| Connections & Handshakes | 4 | All |
| RFPs | 7 | PP, C, CON |
| Team Management | 4 | C, CON |
| Catalog Management | 7 | PS, ED |
| Ads | 2 | PS, ED |
| Notifications | 1 | All |
| System & Alerts | 13 | All |
| Admin | 16 | SUPER_ADMIN |

**Total unique screens: 70** (down from 91 — deduplicated shared screens)

> **Note**: Many screens are shared across roles with role-specific content. The @engineer builds each screen once and varies content based on `persona_type`. For example, `/profile` renders the same component but shows different extension fields for PP vs C vs CON vs PS vs ED.

---

## ROUTE INDEX (Next.js App Router Mapping)

```
/                           → SCR-G01
/discover                   → SCR-G02 (guest), SCR-S06 (authenticated)
/profiles/:id               → SCR-G03
/auth/login                 → SCR-G04
/auth/signup                → SCR-G04
/auth/verify-email          → SCR-SYS08
/auth/session-expired       → SCR-SYS11
/onboarding                 → SCR-O01
/onboarding/profile         → SCR-O02
/dashboard                  → SCR-S01
/profile                    → SCR-S02 (+ role extension fields)
/plan                       → SCR-S03
/address-book               → SCR-S04
/notifications              → SCR-S05
/settings/password          → SCR-S07
/settings/notifications     → SCR-SET01
/settings/contact           → SCR-SET02
/settings/privacy           → SCR-SET03
/settings/billing           → SCR-SET04
/settings/integrations      → SCR-SET05
/settings/gstin             → SCR-SET06
/connections/request        → SCR-S08 (modal)
/connections/incoming       → SCR-S09
/connections/:id            → SCR-S10
/rfps                       → SCR-RFP01
/rfps/new                   → SCR-RFP04
/rfps/:id                   → SCR-RFP03
/rfps/:id/edit              → SCR-RFP04
/rfps/:id/responses/:respId → SCR-RFP05
/rfps/browse                → SCR-RFP02
/projects                   → SCR-RFP07 (Phase 1: empty)
/portfolio                  → SCR-RFP06
/my-team                    → SCR-TEAM01
/firm                       → SCR-TEAM02
/services                   → SCR-TEAM03
/my-equipment               → SCR-TEAM04
/products                   → SCR-CAT01
/products/new               → SCR-CAT02
/products/:id               → SCR-CAT03
/products/:id/edit          → SCR-CAT02
/enquiries                  → SCR-CAT07
/ads                        → SCR-ADS01
/ads/new                    → SCR-ADS02
/ads/:id/edit               → SCR-ADS02
/equipment                  → SCR-CAT04
/equipment/new              → SCR-CAT05
/equipment/:id              → SCR-CAT06
/equipment/:id/edit         → SCR-CAT05
/payment/success            → SCR-SYS05
/payment/failed             → SCR-SYS06
/payment/pending            → SCR-SYS07
/locked                     → SCR-SYS03
/verification/pending       → SCR-SYS09
/verification/rejected      → SCR-SYS10
/maintenance                → SCR-SYS12 (if needed)
/500                        → SCR-SYS02
* (catch-all)               → SCR-SYS01
/admin                      → SCR-A01
/admin/identity             → SCR-A02
/admin/users/:id            → SCR-A03
/admin/users/:id/suspend    → SCR-A04
/admin/companies            → SCR-A05
/admin/moderation           → SCR-A06
/admin/ads/:id              → SCR-A07
/admin/moderation/history   → SCR-A08
/admin/audit                → SCR-A09
/admin/audit/unmasking      → SCR-A10
/admin/audit/purge          → SCR-A11
/admin/config               → SCR-A12
/admin/config/dqs           → SCR-A13
/admin/config/plans         → SCR-A14
/admin/jobs                 → SCR-A15
/admin/payments             → SCR-A16
```

---

## API ENDPOINT INDEX (Backend Contract Mapping)

### Authentication & Profiles
| Endpoint | Method | Screens |
|----------|--------|---------|
| `/api/profiles/me` | GET, PATCH, DELETE | SCR-S02, SCR-SYS03, SCR-SYS09, SCR-SYS10, SCR-SET03 |
| `/api/profiles/:id` | GET | SCR-G03, SCR-S10 |
| `/api/search/profiles` | GET | SCR-G02, SCR-S06 |
| `/api/profiles/featured` | GET | SCR-G01 |
| `/api/profiles/me/portfolio` | GET, POST, DELETE | SCR-RFP06 |
| `/api/profiles/me/data-export` | GET | SCR-SET03 |
| `/api/profiles/gstin-change-request` | POST | SCR-SET06 |
| `/api/stats` | GET | SCR-G01 |
| `/api/profiles/verify` | POST | SCR-O01 |

### Dashboard
| Endpoint | Method | Screens |
|----------|--------|---------|
| `/api/dashboard/metrics` | GET | SCR-S01 |
| `/api/dashboard/activity` | GET | SCR-S01 |

### Connections & Handshakes
| Endpoint | Method | Screens |
|----------|--------|---------|
| `/api/connections` | POST, GET | SCR-S06, SCR-S08, SCR-S09, SCR-CAT07 |
| `/api/connections/:id` | GET | SCR-S10 |
| `/api/connections/:id/accept` | PATCH | SCR-S09, SCR-CAT07 |
| `/api/connections/:id/reject` | PATCH | SCR-S09, SCR-CAT07 |
| `/api/address-book` | GET | SCR-S04 |

### RFPs
| Endpoint | Method | Screens |
|----------|--------|---------|
| `/api/rfps` | POST, GET | SCR-RFP01, SCR-RFP04 |
| `/api/rfps/browse` | GET | SCR-RFP02 |
| `/api/rfps/:id` | GET, PATCH | SCR-RFP03, SCR-RFP04 |
| `/api/rfps/:id/respond` | POST | SCR-RFP02 |
| `/api/rfps/:id/publish` | POST | SCR-RFP01 |
| `/api/rfps/:id/close` | POST | SCR-RFP01 |
| `/api/rfps/:id/cancel` | POST | SCR-RFP01 |
| `/api/rfps/:id/responses` | GET | SCR-RFP03 |
| `/api/rfps/:id/responses/:responseId` | GET | SCR-RFP05 |
| `/api/rfps/:id/responses/:responseId/accept` | POST | SCR-RFP05 |

### Subscriptions & Payments
| Endpoint | Method | Screens |
|----------|--------|---------|
| `/api/profile/rate-limits` | GET | SCR-S03 |
| `/api/subscriptions/upgrade` | POST | SCR-S03 |
| `/api/subscriptions/invoices` | GET | SCR-SET04 |
| `/api/payment/phonepe/init` | POST | SCR-S03 |
| `/api/payment/phonepe/callback` | POST | SCR-SYS05, SCR-SYS06 (webhook) |

### Products
| Endpoint | Method | Screens |
|----------|--------|---------|
| `/api/products` | POST, GET | SCR-CAT01, SCR-CAT02 |
| `/api/products/:id` | GET, PUT, DELETE | SCR-CAT02, SCR-CAT03 |

### Equipment
| Endpoint | Method | Screens |
|----------|--------|---------|
| `/api/equipment` | POST, GET | SCR-CAT04, SCR-CAT05 |
| `/api/equipment/:id` | GET, PUT, DELETE | SCR-CAT05, SCR-CAT06 |

### Ads
| Endpoint | Method | Screens |
|----------|--------|---------|
| `/api/ads/me` | GET | SCR-ADS01 |
| `/api/ads` | POST | SCR-ADS02 |
| `/api/ads/:id` | GET, PUT, DELETE | SCR-ADS02 |
| `/api/ads/:id/retry-payment` | POST | SCR-ADS01 |
| `/api/ads/:id/refund-request` | POST | SCR-ADS01 |

### Company Personnel
| Endpoint | Method | Screens |
|----------|--------|---------|
| `/api/company-personnel` | GET, POST | SCR-TEAM01 |
| `/api/company-personnel/:id` | PATCH, DELETE | SCR-TEAM01 |

### Services
| Endpoint | Method | Screens |
|----------|--------|---------|
| `/api/services` | GET, POST | SCR-TEAM03 |
| `/api/services/:id` | GET, PUT, DELETE | SCR-TEAM03 |

### Notifications
| Endpoint | Method | Screens |
|----------|--------|---------|
| `/api/notifications` | GET | SCR-S05 |
| `/api/notifications/:id/read` | PATCH | SCR-S05 |
| `/api/notifications/read-all` | PATCH | SCR-S05 |
| `/api/notifications/preferences` | GET, PATCH | SCR-S05, SCR-SET01 |

### Moderation
| Endpoint | Method | Screens |
|----------|--------|---------|
| `/api/moderation/queue` | GET | SCR-A06 |
| `/api/moderation/:ad_id/clear` | POST | SCR-A06 |
| `/api/moderation/:ad_id/reject` | POST | SCR-A06 |

### Admin
| Endpoint | Method | Screens |
|----------|--------|---------|
| `/api/admin/dashboard` | GET | SCR-A01 |
| `/api/admin/identity/pending` | GET | SCR-A02 |
| `/api/admin/identity/:id/approve` | POST | SCR-A02 |
| `/api/admin/identity/:id/reject` | POST | SCR-A02 |
| `/api/admin/users/:id` | GET, PATCH | SCR-A03 |
| `/api/admin/users/:id/suspend` | POST | SCR-A04 |
| `/api/admin/users/:id/reinstate` | POST | SCR-A04 |
| `/api/admin/companies` | GET | SCR-A05 |
| `/api/admin/companies/:gstin` | GET | SCR-A05 |
| `/api/admin/ads/:id` | GET, PATCH | SCR-A07 |
| `/api/admin/moderation/history` | GET | SCR-A08 |
| `/api/admin/audit` | GET | SCR-A09 |
| `/api/admin/audit/unmasking` | GET | SCR-A10 |
| `/api/admin/audit/purge` | GET, POST | SCR-A11 |
| `/api/admin/config` | GET, PUT | SCR-A12 |
| `/api/admin/config/dqs` | GET, PUT, POST | SCR-A13 |
| `/api/admin/config/plans` | GET, PUT | SCR-A14 |
| `/api/admin/jobs` | GET | SCR-A15 |
| `/api/admin/payments` | GET, POST | SCR-A16 |
