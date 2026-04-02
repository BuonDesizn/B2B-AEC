# Google Stitch — BuonDesizn B2B Marketplace UI Generation Prompt

## PROJECT CONTEXT

**Product Name**: BuonDesizn  
**Type**: B2B Construction & Architecture Marketplace  
**Platform**: Web (Desktop-first, Mobile-responsive)  
**Framework**: Next.js 15 App Router with Tailwind CSS  
**Design Philosophy**: "Pro Max" — premium, glassmorphic, architectural aesthetic

You are generating the complete UI for a B2B marketplace connecting construction professionals (Architects, Consultants, Contractors) with suppliers (Product Sellers, Equipment Dealers). The core mechanic is the **Handshake Protocol** — a trust-based system where contact information (phone, email) is masked until a mutual connection is accepted.

---

## DESIGN SYSTEM (MANDATORY — DO NOT DEVIATE)

### Typography
| Element | Font | Weight | Usage |
|---------|------|--------|-------|
| Headings/Titles | `Playfair Display` (Serif) | 400, 600, 700 | Page titles, section headers |
| Body & Interface | `Inter` (Sans-serif) | 400, 500, 600 | All UI text, labels, buttons |
| Fallbacks | `serif` (titles), `system-ui` (body) | — | Font loading states |

### Color Palette
| Token | Hex | Usage |
|-------|-----|-------|
| `--brand-primary` | `#42207A` | Sidebar, primary buttons, header |
| `--nav-active` | `#DECEF2` | Active nav item background |
| `--bg-lavender` | `#F3F0F7` | Global page background |
| `--white` | `#FFFFFF` | Cards, form inputs, modals |

### Role Persona Colors
| Role | Background | Text | Usage |
|------|-----------|------|-------|
| PP (Project Professional) | `#E7D9F5` | `#6415A5` | Badges, cards, tags |
| C (Consultant) | `#D1F2E2` | `#0D6F41` | Badges, cards, tags |
| CON (Contractor) | `#F7E9C1` | `#8B5D14` | Badges, cards, tags |
| PS (Product Seller) | `#D9E4F5` | `#1C4E8A` | Badges, cards, tags |
| ED (Equipment Dealer) | `#E1D3F5` | `#7045AA` | Badges, cards, tags |

### UI Aesthetics
- **Glassmorphism**: `backdrop-filter: blur(8px)` on modals, overlays, navigation
- **Micro-animations**: `transition: all 0.2s ease-in-out` on ALL interactive elements
- **Click feedback**: `scale(0.98)` on button press
- **Shadows**: `box-shadow: 0 4px 20px rgba(0,0,0,0.05)` on cards
- **Border radius**: 12px on cards, 8px on buttons/inputs, 9999px on pills/badges

### Responsive Breakpoints
| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Mobile | `< 768px` | Single column, bottom nav (5 items), sidebar hidden |
| Tablet | `768px – 1023px` | 2-column grids, collapsible sidebar |
| Desktop | `≥ 1024px` | Fixed 240px left sidebar + main content |

### Touch Targets
- Minimum height: `48px` for all buttons/links on mobile
- Minimum tap area: `44x44px`

---

## LAYOUT PATTERNS

### 1. Dashboard Shell (All Authenticated Pages)
```
┌─────────────────────────────────────────────┐
│  [Logo]  Sidebar (240px fixed)              │
│  ├─ Dashboard                               │  ┌──────────────────────────────┐
│  ├─ My Profile                              │  │  Main Content Area           │
│  ├─ My Plan                                 │  │  ┌────────────────────────┐  │
│  ├─ My Database                             │  │  │  Page Content          │  │
│  ├─ My Notifications                        │  │  │                        │  │
│  ├─ Discover                                │  │  │                        │  │
│  ├─ [Role-specific items...]                │  │  │                        │  │
│  ├─ Settings                                │  │  └────────────────────────┘  │
│  └─ Change Password                         │  └──────────────────────────────┘
└─────────────────────────────────────────────┘
```

**Sidebar Styling**:
- Background: `#42207A`
- Active item: bg `#DECEF2`, text `#42207A`
- Inactive item: text `#FFFFFF` at 80% opacity
- Logo: top-left corner
- Bottom items: Settings, Change Password (always visible)

**Mobile Bottom Nav** (5 items per role):
| Role | Items |
|------|-------|
| PP | Dashboard, Discover, My RFPs, My Database, Notifications |
| C | Dashboard, Discover, My RFPs, Key Personnels, Notifications |
| CON | Dashboard, Discover, All RFPs, Key Personnels, Notifications |
| PS | Dashboard, Discover, My Products, Enquiries, Notifications |
| ED | Dashboard, Discover, My Equipment, Requests, Notifications |

