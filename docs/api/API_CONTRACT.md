---
id: API_CONTRACT
layer: interface

type: declarative
owner: system
mutable: controlled
criticality: high

depends_on:
    - db_schema
    - STATE_MACHINES

consumes:
    - endpoints
    - payloads

provides:
    - api_definitions
    - request_response_contracts

validates:
    - schema_alignment
    - contract_consistency

runtime:
    triggers:
        - on_external_request
    outputs_to:
        - STATE_MACHINES
        - db_schema

version: 1.0
---

# API_CONTRACT.md — Full API Specification

## Purpose

Defines complete backend API contracts for BuonDesizn.

This includes:

- endpoints
- request/response schemas
- validation rules
- state constraints
- error handling

Derived strictly from:

- `docs/database/db_schema.md`
- `docs/business/business_logic_edge_cases.md`
- `docs/core/ARCHITECTURE.md`

---

## Global Standards

### Base URL

/api

---

### UI Boundary (RPC-First)

- **RPC-first for server components**: Server-rendered components may call Supabase RPC directly using user JWTs.
- **/api remains the client entry point**: Client and external consumers must use `/api` routes.
- This **supersedes** the prior assumption that `/api` is the only entry point.

### Authentication

- Supabase JWT required for all protected routes
- Header: `Authorization: Bearer <token>`

### Canonical Alignment (Planning Lock)

- Handshake request state value is `REQUESTED` (not `PENDING`).
- RFP live state value is `OPEN` (not `ACTIVE`).
- Discovery RPC name is `searching_nearby_profiles()`.
- Discovery distance response unit is `distance_km`.
- `display_name` in discovery is an API alias (derived from profile naming rules); it is not a required persisted column name.

---

### Real-Time Updates

- System uses **polling** (not WebSocket) for notification updates and real-time features.
- Clients poll `GET /api/notifications` at configurable intervals.
- Dashboard metrics are refreshed via polling `GET /api/dashboard/metrics`.

---

### Standard Response Format

```json
{
    "success": true,
    "data": {},
    "meta": {}
}
```

---

### Error Response Schema

All endpoints return errors in this shape:

```json
{
    "success": false,
    "error": {
        "code": "DOMAIN_ACTION_REASON",
        "message": "Human readable message",
        "details": {}
    }
}
```

### HTTP Status Codes

| Status | Meaning |
| --- | --- |
| 400 | Bad Request — validation failed or invalid params |
| 401 | Unauthenticated — missing or invalid JWT |
| 403 | Forbidden — insufficient role or resource locked |
| 404 | Not Found — resource does not exist |
| 409 | Conflict — duplicate resource or state conflict |
| 429 | Rate Limited — too many requests in time window |
| 500 | Server Error — unhandled internal error |

---

# 1. PROFILES

---

## GET /api/profiles/:id

Fetch profile (masked if no connection)

### Response

```json
{
    "id": "uuid",
    "persona_type": "CON",
    "org_name": "ABC Infra",
    "location": {
        "lat": 18.5204,
        "lng": 73.8567
    },
    "verification_status": "VERIFIED",
    "dqs_score": 0.85,
    "handshake_credits": 24,
    "subscription_status": "active",
    "contact": {
        "email": "***@***",
        "phone_primary": "+91**********"
    }
}
```

---

### Rules

- contact data must be resolved via `get_visible_contact_info()`
- `subscription_status` determines UI hard lock state.
- Blocked users must not be returned

---

## PATCH /api/profiles/:id

Update profile fields.

### Request

```json
{
    "org_name": "ABC Infra Pvt Ltd",
    "tagline": "Structural Engineering Excellence",
    "location": {
        "lat": 18.5204,
        "lng": 73.8567
    },
    "city": "Pune",
    "state": "Maharashtra",
    "address_line1": "123 MG Road",
    "pincode": "411001",
    "phone_primary": "+919876543210",
    "email_business": "contact@abcinfra.com",
    "linkedin_url": "https://linkedin.com/company/abcinfra"
}
```

### Guards

- `persona_type` is immutable — rejected if present in body.
- `pan` is immutable after first save — rejected if changed.
- GSTIN changes must use `/api/profiles/gstin-change-request`.
- Caller must own the profile (`auth.uid() = id`).

### Response

```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "org_name": "ABC Infra Pvt Ltd",
        "tagline": "Structural Engineering Excellence",
        "location": { "lat": 18.5204, "lng": 73.8567 },
        "verification_status": "VERIFIED",
        "updated_at": "2026-04-02T10:00:00Z"
    }
}
```

---

## POST /api/profiles

Create profile

### Request

```json
{
    "persona_type": "CON",
    "org_name": "ABC Infra",
    "location": {
        "lat": 18.5204,
        "lng": 73.8567
    },
    "gstin": "27ABCDE1234F1Z5"
}
```

---

### Validation

- persona_type immutable after creation
- GSTIN required for organizations
- email uniqueness (active accounts only)

---

## GET /api/company-personnel

List company personnel under caller's GSTIN.

### Query Params

- `include_deleted` (optional boolean — default false — set to `true` to include soft-deleted records)
- `page` (default 1)
- `page_size` (default 20, max 50)

### Guards

- Caller must have a verified GSTIN.
- Returns only personnel rows matching caller's `company_gstin`.
- If caller has an ACCEPTED handshake with a GSTIN-matching profile, those personnel rows are also visible (Company DNA rule).

### Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "profile_id": "uuid",
        "company_gstin": "27ABCDE1234F1Z5",
        "full_name": "Ananya Sharma",
        "designation": "Project Manager",
        "qualification": "B.E. Civil",
        "specialty": ["PMC", "Planning"],
        "experience_years": 12,
        "deleted_at": null,
        "created_at": "2026-04-01T08:00:00Z"
      }
    ],
    "meta": { "page": 1, "page_size": 20, "total_count": 1, "total_pages": 1 }
  }
}
```

---

## GET /api/company-personnel/:id

Fetch a single personnel record.

### Guards

- Caller must own the record (`profile_id = auth.uid()`) or have admin rights for that GSTIN, or have an ACCEPTED handshake with a GSTIN-matching profile.

### Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "profile_id": "uuid",
    "company_gstin": "27ABCDE1234F1Z5",
    "full_name": "Ananya Sharma",
    "designation": "Project Manager",
    "qualification": "B.E. Civil",
    "specialty": ["PMC", "Planning"],
    "experience_years": 12,
    "email": "person@example.com",
    "phone": "+919999999999",
    "detailed_bio": "...",
    "profile_image_url": null,
    "deleted_at": null
  }
}
```

---

## POST /api/company-personnel

Create company personnel record under caller's GSTIN.

