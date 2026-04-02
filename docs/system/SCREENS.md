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
version: 1.0
---

# SCREENS.md — Complete Screen Registry

Authoritative list of every user-facing screen in the BuonDesizn B2B Marketplace.
Each screen maps to a route, lists its data sources, and specifies backend API endpoints.

---

## 1. GUEST SCREENS (Non-Authenticated)

### SCR-G01 — Landing Page
- **Route**: `/`
- **Purpose**: Marketplace entry point with discovery and trust signals
- **Data Sources**: `profiles` (aggregated counts), `connections` (BuonNects count)
- **API Endpoints**: `GET /api/stats` (trust counters), `GET /api/profiles/featured` (role carousels)
- **Key Elements**: Global search bar (Location, Role, Keyword), Role sliders (PP, C, CON, PS, ED), Trust indicators (BuonNects, Verified Professionals, Leads), CTA to signup/login

### SCR-G02 — Search Results
- **Route**: `/discover` (guest mode)
- **Purpose**: Browse professionals/suppliers without authentication
- **Data Sources**: `searching_nearby_profiles()` RPC, `profiles`, `profiles.dqs_score`
- **API Endpoints**: `GET /api/profiles/search?role=&lat=&lng=&r=&q=`
- **Key Elements**: Profile cards (Logo/Photo, Name, Role, City, DQS badge, Distance), Role filter pills, Radius selector, Map panel (Leaflet), Infinite scroll (20/page)

### SCR-G03 — Masked Profile Preview
- **Route**: `/profiles/:id` (guest view)
- **Purpose**: View professional profile with PII hidden
- **Data Sources**: `profiles` (PII fields omitted server-side)
- **API Endpoints**: `GET /api/profiles/:id` (returns masked response)
- **Key Elements**: Portfolio, Services, Ratings, About section, Email/Phone shown as `***`, "View Contact" triggers login modal

### SCR-G04 — Login / Signup
- **Route**: `/auth/login`, `/auth/signup`
- **Purpose**: Authentication and account creation
- **Data Sources**: Supabase Auth
- **API Endpoints**: Supabase Auth API (`/auth/v1/*`)
- **Key Elements**: Email/password login, OAuth options, Signup form with role selection (PP, C, CON, PS, ED), Redirect to onboarding after signup

---

## 2. ONBOARDING SCREENS

### SCR-O01 — Role Selection & Verification
- **Route**: `/onboarding`
- **Purpose**: Complete profile setup after signup
- **Data Sources**: `profiles`, Supabase Auth user
- **API Endpoints**: `PATCH /api/profiles`, `POST /api/onboarding/verify`
- **Key Elements**: Primary role confirmation, PAN input (individual) or GSTIN input (company), Auto-enters 48-hour trial, 30 handshake credits granted, Redirect to `/dashboard` on completion

### SCR-O02 — Profile Setup Wizard
- **Route**: `/onboarding/profile`
- **Purpose**: Collect mandatory profile fields
- **Data Sources**: `profiles`, role extension tables
- **API Endpoints**: `PATCH /api/profiles`, `PATCH /api/profiles/:role`
- **Key Elements**: Display Name, Designation, Organisation Name, Email (pre-filled), Mobile, Mode of Contact (Email/Call/Both), About Myself (500 chars), Logo/Photo upload (5MB max), Location with Leaflet pin-drop

---

## 3. SHARED AUTHENTICATED SCREENS (All 5 Roles)

### SCR-S01 — Dashboard
- **Route**: `/dashboard`
- **Purpose**: Central operations hub with role-specific metrics
- **Data Sources**: Role-specific (see §7 below)
- **API Endpoints**: `GET /api/dashboard/metrics`, `GET /api/dashboard/activity`
- **Key Elements**: 4-card metric summary (role-specific), Recent activity feed, Trial countdown banner (if `trial`), Hard lock overlay (if `hard_locked`)
- **Responsive**: Sidebar (desktop), Bottom nav (mobile, 5 items)

### SCR-S02 — My Profile
- **Route**: `/profile`
- **Purpose**: Identity and professional settings
- **Data Sources**: `profiles`, role extension table
- **API Endpoints**: `GET /api/profiles/me`, `PATCH /api/profiles/me`
- **Key Elements**: Display Name, Designation, Organisation Name, Email (read-only), Mobile, Mode of Contact, About Myself, Logo upload (5MB), Location + Leaflet map, PAN (immutable after save), GSTIN (editable via change-request)

### SCR-S03 — My Plan
- **Route**: `/plan`
- **Purpose**: Subscription and credit management
- **Data Sources**: `subscriptions`, `profiles.handshake_credits`, `profiles.subscription_status`
- **API Endpoints**: `GET /api/subscriptions/me`, `POST /api/subscriptions/upgrade`, `GET /api/profile/rate-limits`
- **Key Elements**: Current plan (National Pro), Handshake credits remaining, Trial countdown (48h), Monthly reset date, PhonePe payment CTA, Subscription status indicator, Credit usage history

### SCR-S04 — My Database (Address Book)
- **Route**: `/address-book`
- **Purpose**: Permanently unmasked contacts from accepted handshakes
- **Data Sources**: `address_book` JOIN `profiles`
- **API Endpoints**: `GET /api/address-book`
- **Key Elements**: List of ACCEPTED connections with full PII (phone, email, LinkedIn), Search/filter contacts, Connection date, Role badge, "View Full Profile" link, Unmasked contact card

### SCR-S05 — My Notifications
- **Route**: `/notifications`
- **Purpose**: Alert center for marketplace activity
- **Data Sources**: `notifications`, `notification_preferences`
- **API Endpoints**: `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`, `GET/PUT /api/notifications/preferences`
- **Key Elements**: Inbox list (unread first, paginated 20/page), Mark as read (single/all), Notification types: CONNECTION_REQUESTED, CONNECTION_ACCEPTED, CONNECTION_REJECTED, CONNECTION_EXPIRED, RFP_CREATED, RFP_RESPONSE, RFP_RESPONSE_ACCEPTED, RFP_NEARBY, RFP_CLOSED, AD_APPROVED, AD_SUSPENDED, SUBSCRIPTION_EXPIRING, PAYMENT_SUCCESS, PAYMENT_FAILED, Channel preference toggles (email/SMS)

### SCR-S06 — Discover (Find Products & Services)
- **Route**: `/discover`
- **Purpose**: Global discovery gateway with 70% DQS / 30% Proximity ranking
- **Data Sources**: `searching_nearby_profiles()` RPC, `profiles`, `connections` (for button state)
- **API Endpoints**: `GET /api/profiles/search`, `POST /api/connections`, `GET /api/connections?target_id=`
- **Key Elements**: Search controls (Role filter, Keyword, Radius 10/25/50/100km, Location auto-detect/pin-drop), Map panel (Leaflet 40%), Results feed (60%, 20/page infinite scroll), Profile cards (masked/unmasked), Connection button (8-state matrix), Empty state, Loading skeletons
- **URL Params**: `?role=&lat=&lng=&r=&q=`

