# Strategy: Business Logic & Edge Cases

This document describes the unique strategic logic implemented in the BuonDesizn B2B Marketplace.

## 1. The Proximity Paradox (70/30)
**Problem**: Traditional "distance-only" ranking promotes low-quality local options over high-quality regional experts.
**Solution**: A weighted 70/30 ranking system:
- **70%**: Design Quality Score (DQS), calculated from past performance and audit tags.
- **30%**: Haversine geographical distance.
- **Result**: Users see the *best* available profiles first, even if they are slightly further away.

## 2. The Handshake Economy
**Problem**: B2B firms want to protect their personnel rosters from poaching and cold-calling.
**Solution**: Sequential Unmasking:
1. **Discover**: Publicly see firm specialty and DQS.
2. **Connect**: Initiate a "Handshake" (requires mutual acceptance).
3. **Reveal**: Upon acceptance, the full `company_personnel` (email/phone) and specific `unmasking_audit` logs are shared.

## 3. Role Identity & RFP Restrictions
**Problem**: Users often change firms or operate in multiple roles.
**Solution**: Single PAN Identity:
- A user's reputation follows their permanent PAN ID.
- Each profile is bound to a single persona — no persona switching or swappable dashboards.
- **PS (Product Seller)** and **ED (Equipment Dealer)** profiles cannot create RFPs. They may only accept RFP Responses and send connection requests.

## 4. Rural Geocoding & Edge Coverage
**Problem**: Many Tier-2 and Tier-3 rural locations in India have unreliable GPS/Zip mapping.
**Solution**: Admin-curated fallbacks:
- If a location is not automatically geocoded, it is queued for admin review in the **Waiting Room**.
- PostGIS functions provide a "nearest regional hub" fallback to ensure zero-empty search results.

## 5. RFP Response Lifecycle (No Bidding)
This platform does NOT support bidding. All vendor engagement is via **RFP Responses**:
- A buyer creates an RFP and broadcasts it to matching profiles.
- Vendors submit **RFP Responses** (not bids) expressing interest.
- When a buyer **ACCEPTS** an RFP Response, a connection is created in the `ACCEPTED` state immediately.
- Accepting an RFP Response does NOT cost handshake credits.

## 6. RFP Terminal States
- **CLOSED** and **CANCELLED** RFPs are terminal — they cannot be re-opened.
- Once an RFP reaches CLOSED or CANCELLED, no further responses or state changes are permitted.

## 7. Subscription Expiry & Lock Flow
- Subscription status values are lowercase: `trial`, `active`, `expired`, `hard_locked`.
- When a subscription reaches `expired`, the transition to `hard_locked` is **immediate** — there is no grace period.
- A `hard_locked` profile cannot initiate handshakes, create RFPs, or respond to RFPs.

## 8. Concurrency Handling
- Credit deduction and connection creation happen within a **single database transaction**.
- This prevents race conditions where credits are deducted but the connection fails, or duplicate connections are created under concurrent requests.
- The `accept_handshake` RPC and RFP Response acceptance both use serializable or row-level locking to ensure atomicity.

## 9. Timezone Handling
- All timestamps are stored in **UTC** (`TIMESTAMPTZ`).
- All display-layer conversions use **IST (UTC+5:30)** for this India-focused marketplace.
- Date boundaries (e.g., subscription expiry, RFP deadlines) are evaluated in IST but persisted in UTC.

## 10. Currency Handling
- The platform uses **INR only** — no multi-currency support.
- All monetary values use **2 decimal places** with **half-up rounding**.
- Subscription pricing, credit costs, and any future financial references are denominated in INR.

## 11. Cascading Effects on Profile Deletion
When a profile is soft-deleted (`deleted_at` is set):
- All **OPEN** RFPs created by that profile are auto-**CANCELLED**.
- All **ACCEPTED** connections remain in the user's `address_book` (historical record preserved).
- All soft-deleted records cascade: related RFP Responses, connections in REQUESTED state, and pending notifications are also soft-deleted.
- The `deleted_at TIMESTAMPTZ` column is the single source of truth for soft-deletion across all tables.