### Request

```json
{
  "full_name": "Ananya Sharma",
  "designation": "Project Manager",
  "qualification": "B.E. Civil",
  "specialty": ["PMC", "Planning"],
  "experience_years": 12,
  "email": "person@example.com",
  "phone": "+919999999999",
  "detailed_bio": "..."
}
```

### Guards

- Caller must have verified GSTIN.
- `company_gstin` is server-derived from caller profile (never trusted from body).

### Canonical Field Types

- `specialty`: `TEXT[]`
- `detailed_bio`: `TEXT`
- `is_active`: `BOOLEAN`

### Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "profile_id": "uuid",
    "company_gstin": "27ABCDE1234F1Z5",
    "full_name": "Ananya Sharma",
    "designation": "Project Manager",
    "qualification": "B.E. Civil",
    "specialty": ["PMC", "Planning"],
    "experience_years": 12,
    "email": "person@example.com",
    "phone": "+919999999999",
    "detailed_bio": "...",
    "profile_image_url": null,
    "deleted_at": null
  }
}
```

---

## PUT /api/company-personnel/:id

Update an existing personnel record.

### Guards

- Caller must own the record (`profile_id = auth.uid()`) or have admin rights for that GSTIN.

---

## DELETE /api/company-personnel/:id

Soft-delete personnel row (sets `deleted_at = NOW()`) for auditability.

### Guards

- Caller must own the record (`profile_id = auth.uid()`) or have admin rights for that GSTIN.

---

# 2. CONNECTIONS (HANDSHAKE SYSTEM)

---

## POST /api/connections

Create connection request

### Request

```json
{
    "target_id": "uuid",
    "message": "Interested in collaboration"
}
```

---

### Validation

- must pass `can_send_connection_request()`
- cannot connect to self
- blocked users excluded

---

### Response

```json
{
    "connection_id": "uuid",
    "status": "REQUESTED"
}
```

---

## PATCH /api/connections/:id/accept

- Accept connection
- All contact fields become visible (DB enforced)

### Request

```json
{}
```

---

### Effects

- status → ACCEPTED
- FULL contact reveal (email + phone)
- enforced at DB level (trigger)
- unmasking audit entries created
- CONNECTION_ACCEPTED event triggered

---

## PATCH /api/connections/:id/reject

Reject connection

### Effects

- status → REJECTED

---

## GET /api/connections

Fetch user connections

### Filters

- status
- role
- source

---

## GET /api/address-book

Fetch permanent connections

### Response

```json
[
    {
        "id": "uuid",
        "org_name": "ABC Designs",
        "contact": {
            "email": "abc@example.com",
            "phone": "+911234567890"
        }
    }
]
```

---

## POST /api/payment/phonepe/init

Initialize subscription payment

---

## POST /api/payment/phonepe/callback

Handle payment response from PhonePe webhook (Subscription Activation).

### Request (PhonePe webhook POST body)

```json
{
  "merchantId": "BUONDESIZN",
  "merchantTransactionId": "txn_abc123",
  "merchantOrderId": "order_xyz789",
  "amount": 99900,
  "state": "COMPLETED",
  "responseCode": "SUCCESS",
  "paymentInstrument": {
    "type": "UPI",
    "utr": "326987654321"
  },
  "transactionId": "T260402100000"
}
```

### Guards

- Verify webhook signature using PhonePe base64(SHA256(payload + salt)) + X-VERIFY header.
- Idempotent: if `merchantTransactionId` already processed, return 200 with existing result.
- On `state = COMPLETED`: set `subscriptions.status = 'active'`, `profiles.subscription_status = 'active'`, reset `handshake_credits = 30`, set `last_credit_reset_at = NOW()`.
- On `state = FAILED`: set `subscriptions.status = 'expired'`, emit `PAYMENT_FAILED` notification.

### Response 200

```json
{
  "success": true,
  "data": {
    "merchantTransactionId": "txn_abc123",
    "status": "COMPLETED",
    "subscription_activated": true
  }
}
```

---

## POST /api/profiles/verify

Submit profile for GSTIN/PAN verification.

### Request

```json
{
  "pan": "ABCDE1234F",
  "gstin": "27ABCDE1234F1Z5",
  "org_name": "ABC Infra Pvt Ltd",
  "establishment_year": 2015
}
```

### Guards

- PAN regex: `^[A-Z]{5}[0-9]{4}[A-Z]{1}$`.
- GSTIN regex: `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`.
- PAN must not already be registered for the same `persona_type`.
- GSTIN must not already be linked to another profile.
- Transitions `verification_status` to `PENDING_ADMIN` on success.

### Response 200

```json
{
  "success": true,
  "data": {
    "profile_id": "uuid",
    "verification_status": "PENDING_ADMIN",
    "pan": "ABCDE****F",
    "gstin": "27ABCDE*****1Z5"
  }
}
```

### Error 409

```json
{
  "success": false,
  "error": {
    "code": "IDENTITY_VERIFY_DUPLICATE_GSTIN",
    "message": "GSTIN already linked to another profile"
  }
}
```

---

## GET /api/search/profiles

Fetch profiles (National / Proximity)

### Query Params

- lat (optional)
- lng (optional)
- radius (optional, defaults to ALL_INDIA)
- persona_type
- min_dqs_score (optional)

---

### Behavior

- sorts by: `(0.7 * dqs_score) + (0.3 * (1 - normalized_distance))`
- if lat/lng missing, distance weight = 0, DQS weight = 1 (pure quality rank).
- excludes blocked users
- masks contacts server-side unless in user's address book.

---

# 3. RFP SYSTEM

---

## POST /api/rfps

Create RFP. PS and ED personas CANNOT create RFQs — they can only send connections.

### Guards

- Caller must be authenticated.
- `persona_type` must be `PP`, `C`, or `CON`. Returns **403** with `RFQ_CREATE_PERSONA_UNAUTHORIZED` for `PS` or `ED`.
- Caller must not be `hard_locked`.

### Request

```json
{
    "title": "Structural Consultant Required",
    "description": "Need structural design for residential building",
    "category": "Consulting",
    "project_location": {
        "lat": 18.5204,
        "lng": 73.8567
    },
    "notification_radius_meters": 50000,
    "target_personas": ["C"]
}
```

---

### Validation

- title: 10–100 chars
- description: 50–2000 chars
- radius: 1000–200000 meters
- must include at least one target persona

---

## GET /api/rfps/:id

Fetch RFP

---

## POST /api/rfps/:id/respond

Submit RFQ response to an RFP.

### Request

```json
{
    "proposal_text": "We have 15 years of experience in structural design...",
    "estimated_cost": 500000.00,
    "estimated_days": 30,
    "attachments": ["https://..."]
}
```

---

### Validation

- one response per user per RFP
- max 5 responses/day (rate limit)
- RFP must be OPEN

### Response 200

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "rfp_id": "uuid",
    "responder_id": "uuid",
    "proposal_text": "...",
    "estimated_cost": 500000.00,
    "estimated_days": 30,
    "status": "SUBMITTED",
    "created_at": "2026-04-02T09:00:00Z"
  }
}
```