### SCR-S07 — Change Password
- **Route**: `/settings/password`
- **Purpose**: Account security
- **Data Sources**: Supabase Auth
- **API Endpoints**: Supabase Auth API (`/auth/v1/user`)
- **Key Elements**: Current password, New password, Confirm password, Submit button

### SCR-S08 — Handshake Request Screen
- **Route**: `/connections/request` (modal or page)
- **Purpose**: Initiate a connection request
- **Data Sources**: `profiles.handshake_credits`, `connections`
- **API Endpoints**: `POST /api/connections`
- **Key Elements**: Target profile summary, Credit cost display (1 credit), Confirmation dialog, Cancel option, Error states (insufficient credits, hard_locked)

### SCR-S09 — Incoming Handshake Screen
- **Route**: `/connections/incoming`
- **Purpose**: Respond to incoming connection requests
- **Data Sources**: `connections WHERE target_id = me AND status = 'REQUESTED'`
- **API Endpoints**: `GET /api/connections/incoming`, `PATCH /api/connections/:id`
- **Key Elements**: List of REQUESTED connections, Target profile summary, Accept/Decline buttons, 30-day expiry countdown, Bulk accept option

### SCR-S10 — Connection Detail Screen
- **Route**: `/connections/:id`
- **Purpose**: View connection status and details
- **Data Sources**: `connections`, `profiles`, `address_book`
- **API Endpoints**: `GET /api/connections/:id`, `PATCH /api/connections/:id`
- **Key Elements**: Connection state (MASKED/REQUESTED/ACCEPTED/REJECTED/EXPIRED/BLOCKED), Unmasked PII (if ACCEPTED), Block option, Connection history, Timestamp

---

## 4. PROJECT PROFESSIONAL (PP) SCREENS

### SCR-PP01 — My RFPs
- **Route**: `/rfps`
- **Purpose**: Manage RFPs I created
- **Data Sources**: `rfps WHERE creator_id = me`
- **API Endpoints**: `GET /api/rfps`, `DELETE /api/rfps/:id`
- **Key Elements**: RFP list (DRAFT/OPEN/CLOSED/CANCELLED/EXPIRED), Create RFP button, Response count per RFP, Status filter, Publish draft, Close/Cancel open RFPs

### SCR-PP02 — All RFPs (Browse)
- **Route**: `/rfps/browse`
- **Purpose**: Find open RFPs to respond to
- **Data Sources**: `rfps WHERE status = 'OPEN'`, `rfp_responses WHERE responder_id = me`
- **API Endpoints**: `GET /api/rfps/browse`, `POST /api/rfps/:id/respond`
- **Key Elements**: Browse open RFPs, Filter by persona/radius/sector, RFP detail preview, Submit Response button, Already responded indicator

### SCR-PP03 — My Projects
- **Route**: `/projects`
- **Purpose**: Track active and past projects
- **Data Sources**: `projects` (Phase 1: empty state)
- **API Endpoints**: `GET /api/projects/me`
- **Key Elements**: Project list, Status, Linked connections/contractors, Phase 1: "Coming Soon" empty state

### SCR-PP04 — RFP Response Detail
- **Route**: `/rfps/:id/responses/:responseId`
- **Purpose**: Review vendor responses to my RFP
- **Data Sources**: `rfp_responses`, `profiles` (responder)
- **API Endpoints**: `GET /api/rfps/:id/responses/:responseId`, `POST /api/rfps/:id/responses/:responseId/accept`, `PATCH /api/rfps/:id/responses/:responseId`
- **Key Elements**: Vendor bid details, Response content, Compare responses, Shortlist/Accept/Reject actions, Accept triggers free handshake + PII unmask

### SCR-PP05 — Portfolio / Work Samples
- **Route**: `/portfolio`
- **Purpose**: Showcase past work and projects
- **Data Sources**: `profiles.portfolio`, Supabase Storage
- **API Endpoints**: `GET /api/profiles/me/portfolio`, `POST /api/profiles/me/portfolio`, `DELETE /api/profiles/me/portfolio/:id`
- **Key Elements**: Project gallery, Descriptions, Drawings (60-min TTL signed URLs), Add/Edit/Delete portfolio items

### SCR-PP06 — RFP Detail View
- **Route**: `/rfps/:id`
- **Purpose**: View a single RFP (creator or responder view)
- **Data Sources**: `rfps`, `rfp_responses`
- **API Endpoints**: `GET /api/rfps/:id`
- **Key Elements**: RFP subject, Sector, Category, Order value, Payment terms, Location (text + map), Timeline, Response list (creator view), Submit response form (responder view)

### SCR-PP07 — Create/Edit RFP
- **Route**: `/rfps/new`, `/rfps/:id/edit`
- **Purpose**: Draft and publish RFPs
- **Data Sources**: `rfps`
- **API Endpoints**: `POST /api/rfps`, `PUT /api/rfps/:id`
- **Key Elements**: Section 1: RFP Subject, Sector, Category, Order Value (INR), Payment Terms; Section 2: Project Location, Pincode, State, City, Address + Leaflet map; Section 3: Work Commencement date, Work Completion date; Save as Draft, Publish (validates GSTIN, broadcasts)

---

## 5. CONSULTANT (C) SCREENS

### SCR-C01 — My RFPs
- **Route**: `/rfps`
- **Purpose**: Same as SCR-PP01
- **Data Sources**: `rfps WHERE creator_id = me`
- **API Endpoints**: `GET /api/rfps`, `DELETE /api/rfps/:id`

### SCR-C02 — All RFPs (Browse)
- **Route**: `/rfps/browse`
- **Purpose**: Same as SCR-PP02
- **Data Sources**: `rfps WHERE status = 'OPEN'`
- **API Endpoints**: `GET /api/rfps/browse`, `POST /api/rfps/:id/respond`

### SCR-C03 — My Projects
- **Route**: `/projects`
- **Purpose**: Same as SCR-PP03
- **Data Sources**: `projects` (Phase 1: empty state)
- **API Endpoints**: `GET /api/projects/me`

### SCR-C04 — RFP Response Detail
- **Route**: `/rfps/:id/responses/:responseId`
- **Purpose**: Same as SCR-PP04
- **Data Sources**: `rfp_responses`, `profiles`
- **API Endpoints**: `GET /api/rfps/:id/responses/:responseId`, `POST /api/rfps/:id/responses/:responseId/accept`