### 2. Metric Card Pattern (Dashboard)
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Icon        │ │  Icon        │ │  Icon        │ │  Icon        │
│  42          │ │  87%         │ │  15          │ │  3           │
│  Label       │ │  Label       │ │  Label       │ │  Label       │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```
- 4 cards per role dashboard
- White background, 12px radius, soft shadow
- Icon in role color, value in bold, label in muted text

### 3. Profile Card Pattern (Masked State)
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

### 4. Profile Card Pattern (Unmasked State)
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

### 5. Connection Button States
| Condition | Label | Enabled | Style |
|-----------|-------|---------|-------|
| No connection | "Request Connection" | Yes | Primary button |
| Requested (viewer sent) | "Request Sent" | No | Disabled, muted |
| Requested (viewer is target) | "Accept" + "Decline" | Yes | Two buttons: green + red |
| Accepted | "View Contact" | Yes | Secondary button |
| Rejected | "Request Connection" | Yes | Primary button (retry) |
| Expired | "Request Connection" | Yes | Primary button (retry) |
| Blocked | "Blocked" | No | Disabled, grey |
| No credits | "No Credits" | No | Disabled + tooltip |
| Hard locked | 🔒 | No | Lock icon + tooltip |

### 6. Form Pattern
```
┌───────────────────────────────────────┐
│  Page Title (Playfair Display)        │
│  ─────────────────────────────────    │
│  Section Title                        │
│  Label                                │
│  [Input field ──────────────]         │
│  Helper text (muted)                  │
│                                       │
│  [Save] [Cancel]                      │
└───────────────────────────────────────┘
```
- Inputs: white bg, 8px radius, 1px border `#E5E7EB`, focus ring `#DECEF2`
- Primary button: `#42207A` bg, white text, 8px radius
- Secondary button: white bg, `#42207A` border, `#42207A` text
- Error state: red border `#EF4444`, error text below field

### 7. Table Pattern
```
┌───────────────────────────────────────┐
│  [Search] [Filter] [+ Add New]        │
│  ─────────────────────────────────    │
│  Col 1 │ Col 2 │ Col 3 │ Actions     │
│  ──────┼───────┼───────┼────────     │
│  Row 1 │ Data  │ Data  │ [Edit][Del] │
│  Row 2 │ Data  │ Data  │ [Edit][Del] │
│  ──────┴───────┴───────┴────────     │
│  [Pagination: ← 1 2 3 ... 10 →]      │
└───────────────────────────────────────┘
```
- Header: `#F9FAFB` bg, 600 weight
- Rows: alternating white/`#F9FAFB`, hover highlight
- Actions: icon buttons with tooltips

### 8. Empty State Pattern
```
┌───────────────────────────────────────┐
│                                       │
│           [Illustration]              │
│                                       │
│        "No items found"               │
│     "Description of empty state"      │
│                                       │
│        [+ Create First]               │
│                                       │
└───────────────────────────────────────┘
```

### 9. Loading Skeleton Pattern
- Match dimensions of actual content
- Shimmer animation: `bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200`
- 3 skeleton cards for discovery feed
- 4 skeleton metric cards for dashboard

---

## SCREEN GENERATION ORDER & SPECIFICATIONS

Generate screens in this exact order. Each screen must follow the design system above.

### PHASE 1: GUEST & AUTH SCREENS (4 screens)

#### SCR-G01: Landing Page (`/`)
- **Hero section**: Search bar with 3 inputs (Location dropdown, Role dropdown, Keyword text input)
- **Trust indicators**: 3 stat cards (BuonNects count, Verified Professionals count, Leads count)
- **Role carousels**: Horizontal scrollable cards for each role type (PP, C, CON, PS, ED)
- **CTA buttons**: "Sign Up" (primary), "Log In" (secondary)
- **Footer**: Links, branding

#### SCR-G02: Search Results (`/discover` — guest)
- **Search controls bar**: Role filter pills, Keyword input, Radius selector (10/25/50/100km), Location input
- **Map panel** (40% width on desktop): Leaflet map with markers colored by role
- **Results feed** (60% width): Profile cards in masked state, 20 per page, infinite scroll
- **Mobile**: Single column feed, map toggle FAB (bottom-right)

#### SCR-G03: Profile Preview (`/profiles/:id` — guest)
- **Header**: Avatar, name, role badge, city/state, DQS score, verified badge
- **About section**: Professional summary
- **Portfolio grid**: Project images (if any)
- **Privacy wall**: Phone/email shown as `***`, "View Contact" triggers login modal
- **Login modal**: Email/password fields, signup link

#### SCR-G04: Login/Signup (`/auth/login`, `/auth/signup`)
- **Login form**: Email, password, "Forgot password?", "Sign In" button
- **Signup form**: Email, password, role selection (PP/C/CON/PS/ED dropdown), "Create Account" button
- **Layout**: Centered card on lavender background
- **Validation**: Error states for invalid inputs

---

### PHASE 2: ONBOARDING (2 screens)