---

## GET /api/rfps/:id/responses/:responseId

Fetch a single RFQ response detail.

### Guards

- Caller must be RFP creator or the responder who submitted this response.

### Response 200

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "rfp_id": "uuid",
    "responder_id": "uuid",
    "responder_display_name": "ABC Consultants",
    "proposal_text": "...",
    "estimated_cost": 500000.00,
    "estimated_days": 30,
    "status": "SUBMITTED",
    "created_at": "2026-04-02T09:00:00Z"
  }
}
```

---

## POST /api/rfps/:id/responses/:responseId/accept

RFP creator accepts a specific RFQ response. Creates a connection in ACCEPTED state at no credit cost.

**Request**: `{}` (empty body — action is implicit)

**Response 200**
```json
{
  "success": true,
  "data": {
    "rfp_response_id": "uuid",
    "status": "ACCEPTED",
    "connection_id": "uuid",
    "connection_status": "ACCEPTED"
  }
}
```
**Guards**: RFP must be `OPEN`. Caller must be RFP creator. Emits `RFP_RESPONSE_ACCEPTED`.
**Side Effects**:
- Creates a `connections` row with `connection_source = 'RFP_RESPONSE'` and `status = 'ACCEPTED'` (not REQUESTED).
- No credit cost to the requester.
- Creates an `unmasking_audit` entry for contact reveal.

---

## GET /api/rfps

List caller-owned RFPs with status filters and pagination.

### Guards

- PS and ED roles cannot create RFPs — they only see RFPs where they were invited or responded.

### Query Params

- status (optional: `DRAFT|OPEN|CLOSED|EXPIRED|CANCELLED`)
- page
- page_size

---

## GET /api/rfps/browse

Browse all discoverable OPEN RFPs for the caller.

### Query Params

- target_persona (optional)
- radius_km (optional)
- page
- page_size

---

## POST /api/rfps/:id/publish

Transition RFP from DRAFT → OPEN state.

### Guards

- Caller must be RFP creator.
- RFP must be in DRAFT state.
- Required fields must be populated (title, description, target_personas).

### Response 200

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "OPEN",
    "published_at": "2026-04-02T10:00:00Z"
  }
}
```

---

## PATCH /api/rfps/:id

Update RFP fields.

### Guards

- Caller must be RFP creator.
- RFP must be in DRAFT state (cannot edit after publish).
- Location is immutable after publish.

---

## PATCH /api/rfps/:id/close

Close RFP (terminal state — cannot be re-opened).

---

### Effects

- pending responses updated
- notifications triggered
- RFP_CLOSED event
- **Terminal state: cannot be re-opened**

---

## PATCH /api/rfps/:id/cancel

Cancel RFP (terminal state — cannot be re-opened).

---

### Effects

- pending responses → WITHDRAWN
- notifications triggered
- RFP_CANCELLED event
- **Terminal state: cannot be re-opened**

---

## POST /api/rfps/:id/invite

Invite a specific profile to respond to an RFP.

### Request

```json
{
  "invitee_id": "uuid"
}
```

### Guards

- RFP must be `OPEN`.
- Caller must be RFP creator.
- Invitee's `persona_type` must match one of the RFP's `target_personas`.
- Cannot invite the same profile twice (unique constraint on `rfp_invitations`).

### Response 200

```json
{
  "success": true,
  "data": {
    "invitation_id": "uuid",
    "invitee_id": "uuid",
    "status": "PENDING"
  }
}
```

### Events Triggered

- `RFP_NEARBY` notification sent to invitee.

---

## GET /api/rfps/:id/responses

List all responses for an RFP.

### Guards

- Caller must be RFP creator or a responder on this RFP.

### Query Params

- `status` (optional: `SUBMITTED|SHORTLISTED|ACCEPTED|REJECTED`)
- `page` (default 1)
- `page_size` (default 20, max 50)

