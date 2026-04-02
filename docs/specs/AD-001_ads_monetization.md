---
spec_id: AD-001
title: Ads Lifecycle and Geo Promotion
module: 7 (Payments and Ads)
phase: 3
status: GREY
witness_required: true
created: 2026-04-02
owner: @pm
depends_on: [MON-001, RM-001, HD-001]
---

# Spec AD-001: Ads Lifecycle and Geo Promotion

## Objective

Define ad creation, payment, activation, moderation, and renewal behavior for geo-targeted visibility.

## State Authority

- `DRAFT -> PENDING_PAYMENT -> ACTIVE -> PAUSED -> ACTIVE -> EXPIRED`
- `ACTIVE -> SUSPENDED -> ACTIVE` (moderation/admin path)
- `PAUSED -> ACTIVE` (creator resumes)
- Source of truth: `docs/system/STATE_MACHINES.md`

## Affected Tables

| Table | Operation | Notes |
| --- | --- | --- |
| `ads` | CREATE/READ/UPDATE/DELETE | Main ad lifecycle table |
| `ad_analytics` | INSERT/READ | Impression/click metrics |
| `notifications` | INSERT | Payment/moderation/ad expiry alerts |

## API Impact

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/ads` | POST | Create draft ad |
| `/api/ads/:id` | GET, PUT, DELETE | Read/update/delete ad |
| `/api/ads/:id/retry-payment` | POST | Restart payment flow |
| `/api/ads/:id/refund-request` | POST | Refund request for suspended ad |
| `/api/ads/:id/connect` | POST | Convert ad interaction into handshake request |

## Validation Rules

- Only ad owner can update/delete ad.
- ACTIVE ads must have successful payment proof.
- Moderation failure forces SUSPENDED state.

## Definition of Done

1. Ads CRUD contract exists and maps to lifecycle states.
2. Retry-payment and refund actions are constrained to valid states.
3. Ad-click connect flow uses handshake guards.
4. `// @witness [AD-001]` is present in implementation and tests.

## Test Coverage Required

- Unit: state guard validation per endpoint.
- Integration: payment success/failure state transitions.
- E2E: create ad -> pay -> active -> connect request.