### SCR-C05 — Key Personnels (My Team)
- **Route**: `/my-team`
- **Purpose**: Manage GSTIN-linked firm roster
- **Data Sources**: `company_personnel WHERE company_gstin = me.gstin`
- **API Endpoints**: `GET /api/company-personnel`, `POST /api/company-personnel`, `PUT /api/company-personnel/:id`, `DELETE /api/company-personnel/:id`, `POST /api/company-personnel/bulk`
- **Key Elements**: Table view (Name, Designation, Qualification, Specialty, Experience, Status), Add single entry form, Bulk CSV import (500 rows max, downloadable template), Masked indicator for unconnected viewers, Active/Inactive toggle

### SCR-C06 — Firm Profile
- **Route**: `/firm`
- **Purpose**: Company-level identity and GSTIN management
- **Data Sources**: `profiles`, `company_personnel`, GSTIN verification API
- **API Endpoints**: `GET /api/firm`, `PATCH /api/firm`, `POST /api/firm/verify-gstin`
- **Key Elements**: GSTIN verification status, Firm name (from GSTIN API), Firm branding/logo, Linked PAN profiles list, Master Rep designation, Company DNA tree view

### SCR-C07 — Consultant Services
- **Route**: `/services`
- **Purpose**: Manage consulting services offered
- **Data Sources**: `consultants.services_offered`
- **API Endpoints**: `GET /api/consultants/me/services`, `PUT /api/consultants/me/services`
- **Key Elements**: Services list (add/edit/remove), Service categories, Specializations, Service descriptions

---

## 6. CONTRACTOR (CON) SCREENS

### SCR-CON01 — Key Personnels (My Team)
- **Route**: `/my-team`
- **Purpose**: Manage contractor team roster
- **Data Sources**: `company_personnel WHERE company_gstin = me.gstin`
- **API Endpoints**: `GET /api/company-personnel`, `POST /api/company-personnel`, `PUT /api/company-personnel/:id`, `DELETE /api/company-personnel/:id`, `POST /api/company-personnel/bulk`
- **Key Elements**: Same as SCR-C05

### SCR-CON02 — My Projects
- **Route**: `/projects`
- **Purpose**: Track execution projects
- **Data Sources**: `projects` (Phase 1: empty state)
- **API Endpoints**: `GET /api/projects/me`
- **Key Elements**: Active projects, Status, Timeline, Linked professionals, Phase 1: "Coming Soon"

### SCR-CON03 — Contractor Portfolio
- **Route**: `/portfolio`
- **Purpose**: Showcase completed construction work
- **Data Sources**: `profiles.portfolio`, `contractors`, Supabase Storage
- **API Endpoints**: `GET /api/profiles/me/portfolio`, `POST /api/profiles/me/portfolio`
- **Key Elements**: Project gallery, Site photos, Compliance documents (ISO/OHSAS flags), Add/Edit/Delete items

### SCR-CON04 — All RFPs (Browse)
- **Route**: `/rfps/browse`
- **Purpose**: Find contractor-focused RFPs
- **Data Sources**: `rfps WHERE status = 'OPEN'`
- **API Endpoints**: `GET /api/rfps/browse`, `POST /api/rfps/:id/respond`
- **Key Elements**: Filter for execution-focused RFPs, Submit bid form, Already responded indicator

### SCR-CON05 — Contractor Profile
- **Route**: `/profile` (CON-specific extension)
- **Purpose**: Contractor-specific profile fields
- **Data Sources**: `profiles`, `contractors`
- **API Endpoints**: `GET /api/profiles/me`, `PATCH /api/profiles/me`, `PATCH /api/contractors/me`
- **Key Elements**: All shared profile fields + Staff count, Owned equipment list, Concurrent projects capacity, ISO/OHSAS compliance flags, Fleet size

### SCR-CON06 — Equipment Owned
- **Route**: `/my-equipment`
- **Purpose**: View/manage contractor-owned equipment
- **Data Sources**: `contractors.owned_equipment`
- **API Endpoints**: `GET /api/contractors/me/equipment`, `PUT /api/contractors/me/equipment`
- **Key Elements**: Equipment list, Add/Edit equipment entries, Equipment type, Condition, Availability

---

## 7. PRODUCT SELLER (PS) SCREENS

### SCR-PS01 — My Products
- **Route**: `/products`
- **Purpose**: Product catalog management
- **Data Sources**: `products WHERE seller_id = me`
- **API Endpoints**: `GET /api/products/me`, `DELETE /api/products/:id`
- **Key Elements**: Product list (SKU, Name, Price, Images, Status), Add Product button, Edit/Delete actions, Search/filter, Bulk actions

### SCR-PS02 — Add / Edit Product
- **Route**: `/products/new`, `/products/:id/edit`
- **Purpose**: Create or update product listing
- **Data Sources**: `products`
- **API Endpoints**: `POST /api/products`, `PUT /api/products/:id`
- **Key Elements**: Section 1: Product Name, Material Category, Material Type (dependent), Description (250 chars), Area of Application; Section 2: Images (max 5, 5MB), Catalog PDF (10MB), Video (50MB, .mov/.mp4); Section 3: Model No., Manufactured by, MOQ, Lead Time, Manufacturing Location, Size (LxBxH), UOM, Color Options, Price/Unit (INR), Discount Price, Warranty, Green Building Compliant (Y/N), Product Tags; Section 4: Dynamic technical specs builder (Attribute/Unit/Value/Testing Standard rows)

### SCR-PS03 — Enquiries
- **Route**: `/enquiries`
- **Purpose**: Inbound product enquiry management
- **Data Sources**: `connections WHERE target_id = me AND connection_source = 'SEARCH'`
- **API Endpoints**: `GET /api/enquiries`, `PATCH /api/connections/:id`
- **Key Elements**: List of inbound enquiries, Enquiry source (product/profile), Respond to enquiry, Accept handshake, Status filter (new/responded/accepted)

### SCR-PS04 — My Ads
- **Route**: `/ads`
- **Purpose**: Advertisement campaign management
- **Data Sources**: `ads WHERE profile_id = me`, `ad_analytics`
- **API Endpoints**: `GET /api/ads/me`, `POST /api/ads`, `PUT /api/ads/:id`, `DELETE /api/ads/:id`, `POST /api/ads/:id/retry-payment`, `POST /api/ads/:id/refund-request`
- **Key Elements**: Ad list (status, impressions, clicks, spend), Create Ad button, Ad state (DRAFT/PENDING_PAYMENT/ACTIVE/PAUSED/EXPIRED/SUSPENDED), Payment retry, Refund request, Moderation status

### SCR-PS05 — Create / Edit Ad
- **Route**: `/ads/new`, `/ads/:id/edit`
- **Purpose**: Create geo-targeted advertisement
- **Data Sources**: `ads`
- **API Endpoints**: `POST /api/ads`, `PUT /api/ads/:id`, `POST /api/ads/:id/connect`
- **Key Elements**: Ad title, Description, Image upload (max 5, 5MB), Target URL, Geo-targeting radius, Duration, Budget, Payment via PhonePe, Preview