### Response 200

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "responder_id": "uuid",
        "responder_display_name": "ABC Consultants",
        "proposal_text": "...",
        "estimated_cost": 500000.00,
        "estimated_days": 30,
        "status": "SUBMITTED",
        "created_at": "2026-04-02T09:00:00Z"
      }
    ],
    "meta": { "page": 1, "page_size": 20, "total_count": 3, "total_pages": 1 }
  }
}
```

---

# 4. DISCOVERY

---

## GET /api/search/profiles

### Query Params

- lat
- lng
- radius
- persona_type
- min_completeness

---

### Behavior

- uses PostGIS ST_DWithin
- excludes blocked users
- sorts by weighted score

---

## GET /api/search/ads

Returns nearby ads sorted by proximity

---

# 5. ADS

---

## POST /api/ads

Create ad in `DRAFT` state.

### Request

```json
{
  "title": "Hempcrete Blocks",
  "description": "Sustainable building material",
  "location": { "lat": 18.5204, "lng": 73.8567 },
  "radius_km": 25,
  "budget_inr": 2500
}
```

### Guards

- Caller must not be `hard_locked`.

---

## PUT /api/ads/:id

Update ad details while ad is `DRAFT` or `PENDING_PAYMENT`.

---

## DELETE /api/ads/:id

Delete ad if not ACTIVE. For ACTIVE ads use pause/archive workflow.

---

## GET /api/ads/:id

Fetch ad details

---

### Validation

- ad must be ACTIVE

---

### Response

```json
{
    "id": "uuid",
    "title": "Hempcrete Blocks",
    "description": "Sustainable building material",
    "location": {
        "lat": 18.5204,
        "lng": 73.8567
    },
    "status": "ACTIVE"
}
```

---

## POST /api/ads/:id/connect

Trigger connection from ad interaction

---

### Request

```json
{
    "message": "Interested in your product"
}
```

---

### Behavior

- validates ad is ACTIVE
- validates connection eligibility
- creates connection with:

```text
connection_source = AD_CLICK
connection_context = { ad_id }
```

---

### Response

```json
{
    "connection_id": "uuid",
    "status": "REQUESTED"
}
```

---

### Events Triggered

- CONNECTION_REQUESTED

---

### Notes

- does NOT reveal contact directly
- follows handshake system

---

# 6. PRIVACY & CONTACT VISIBILITY

---

## GET /api/profiles/:id/contact

Returns visible contact info

---

### Behavior

- masked if no connection
- FULL visible if connection = ACCEPTED
- controlled via DB function `get_visible_contact_info()`

---

# 7. VERIFICATION

---

## POST /api/profiles/verify

Submit verification

---

## PATCH /api/profiles/:id/verification

Admin endpoint

---

### Transitions

- PENDING_VERIFICATION → PENDING_ADMIN → VERIFIED
- PENDING_ADMIN → REJECTED

---

# 8. RATE LIMITING

---

### RFP Responses

- max 5 per day per user

---

### Connection Requests

Allowed only if:

- no active connection
- or last status = REJECTED / EXPIRED

---

# 9. STATE ENFORCEMENT

## Subscription State Machine

Subscription states and transitions:

| State | Description |
| --- | --- |
| `trial` | Initial free trial period |
| `active` | Paid subscription is current |
| `expired` | Subscription has lapsed (no grace period) |
| `hard_locked` | Account locked — no API access except data export/deletion |

### Transitions

| From | To | Trigger |
| --- | --- | --- |
| `trial` | `active` | Payment succeeds |
| `trial` | `expired` | Trial period ends without payment |
| `active` | `expired` | Billing period ends without renewal |
| `expired` | `hard_locked` | **Immediate** — no grace period |
| `expired` | `active` | Payment succeeds (before hard_locked) |
| `hard_locked` | `active` | Payment succeeds (re-activation) |

### Notes

- `expired` → `hard_locked` happens **immediately** with no grace period.
- `hard_locked` users cannot create ads, send connections, respond to RFPs, or access most platform features.
- Only allowed actions for `hard_locked` users: data export (`GET /api/profiles/me/data-export`) and account deletion (`DELETE /api/profiles/me`).

## RFP Terminal States

`CLOSED` and `CANCELLED` are **terminal states** — RFPs in these states cannot be re-opened.

## Additional Endpoints (Edge Case Coverage)

---

### POST /api/connections/block

Block a user. Works from any connection state.

**Request**
```json
{ "target_id": "uuid" }
```
**Response 200**
```json
{ "success": true, "data": { "connection_id": "uuid", "status": "BLOCKED" } }
```
**Guards**: Cannot block yourself. Emits no credit deduction.

---

### DELETE /api/connections/block/:target_id

Unblock a previously blocked user. Sets connection status to `REJECTED` (soft unblock — row is preserved for audit).

**Response 200**
```json
{ "success": true, "data": { "unblocked": true, "connection_status": "REJECTED" } }
```

**Guards**: Caller must be the original blocker. Emits `CONNECTION_UNBLOCKED` event.

---

### POST /api/rfps/:id/responses/:responseId/accept

RFP creator accepts a specific RFQ response. Creates a connection in ACCEPTED state at no credit cost.

**Request**: `{}` (empty body — action is implicit)

**Response 200**
```json
{
  "success": true,
  "data": {
    "rfp_response_id": "uuid",
    "status": "ACCEPTED",
    "connection_id": "uuid",
    "connection_status": "ACCEPTED"
  }
}
```
**Guards**: RFP must be `OPEN`. Caller must be RFP creator. Emits `RFP_RESPONSE_ACCEPTED`.
**Side Effects**:
- Creates a `connections` row with `connection_source = 'RFP_RESPONSE'` and `status = 'ACCEPTED'` (not REQUESTED).
- No credit cost to the requester.
- Creates an `unmasking_audit` entry for contact reveal.

---

### POST /api/subscriptions/upgrade

Initiate a PhonePe payment for the National Pro plan. Returns a PhonePe redirect URL.

**Request**
```json
{ "plan_name": "national_pro" }
```
**Response 200**
```json
{
  "success": true,
  "data": {
    "phonepe_order_id": "string",
    "redirect_url": "https://mercury-uat.phonepe.com/...",
    "expires_at": "2026-03-31T10:15:00Z"
  }
}
```
**Guards**: Profile must not be currently `active`. See `docs/business/business_logic_edge_cases.md` for idempotency handling.

---

### POST /api/subscriptions/schedule-downgrade

Mark subscription for non-renewal at the end of the current billing period.

**Request**: `{}` (empty)
**Response 200**
```json
{ "success": true, "data": { "downgrade_scheduled_at": "2026-04-30T10:00:00Z" } }
```
**Guards**: Subscription must be `active`. Does not immediately downgrade.

---

### POST /api/ads/:id/retry-payment

Re-initiate PhonePe payment for an ad in `DRAFT` or failed `PENDING_PAYMENT` state.

**Request**: `{}`
**Response 200**
```json
{
  "success": true,
  "data": {
    "phonepe_order_id": "string",
    "redirect_url": "https://mercury-uat.phonepe.com/..."
  }
}
```
**Guards**: Ad must be in `DRAFT` or `PENDING_PAYMENT`. Emits `AD_PAYMENT_INITIATED`.

---

### POST /api/ads/:id/refund-request

Submit a refund request for a SUSPENDED ad (flagged by Sightengine).

**Request**
```json
{ "reason": "string" }
```
**Response 200**
```json
{ "success": true, "data": { "refund_request_id": "uuid", "status": "PENDING_REVIEW" } }
```
**Guards**: Ad must be `SUSPENDED`. One refund request per ad.

---

### PATCH /api/notifications/preferences

Update notification preferences (in-app, SMS).

**Request**
```json
{
  "connection_requests": true,
  "connection_accepted": true,
  "connection_rejected": false,
  "rfp_responses": true,
  "rfp_nearby": true,
  "ad_moderation": true,
  "subscription_updates": true,
  "marketing": false
}
```
**Response 200**
```json
{ "success": true, "data": { "preferences": { ... } } }
```

---

### GET /api/notifications

Returns inbox notifications for the authenticated user.

**Query Params**

- `is_read` (optional boolean)
- `page`
- `page_size`

**Response 200**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "type": "CONNECTION_REQUESTED",
        "title": "New connection request",
        "message": "...",
        "is_read": false,
        "created_at": "2026-04-02T09:30:00Z"
      }
    ]
  },
  "meta": { "page": 1, "page_size": 20 }
}
```

---

### PATCH /api/notifications/:id/read

Marks a notification as read.

**Request**

```json
{ "is_read": true }
```

**Response 200**

```json
{ "success": true, "data": { "id": "uuid", "is_read": true } }
```

---

### PATCH /api/notifications/read-all

Marks all unread notifications as read for the authenticated user.

**Request**: `{}` (empty body)

**Response 200**

```json
{
  "success": true,
  "data": { "marked_count": 7 }
}
```