#### SCR-O01: Role Selection & Verification (`/onboarding`)
- **Step indicator**: 3 steps (Role → Verify → Complete)
- **Role confirmation**: Display selected role with icon
- **Identity input**: PAN field (individual) or GSTIN field (company) with format hint
- **Trial banner**: "48-hour trial started — 30 handshake credits granted"
- **CTA**: "Continue" button

#### SCR-O02: Profile Setup Wizard (`/onboarding/profile`)
- **Multi-section form**:
  - Identity: Display Name, Designation, Organisation Name
  - Contact: Email (pre-filled, read-only), Mobile, Mode of Contact (radio: Email/Call/Both)
  - About: Textarea (500 char limit with counter)
  - Branding: Logo upload area (drag & drop, 5MB max, JPG/PNG)
  - Location: Address fields + Leaflet map for pin-drop
- **CTA**: "Complete Setup" → redirect to `/dashboard`

---

### PHASE 3: SHARED AUTHENTICATED SCREENS (10 screens)

#### SCR-S01: Dashboard (`/dashboard`)
- **Role-specific metric cards** (4 cards):
  - PP: Active RFPs, RFP Responses, Handshake Success Rate, Profile Views
  - C: Inbound Connections, Team Strength, Services Offered, Organisation Age
  - CON: Active Projects, Key Personnels, Fleet Size, RFP Acceptance Rate
  - PS: Catalog SKUs, Inbound Enquiries, Products with MOQ, Active Ads
  - ED: Fleet Available, Inbound Requests, Maintenance Due, Active Ads
- **Trial banner** (if trial): "⏳ Trial active — X hours remaining. Upgrade to National Pro"
- **Recent activity feed**: List of recent connections, RFP responses, notifications
- **Hard lock overlay** (if hard_locked): Full-screen modal blocking all except My Plan

#### SCR-S02: My Profile (`/profile`)
- **Form sections**:
  - Identity: Display Name, Designation, Organisation Name
  - Contact: Email (read-only), Mobile, Mode of Contact
  - About: Textarea (500 chars)
  - Branding: Current logo + upload new
  - Location: Address fields + Leaflet pin-drop map
  - Legal: PAN (read-only after save), GSTIN (editable with change-request link)
- **Save/Cancel buttons**

#### SCR-S03: My Plan (`/plan`)
- **Current plan card**: "National Pro" badge, status indicator (trial/active/expired/hard_locked)
- **Credits display**: "X of 30 handshake credits remaining" with progress bar
- **Trial countdown** (if trial): Hours remaining
- **Next reset date**: "Credits reset on [date]"
- **Payment section**: "Upgrade to National Pro" CTA → PhonePe integration
- **Plan features list**: What's included

#### SCR-S04: My Database / Address Book (`/address-book`)
- **Search bar**: Filter contacts by name/role
- **Contact list**: Unmasked profile cards with real phone/email
- **Each card**: Avatar, name, role badge, city, phone, email, "View Full Profile" link, connection date
- **Empty state**: "No connections yet. Discover professionals to start connecting."

#### SCR-S05: My Notifications (`/notifications`)
- **Inbox list**: Unread notifications first, 20 per page
- **Each item**: Icon (by type), title, timestamp, read/unread indicator
- **Actions**: Mark as read (single), "Mark all as read" button
- **Preferences link**: "Notification Settings" → `/settings/notifications`
- **Empty state**: "No notifications"

#### SCR-S06: Discover (`/discover` — authenticated)
- **Search controls**: Role pills, Keyword (debounced), Radius (10/25/50/100km), Location (auto-detect/pin-drop)
- **Map panel** (40% desktop): Leaflet with colored markers, radius circle
- **Results feed** (60% desktop): Masked/unmasked profile cards, sorted by ranked_score
- **Connection buttons**: 8-state matrix on each card
- **Mobile**: Single column feed, map FAB
- **Loading**: 3 skeleton cards
- **Empty state**: "No professionals found. Try expanding radius or changing filters."

#### SCR-S07: Change Password (`/settings/password`)
- **Form fields**: Current password, New password, Confirm password
- **Validation**: Password strength indicator, match check
- **Submit button**: "Update Password"

#### SCR-S08: Handshake Request (`/connections/request` — modal)
- **Modal overlay**: Glassmorphic backdrop
- **Target profile summary**: Avatar, name, role, city
- **Credit cost**: "This will cost 1 handshake credit (X remaining)"
- **Confirmation**: "Request Connection" / "Cancel" buttons
- **Error states**: Insufficient credits, hard_locked

#### SCR-S09: Incoming Handshakes (`/connections/incoming`)
- **List of requests**: Each with requester profile summary
- **Actions per item**: "Accept" (green) + "Decline" (red) buttons
- **Expiry countdown**: "Expires in X days"
- **Empty state**: "No pending connection requests"

