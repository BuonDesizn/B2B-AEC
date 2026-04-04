# API Contract Gap Analysis

**Date**: 2026-04-03
**Contract**: `docs/api/API_CONTRACT.md` (1865 lines, 16 sections)
**Implemented**: 24 API routes

---

## Summary

| Status | Count |
|--------|-------|
| ✅ Implemented | 24 |
| ⚠️ URL Mismatch | 1 |
| ❌ Missing from Contract | 35 |
| **Total Contract Endpoints** | **60** |

**Coverage**: 40% (24/60)

---

## 1. PROFILES (13 endpoints)

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /api/profiles/:id` | ❌ | Fetch profile with masked contact |
| `PATCH /api/profiles/:id` | ❌ | Update profile fields |
| `POST /api/profiles` | ❌ | Create profile |
| `GET /api/company-personnel` | ❌ | List personnel under GSTIN |
| `GET /api/company-personnel/:id` | ❌ | Fetch single personnel |
| `POST /api/company-personnel` | ❌ | Create personnel record |
| `PUT /api/company-personnel/:id` | ❌ | Update personnel |
| `DELETE /api/company-personnel/:id` | ❌ | Soft-delete personnel |
| `GET /api/profiles/:id/contact` | ❌ | Contact visibility (masked/full) |
| `POST /api/profiles/verify` | ❌ | Submit GSTIN/PAN verification |
| `PATCH /api/profiles/:id/verification` | ❌ | Admin verification approval |
| `POST /api/profiles/gstin-change-request` | ❌ | Request GSTIN change |
| `PATCH /api/admin/gstin-change-requests/:id/approve` | ❌ | Admin approve/reject GSTIN change |

---

## 2. CONNECTIONS / HANDSHAKE (7 endpoints)

| Endpoint | Status | Notes |
|----------|--------|-------|
| `POST /api/connections` | ❌ | Create connection request |
| `PATCH /api/connections/:id/accept` | ❌ | Accept connection (unmask) |
| `PATCH /api/connections/:id/reject` | ❌ | Reject connection |
| `GET /api/connections` | ❌ | List user connections |
| `GET /api/address-book` | ❌ | Fetch permanent connections |
| `POST /api/connections/block` | ❌ | Block a user |
| `DELETE /api/connections/block/:target_id` | ❌ | Unblock a user |

---

## 3. PAYMENTS (2 endpoints)

| Endpoint | Status | Notes |
|----------|--------|-------|
| `POST /api/payment/phonepe/init` | ❌ | Initialize PhonePe payment |
| `POST /api/payment/phonepe/callback` | ❌ | PhonePe webhook handler |

---

## 4. RFP SYSTEM (11 endpoints)

| Endpoint | Status | Notes |
|----------|--------|-------|
| `POST /api/rfps` | ✅ | Create RFP |
| `GET /api/rfps` | ✅ | List caller-owned RFPs |
| `GET /api/rfps/:id` | ✅ | Fetch RFP details |
| `PATCH /api/rfps/:id` | ✅ | Update RFP |
| `POST /api/rfps/:id/respond` | ✅ | Submit response |
| `GET /api/rfps/browse` | ✅ | Browse OPEN RFPs |
| `POST /api/rfps/:id/publish` | ✅ | Publish RFP (DRAFT → OPEN) |
| `POST /api/rfps/:id/close` | ✅ | Close RFP |
| `POST /api/rfps/:id/cancel` | ✅ | Cancel RFP |
| `POST /api/rfps/:id/responses/:responseId/accept` | ✅ | Accept response |
| `POST /api/rfps/:id/invite` | ❌ | Invite specific profile |
| `GET /api/rfps/:id/responses` | ❌ | List all responses for RFP |

**RFP Coverage**: 9/11 (82%)

---

## 5. DISCOVERY (2 endpoints)

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /api/search/profiles` | ⚠️ | **URL MISMATCH** — implemented as `POST /api/discovery/search` |
| `GET /api/search/ads` | ❌ | Nearby ads search |

---

## 6. ADS (8 endpoints)

| Endpoint | Status | Notes |
|----------|--------|-------|
| `POST /api/ads` | ❌ | Create ad in DRAFT |
| `PUT /api/ads/:id` | ❌ | Update ad details |
| `DELETE /api/ads/:id` | ❌ | Delete ad |
| `GET /api/ads/:id` | ❌ | Fetch ad details |
| `POST /api/ads/:id/connect` | ❌ | Connection from ad click |
| `POST /api/ads/:id/retry-payment` | ❌ | Retry failed ad payment |
| `POST /api/ads/:id/refund-request` | ❌ | Refund for suspended ad |
| `GET /api/ads/:id/analytics` | ❌ | Ad performance metrics |

---

## 7. SUBSCRIPTIONS (4 endpoints)

