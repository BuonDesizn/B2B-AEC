---
spec_id: UI-001
title: Marketplace UI — Discovery, Profile Cards, Dashboard Shell, Role Nav
module: 6 (Marketplace UI)
phase: 1
status: GREY
witness_required: true
created: 2026-03-31
owner: @pm
depends_on: [ID-001, RM-001, HD-001]
---

# Spec UI-001: Marketplace UI — Discovery, Profile Cards, Dashboard Shell

## Objective

Build the Phase 1 frontend shell: the discovery/search page, masked and unmasked profile cards, role-specific sidebar navigation with all pages, and dashboard metric summaries. This is the UI layer over which ID-001, RM-001, and HD-001 are exposed to users.

**Baseline authority**: `docs/audit/legacy_roles.md` — every item in this spec must meet or exceed the legacy UAT baseline.
**Design authority**: `docs/core/STYLEGUIDE.md` — all color, typography, spacing, and animation tokens are mandatory.
**Aesthetic standard**: "Pro Max" — glassmorphism, micro-animations (`transition: all 0.2s ease-in-out`), soft shadows (`box-shadow: 0 4px 20px rgba(0,0,0,0.05)`).

---

## Affected APIs

| Resource | Operation | Page |
|----------|-----------|------|
| `searching_nearby_profiles()` | RPC | /discover |
| `get_visible_contact_info()` | RPC | Profile card, /address-book |
| `profiles` | READ | Profile card, /profile |
| `connections` | READ/WRITE | Profile card connection button |
| `address_book` | READ | /address-book (My Database) |
| `rfps` | READ/WRITE | /rfps, /all-rfps |
| `company_personnel` | READ | /my-team |
| `subscriptions` | READ | /plan |
| `notifications` | READ/UPDATE | /notifications |
| `ads` | READ/WRITE | /my-ads |

---

## 1. Dashboard Shell (all roles)

### Layout
- **Desktop (≥1024px)**: Left sidebar fixed 240px + main content area
- **Tablet (768–1023px)**: Left sidebar collapsible (hamburger toggle)
- **Mobile (<768px)**: Bottom navigation bar (5 key items), sidebar hidden

### Sidebar
- Background: `#42207A`
- Active item background: `#DECEF2`, active text: `#42207A`
- Inactive item text: `#FFFFFF` at 80% opacity
- Logo: top-left of sidebar
- Bottom items: Settings, Change Password (always visible, all roles)

### Hard Lock Overlay
When `subscription_status = 'hard_locked'`:
- Full-screen modal over main content (not over sidebar)
- Message: "Your 48-hour trial has ended. Upgrade to continue."
- CTA: "Upgrade to National Pro" → `/plan`
- All sidebar nav items disabled except "My Plan" and "Change Password"

### Subscription Trial Banner
When `subscription_status = 'trial'`:
- Sticky banner below top bar
- Text: "⏳ Trial active — X hours remaining. Upgrade to National Pro for uninterrupted access."
- CTA: [Upgrade →] → `/plan`

---

## 2. Sidebar Navigation — Full Item List by Role

The legacy audit defines a core set present on all roles, plus role-specific items. Every item maps to a page and its data source.

### Universal (all 5 roles)

| Nav Item | Route | Data Source | Page Purpose |
|----------|-------|-------------|--------------|
| Dashboard | `/dashboard` | Role-specific metrics (see §5) | Central operations hub |
| My Profile | `/profile` | `profiles` + role extension table | Identity, credentials, bio, logo |
| My Plan | `/plan` | `subscriptions`, `profiles.handshake_credits` | Subscription status, credits, upgrade |
| My Database | `/address-book` | `address_book` + `profiles` | Permanent accepted handshakes |
| My Notifications | `/notifications` | `notifications` | Marketplace activity alerts |
| Find Products & Services | `/discover` | `searching_nearby_profiles()` | Global discovery gateway |
| Change Password | `/settings/password` | Supabase Auth | Account security |

### PP (Project Professional) — additional items

