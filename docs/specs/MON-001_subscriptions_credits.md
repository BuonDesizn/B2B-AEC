---
spec_id: MON-001
title: Subscription Lifecycle and Handshake Credits
module: 7 (Payments and Ads)
phase: 3
status: GREY
witness_required: true
created: 2026-04-02
owner: @pm
depends_on: [HD-001]
---

# Spec MON-001: Subscription Lifecycle and Handshake Credits

## Objective

Define subscription state transitions, trial lock behavior, monthly credit resets, and payment-driven access recovery.

## State Authority

- `trial -> active`
- `trial -> hard_locked` at H+49 without payment
- `active -> expired` on failed renewal/cancellation
- `expired/hard_locked -> active` on successful payment
- Source: `docs/system/STATE_MACHINES.md`

## Affected Tables

| Table | Operation | Notes |
| --- | --- | --- |
| `subscriptions` | CREATE/READ/UPDATE | Billing lifecycle records |
| `profiles` | UPDATE | `subscription_status`, `handshake_credits`, reset timestamp |
| `notifications` | INSERT | Trial ending, payment success/failure alerts |

## API Impact

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/subscriptions/upgrade` | POST | Initiate PhonePe payment |
| `/api/subscriptions/schedule-downgrade` | POST | Mark non-renewal |
| `/api/profile/rate-limits` | GET | Return credits + reset metadata |

## Validation Rules

- `hard_locked` blocks handshake initiation and marketplace actions.
- Credit deduction occurs only on handshake REQUESTED, never on ACCEPTED.
- Renewal resets credits to 30.

## Definition of Done

1. Subscription statuses and transitions are contract-aligned with state machine values.
2. Trial lock and recovery flows are fully specified with event expectations.
3. Credits and reset metadata are queryable through API contract.
4. `// @witness [MON-001]` is present in implementation and tests.

## Test Coverage Required

- Unit: transition guards by status.
- Integration: payment callbacks update status and credits.
- E2E: trial user -> hard lock -> payment -> active restoration.