#### SCR-S10: Connection Detail (`/connections/:id`)
- **Connection status badge**: REQUESTED/ACCEPTED/REJECTED/EXPIRED/BLOCKED
- **Profile info**: Avatar, name, role, city, DQS
- **Contact info** (if ACCEPTED): Phone, email, LinkedIn
- **Actions**: Block user, View full profile
- **History**: Request date, response date

---

### PHASE 4: PROJECT PROFESSIONAL SCREENS (7 screens)

#### SCR-PP01: My RFPs (`/rfps`)
- **Header**: "My RFPs" + "Create RFP" button
- **Filter tabs**: All / Draft / Open / Closed / Cancelled
- **RFP list cards**: Subject, status badge, response count, created date, actions (Edit/Publish/Close/Cancel/Delete)
- **Empty state**: "No RFPs yet. Create your first RFP."

#### SCR-PP02: All RFPs Browse (`/rfps/browse`)
- **Filters**: Role, Sector, Radius, Status
- **RFP list cards**: Subject, creator (masked), location, order value, deadline, response count
- **Already responded badge**: On RFPs user has responded to
- **Action**: "Submit Response" button
- **Empty state**: "No open RFPs in your area."

#### SCR-PP03: My Projects (`/projects`)
- **Phase 1 empty state**: "Projects feature coming soon" with illustration
- **Placeholder**: Card grid ready for future implementation

#### SCR-PP04: RFP Response Detail (`/rfps/:id/responses/:responseId`)
- **Response header**: Responder name (masked), submitted date
- **Response content**: Bid details, proposal text, attachments
- **Actions**: Shortlist, Accept, Reject
- **Accept confirmation**: "This will create a free handshake connection"

#### SCR-PP05: Portfolio (`/portfolio`)
- **Grid of portfolio items**: Image thumbnail, title, description
- **Add button**: "+ Add Project"
- **Each item**: Edit/Delete actions
- **Empty state**: "Showcase your work. Add your first project."

#### SCR-PP06: RFP Detail (`/rfps/:id`)
- **RFP info**: Subject, sector, category, order value, payment terms
- **Location**: Text + Leaflet map
- **Timeline**: Commencement date, completion date
- **Responses tab** (creator view): List of responses with status
- **Submit response form** (responder view): Proposal text, attachments, submit button

#### SCR-PP07: Create/Edit RFP (`/rfps/new`, `/rfps/:id/edit`)
- **Section 1 — Project Overview**: RFP Subject (text), Sector (dropdown), Category (dropdown), Order Value (INR input), Payment Terms (textarea)
- **Section 2 — Location**: Project Location (text), Pincode, State, City, Address Line + Leaflet map
- **Section 3 — Timeline**: Work Commencement (date picker), Work Completion (date picker)
- **Buttons**: "Save as Draft" (secondary), "Publish" (primary — validates GSTIN)

---

### PHASE 5: CONSULTANT SCREENS (7 screens)

#### SCR-C01 to SCR-C04: Same as SCR-PP01 to SCR-PP04

#### SCR-C05: Key Personnels / My Team (`/my-team`)
- **Header**: "Key Personnels" + "Add Person" + "Bulk Import CSV" buttons
- **Table columns**: Name, Designation, Qualification, Specialty, Experience, Status (Active/Inactive toggle), Actions
- **Add person form** (modal): All fields as above
- **Bulk import**: CSV upload area with template download link
- **Masked indicators**: For unconnected viewers

#### SCR-C06: Firm Profile (`/firm`)
- **Firm info**: GSTIN verification status badge, firm name, logo
- **Company DNA tree**: Visual hierarchy of linked personnel
- **Master Rep**: Highlighted designation
- **Linked profiles list**: Name, role, verification status
- **GSTIN verification**: "Verify GSTIN" button if not verified

#### SCR-C07: Consultant Services (`/services`)
- **Services list**: Each service as a card with name, category, description
- **Add service form**: Service name, category, specialization, description
- **Edit/Delete actions** per service
- **Empty state**: "Add your consulting services."

---

### PHASE 6: CONTRACTOR SCREENS (6 screens)

#### SCR-CON01: Key Personnels — Same as SCR-C05

#### SCR-CON02: My Projects — Same as SCR-PP03 (empty state)

#### SCR-CON03: Contractor Portfolio (`/portfolio`)
- **Project gallery**: Site photos, compliance documents
- **Compliance badges**: ISO/OHSAS flags
- **Add/Edit/Delete** project items

#### SCR-CON04: All RFPs Browse — Same as SCR-PP02 (contractor-focused filter)

#### SCR-CON05: Contractor Profile (`/profile` — CON extension)
- **All shared profile fields** (from SCR-S02)
- **Additional fields**: Staff count, Owned equipment list, Concurrent projects capacity, ISO/OHSAS compliance checkboxes, Fleet size