| Nav Item | Route | Data Source | Page Purpose |
|----------|-------|-------------|--------------|
| My RFPs | `/rfps` | `rfps` WHERE `profile_id = me` | RFPs I created (draft, open, closed) |
| All RFPs | `/rfps/browse` | `rfps` WHERE `status = 'OPEN'` | Browse open RFPs from all roles |
| My Projects | `/projects` | `projects` (future — show empty state in Phase 1) | Project portfolio |

### C (Consultant) — additional items

| Nav Item | Route | Data Source | Page Purpose |
|----------|-------|-------------|--------------|
| My RFPs | `/rfps` | `rfps` WHERE `profile_id = me` | RFPs I created |
| All RFPs | `/rfps/browse` | `rfps` WHERE `status = 'OPEN'` | Browse open RFPs |
| My Projects | `/projects` | `projects` (Phase 1: empty state) | Project history |
| Key Personnels | `/my-team` | `company_personnel` WHERE `company_gstin = me.gstin` | Manage firm roster |

### CON (Contractor) — additional items

| Nav Item | Route | Data Source | Page Purpose |
|----------|-------|-------------|--------------|
| Key Personnels | `/my-team` | `company_personnel` WHERE `company_gstin = me.gstin` | Manage team roster |
| My Projects | `/projects` | `projects` (Phase 1: empty state) | Project history |
| All RFPs | `/rfps/browse` | `rfps` WHERE `status = 'OPEN'` | Browse open RFPs (CON responds to these) |

### PS (Product Seller) — additional items

| Nav Item | Route | Data Source | Page Purpose |
|----------|-------|-------------|--------------|
| My Products | `/products` | `products` WHERE `seller_id = me` | Product catalog management |
| Add Product | `/products/new` | `products` (CREATE) | Add Product form (see PRODUCT_FLOW.md) |
| Enquiries | `/enquiries` | `connections` WHERE `target_id = me AND connection_source = 'SEARCH'` | Inbound product enquiries |
| My Ads | `/ads` | `ads` WHERE `profile_id = me` | Ad campaign management |

### ED (Equipment Dealer) — additional items

| Nav Item | Route | Data Source | Page Purpose |
|----------|-------|-------------|--------------|
| My Equipment | `/equipment` | `equipment` WHERE `dealer_id = me` | Fleet/equipment listing |
| Add Equipment | `/equipment/new` | `equipment` (CREATE) | Add Equipment form (see EQUIPMENT_FLOW.md) |
| Requests | `/requests` | `connections` WHERE `target_id = me AND connection_source = 'EQUIPMENT'` | Inbound rental/sale requests |
| My Ads | `/ads` | `ads` WHERE `profile_id = me` | Ad campaign management |

### Mobile Bottom Nav (5 items, all roles)
Show the 5 most-used items for each role in the bottom bar. Non-critical items move to a "More" overflow drawer.

| Role | Bottom Nav Items |
|------|-----------------|
| PP | Dashboard, Discover, My RFPs, My Database, Notifications |
| C | Dashboard, Discover, My RFPs, Key Personnels, Notifications |
| CON | Dashboard, Discover, All RFPs, Key Personnels, Notifications |
| PS | Dashboard, Discover, My Products, Enquiries, Notifications |
| ED | Dashboard, Discover, My Equipment, Requests, Notifications |

---

## 3. Discovery Page (`/discover`)

### URL params
`?role=CON&lat=19.076&lng=72.877&r=50&q=structural`

### Layout (desktop)
```
[ Search Controls Bar — full width ]
[ Map Panel 40% | Results Feed 60% ]
```

### Layout (mobile)
```
[ Search Controls Bar ]
[ Results Feed — single column ]
[ Map toggle FAB — bottom-right ]
```

### Search Controls
- Role filter: pill buttons PP / C / CON / PS / ED (single-select; clear = all roles)
- Keyword: debounced 400ms, min 2 chars
- Radius: 10 / 25 / 50 / 100 km (default 50km)
- Location: auto-detect (browser geolocation) OR manual pin-drop on map
- "Search" triggers `searching_nearby_profiles()` RPC

### Map Panel (Leaflet)
- Center: searcher's location or pinned location
- Radius circle overlay at current radius
- Markers: one per result, color = persona_type role color from STYLEGUIDE
- Click marker → scroll to corresponding card in feed
- Manual pin-drop: right-click or long-press sets new search center, re-fetches
- `data-testid="location-map"` on the map container