### SCR-PS06 — Product Detail (Public)
- **Route**: `/products/:id`
- **Purpose**: Individual product view (public + authenticated)
- **Data Sources**: `products`, `profiles` (seller)
- **API Endpoints**: `GET /api/products/:id`
- **Key Elements**: Full specs, Images gallery, Pricing, Seller info (masked), Enquiry button, Technical specs table

### SCR-PS07 — Product Detail (Edit View)
- **Route**: `/products/:id` (seller view)
- **Purpose**: Seller's detailed product management view
- **Data Sources**: `products`, `ad_analytics` (if promoted)
- **API Endpoints**: `GET /api/products/:id`, `PUT /api/products/:id`
- **Key Elements**: Edit mode, View count, Enquiry count, Promote to ad CTA

---

## 8. EQUIPMENT DEALER (ED) SCREENS

### SCR-ED01 — My Equipment
- **Route**: `/equipment`
- **Purpose**: Fleet/asset listing and management
- **Data Sources**: `equipment WHERE dealer_id = me`
- **API Endpoints**: `GET /api/equipment/me`, `DELETE /api/equipment/:id`
- **Key Elements**: Equipment list (Type, Availability, Rate, Status, Images), Add Equipment button, Edit/Delete actions, Search/filter, Maintenance due indicators

### SCR-ED02 — Add / Edit Equipment
- **Route**: `/equipment/new`, `/equipment/:id/edit`
- **Purpose**: Create or update equipment listing
- **Data Sources**: `equipment`
- **API Endpoints**: `POST /api/equipment`, `PUT /api/equipment/:id`
- **Key Elements**: Section 1: Equipment Name, Category (Excavators/Cranes/Generators/etc), Manufactured On (date), Description, Hypothecated? (Y/N), RC Available? (Y/N); Section 2: Images (max 5, 5MB), Catalog PDF (10MB), Video (50MB); Section 3: Monthly Rental Price (INR), Selling Price (INR), Current Location (text + Leaflet pin); Section 4: Dynamic performance specs builder (Property/Unit/Value/Testing Standard)

### SCR-ED03 — Requests
- **Route**: `/requests`
- **Purpose**: Inbound equipment rental/sale requests
- **Data Sources**: `connections WHERE target_id = me AND connection_source = 'EQUIPMENT'`
- **API Endpoints**: `GET /api/requests`, `PATCH /api/connections/:id`
- **Key Elements**: List of inbound requests, Request source (equipment/ad), Respond, Accept handshake, Status filter

### SCR-ED04 — My Ads
- **Route**: `/ads`
- **Purpose**: Same as SCR-PS04
- **Data Sources**: `ads WHERE profile_id = me`
- **API Endpoints**: `GET /api/ads/me`, `POST /api/ads`, `PUT /api/ads/:id`, `DELETE /api/ads/:id`

### SCR-ED05 — Equipment Detail (Public)
- **Route**: `/equipment/:id`
- **Purpose**: Individual equipment view (public + authenticated)
- **Data Sources**: `equipment`, `profiles` (dealer)
- **API Endpoints**: `GET /api/equipment/:id`
- **Key Elements**: Full specs, Images, Availability calendar, Rate card (rental + sale), Dealer info (masked), Request button, Performance specs table

### SCR-ED06 — Equipment Booking Detail
- **Route**: `/equipment/:id/bookings/:bookingId`
- **Purpose**: View/manage individual equipment booking
- **Data Sources**: `equipment_bookings`, `equipment`
- **API Endpoints**: `GET /api/equipment/:id/bookings/:bookingId`
- **Key Elements**: Booking dates, Payment status, Return status, Late return flag, Total amount

---

## 9. SETTINGS SCREENS (All Roles)

### SCR-SET01 — Notification Preferences
- **Route**: `/settings/notifications`
- **Purpose**: Configure notification delivery channels
- **Data Sources**: `notification_preferences`
- **API Endpoints**: `GET /api/notifications/preferences`, `PUT /api/notifications/preferences`
- **Key Elements**: Email notifications toggle, SMS notifications toggle, Per-type notification toggles (connection, RFP, ads, subscription)

### SCR-SET02 — Contact Preferences
- **Route**: `/settings/contact`
- **Purpose**: Configure how others can contact you
- **Data Sources**: `profiles`
- **API Endpoints**: `PATCH /api/profiles/me`
- **Key Elements**: Mode of Contact (Email/Call/Both), Business hours, Auto-accept handshakes toggle (future)

### SCR-SET03 — Privacy & Data
- **Route**: `/settings/privacy`
- **Purpose**: Manage data visibility and export
- **Data Sources**: `profiles`, `connections`, `address_book`
- **API Endpoints**: `GET /api/profiles/me/data-export`, `DELETE /api/profiles/me`
- **Key Elements**: Profile visibility toggle, Data export (JSON/PDF), Account deletion request, Blocked users list, Unblock actions

### SCR-SET04 — Billing & Invoices
- **Route**: `/settings/billing`
- **Purpose**: View billing history and invoices
- **Data Sources**: `subscriptions`, PhonePe transaction log
- **API Endpoints**: `GET /api/subscriptions/invoices`, `GET /api/subscriptions/receipts/:id`
- **Key Elements**: Payment history, Invoice download, Subscription plan details, Next billing date, Cancel subscription option

### SCR-SET05 — API & Integrations
- **Route**: `/settings/integrations`
- **Purpose**: Manage third-party integrations
- **Data Sources**: `profiles`
- **API Endpoints**: `GET /api/profiles/me/integrations`, `PUT /api/profiles/me/integrations`
- **Key Elements**: LinkedIn URL, Website URL, Social media links, Connected apps (future)

### SCR-SET06 — GSTIN Change Request
- **Route**: `/settings/gstin`
- **Purpose**: Request GSTIN change after initial verification
- **Data Sources**: `profiles`
- **API Endpoints**: `POST /api/profiles/me/gstin-change`
- **Key Elements**: Current GSTIN display, New GSTIN input, Reason for change, Document upload, Status tracker (PENDING_VERIFICATION → PENDING_ADMIN → VERIFIED/REJECTED)

---

## 10. SYSTEM & ALERT SCREENS

### SCR-SYS01 — 404 Not Found
- **Route**: `*` (catch-all)
- **Purpose**: Handle invalid routes
- **Key Elements**: "Page not found" message, BuonDesizn branding, Back to Dashboard button, Search bar, Suggested pages

### SCR-SYS02 — 500 Server Error
- **Route**: `/500`
- **Purpose**: Handle server-side errors
- **Key Elements**: Error message, "Something went wrong" text, Retry button, Support contact link, Error reference ID (Sentry)