#### SCR-CON06: Equipment Owned (`/my-equipment`)
- **Equipment list**: Type, condition, availability status
- **Add/Edit** equipment entries
- **Empty state**: "Add your owned equipment."

---

### PHASE 7: PRODUCT SELLER SCREENS (7 screens)

#### SCR-PS01: My Products (`/products`)
- **Header**: "My Products" + "Add Product" button
- **Product list**: SKU, name, price, thumbnail, status badge
- **Search/filter**: By name, category, status
- **Bulk actions**: Select multiple, delete
- **Empty state**: "No products yet. Add your first product."

#### SCR-PS02: Add/Edit Product (`/products/new`, `/products/:id/edit`)
- **Section 1 — Basic Info**: Product Name, Material Category (dropdown), Material Type (dependent dropdown), Description (250 chars with counter), Area of Application
- **Section 2 — Media**: Image upload (max 5, 5MB each), Catalog PDF (10MB), Video upload (50MB, .mov/.mp4)
- **Section 3 — Details**: Model No., Manufactured by, MOQ, Lead Time, Manufacturing Location, Size (L×B×H), UOM, Color Options, Price/Unit (INR), Discount Price, Warranty, Green Building Compliant (toggle), Product Tags
- **Section 4 — Technical Specs**: Dynamic rows builder (Attribute / Unit / Value / Testing Standard), Add row button
- **Buttons**: "Save Draft", "Publish"

#### SCR-PS03: Enquiries (`/enquiries`)
- **Enquiry list**: Source (product/profile), sender (masked), date, status
- **Filter tabs**: New / Responded / Accepted
- **Actions**: Respond, Accept handshake
- **Empty state**: "No enquiries yet."

#### SCR-PS04: My Ads (`/ads`)
- **Header**: "My Ads" + "Create Ad" button
- **Ad list cards**: Title, status badge (DRAFT/PENDING_PAYMENT/ACTIVE/PAUSED/EXPIRED/SUSPENDED), impressions, clicks, spend
- **Actions per ad**: Edit, Pause/Resume, Delete, Retry Payment, Request Refund
- **Moderation status indicator**: Pending/Approved/Flagged
- **Empty state**: "No ads yet. Create your first ad."

#### SCR-PS05: Create/Edit Ad (`/ads/new`, `/ads/:id/edit`)
- **Ad details**: Title, Description, Image upload (max 5, 5MB), Target URL
- **Targeting**: Geo-radius selector, Duration, Budget
- **Preview**: Ad preview card
- **Payment**: PhonePe payment CTA
- **Buttons**: "Save Draft", "Pay & Publish"

#### SCR-PS06: Product Detail Public (`/products/:id`)
- **Product hero**: Image gallery (carousel)
- **Product info**: Name, price, MOQ, specs table
- **Seller info** (masked): Name, role badge, city, "Enquire" button
- **Technical specs**: Table of attributes
- **Related products**: Carousel

#### SCR-PS07: Product Detail Seller View (`/products/:id` — seller)
- **Same as PS06** + edit mode toggle
- **Analytics**: View count, enquiry count
- **Promote CTA**: "Promote this product as an ad"

---

### PHASE 8: EQUIPMENT DEALER SCREENS (6 screens)

#### SCR-ED01: My Equipment (`/equipment`)
- **Header**: "My Equipment" + "Add Equipment" button
- **Equipment list**: Type, availability status, rate, thumbnail, maintenance due indicator
- **Filter**: By type, availability, status
- **Empty state**: "No equipment listed. Add your first equipment."

#### SCR-ED02: Add/Edit Equipment (`/equipment/new`, `/equipment/:id/edit`)
- **Section 1 — Basic Info**: Equipment Name, Category (dropdown: Excavators/Cranes/Generators/etc), Manufactured On (date), Description, Hypothecated? (toggle), RC Available? (toggle)
- **Section 2 — Media**: Images (max 5, 5MB), Catalog PDF (10MB), Video (50MB)
- **Section 3 — Pricing & Location**: Monthly Rental Price (INR), Selling Price (INR), Current Location (text + Leaflet pin)
- **Section 4 — Performance Specs**: Dynamic rows builder (Property / Unit / Value / Testing Standard)
- **Buttons**: "Save Draft", "Publish"

#### SCR-ED03: Requests (`/requests`)
- **Request list**: Source (equipment/ad), sender (masked), date, status
- **Filter tabs**: New / Responded / Accepted
- **Actions**: Respond, Accept handshake
- **Empty state**: "No requests yet."

#### SCR-ED04: My Ads — Same as SCR-PS04

#### SCR-ED05: Equipment Detail Public (`/equipment/:id`)
- **Equipment hero**: Image gallery
- **Specs**: Type, category, performance specs table
- **Pricing**: Rental rate, sale price
- **Availability calendar**: Visual calendar showing booked/available dates
- **Dealer info** (masked): Name, role badge, "Request" button