**Guards**: Caller must be authenticated. Only updates notifications where `recipient_id = auth.uid()` and `is_read = false`. Emits no events.

---

### GET /api/profile/rate-limits

Returns the current rate limit state for the authenticated user (credits remaining, requests this minute).

**Response 200**
```json
{
  "success": true,
  "data": {
    "handshake_credits_remaining": 27,
    "last_credit_reset_at": "2026-03-01T00:00:00Z",
    "next_reset_at": "2026-04-01T00:00:00Z",
    "subscription_status": "active"
  }
}
```

---

### POST /api/profiles/gstin-change-request

Request a GSTIN change (requires admin approval — see STATE_MACHINES.md §4 `PENDING_ADMIN`).

**Request**
```json
{ "new_gstin": "27ABCDE1234F1Z5", "reason": "string" }
```
**Response 200**
```json
{ "success": true, "data": { "request_id": "uuid", "status": "PENDING_ADMIN" } }
```
**Guards**: New GSTIN must pass regex validation. Existing GSTIN must be verified. Only one open request at a time.

---

### PATCH /api/admin/gstin-change-requests/:id/approve

Super-admin approves or rejects a GSTIN change request.

**Request**
```json
{ "action": "approve" | "reject", "notes": "string" }
```
**Response 200**
```json
{ "success": true, "data": { "request_id": "uuid", "action": "approve", "profile_id": "uuid" } }
```
**Guards**: Caller must have `role = 'super_admin'` in admin table. Emits `PROFILE_VERIFIED`.

---

### POST /api/admin/audit/purge/:id/approve

GDPR hard-delete approval. Super-admin approves purge of a profile and all associated PII.

**Request**
```json
{ "confirm": true }
```
**Response 200**
```json
{ "success": true, "data": { "purged_profile_id": "uuid", "purged_at": "2026-03-31T10:00:00Z" } }
```
**Guards**: Irreversible. Logs to `unmasking_audit` with `trigger_event = 'ADMIN_ACCESS'`. Cascades soft-delete to all related rows.

---

All APIs must:

- validate state transitions
- reject invalid transitions
- enforce immutability rules:

  - persona_type
  - RFP location after publish

---

# 10. EVENTS TRIGGERED (LINKED TO EVENTS.md)

Each API must emit events:

- POST /api/connections → CONNECTION_REQUESTED
- PATCH /api/connections/:id/accept → CONNECTION_ACCEPTED
- PATCH /api/connections/:id/reject → CONNECTION_REJECTED
- POST /api/connections/block → CONNECTION_BLOCKED
- DELETE /api/connections/block/:target_id → CONNECTION_UNBLOCKED
- POST /api/rfps → RFP_CREATED
- POST /api/rfps/:id/respond → RFP_RESPONSE_SUBMITTED
- POST /api/rfps/:id/invite → RFP_NEARBY
- RFP close → RFP_CLOSED
- RFP cancel → RFP_CANCELLED
- POST /api/rfps/:id/responses/:responseId/accept → RFP_RESPONSE_ACCEPTED
- contact reveal → UNMASKING_TRIGGERED
- POST /api/ads/:id/connect → CONNECTION_REQUESTED
- POST /api/ads → AD_CREATED
- POST /api/payment/phonepe/callback → PAYMENT_SUCCESS or PAYMENT_FAILED
- POST /api/subscriptions/upgrade → SUBSCRIPTION_ACTIVATED
- POST /api/subscriptions/schedule-downgrade → SUBSCRIPTION_DOWNGRADE_SCHEDULED
- POST /api/moderation/:ad_id/clear → AD_APPROVED
- POST /api/moderation/:ad_id/reject → AD_SUSPENDED
- PATCH /api/notifications/:id/read → NOTIFICATION_READ
- PATCH /api/notifications/read-all → NOTIFICATIONS_READ_ALL

---

# 11. SECURITY

---

- All sensitive data masked server-side
- RLS enforced for:

  - profiles
  - connections
  - RFP visibility
- No direct DB exposure for clients; server components may call RPC using user JWTs.

---

---

## RPC: searching_nearby_profiles()
_Spec: RM-001 | Called by: Server Components (via Supabase RPC with user JWT)_

This is the core discovery function. It implements the **70/30 Quality-First ranking formula**: 70% DQS + 30% inverse proximity. It runs as a `SECURITY DEFINER` function in Postgres and NEVER returns PII fields.

### Signature

```sql
searching_nearby_profiles(
  searcher_lat    DOUBLE PRECISION,   -- Searcher's latitude (required)
  searcher_lng    DOUBLE PRECISION,   -- Searcher's longitude (required)
  radius_km       INT     DEFAULT 50, -- Search radius; server cap: 500km
  role_filter     TEXT    DEFAULT NULL, -- 'PP' | 'C' | 'CON' | 'PS' | 'ED' | NULL (all)
  keyword         TEXT    DEFAULT NULL, -- Case-insensitive match on display_name, tagline
  page_size       INT     DEFAULT 20,  -- Max: 50
  page_offset     INT     DEFAULT 0    -- Pagination offset
)
```

### Ranking Formula

```
ranked_score = (0.7 × dqs_score) + (0.3 × (1 - LEAST(distance_km / radius_km, 1.0)))
```

Where `dqs_score` is stored in `profiles.dqs_score`, updated daily at 2 AM UTC by pg_cron.

### Return Shape

```json
{
  "profile_id": "uuid",
  "display_name": "string",
  "persona_type": "PP | C | CON | PS | ED",
  "city": "string",
  "state": "string",
  "dqs_score": 0.85,
  "distance_km": 12.4,
  "ranked_score": 0.631,
  "subscription_status": "active | trial"
}
```

**Fields NEVER returned** (masked at RPC level regardless of caller):
- `phone`
- `email`
- `linkedin_url`
- `pan`

`display_name` is an API alias for UI consumption. Persisted naming can remain `org_name` in storage.

### Exclusion Rules

- Profiles with `subscription_status = 'hard_locked'` are excluded
- Profiles with `location IS NULL` are excluded (not geocoded yet)
- The calling user's own profile is excluded
- Blocked users (mutual) are excluded

### Performance Requirements

- Must use PostGIS `ST_DWithin` for initial radius filter (GiST index required)
- P95 latency target: **<300ms** for radius ≤ 50km, page_size ≤ 20
- `EXPLAIN ANALYZE` must show Index Scan on `idx_profiles_location`

### Client Usage (Server Component)