### SCR-SYS03 — Hard Lock Screen
- **Route**: `/locked` (or overlay on any route)
- **Purpose**: Display when trial expired without payment (H+49)
- **Data Sources**: `profiles.subscription_status`
- **API Endpoints**: `GET /api/profiles/me`
- **Key Elements**: "Your 48-hour trial has ended" message, Account locked status, "Upgrade to National Pro" CTA → `/plan`, Feature restriction list, Support contact

### SCR-SYS04 — Trial Expiry Warning
- **Route**: Banner on all authenticated pages (not a full page)
- **Purpose**: Warn before hard lock (H+47)
- **Data Sources**: `profiles.subscription_status`, `profiles.trial_started_at`
- **Key Elements**: Countdown timer (hours remaining), "Upgrade to National Pro" CTA, Dismiss option

### SCR-SYS05 — Payment Success
- **Route**: `/payment/success`
- **Purpose**: Confirm successful PhonePe payment
- **Data Sources**: `subscriptions`, PhonePe webhook
- **API Endpoints**: `GET /api/subscriptions/me`, `GET /api/webhooks/phonepe` (internal)
- **Key Elements**: Payment confirmation, Credits reset to 30, Subscription status: Active, Next reset date, Continue to Dashboard CTA

### SCR-SYS06 — Payment Failure
- **Route**: `/payment/failed`
- **Purpose**: Handle failed payment
- **Data Sources**: `subscriptions`, PhonePe webhook
- **API Endpoints**: `GET /api/subscriptions/me`
- **Key Elements**: Error message, Payment failure reason, Retry payment CTA, Alternative payment methods (future), Support contact

### SCR-SYS07 — Payment Pending
- **Route**: `/payment/pending`
- **Purpose**: Show while payment is processing
- **Data Sources**: `subscriptions`
- **API Endpoints**: `GET /api/subscriptions/me`
- **Key Elements**: "Payment processing" message, Spinner, Auto-refresh status, Estimated completion time

### SCR-SYS08 — Email Verification Required
- **Route**: `/auth/verify-email`
- **Purpose**: Prompt user to verify email after signup
- **Data Sources**: Supabase Auth
- **API Endpoints**: Supabase Auth API
- **Key Elements**: Verification email sent message, Resend email button, Check spam folder tip, Continue after verification

### SCR-SYS09 — Verification Pending (Admin Review)
- **Route**: `/verification/pending`
- **Purpose**: Show when profile is in PENDING_ADMIN state
- **Data Sources**: `profiles.verification_status`
- **API Endpoints**: `GET /api/profiles/me`
- **Key Elements**: "Your profile is under review" message, Estimated review time, What to expect next, Contact support link

### SCR-SYS10 — Verification Rejected
- **Route**: `/verification/rejected`
- **Purpose**: Show when verification fails
- **Data Sources**: `profiles.verification_status`
- **API Endpoints**: `GET /api/profiles/me`
- **Key Elements**: Rejection reason, What went wrong (duplicate PAN, invalid GSTIN, admin rejection), Retry verification CTA, Support contact

### SCR-SYS11 — Session Expired
- **Route**: `/auth/session-expired`
- **Purpose**: Handle expired auth sessions
- **Data Sources**: Supabase Auth
- **Key Elements**: "Session expired" message, Login again CTA, Redirect to login

### SCR-SYS12 — Maintenance Mode
- **Route**: `/maintenance`
- **Purpose**: Display during system maintenance
- **Key Elements**: Maintenance message, Estimated downtime, Status page link, Emergency contact

---

## 11. ADMIN SCREENS (SUPER_ADMIN)

### Identity & Verification

### SCR-A01 — Identity Review Queue
- **Route**: `/admin/identity`
- **Purpose**: Review pending profile verifications
- **Data Sources**: `profiles WHERE verification_status = 'PENDING_ADMIN'`
- **API Endpoints**: `GET /api/admin/identity/pending`, `POST /api/admin/identity/:id/approve`, `POST /api/admin/identity/:id/reject`
- **Key Elements**: Queue of PENDING_ADMIN profiles, GSTIN/PAN validation results, Firm name match from API, Document viewer, Approve/Reject with reason, Bulk actions

### SCR-A02 — Profile Detail (Admin View)
- **Route**: `/admin/users/:id`
- **Purpose**: Deep-dive into any user profile
- **Data Sources**: `profiles`, role extension tables, `connections`, `company_personnel`, `subscriptions`
- **API Endpoints**: `GET /api/admin/users/:id`, `PATCH /api/admin/users/:id`
- **Key Elements**: Full PII (no masking), Verification status, GSTIN/PAN details, Company DNA tree, Connection history, DQS breakdown (all 4 components), Subscription status, Activity log, Suspend user action

### SCR-A03 — User Suspension Panel
- **Route**: `/admin/users/:id/suspend`
- **Purpose**: Suspend or reinstate user accounts
- **Data Sources**: `profiles`
- **API Endpoints**: `POST /api/admin/users/:id/suspend`, `POST /api/admin/users/:id/reinstate`
- **Key Elements**: Current status, Suspend with reason dropdown, Custom reason text field, Reinstate action, Suspension history log, Notification to user toggle

### SCR-A04 — Company DNA Explorer
- **Route**: `/admin/companies`
- **Purpose**: View and manage GSTIN-linked organizations
- **Data Sources**: `profiles` (with GSTIN), `company_personnel`
- **API Endpoints**: `GET /api/admin/companies`, `GET /api/admin/companies/:gstin`
- **Key Elements**: GSTIN search, Organization list, All linked personnel, Master Rep identification, Unmask audit trail per GSTIN, Personnel count, Verification status per org

### Moderation & Content Safety

### SCR-A05 — Moderation Queue
- **Route**: `/admin/moderation`
- **Purpose**: Review flagged and suspended ads
- **Data Sources**: `ads WHERE moderation_status IN ('FLAGGED', 'SUSPENDED')`
- **API Endpoints**: `GET /api/moderation/queue`, `POST /api/moderation/:ad_id/clear`, `POST /api/moderation/:ad_id/reject`
- **Key Elements**: List of flagged/suspended ads, Ad image preview, Sightengine flag reasons, Ad content details, Creator info, Clear/Reject actions, Bulk moderation

### SCR-A06 — Ad Detail (Admin View)
- **Route**: `/admin/ads/:id`
- **Purpose**: Full ad inspection and management
- **Data Sources**: `ads`, `ad_analytics`, `profiles` (creator)
- **API Endpoints**: `GET /api/admin/ads/:id`, `PATCH /api/admin/ads/:id`
- **Key Elements**: Ad content, Payment status, Moderation history (state transitions), Impression/click analytics, Creator details, Force state change, Refund trigger

### SCR-A07 — Moderation History
- **Route**: `/admin/moderation/history`
- **Purpose**: Audit trail of all moderation actions
- **Data Sources**: `system_audit_log` (moderation actions), `ads`
- **API Endpoints**: `GET /api/admin/moderation/history`
- **Key Elements**: Filter by date/status/action/admin, Before/after states, Export CSV, Ad creator notification log