#### SCR-ED06: Equipment Booking Detail (`/equipment/:id/bookings/:bookingId`)
- **Booking info**: Dates, payment status, return status
- **Late return flag**: Red badge if overdue
- **Total amount**: Display
- **Actions**: Mark returned, Process payment

---

### PHASE 9: SETTINGS SCREENS (6 screens)

#### SCR-SET01: Notification Preferences (`/settings/notifications`)
- **Channel toggles**: Email notifications, SMS notifications
- **Per-type toggles**: Connection requests, RFP updates, Ad notifications, Subscription alerts
- **Save button**

#### SCR-SET02: Contact Preferences (`/settings/contact`)
- **Mode of Contact**: Radio buttons (Email / Call / Both)
- **Business hours**: Time range picker
- **Auto-accept handshakes**: Toggle (future — show as "Coming Soon")

#### SCR-SET03: Privacy & Data (`/settings/privacy`)
- **Profile visibility**: Toggle (public/hidden)
- **Data export**: "Export My Data" button (JSON/PDF)
- **Account deletion**: "Delete Account" button (with confirmation modal)
- **Blocked users list**: Each with unblock action

#### SCR-SET04: Billing & Invoices (`/settings/billing`)
- **Payment history table**: Date, amount, status, invoice download link
- **Subscription details**: Current plan, next billing date, cancel option
- **Empty state**: "No billing history yet."

#### SCR-SET05: API & Integrations (`/settings/integrations`)
- **Social links**: LinkedIn URL, Website URL, other social media
- **Connected apps**: List (future — show "Coming Soon")

#### SCR-SET06: GSTIN Change Request (`/settings/gstin`)
- **Current GSTIN**: Display (read-only)
- **New GSTIN input**: With validation
- **Reason**: Textarea
- **Document upload**: Supporting documents
- **Status tracker**: PENDING_VERIFICATION → PENDING_ADMIN → VERIFIED/REJECTED

---

### PHASE 10: SYSTEM & ALERT SCREENS (12 screens)

#### SCR-SYS01: 404 Not Found
- **Centered card**: "Page Not Found" (Playfair Display), illustration, "Back to Dashboard" button, search bar

#### SCR-SYS02: 500 Server Error
- **Centered card**: "Something Went Wrong", error reference ID, "Retry" button, "Contact Support" link

#### SCR-SYS03: Hard Lock Screen (`/locked`)
- **Full-screen overlay**: "Your 48-hour trial has ended", locked icon, "Upgrade to National Pro" CTA, feature restriction list, support contact

#### SCR-SYS04: Trial Expiry Warning (Banner)
- **Sticky banner below header**: "⏳ Trial active — X hours remaining", countdown timer, "Upgrade →" CTA, dismiss button

#### SCR-SYS05: Payment Success (`/payment/success`)
- **Success card**: Checkmark icon, "Payment Confirmed", credits reset to 30 display, subscription status: Active, next reset date, "Continue to Dashboard" button

#### SCR-SYS06: Payment Failure (`/payment/failed`)
- **Error card**: X icon, "Payment Failed", reason display, "Retry Payment" button, "Contact Support" link

#### SCR-SYS07: Payment Pending (`/payment/pending`)
- **Loading card**: Spinner, "Payment Processing...", auto-refresh indicator, estimated time

#### SCR-SYS08: Email Verification (`/auth/verify-email`)
- **Centered card**: "Verify Your Email", "We sent a verification email to [email]", "Resend Email" button, "Check spam folder" tip

#### SCR-SYS09: Verification Pending (`/verification/pending`)
- **Centered card**: "Profile Under Review", estimated review time, what to expect next, support link

#### SCR-SYS10: Verification Rejected (`/verification/rejected`)
- **Centered card**: "Verification Failed", rejection reason, "Retry Verification" button, support contact

#### SCR-SYS11: Session Expired (`/auth/session-expired`)
- **Centered card**: "Session Expired", "Please log in again", "Go to Login" button

#### SCR-SYS12: Maintenance Mode (`/maintenance`)
- **Full page**: "System Maintenance", estimated downtime, status page link, emergency contact

---

### PHASE 11: ADMIN SCREENS (24 screens)

#### SCR-A01: Identity Review Queue (`/admin/identity`)
- **Queue table**: Profile name, role, GSTIN/PAN, validation status, submitted date
- **Actions**: View details, Approve, Reject (with reason modal)
- **Filters**: Status, role, date range
- **Bulk actions**: Approve selected, Reject selected

#### SCR-A02: Profile Detail Admin (`/admin/users/:id`)
- **Full profile view**: All fields including PII (no masking)
- **Tabs**: Overview, Connections, Company DNA, Activity Log, DQS Breakdown
- **DQS breakdown**: 4 component scores with bars
- **Actions**: Suspend user, Edit profile

#### SCR-A03: User Suspension (`/admin/users/:id/suspend`)
- **Current status display**
- **Suspend form**: Reason dropdown + custom text
- **Reinstate button**
- **Suspension history log**