### Results Feed
- Sorted by `ranked_score DESC` — never by distance alone
- 20 results/page, infinite scroll (SWR cursor pagination)
- Empty state: "No professionals found in this area. Try expanding the radius or changing the role filter."
- Loading: 3 skeleton cards (same dimensions as real card, animated shimmer)

---

## 4. Profile Card — Masked State

Shown to any authenticated user with no connection or non-ACCEPTED connection.

```
┌───────────────────────────────────────┐
│  [Avatar — initials fallback]         │
│  Display Name                         │
│  [Role Badge — persona color]         │
│  City, State  •  Xkm away            │
│  ⭐ DQS: 0.85  •  [Verified badge]    │
│  ────────────────────────────────     │
│  📞 ••••••••••   ✉ ••••@•••.com      │  ← masked placeholders
│  [Request Connection]  [View Profile] │
└───────────────────────────────────────┘
```

**Test IDs**:
- `data-testid="profile-card-{profile_id}"`
- `data-testid="contact-phone"` — text: "Hidden" or masked dots; NEVER real phone in DOM
- `data-testid="contact-email"` — same
- `data-testid="contact-masked-badge"` — visible indicator

**Style**:
- Card bg: `#FFFFFF`, border-radius: 12px, shadow: `0 4px 20px rgba(0,0,0,0.05)`
- Hover: `transform: translateY(-2px)`
- Role badge: bg and text from STYLEGUIDE `§Role-Specific Persona DNA`

---

## 5. Profile Card — Unmasked State

Shown in `/address-book` or when `get_visible_contact_info().is_masked = false`.

```
┌───────────────────────────────────────┐
│  [Real Avatar]                        │
│  Display Name                         │
│  [Role Badge]  ✓ Connected           │
│  City, State  •  Xkm away            │
│  ⭐ DQS: 0.85  •  [Verified badge]    │
│  ────────────────────────────────     │
│  📞 +91-9876543210                    │  ← real values
│  ✉ contact@firm.com                   │
│  [View Full Profile]  [Message]       │
└───────────────────────────────────────┘
```

**Test IDs**:
- `data-testid="contact-phone"` — real phone number
- `data-testid="contact-masked-badge"` — NOT rendered

---

## 6. Connection Button State Matrix

| Condition | Button Label | Enabled? | Action |
|-----------|-------------|---------|--------|
| No connection exists | "Request Connection" | Yes | POST /api/connections |
| `status=REQUESTED`, viewer is requester | "Request Sent" | No (disabled) | — |
| `status=REQUESTED`, viewer is target | "Accept" + "Decline" (two buttons) | Yes | PATCH /api/connections/:id |
| `status=ACCEPTED` | "View Contact" | Yes | Reveal contact card |
| `status=REJECTED` | "Request Connection" (retry allowed) | Yes | POST /api/connections |
| `status=EXPIRED` | "Request Connection" (retry allowed) | Yes | POST /api/connections |
| `status=BLOCKED` | "Blocked" | No | — |
| `handshake_credits = 0` | "No Credits" | No | Tooltip: "Credits reset on plan renewal" |
| `subscription_status = hard_locked` | 🔒 (lock icon) | No | Tooltip: "Upgrade your plan" |

---

## 7. Dashboard Metric Cards by Role

Each role's `/dashboard` shows a 4-card metric summary row followed by a recent activity feed.

### PP Dashboard
| Card | Value | Source |
|------|-------|--------|
| Active RFPs | Count of my open RFPs | `rfps WHERE profile_id=me AND status='OPEN'` |
| RFP Responses | Count of responses to my RFPs | `rfp_responses` linked to my RFPs |
| Handshake Success Rate | `ACCEPTED / total` as % | `connections WHERE requester_id=me` |
| Profile Views | Count (Phase 1: show 0 with "Coming Soon") | `user_activity_log` (Phase 2) |