### Audit & Compliance

### SCR-A08 — Audit Explorer
- **Route**: `/admin/audit`
- **Purpose**: System-wide audit log viewer
- **Data Sources**: `system_audit_log`
- **API Endpoints**: `GET /api/admin/audit`
- **Key Elements**: Full audit log, Filter by entity type/user/action/date range, Search, Export (CSV/JSON), Pagination (50/page)

### SCR-A09 — Unmasking Audit
- **Route**: `/admin/audit/unmasking`
- **Purpose**: Track all PII reveal events
- **Data Sources**: `unmasking_audit`
- **API Endpoints**: `GET /api/admin/audit/unmasking`
- **Key Elements**: Unmask events list, Who unmasked whom, Timestamp, Mechanism (handshake/RFP/Company DNA), Revealed fields list, Filter by date/user/mechanism, Export

### SCR-A10 — Audit Purge Queue
- **Route**: `/admin/audit/purge`
- **Purpose**: Manage data retention and scheduled deletion
- **Data Sources**: `audit_purge_queue`
- **API Endpoints**: `GET /api/admin/audit/purge`, `POST /api/admin/audit/purge/execute`
- **Key Elements**: Scheduled purge entries, Manual purge trigger, Purge history, Compliance status, Retention policy display

### SCR-A11 — Personnel Audit
- **Route**: `/admin/audit/personnel`
- **Purpose**: Track company personnel data exposure
- **Data Sources**: `unmasking_audit` (filtered for personnel fields), `company_personnel`
- **API Endpoints**: `GET /api/admin/audit/personnel`
- **Key Elements**: Filter by `revealed_fields` containing `personnel_email`, Company personnel unmask events, GSTIN-wide unmask tracking, Exposure timeline

### System Configuration

### SCR-A12 — Global Toggles
- **Route**: `/admin/config`
- **Purpose**: System-wide feature flags and configuration
- **Data Sources**: `system_config`
- **API Endpoints**: `GET /api/admin/config`, `PUT /api/admin/config`
- **Key Elements**: Feature enable/disable toggles, Broadcast radius cap, Trial duration override, Maintenance mode toggle, DQS recalc trigger, System announcements

### SCR-A13 — DQS Configuration
- **Route**: `/admin/config/dqs`
- **Purpose**: Manage Discovery Quality Score algorithm
- **Data Sources**: `profiles.dqs_score`, `system_config`
- **API Endpoints**: `GET /api/admin/config/dqs`, `PUT /api/admin/config/dqs`, `POST /api/admin/dqs/recalc`
- **Key Elements**: Current formula weights (0.4 Responsiveness, 0.3 Trust Loops, 0.2 Verification, 0.1 Depth), Weight adjustment sliders, Preview impact on rankings, Manual recalc trigger, Last recalc timestamp

### SCR-A14 — Subscription Plans
- **Route**: `/admin/config/plans`
- **Purpose**: Manage pricing, plans, and credit allocations
- **Data Sources**: `subscriptions`, `system_config`
- **API Endpoints**: `GET /api/admin/config/plans`, `PUT /api/admin/config/plans`
- **Key Elements**: Plan details (National Pro), Credit amounts, Monthly pricing, PhonePe configuration, Trial duration, Auto-renewal settings

### Platform Analytics

### SCR-A15 — Admin Dashboard (Overview)
- **Route**: `/admin`
- **Purpose**: Platform health overview
- **Data Sources**: `profiles`, `connections`, `rfps`, `ads`, `subscriptions`
- **API Endpoints**: `GET /api/admin/dashboard`
- **Key Elements**: Total users by role, Active vs trial vs hard_locked counts, Today's handshakes, RFP activity (open/closed), Ad revenue, DQS distribution chart, Pending verifications count, Flagged ads count

### SCR-A16 — User Analytics
- **Route**: `/admin/analytics/users`
- **Purpose**: Growth and engagement metrics
- **Data Sources**: `profiles`, `connections`, `subscriptions`
- **API Endpoints**: `GET /api/admin/analytics/users`
- **Key Elements**: Registration trends (chart), Role distribution pie chart, Geographic heatmap, Retention rates, Trial-to-paid conversion rate, Churn analysis

### SCR-A17 — Handshake Analytics
- **Route**: `/admin/analytics/handshakes`
- **Purpose**: Connection economy metrics
- **Data Sources**: `connections`, `profiles.handshake_credits`
- **API Endpoints**: `GET /api/admin/analytics/handshakes`
- **Key Elements**: Total handshakes by state, Acceptance rate, Average response time, Credit consumption rate, Re-initiation patterns, State distribution chart

### SCR-A18 — RFP Analytics
- **Route**: `/admin/analytics/rfps`
- **Purpose**: Marketplace procurement activity
- **Data Sources**: `rfps`, `rfp_responses`
- **API Endpoints**: `GET /api/admin/analytics/rfps`
- **Key Elements**: Open/Closed/Expired RFPs count, Average responses per RFP, Acceptance rate by persona, Broadcast effectiveness, RFP lifecycle duration

### SCR-A19 — Ad Analytics
- **Route**: `/admin/analytics/ads`
- **Purpose**: Advertisement performance and monetization
- **Data Sources**: `ads`, `ad_analytics`
- **API Endpoints**: `GET /api/admin/analytics/ads`
- **Key Elements**: Active ads count, Total revenue, Moderation pass/fail rate, Expiry/renewal rate, Top advertisers, Impression/click trends

### SCR-A20 — Revenue Dashboard
- **Route**: `/admin/analytics/revenue`
- **Purpose**: Financial overview
- **Data Sources**: `subscriptions`, PhonePe transaction log, `ads`
- **API Endpoints**: `GET /api/admin/analytics/revenue`
- **Key Elements**: Subscription revenue (monthly), Ad revenue, PhonePe transaction log, Refund tracking, Revenue by plan, Growth chart

### Operational Management

### SCR-A21 — Notification Center (Admin)
- **Route**: `/admin/notifications`
- **Purpose**: Send platform-wide communications
- **Data Sources**: `notifications`, `profiles`
- **API Endpoints**: `POST /api/admin/notifications/broadcast`, `GET /api/admin/notifications/sent`
- **Key Elements**: Compose broadcast notification, Target by role/region/status, Trial expiry reminders, System announcements, Delivery status, Sent history

### SCR-A22 — Job Queue Monitor
- **Route**: `/admin/jobs`
- **Purpose**: Background job health monitoring
- **Data Sources**: QStash job status, pg_cron history
- **API Endpoints**: `GET /api/admin/jobs`
- **Key Elements**: QStash job status list, pg_cron job history (DQS recalc, expiry checks), Failed jobs, Retry triggers, Last run timestamps, Next scheduled run