```typescript
// @witness [RM-001]
import { createServerClient } from '@/lib/supabase/server'

const supabase = createServerClient()
const { data, error } = await supabase.rpc('searching_nearby_profiles', {
  searcher_lat: 19.076,
  searcher_lng: 72.877,
  radius_km: 50,
  role_filter: 'CON',
  page_size: 20,
  page_offset: 0,
})
```

---

## RPC: dqs_recalculate()
_Spec: RM-001 | Triggered by: pg_cron at 02:00 UTC daily_

Recomputes `profiles.dqs_score` from subcomponents using the locked formula:

```
dqs_score = (0.4 × dqs_responsiveness)
          + (0.3 × dqs_trust_loops)
          + (0.2 × dqs_verification)
          + (0.1 × dqs_profile_depth)
```

### Contract

- No request payload.
- Returns `void`.
- Applies only to non-deleted profiles.
- Result is clamped to `[0.0, 1.0]`.

### Scheduling

- Cron expression: `0 2 * * *`
- Job id: `dqs-daily-recalc`

---

# 12. PRODUCT CATALOG (PS Role)
_Spec: PS-001 | Simple CRUD — no inventory logic in Phase 1_

---

## POST /api/products

Create product listing.

### Request

```json
{
  "name": "Ready-Mix Concrete M25",
  "description": "High-strength concrete for structural work",
  "category": "Building Materials",
  "subcategory": "Concrete",
  "price_per_unit": 4500.00,
  "unit": "per cubic meter",
  "min_order_quantity": 5,
  "images": ["https://..."],
  "available": true
}
```

### Guards

- Caller must have `persona_type = 'PS'`.
- Caller must not be `hard_locked`.

---

## GET /api/products

List products with pagination.

### Query Params

- `seller_id` (optional — filter by seller)
- `category` (optional)
- `page` (default 1)
- `page_size` (default 20, max 50)

---

## GET /api/products/:id

Fetch single product.

---

## PUT /api/products/:id

Update product details.

### Guards

- Caller must own the product (`seller_id = auth.uid()`).

---

## DELETE /api/products/:id

Soft-delete product (`is_active = false`).

### Guards

- Caller must own the product.

---

# 13. EQUIPMENT LISTINGS (ED Role)
_Spec: ED-001 | Simple CRUD — no booking logic in Phase 1_

---

## POST /api/equipment

Create equipment listing.

### Request

```json
{
  "name": "CAT 320 Excavator",
  "description": "20-ton hydraulic excavator, well-maintained",
  "category": "Earthmoving",
  "type": "Excavator",
  "rental_rate_per_day": 15000.00,
  "operator_included": false,
  "location": { "lat": 18.5204, "lng": 73.8567 },
  "images": ["https://..."],
  "available": true
}
```

### Guards

- Caller must have `persona_type = 'ED'`.
- Caller must not be `hard_locked`.

---

## GET /api/equipment

List equipment with pagination.

### Query Params

- `dealer_id` (optional — filter by dealer)
- `category` (optional)
- `available_only` (optional boolean)
- `page` (default 1)
- `page_size` (default 20, max 50)

---

## GET /api/equipment/:id

Fetch single equipment item.

---

## PUT /api/equipment/:id

Update equipment details.

### Guards

- Caller must own the equipment (`dealer_id = auth.uid()`).

---

## DELETE /api/equipment/:id

Soft-delete equipment (`is_active = false`).

### Guards

- Caller must own the equipment.

---

# 14. MODERATION (MOD-001)
_Spec: MOD-001 | Admin-only endpoints for ad content safety_

---

## GET /api/moderation/queue

Admin-only: list flagged/suspended ads awaiting review.

### Query Params

- `status` (optional: `FLAGGED|SUSPENDED` — default both)
- `page` (default 1)
- `page_size` (default 20, max 50)

### Guards

- Caller must have `role = 'super_admin'`.

### Response 200

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "Hempcrete Blocks",
        "image_url": "https://...",
        "status": "SUSPENDED",
        "moderation_status": "FLAGGED",
        "profile_id": "uuid",
        "created_at": "2026-04-02T08:00:00Z"
      }
    ],
    "meta": { "page": 1, "page_size": 20, "total_count": 3, "total_pages": 1 }
  }
}
```

---

## POST /api/moderation/:ad_id/clear

Admin clears a flagged/suspended ad, restoring it to ACTIVE.

### Request

```json
{ "notes": "string (optional)" }
```

### Guards

- Caller must have `role = 'super_admin'`.
- Ad must be in `SUSPENDED` or `FLAGGED` state.
- If ad was previously paid, it resumes `ACTIVE` without re-payment.
- Emits `AD_APPROVED` notification to ad creator.

### Response 200

```json
{
  "success": true,
  "data": {
    "ad_id": "uuid",
    "status": "ACTIVE",
    "moderation_status": "APPROVED"
  }
}
```

---

## POST /api/moderation/:ad_id/reject

Admin rejects a flagged ad, keeping it SUSPENDED permanently.

### Request

```json
{ "reason": "string", "notes": "string (optional)" }
```

### Guards

- Caller must have `role = 'super_admin'`.
- Ad must be in `SUSPENDED` or `FLAGGED` state.
- Triggers refund flow if ad was paid.
- Emits `AD_SUSPENDED` notification to ad creator.

### Response 200

```json
{
  "success": true,
  "data": {
    "ad_id": "uuid",
    "status": "SUSPENDED",
    "moderation_status": "REJECTED"
  }
}
```

---

# 15. ADS ANALYTICS
_Spec: AD-001 | Read ad performance metrics_

---

## GET /api/ads/:id/analytics

Returns analytics for a specific ad.

### Query Params

- `event_type` (optional: `IMPRESSION|CLICK|CONNECT` — default all)
- `from` (optional ISO date — filter from)
- `to` (optional ISO date — filter to)
- `page` (default 1)
- `page_size` (default 20, max 50)

### Guards

- Caller must own the ad (`profile_id = auth.uid()`).

### Response 200

```json
{
  "success": true,
  "data": {
    "ad_id": "uuid",
    "summary": {
      "impressions": 1250,
      "clicks": 87,
      "connects": 12,
      "ctr": 0.0696
    },
    "items": [
      {
        "id": "uuid",
        "event_type": "CLICK",
        "viewer_lat": 18.5204,
        "viewer_lng": 73.8567,
        "distance_meters": 2500,
        "created_at": "2026-04-02T10:30:00Z"
      }
    ],
    "meta": { "page": 1, "page_size": 20, "total_count": 87, "total_pages": 5 }
  }
}
```

---

# 17. PLATFORM STATS & DASHBOARD

---

## GET /api/stats

Returns aggregated platform statistics (public endpoint).

### Response 200

```json
{
  "success": true,
  "data": {
    "total_profiles": 12500,
    "total_connections": 45000,
    "total_rfps": 3200,
    "active_ads": 890,
    "verified_profiles": 8700
  }
}
```

---

## GET /api/profiles/featured

Returns featured profiles for the landing page. Curated by admin selection and DQS score.

### Query Params

- `limit` (default 10, max 20)
- `persona_type` (optional filter)

### Response 200

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "org_name": "ABC Infra",
        "persona_type": "CON",
        "city": "Pune",
        "state": "Maharashtra",
        "dqs_score": 0.92,
        "verification_status": "VERIFIED",
        "tagline": "Structural Engineering Excellence"
      }
    ]
  }
}
```