#### SCR-A04: Company DNA Explorer (`/admin/companies`)
- **GSTIN search bar**
- **Organization list**: GSTIN, firm name, personnel count, verification status
- **Organization detail**: Linked personnel table, Master Rep highlight, unmask audit trail

#### SCR-A05: Moderation Queue (`/admin/moderation`)
- **Flagged ads list**: Ad image thumbnail, title, creator, flag reason, date
- **Actions**: Clear (green), Reject (red)
- **Bulk moderation**: Select multiple, bulk action
- **Filters**: Status, date range

#### SCR-A06: Ad Detail Admin (`/admin/ads/:id`)
- **Ad content**: Full preview
- **Payment status**: Amount, date, method
- **Moderation history**: State transition timeline
- **Analytics**: Impressions, clicks chart
- **Actions**: Force state change, Trigger refund

#### SCR-A07: Moderation History (`/admin/moderation/history`)
- **Audit table**: Ad, action, admin, date, before/after states
- **Filters**: Date, admin, action type
- **Export CSV button**

#### SCR-A08: Audit Explorer (`/admin/audit`)
- **Full audit log table**: Entity, action, user, timestamp, details
- **Filters**: Entity type, user, action, date range
- **Search bar**
- **Export (CSV/JSON)**
- **Pagination**: 50 per page

#### SCR-A09: Unmasking Audit (`/admin/audit/unmasking`)
- **Unmask events table**: Seeker, target, timestamp, mechanism, revealed fields
- **Filters**: Date, user, mechanism (handshake/RFP/Company DNA)
- **Export button**

#### SCR-A10: Audit Purge Queue (`/admin/audit/purge`)
- **Scheduled purges list**: Type, scheduled date, status
- **Manual purge trigger button**
- **Purge history**
- **Retention policy display**

#### SCR-A11: Personnel Audit (`/admin/audit/personnel`)
- **Personnel exposure table**: Company, personnel, revealed fields, timestamp, mechanism
- **Filters**: GSTIN, date, field type
- **GSTIN-wide unmask tracking**

#### SCR-A12: Global Toggles (`/admin/config`)
- **Feature toggles**: Switch controls for each feature
- **Broadcast radius cap**: Number input
- **Trial duration override**: Number input (hours)
- **Maintenance mode toggle**
- **DQS recalc trigger button**
- **System announcements textarea**

#### SCR-A13: DQS Configuration (`/admin/config/dqs`)
- **Formula display**: Current weights shown visually
- **Weight sliders**: Responsiveness (0.4), Trust Loops (0.3), Verification (0.2), Profile Depth (0.1)
- **Preview impact**: "Apply" shows projected ranking changes
- **Manual recalc button**
- **Last recalc timestamp**

#### SCR-A14: Subscription Plans (`/admin/config/plans`)
- **Plan cards**: Name, price, credits, features
- **Edit plan form**: Price, credit amount, trial duration
- **PhonePe configuration**: Merchant ID, API keys (masked)
- **Auto-renewal settings**

#### SCR-A15: Admin Dashboard (`/admin`)
- **Overview metrics**: Total users by role, active/trial/locked counts, today's handshakes, RFP activity, ad revenue
- **Charts**: DQS distribution, registration trends, handshake states
- **Quick actions**: Pending verifications count (clickable), flagged ads count (clickable)

#### SCR-A16: User Analytics (`/admin/analytics/users`)
- **Registration trends**: Line chart
- **Role distribution**: Pie chart
- **Geographic heatmap**: Map visualization
- **Retention rates**: Cohort table
- **Trial-to-paid conversion**: Funnel chart

#### SCR-A17: Handshake Analytics (`/admin/analytics/handshakes`)
- **Total handshakes by state**: Bar chart
- **Acceptance rate**: Percentage with trend
- **Average response time**: Line chart
- **Credit consumption**: Bar chart
- **Re-initiation patterns**: Table

#### SCR-A18: RFP Analytics (`/admin/analytics/rfps`)
- **RFP counts by status**: Donut chart
- **Average responses per RFP**: Number with trend
- **Acceptance rate by persona**: Bar chart
- **Broadcast effectiveness**: Metrics
- **RFP lifecycle duration**: Average days

#### SCR-A19: Ad Analytics (`/admin/analytics/ads`)
- **Active ads count**: Number
- **Total revenue**: Number with trend
- **Moderation pass/fail rate**: Pie chart
- **Top advertisers**: Table
- **Impression/click trends**: Line chart

#### SCR-A20: Revenue Dashboard (`/admin/analytics/revenue`)
- **Subscription revenue**: Monthly bar chart
- **Ad revenue**: Monthly bar chart
- **PhonePe transaction log**: Table
- **Refund tracking**: Number + list
- **Revenue growth**: Line chart