### SCR-A23 — Payment Reconciliation
- **Route**: `/admin/payments`
- **Purpose**: Match payments to user accounts
- **Data Sources**: `subscriptions`, PhonePe webhook log
- **API Endpoints**: `GET /api/admin/payments`, `POST /api/admin/payments/reconcile`
- **Key Elements**: PhonePe webhook log, Unmatched payments, Failed payment retries, Manual reconciliation, Refund processing, Transaction search

### SCR-A24 — Support Tickets
- **Route**: `/admin/support`
- **Purpose**: User issues and requests management
- **Data Sources**: Refund requests, verification disputes, support messages
- **API Endpoints**: `GET /api/admin/support`, `PATCH /api/admin/support/:id`
- **Key Elements**: Ticket list, Filter by user/status/type, Refund requests (suspended ads), Verification disputes, Resolution tracking, Assign to admin, Response history

---

## SCREEN COUNT SUMMARY

| Category | Count | Screen IDs |
|----------|-------|------------|
| Guest | 4 | SCR-G01 to SCR-G04 |
| Onboarding | 2 | SCR-O01 to SCR-O02 |
| Shared Authenticated | 10 | SCR-S01 to SCR-S10 |
| Project Professional (unique) | 7 | SCR-PP01 to SCR-PP07 |
| Consultant (unique) | 7 | SCR-C01 to SCR-C07 |
| Contractor (unique) | 6 | SCR-CON01 to SCR-CON06 |
| Product Seller (unique) | 7 | SCR-PS01 to SCR-PS07 |
| Equipment Dealer (unique) | 6 | SCR-ED01 to SCR-ED06 |
| Settings | 6 | SCR-SET01 to SCR-SET06 |
| System & Alerts | 12 | SCR-SYS01 to SCR-SYS12 |
| Admin | 24 | SCR-A01 to SCR-A24 |

**Total unique screens: 91**

Note: Many role-specific screens share routes and components (e.g., `/rfps`, `/my-team`, `/ads`). The count above reflects distinct page templates. Shared screens (SCR-S01 to SCR-S10) render role-specific content based on the authenticated user's persona_type.

---

## ROUTE INDEX (Next.js App Router Mapping)

```
/                           → SCR-G01
/discover                   → SCR-G02, SCR-S06
/profiles/:id               → SCR-G03
/auth/login                 → SCR-G04
/auth/signup                → SCR-G04
/auth/verify-email          → SCR-SYS08
/auth/session-expired       → SCR-SYS11
/onboarding                 → SCR-O01
/onboarding/profile         → SCR-O02
/dashboard                  → SCR-S01
/profile                    → SCR-S02, SCR-CON05
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
/connections/request        → SCR-S08
/connections/incoming       → SCR-S09
/connections/:id            → SCR-S10
/rfps                       → SCR-PP01, SCR-C01
/rfps/new                   → SCR-PP07
/rfps/:id                   → SCR-PP06
/rfps/:id/edit              → SCR-PP07
/rfps/:id/responses/:respId → SCR-PP04, SCR-C04
/rfps/browse                → SCR-PP02, SCR-C02, SCR-CON04
/projects                   → SCR-PP03, SCR-C03, SCR-CON02
/portfolio                  → SCR-PP05, SCR-CON03
/my-team                    → SCR-C05, SCR-CON01
/firm                       → SCR-C06
/services                   → SCR-C07
/my-equipment               → SCR-CON06
/products                   → SCR-PS01
/products/new               → SCR-PS02
/products/:id               → SCR-PS06, SCR-PS07
/products/:id/edit          → SCR-PS02
/enquiries                  → SCR-PS03
/ads                        → SCR-PS04, SCR-ED04
/ads/new                    → SCR-PS05
/ads/:id                    → SCR-PS05
/ads/:id/edit               → SCR-PS05
/equipment                  → SCR-ED01
/equipment/new              → SCR-ED02
/equipment/:id              → SCR-ED05
/equipment/:id/edit         → SCR-ED02
/equipment/:id/bookings/:bid→ SCR-ED06
/requests                   → SCR-ED03
/payment/success            → SCR-SYS05
/payment/failed             → SCR-SYS06
/payment/pending            → SCR-SYS07
/locked                     → SCR-SYS03
/verification/pending       → SCR-SYS09
/verification/rejected      → SCR-SYS10
/maintenance                → SCR-SYS12
/500                        → SCR-SYS02
* (catch-all)               → SCR-SYS01
/admin                      → SCR-A15
/admin/identity             → SCR-A01
/admin/users/:id            → SCR-A02
/admin/users/:id/suspend    → SCR-A03
/admin/companies            → SCR-A04
/admin/moderation           → SCR-A05
/admin/ads/:id              → SCR-A06
/admin/moderation/history   → SCR-A07
/admin/audit                → SCR-A08
/admin/audit/unmasking      → SCR-A09
/admin/audit/purge          → SCR-A10
/admin/audit/personnel      → SCR-A11
/admin/config               → SCR-A12
/admin/config/dqs           → SCR-A13
/admin/config/plans         → SCR-A14
/admin/analytics/users      → SCR-A16
/admin/analytics/handshakes → SCR-A17
/admin/analytics/rfps       → SCR-A18
/admin/analytics/ads        → SCR-A19
/admin/analytics/revenue    → SCR-A20
/admin/notifications        → SCR-A21
/admin/jobs                 → SCR-A22
/admin/payments             → SCR-A23
/admin/support              → SCR-A24
```

---

## API ENDPOINT INDEX (Backend Contract Mapping)

### Authentication & Profiles
| Endpoint | Method | Screens |
|----------|--------|---------|
| `/api/profiles/me` | GET, PATCH | SCR-S02, SCR-CON05, SCR-SYS03, SCR-SYS09, SCR-SYS10 |
| `/api/profiles/:id` | GET | SCR-G03, SCR-S10 |
| `/api/profiles/search` | GET | SCR-G02, SCR-S06 |
| `/api/profiles/featured` | GET | SCR-G01 |
| `/api/profiles/me/portfolio` | GET, POST, DELETE | SCR-PP05, SCR-CON03 |
| `/api/profiles/me/gstin-change` | POST | SCR-SET06 |
| `/api/stats` | GET | SCR-G01 |
| `/api/onboarding/verify` | POST | SCR-O01 |

### Connections & Handshakes
| Endpoint | Method | Screens |
|----------|--------|---------|
| `/api/connections` | POST, GET | SCR-S06, SCR-S08 |
| `/api/connections/:id` | GET, PATCH | SCR-S09, SCR-S10, SCR-PS03, SCR-ED03 |
| `/api/connections/incoming` | GET | SCR-S09 |
| `/api/address-book` | GET | SCR-S04 |