---

## GET /api/dashboard/metrics

Returns role-specific dashboard metrics for the authenticated user.

### Guards

- Caller must be authenticated.
- Metrics returned are scoped to caller's `persona_type`.

### Response 200

```json
{
  "success": true,
  "data": {
    "pending_connections": 3,
    "active_rfps": 2,
    "unread_notifications": 7,
    "handshake_credits_remaining": 27,
    "subscription_status": "active",
    "recent_connections": 12,
    "recent_rfp_responses": 5
  }
}
```

---

## GET /api/dashboard/activity

Returns recent activity feed for the authenticated user.

### Query Params

- `limit` (default 20, max 50)
- `type` (optional: `CONNECTION|RFP|AD|SUBSCRIPTION` — default all)

### Response 200

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "type": "CONNECTION_ACCEPTED",
        "title": "Connection accepted",
        "message": "ABC Infra accepted your connection request",
        "created_at": "2026-04-02T10:00:00Z",
        "entity_id": "uuid",
        "entity_type": "connection"
      }
    ]
  }
}
```

---

# 18. CONSULTANT SERVICES CRUD (CON Role)

---

## GET /api/services

List consultant services offered by the caller.

### Query Params

- `page` (default 1)
- `page_size` (default 20, max 50)

### Guards

- Caller must have `persona_type = 'CON'`.

### Response 200

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "Structural Design",
        "description": "Complete structural analysis and design",
        "category": "Structural Engineering",
        "starting_price": 50000.00,
        "is_active": true,
        "created_at": "2026-04-01T08:00:00Z"
      }
    ],
    "meta": { "page": 1, "page_size": 20, "total_count": 1, "total_pages": 1 }
  }
}
```

---

## POST /api/services

Create a new consultant service listing.

### Request

```json
{
  "title": "Structural Design",
  "description": "Complete structural analysis and design for residential and commercial buildings",
  "category": "Structural Engineering",
  "starting_price": 50000.00,
  "deliverables": ["Design drawings", "Structural calculations", "BOQ"]
}
```

### Guards

- Caller must have `persona_type = 'CON'`.
- Caller must not be `hard_locked`.

---

## PUT /api/services/:id

Update a consultant service listing.

### Guards

- Caller must own the service.

---

## DELETE /api/services/:id

Soft-delete a consultant service listing (`is_active = false`).

### Guards

- Caller must own the service.

---

# 19. PORTFOLIO CRUD

---

## GET /api/profiles/me/portfolio

List portfolio items for the authenticated user.

### Query Params

- `page` (default 1)
- `page_size` (default 20, max 50)

### Response 200

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "Metro Station Design",
        "description": "Structural design for elevated metro station",
        "category": "Infrastructure",
        "images": ["https://..."],
        "completion_year": 2024,
        "created_at": "2026-04-01T08:00:00Z"
      }
    ],
    "meta": { "page": 1, "page_size": 20, "total_count": 1, "total_pages": 1 }
  }
}
```

---

## POST /api/profiles/me/portfolio

Create a portfolio item.

### Request

```json
{
  "title": "Metro Station Design",
  "description": "Structural design for elevated metro station",
  "category": "Infrastructure",
  "images": ["https://..."],
  "completion_year": 2024
}
```

### Guards

- Caller must not be `hard_locked`.

---

## DELETE /api/profiles/me/portfolio/:id

Delete a portfolio item.

### Guards

- Caller must own the portfolio item.

---

# 20. SUBSCRIPTION MANAGEMENT

---

## GET /api/subscriptions/invoices

Returns payment history for the authenticated user.

### Query Params

- `page` (default 1)
- `page_size` (default 20, max 50)

### Response 200

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "subscription_id": "uuid",
        "amount": 99900,
        "currency": "INR",
        "status": "COMPLETED",
        "payment_method": "UPI",
        "transaction_id": "T260402100000",
        "created_at": "2026-04-01T10:00:00Z"
      }
    ],
    "meta": { "page": 1, "page_size": 20, "total_count": 1, "total_pages": 1 }
  }
}
```

---

# 21. CONNECTION DETAILS

---

## GET /api/connections/:id

Returns single connection detail including masked/unmasked contact info based on connection state.

### Guards

- Caller must be either party in the connection.

### Response 200

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "initiator_id": "uuid",
    "target_id": "uuid",
    "status": "ACCEPTED",
    "source": "DIRECT",
    "message": "Interested in collaboration",
    "contact_visible": true,
    "created_at": "2026-04-01T08:00:00Z",
    "updated_at": "2026-04-01T09:00:00Z",
    "other_party": {
      "id": "uuid",
      "org_name": "ABC Infra",
      "persona_type": "CON",
      "city": "Pune",
      "dqs_score": 0.85
    }
  }
}
```

---

# 22. USER ADS

---

## GET /api/ads/me

Returns ads owned by the current authenticated user.

### Query Params

- `status` (optional: `DRAFT|PENDING_PAYMENT|PENDING_MODERATION|ACTIVE|PAUSED|FLAGGED|SUSPENDED|EXPIRED`)
- `page` (default 1)
- `page_size` (default 20, max 50)

### Response 200

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "Hempcrete Blocks",
        "status": "ACTIVE",
        "impressions": 1250,
        "clicks": 87,
        "connects": 12,
        "created_at": "2026-04-01T08:00:00Z"
      }
    ],
    "meta": { "page": 1, "page_size": 20, "total_count": 1, "total_pages": 1 }
  }
}
```

---

# 23. GDPR & ACCOUNT MANAGEMENT

---

## GET /api/profiles/me/data-export

Export all user data for GDPR compliance (Right to Access).

### Response 200

```json
{
  "success": true,
  "data": {
    "export_id": "uuid",
    "status": "PROCESSING",
    "download_url": null,
    "expires_at": null,
    "requested_at": "2026-04-02T10:00:00Z"
  }
}
```

### Notes