### C (Consultant) Dashboard
| Card | Value | Source |
|------|-------|--------|
| Inbound Connections | Count `REQUESTED` where I am target | `connections WHERE target_id=me AND status='REQUESTED'` |
| Team Strength | Count of active company personnel | `company_personnel WHERE company_gstin=me.gstin AND is_active=true` |
| Services Offered | Count | `consultants.services_offered` length |
| Organisation Age | Years since `profiles.establishment_year` | Calculated |

### CON (Contractor) Dashboard
| Card | Value | Source |
|------|-------|--------|
| Active Projects | Count (Phase 1: show 0 with "Coming Soon") | `projects` (Phase 2) |
| Key Personnels | Count of team members | `company_personnel WHERE company_gstin=me.gstin AND is_active=true` |
| Fleet Size | Equipment count | `contractors.owned_equipment` length |
| RFP Acceptance Rate | Accepted / submitted % | `rfp_responses WHERE profile_id=me` |

### PS (Product Seller) Dashboard
| Card | Value | Source |
|------|-------|--------|
| Catalog SKUs | Total product count | `products WHERE seller_id=me` |
| Inbound Enquiries | Count of new connections from products | `connections WHERE target_id=me AND status='REQUESTED'` |
| Products with MOQ | Count of products with `min_order_quantity IS NOT NULL` | `products` |
| Active Ads | Count | `ads WHERE profile_id=me AND status='ACTIVE'` |

### ED (Equipment Dealer) Dashboard
| Card | Value | Source |
|------|-------|--------|
| Fleet Available | Count `available=TRUE` | `equipment WHERE dealer_id=me` |
| Inbound Requests | New rental/sale requests | `connections WHERE target_id=me AND status='REQUESTED'` |
| Maintenance Due | Equipment with `next_maintenance_due_date <= NOW()+30days` | `equipment` |
| Active Ads | Count | `ads WHERE profile_id=me AND status='ACTIVE'` |

---

## 8. Key Form Pages (Phase 1 baseline)

### My Profile (`/profile`)

Based on `docs/audit/legacy_roles.md §4`:
- **Identity**: Display Name, Designation, Organisation Name
- **Contact**: Email (read-only from auth), Mobile, Mode of Contact (Email / Call / Both)
- **About**: "About Myself" professional summary (max 500 chars)
- **Branding**: Logo/Profile Picture upload (JPG/PNG, max 5MB) → Supabase Storage, 60min signed URL
- **Location**: Address fields + Leaflet map for manual pin-drop
- **Legal**: PAN (required, immutable after first save), GSTIN (editable via change-request flow)

### My Team / Key Personnels (`/my-team`)

Based on `docs/plans/2026-03-31-key-personnel-design.md` + `docs/specs/ID-001`:
- Table view of all `company_personnel` rows
- Columns: Name, Designation, Qualification, Specialty, Experience, Status (Active/Inactive)
- Add single entry: form with all fields
- Bulk import: CSV upload (template downloadable), processes up to 500 rows
- Masked indicator shown to viewer without GSTIN connection

### Add Product (`/products/new`)

Based on `docs/audit/PRODUCT_FLOW.md`:
- Section 1: Product Name, Material Category, Material Type (dependent), Description (250 chars), Area of Application
- Section 2: Images (max 5, 5MB each), Catalog PDF (10MB), Video (50MB, .mov/.mp4) → Supabase Storage
- Section 3: Model No., Manufactured by, MOQ, Lead Time, Manufacturing Location, Size (L×B×H), UOM, Color Options, Price/Unit (INR), Discount Price, Warranty, Green Building Compliant (Y/N), Product Tags
- Section 4: Dynamic technical specs builder (Attribute / Unit / Value / Testing Standard rows)

### Add Equipment (`/equipment/new`)

Based on `docs/audit/EQUIPMENT_FLOW.md`:
- Section 1: Equipment Name, Category (Excavators/Cranes/Generators/…), Manufactured On (date), Description, Hypothecated? (Y/N), RC Available? (Y/N)
- Section 2: Images (max 5, 5MB), Catalog PDF (10MB), Video (50MB)
- Section 3: Monthly Rental Price (INR), Selling Price (INR), Current Location (text + Leaflet pin)
- Section 4: Dynamic performance specs builder (Select Property / Unit / Value / Testing Standard)