### RFPs
| Endpoint | Method | Screens |
|----------|--------|---------|
| `/api/rfps` | POST, GET, DELETE | SCR-PP01, SCR-C01, SCR-PP07 |
| `/api/rfps/browse` | GET | SCR-PP02, SCR-C02, SCR-CON04 |
| `/api/rfps/:id` | GET | SCR-PP06 |
| `/api/rfps/:id/respond` | POST | SCR-PP02, SCR-C02, SCR-CON04 |
| `/api/rfps/:id/close` | PATCH | SCR-PP01 |
| `/api/rfps/:id/cancel` | PATCH | SCR-PP01 |
| `/api/rfps/:id/responses/:responseId` | GET | SCR-PP04, SCR-C04 |
| `/api/rfps/:id/responses/:responseId/accept` | POST | SCR-PP04, SCR-C04 |

### Subscriptions & Payments
| Endpoint | Method | Screens |
|----------|--------|---------|
| `/api/subscriptions/me` | GET | SCR-S03, SCR-SYS05, SCR-SYS06, SCR-SYS07 |
| `/api/subscriptions/upgrade` | POST | SCR-S03 |
| `/api/subscriptions/invoices` | GET | SCR-SET04 |
| `/api/subscriptions/receipts/:id` | GET | SCR-SET04 |
| `/api/profile/rate-limits` | GET | SCR-S03 |
| `/api/webhooks/phonepe` | POST | SCR-SYS05, SCR-SYS06 (internal) |

### Products
| Endpoint | Method | Screens |
|----------|--------|---------|
| `/api/products/me` | GET | SCR-PS01 |
| `/api/products` | POST | SCR-PS02 |
| `/api/products/:id` | GET, PUT, DELETE | SCR-PS02, SCR-PS06, SCR-PS07 |

### Equipment
| Endpoint | Method | Screens |
|----------|--------|---------|
| `/api/equipment/me` | GET | SCR-ED01 |
| `/api/equipment` | POST | SCR-ED02 |
| `/api/equipment/:id` | GET, PUT, DELETE | SCR-ED02, SCR-ED05 |
| `/api/equipment/:id/bookings/:bookingId` | GET | SCR-ED06 |

### Ads
| Endpoint | Method | Screens |
|----------|--------|---------|
| `/api/ads/me` | GET | SCR-PS04, SCR-ED04 |
| `/api/ads` | POST | SCR-PS05 |
| `/api/ads/:id` | GET, PUT, DELETE | SCR-PS05 |
| `/api/ads/:id/retry-payment` | POST | SCR-PS04 |
| `/api/ads/:id/refund-request` | POST | SCR-PS04 |
| `/api/ads/:id/connect` | POST | SCR-PS05 |

### Company Personnel
| Endpoint | Method | Screens |
|----------|--------|---------|
| `/api/company-personnel` | GET, POST | SCR-C05, SCR-CON01 |
| `/api/company-personnel/:id` | PUT, DELETE | SCR-C05, SCR-CON01 |
| `/api/company-personnel/bulk` | POST | SCR-C05, SCR-CON01 |

### Notifications
| Endpoint | Method | Screens |
|----------|--------|---------|
| `/api/notifications` | GET | SCR-S05 |
| `/api/notifications/:id/read` | PATCH | SCR-S05 |
| `/api/notifications/read-all` | PATCH | SCR-S05 |
| `/api/notifications/preferences` | GET, PUT | SCR-S05, SCR-SET01 |

### Dashboard
| Endpoint | Method | Screens |
|----------|--------|---------|
| `/api/dashboard/metrics` | GET | SCR-S01 |
| `/api/dashboard/activity` | GET | SCR-S01 |

### Consultant
| Endpoint | Method | Screens |
|----------|--------|---------|
| `/api/consultants/me/services` | GET, PUT | SCR-C07 |
| `/api/firm` | GET, PATCH | SCR-C06 |
| `/api/firm/verify-gstin` | POST | SCR-C06 |

### Contractor
| Endpoint | Method | Screens |
|----------|--------|---------|
| `/api/contractors/me` | PATCH | SCR-CON05 |
| `/api/contractors/me/equipment` | GET, PUT | SCR-CON06 |
| `/api/projects/me` | GET | SCR-PP03, SCR-C03, SCR-CON02 |

### Moderation
| Endpoint | Method | Screens |
|----------|--------|---------|
| `/api/moderation/queue` | GET | SCR-A05 |
| `/api/moderation/:ad_id/clear` | POST | SCR-A05 |
| `/api/moderation/:ad_id/reject` | POST | SCR-A05 |

### Admin
| Endpoint | Method | Screens |
|----------|--------|---------|
| `/api/admin/dashboard` | GET | SCR-A15 |
| `/api/admin/identity/pending` | GET | SCR-A01 |
| `/api/admin/identity/:id/approve` | POST | SCR-A01 |
| `/api/admin/identity/:id/reject` | POST | SCR-A01 |
| `/api/admin/users/:id` | GET, PATCH | SCR-A02 |
| `/api/admin/users/:id/suspend` | POST | SCR-A03 |
| `/api/admin/users/:id/reinstate` | POST | SCR-A03 |
| `/api/admin/companies` | GET | SCR-A04 |
| `/api/admin/companies/:gstin` | GET | SCR-A04 |
| `/api/admin/ads/:id` | GET, PATCH | SCR-A06 |
| `/api/admin/moderation/history` | GET | SCR-A07 |
| `/api/admin/audit` | GET | SCR-A08 |
| `/api/admin/audit/unmasking` | GET | SCR-A09 |
| `/api/admin/audit/purge` | GET, POST | SCR-A10 |
| `/api/admin/audit/personnel` | GET | SCR-A11 |
| `/api/admin/config` | GET, PUT | SCR-A12 |
| `/api/admin/config/dqs` | GET, PUT, POST | SCR-A13 |
| `/api/admin/config/plans` | GET, PUT | SCR-A14 |
| `/api/admin/analytics/users` | GET | SCR-A16 |
| `/api/admin/analytics/handshakes` | GET | SCR-A17 |
| `/api/admin/analytics/rfps` | GET | SCR-A18 |
| `/api/admin/analytics/ads` | GET | SCR-A19 |
| `/api/admin/analytics/revenue` | GET | SCR-A20 |
| `/api/admin/notifications/broadcast` | POST | SCR-A21 |
| `/api/admin/notifications/sent` | GET | SCR-A21 |
| `/api/admin/jobs` | GET | SCR-A22 |
| `/api/admin/payments` | GET, POST | SCR-A23 |
| `/api/admin/support` | GET, PATCH | SCR-A24 |
| `/api/profiles/me/data-export` | GET | SCR-SET03 |
| `/api/profiles/me/integrations` | GET, PUT | SCR-SET05 |
| `/api/enquiries` | GET | SCR-PS03 |
| `/api/requests` | GET | SCR-ED03 |