- Export includes: profile data, connections, RFPs, responses, ads, notifications, audit logs.
- PII of other users is excluded (only caller's own data is exported).
- Download URL is generated when export is ready (async processing).

---

## DELETE /api/profiles/me

Request account deletion (GDPR Right to Erasure).

### Request

```json
{
  "reason": "string (optional)"
}
```

### Response 200

```json
{
  "success": true,
  "data": {
    "deletion_request_id": "uuid",
    "status": "PENDING_ADMIN_APPROVAL",
    "requested_at": "2026-04-02T10:00:00Z"
  }
}
```

### Guards

- Requires admin approval before execution (see `POST /api/admin/audit/purge/:id/approve`).
- All active subscriptions are cancelled.
- All active ads are paused.
- Row is preserved for audit; PII is hard-deleted upon approval.

---

# 24. PROJECTS (COMING SOON)

---

## GET /api/projects/me

Returns "Coming Soon" placeholder. Projects module is not available in Phase 1.

### Response 200

```json
{
  "success": true,
  "data": {
    "message": "Projects module coming soon in Phase 2",
    "available_in_phase": 2
  }
}
```

---

# 25. AD MODERATION FLOW

---

The ad lifecycle after payment follows this sequence:

```
PAYMENT_SUCCESS → PENDING_MODERATION → Sightengine scan → ACTIVE (pass) or FLAGGED (fail)
                                                                        ↓
                                                              Admin review → ACTIVE (cleared) or SUSPENDED (confirmed violation)
```

### State Transitions

| From | To | Trigger |
| --- | --- | --- |
| DRAFT | PENDING_PAYMENT | User initiates payment |
| PENDING_PAYMENT | PENDING_MODERATION | Payment succeeds |
| PENDING_MODERATION | ACTIVE | Sightengine scan passes |
| PENDING_MODERATION | FLAGGED | Sightengine scan fails |
| FLAGGED | ACTIVE | Admin clears ad |
| FLAGGED | SUSPENDED | Admin confirms violation |
| SUSPENDED | ACTIVE | Admin clears after refund/appeal |
| ACTIVE | PAUSED | User pauses ad |
| ACTIVE | EXPIRED | Ad duration expires |

---

# 16. GLOBAL STANDARDS

## 14.1 Pagination Standard

All list endpoints follow this envelope:

### Request Query Params

| Param | Type | Default | Max | Notes |
| --- | --- | --- | --- | --- |
| `page` | INT | 1 | — | 1-indexed page number |
| `page_size` | INT | 20 | 50 | Items per page |

### Response Envelope

```json
{
  "success": true,
  "data": {
    "items": [...],
    "meta": {
      "page": 1,
      "page_size": 20,
      "total_count": 142,
      "total_pages": 8
    }
  }
}
```

## 14.2 Error Code Registry

All errors use the `DOMAIN_ACTION_REASON` format.

### Identity Domain

| Code | HTTP Status | Meaning |
| --- | --- | --- |
| `IDENTITY_CREATE_DUPLICATE_PAN` | 409 | PAN already registered for this persona_type |
| `IDENTITY_VERIFY_INVALID_GSTIN` | 400 | GSTIN failed regex or external API check |
| `IDENTITY_VERIFY_DUPLICATE_GSTIN` | 409 | GSTIN already linked to another profile |
| `IDENTITY_GSTIN_CHANGE_PENDING` | 409 | GSTIN change request already in progress |

### Handshake Domain

| Code | HTTP Status | Meaning |
| --- | --- | --- |
| `HANDSHAKE_INITIATE_INSUFFICIENT_CREDITS` | 402 | No handshake credits remaining |
| `HANDSHAKE_INITIATE_SUBSCRIPTION_LOCKED` | 403 | Profile is hard_locked |
| `HANDSHAKE_INITIATE_SELF_CONNECT` | 400 | Cannot connect to own profile |
| `HANDSHAKE_INITIATE_ALREADY_CONNECTED` | 409 | Active connection already exists |
| `HANDSHAKE_INITIATE_BLOCKED_USER` | 403 | Target user is blocked |
| `HANDSHAKE_ACCEPT_NOT_TARGET` | 403 | Only the target can accept a handshake |

### RFP Domain

| Code | HTTP Status | Meaning |
| --- | --- | --- |
| `RFP_CREATE_INVALID_RADIUS` | 400 | Radius outside allowed range |
| `RFP_CREATE_NO_TARGET_PERSONAS` | 400 | At least one target persona required |
| `RFP_RESPOND_NOT_OPEN` | 400 | RFP is not in OPEN state |
| `RFP_RESPOND_DUPLICATE` | 409 | Already responded to this RFP |
| `RFP_RESPOND_RATE_LIMIT` | 429 | Max 5 responses per day exceeded |
| `RFP_CLOSE_NOT_OWNER` | 403 | Only the creator can close/cancel |

### Ads Domain

| Code | HTTP Status | Meaning |
| --- | --- | --- |
| `ADS_CREATE_SUBSCRIPTION_LOCKED` | 403 | Profile is hard_locked |
| `ADS_UPDATE_NOT_DRAFT` | 400 | Can only edit ads in DRAFT or PENDING_PAYMENT |
| `ADS_DELETE_ACTIVE` | 400 | Cannot delete active ads — use pause instead |
| `ADS_PAYMENT_RETRY_INVALID_STATE` | 400 | Ad not in DRAFT or PENDING_PAYMENT |

### Subscription Domain

| Code | HTTP Status | Meaning |
| --- | --- | --- |
| `SUBSCRIPTION_UPGRADE_ALREADY_ACTIVE` | 409 | Subscription already active |
| `SUBSCRIPTION_DOWNGRADE_NOT_ACTIVE` | 400 | Can only schedule downgrade on active subscription |

### Moderation Domain

| Code | HTTP Status | Meaning |
| --- | --- | --- |
| `MODERATION_NOT_ADMIN` | 403 | Caller is not a super_admin |
| `MODERATION_ALREADY_CLEARED` | 409 | Ad already cleared or not suspended |

### General

| Code | HTTP Status | Meaning |
| --- | --- | --- |
| `AUTH_MISSING` | 401 | No valid JWT |
| `AUTH_INSUFFICIENT_ROLE` | 403 | Caller lacks required role |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource does not exist |
| `VALIDATION_FAILED` | 400 | Request body failed schema validation |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests in time window |
| `INTERNAL_ERROR` | 500 | Unhandled server error |

---

# FINAL DIRECTIVE

This API layer is the primary client entry point into the system. Server-rendered components may call Supabase RPC directly using user JWTs. This supersedes the prior "only entry point" constraint while preserving RLS and state enforcement.

- All business logic must align with state machines
- All side effects must trigger events
- No endpoint may bypass privacy or state enforcement