| Endpoint | Status | Notes |
|----------|--------|-------|
| `POST /api/subscriptions/trial` | ✅ | Create trial (not in contract but needed) |
| `POST /api/subscriptions/activate` | ✅ | Activate after payment |
| `POST /api/subscriptions/upgrade` | ❌ | Initiate PhonePe payment |
| `POST /api/subscriptions/schedule-downgrade` | ❌ | Schedule non-renewal |

**Subscription Coverage**: 2/4 (50%)

---

## 8. NOTIFICATIONS (4 endpoints)

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /api/notifications` | ✅ | List inbox |
| `PATCH /api/notifications/:id/read` | ✅ | Mark as read |
| `PATCH /api/notifications/read-all` | ✅ | Mark all as read |
| `PATCH /api/notifications/preferences` | ✅ | Update preferences |

**Notification Coverage**: 4/4 (100%) ✅

---

## 9. MODERATION (4 endpoints)

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /api/moderation/queue` | ✅ | Admin moderation queue |
| `POST /api/moderation/:ad_id/clear` | ✅ | Admin clears ad |
| `POST /api/moderation/:ad_id/reject` | ✅ | Admin rejects ad |
| `POST /api/moderation/scan` | ✅ | Trigger Sightengine scan |

**Moderation Coverage**: 4/4 (100%) ✅

---

## 10. RATE LIMITS (1 endpoint)

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /api/profile/rate-limits` | ✅ | Credits and reset info |

**Rate Limits Coverage**: 1/1 (100%) ✅

---

## 11. PRODUCT CATALOG (5 endpoints)

| Endpoint | Status | Notes |
|----------|--------|-------|
| `POST /api/products` | ❌ | Create product listing |
| `GET /api/products` | ❌ | List products |
| `GET /api/products/:id` | ❌ | Fetch single product |
| `PUT /api/products/:id` | ❌ | Update product |
| `DELETE /api/products/:id` | ❌ | Soft-delete product |

---

## 12. EQUIPMENT (5 endpoints)

| Endpoint | Status | Notes |
|----------|--------|-------|
| `POST /api/equipment` | ❌ | Create equipment listing |
| `GET /api/equipment` | ❌ | List equipment |
| `GET /api/equipment/:id` | ❌ | Fetch single equipment |
| `PUT /api/equipment/:id` | ❌ | Update equipment |
| `DELETE /api/equipment/:id` | ❌ | Soft-delete equipment |

---

## 13. SCHEDULED JOBS (4 endpoints) — Internal

| Endpoint | Status | Notes |
|----------|--------|-------|
| `POST /api/jobs/dqs-recalc` | ✅ | Daily DQS recalculation |
| `POST /api/jobs/rfp-expiry` | ✅ | Hourly RFP expiry check |
| `POST /api/jobs/trial-lock` | ✅ | Hourly trial lock check |
| `POST /api/jobs/credit-reset` | ✅ | Monthly credit reset |

**Jobs Coverage**: 4/4 (100%) ✅

---

## 14. ADMIN (1 endpoint)

| Endpoint | Status | Notes |
|----------|--------|-------|
| `POST /api/admin/audit/purge/:id/approve` | ❌ | GDPR purge approval |

---

## Critical Gaps by Priority

### 🔴 Critical (Core Workflow Blockers)
1. **Connections/Handshake** (7 endpoints) — Core marketplace interaction missing
2. **Profile CRUD** (13 endpoints) — User identity and onboarding missing
3. **Payment integration** (2 endpoints) — Revenue pipeline missing

### 🟡 High (Feature Completeness)
4. **Ads CRUD** (8 endpoints) — Monetization feature missing
5. **Product Catalog** (5 endpoints) — PS role functionality missing
6. **Equipment** (5 endpoints) — ED role functionality missing

### 🟢 Medium (Edge Cases & Admin)
7. **RFP invite & responses list** (2 endpoints) — RFP workflow incomplete
8. **Subscription upgrade/downgrade** (2 endpoints) — Payment flow missing
9. **Discovery URL mismatch** (1 endpoint) — Contract alignment issue
10. **Admin endpoints** (1 endpoint) — GDPR compliance missing

---

## URL Alignment Issues

| Contract | Implemented | Resolution |
|----------|-------------|------------|
| `GET /api/search/profiles` | `POST /api/discovery/search` | Contract uses GET with query params; implementation uses POST with body. Need to align. |

---

## Response Format Alignment

All implemented routes now follow the contract's standard format:
```json
{ "success": true, "data": {...}, "meta": {...} }
```
Error format:
```json
{ "success": false, "error": { "code": "ERROR_CODE", "message": "..." } }
```

✅ All 24 implemented routes are aligned with the contract's response format.

---

## Auth Integration Status

✅ All 24 implemented routes use `requireAuth()` or `requireAdmin()`
✅ No route accepts user IDs from request body
✅ Scheduled jobs use QStash signature verification