### Create RFP (`/rfps/new`)

Based on `docs/audit/RFP_FLOW.md`:
- Section 1 (Project Overview, all mandatory): RFP Subject, Sector of Application, Requirement Category, Order Value (INR), Payment Terms
- Section 2 (Location, all mandatory): Project Location (text), Pincode, State, City, Address Line; + Leaflet map geocoding
- Section 3 (Timeline): Work Commencement (date), Work Completion (date)
- "Save as Draft" button (persists as `status='DRAFT'`) + "Publish" button (validates GSTIN → broadcasts)

---

## State Machine Connections

- All pages: check `subscription_status` on mount → redirect to lock overlay if `hard_locked`
- Discovery page: "Request Connection" button guards against `handshake_credits = 0`
- Profile card: masked ↔ unmasked via `get_visible_contact_info().is_masked`
- Connection button: reads `connections.status` for current pair
- See: `docs/system/STATE_MACHINES.md §1 (Handshake)`, `§2 (Subscription)`, `§3 (RFP)`

---

## Guardrail Checks

- [ ] **Handshake Privacy**: Profile cards in masked state — PII fields NEVER in DOM, not CSS-hidden
- [ ] **Proximity Logic**: Results feed sorted by `ranked_score` DESC, `distance_km` shown as info only
- [ ] **Company DNA**: My Team page shows masked indicators for unconnected viewers; reveals on Company DNA match

---

## Definition of Done (DoD)

1. Dashboard shell renders for all 5 roles with the full nav item set from §2 above
2. Hard lock overlay prevents access to all pages except `/plan` and `/settings/password`
3. Subscription trial banner shows correct hours-remaining countdown
4. Discovery page renders results sorted by `ranked_score`, not `distance_km`
5. Profile cards in masked state: zero PII in rendered DOM (Playwright `innerHTML` assertion)
6. Profile cards in unmasked state: real phone and email visible
7. Connection button renders correct label and enabled/disabled state for all 8 conditions in §6
8. Manual pin-drop re-triggers search from new coordinates
9. Empty state and loading skeleton cards render correctly
10. All 4 dashboard metric cards populate from the correct data sources for each role
11. Add Product / Add Equipment forms match the field structure from audit docs exactly
12. Create RFP form has Save as Draft + Publish with GSTIN validation before broadcast
13. My Team page shows masked vs unmasked based on viewer's handshake status
14. Responsive: sidebar on desktop, bottom nav on mobile (5 items per role from §2)
15. All components use STYLEGUIDE color tokens — no hardcoded hex values in Tailwind classes
16. `// @witness [UI-001]` present in all implementation files

---

## Test Coverage Required

- Unit: Connection button state — all 8 conditions produce correct label + disabled state
- Unit: Ranked score ordering — mock results, assert sorted by `ranked_score DESC`
- Unit: Role nav items — each role renders exactly its items from §2 (no more, no less)
- E2E: Discovery page loads, cards show masked state, no PII in DOM
- E2E: After handshake ACCEPTED, card switches to unmasked without page reload
- E2E: Hard lock overlay blocks navigation to `/discover`, `/rfps`, `/products`
- E2E: Trial banner visible on dashboard, hidden after upgrade
- E2E: Manual pin-drop updates search center (see Pattern G in implementation notes)
- E2E: Mobile viewport (375px) renders bottom nav, not sidebar
- E2E: Add Product form — submit with valid data, product appears in My Products

---

## Implementation Notes

- Use Next.js App Router; pages are Server Components unless interactivity requires `'use client'`
- Leaflet: load client-side only: `dynamic(() => import('@/components/Map'), { ssr: false })`
- SWR key for discovery: `['discover', lat, lng, radius, role, keyword, offset]`
- Avatar fallback: first letter of `display_name` in role color
- File uploads: all go to Supabase Storage; return 60-min signed URLs
- Form validation: GSTIN, PAN, phone via `lib/utils/validation.ts` (see `docs/core/PATTERNS.md §8`)
- Server Component data: use `lib/supabase/server.ts`; Client Component data: SWR + `lib/supabase/client.ts`
- See: `docs/core/PATTERNS.md` for all code patterns