#### SCR-A21: Notification Center Admin (`/admin/notifications`)
- **Compose form**: Title, message body, target selection (role/region/status)
- **Broadcast types**: Trial expiry reminder, System announcement, Feature update
- **Sent history**: Table with delivery status
- **Preview button**

#### SCR-A22: Job Queue Monitor (`/admin/jobs`)
- **QStash jobs list**: Name, status, last run, next run
- **pg_cron jobs**: DQS recalc, expiry checks, connection expiry
- **Failed jobs**: Error details, retry button
- **Job history log**

#### SCR-A23: Payment Reconciliation (`/admin/payments`)
- **PhonePe webhook log**: Transaction ID, amount, status, matched user
- **Unmatched payments**: Table with manual reconciliation form
- **Failed retries**: List with retry button
- **Refund processing**: Queue with status

#### SCR-A24: Support Tickets (`/admin/support`)
- **Ticket list**: User, type, status, priority, created date
- **Filters**: Status, type, priority
- **Ticket detail**: Conversation thread, resolution actions
- **Assign to admin**: Dropdown
- **Refund requests**: Special handling flow

---

## COMPONENT LIBRARY TO GENERATE

Create these reusable components that all screens will consume:

1. **Sidebar** — Fixed left nav with role-specific items, active state styling
2. **BottomNav** — Mobile-only bottom navigation (5 items per role)
3. **MetricCard** — Dashboard metric display with icon, value, label
4. **ProfileCard** — Masked and unmasked variants with connection button
5. **ConnectionButton** — 8-state button with correct labels and disabled states
6. **DataTable** — Sortable, filterable table with pagination
7. **FormInput** — Text, number, email, password inputs with validation states
8. **FormSelect** — Dropdown select with search
9. **FormTextarea** — Multi-line text with character counter
10. **FileUpload** — Drag & drop zone with file type/size validation
11. **Badge** — Role-colored status badges
12. **StatusPill** — State indicator (DRAFT/OPEN/CLOSED/etc)
13. **Modal** — Glassmorphic overlay with backdrop blur
14. **Toast** — Success/error/info notifications
15. **EmptyState** — Illustration + message + CTA
16. **SkeletonCard** — Loading placeholder with shimmer
17. **Pagination** — Page navigation with prev/next
18. **TrialBanner** — Sticky trial countdown banner
19. **HardLockOverlay** — Full-screen lock modal
20. **MapContainer** — Leaflet map wrapper (client-side only)
21. **Avatar** — Image with initials fallback, role-colored border
22. **SearchBar** — Multi-field search with filters
23. **TabBar** — Horizontal tab navigation
24. **Toggle** — On/off switch
25. **ProgressBar** — Credit usage, completion indicators

---

## BEHAVIORAL RULES (IMPLEMENT IN UI)

1. **PII NEVER in DOM when masked**: Phone/email fields must show placeholder text (`***`), never real values with CSS hiding
2. **Hard lock blocks navigation**: When `subscription_status = 'hard_locked'`, all nav items disabled except "My Plan" and "Change Password"
3. **Trial banner on all pages**: When in trial, show countdown banner on every authenticated page
4. **Connection button state**: Read connection status and render correct label/enabled state per the 8-state matrix
5. **Role-based nav**: Each role sees only their sidebar items — hide irrelevant menu items
6. **Empty states everywhere**: Every list/table must have an empty state with illustration and CTA
7. **Loading states**: Show skeleton loaders matching content dimensions before data arrives
8. **Error states**: Form validation errors shown inline below fields, toast notifications for API errors
9. **Responsive**: All screens must work on mobile (375px), tablet (768px), and desktop (1440px)
10. **Accessibility**: All interactive elements have aria-labels, focus states visible, color contrast meets WCAG AA

---

## OUTPUT REQUIREMENTS

Generate all screens as:
- **Figma frames** OR **React components with Tailwind CSS** (specify your output format)
- Each screen as a separate frame/component
- Use the exact color tokens, fonts, and spacing defined above
- Include all states: default, loading, empty, error
- Show responsive variants for mobile and desktop where layout differs significantly
- Component library as separate reusable elements
- Maintain consistent spacing scale: 4px base (4, 8, 12, 16, 24, 32, 48, 64)

---

## SCREEN COUNT REFERENCE

| Phase | Category | Screens |
|-------|----------|---------|
| 1 | Guest & Auth | 4 |
| 2 | Onboarding | 2 |
| 3 | Shared Authenticated | 10 |
| 4 | Project Professional | 7 |
| 5 | Consultant | 7 |
| 6 | Contractor | 6 |
| 7 | Product Seller | 7 |
| 8 | Equipment Dealer | 6 |
| 9 | Settings | 6 |
| 10 | System & Alerts | 12 |
| 11 | Admin | 24 |
| — | Component Library | 25 |

**Total screens to generate: 91 + 25 components = 116 UI elements**
