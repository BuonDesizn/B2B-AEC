---
spec_id: MOD-001
title: Moderation — Ad Content Safety Workflow
module: 5 (Safety/NLP)
phase: 3
status: GREY
witness_required: true
created: 2026-04-02
owner: @pm
depends_on: [AD-001]
---

# Spec MOD-001: Moderation — Ad Content Safety Workflow

## Objective

Define the Sightengine-powered content moderation pipeline for ads. When an ad is created or updated, its image and URL are scanned. If flagged, the ad is auto-suspended pending admin review.

**Scope: Ads only.** Profile images and RFP attachments are out of scope for Phase 1/2.

## Affected Tables

| Table | Operation | Notes |
| --- | --- | --- |
| `ads` | UPDATE | `moderation_status` field transitions |
| `ads` | READ | Admin review queue filters by moderation status |
| `system_audit_log` | INSERT | Moderation actions logged for compliance |

## Moderation States

| State | DB Value | Description |
| --- | --- | --- |
| `PENDING` | `PENDING` | Awaiting Sightengine scan (new or updated ad) |
| `APPROVED` | `APPROVED` | Passed moderation, ad is live or can go live |
| `FLAGGED` | `FLAGGED` | Sightengine detected potential violation |
| `SUSPENDED` | `SUSPENDED` | Admin confirmed violation — ad hidden from discovery |
| `CLEARED` | `CLEARED` | Admin reviewed and cleared — ad restored to ACTIVE |

## State Transitions

```
[Ad created/updated] ──(Sightengine scan queued)────────▶ PENDING
PENDING              ──(Sightengine: clean)──────────────▶ APPROVED
PENDING              ──(Sightengine: flagged)────────────▶ FLAGGED
FLAGGED              ──(auto)────────────────────────────▶ SUSPENDED
SUSPENDED            ──(admin: clear)────────────────────▶ CLEARED → ACTIVE
SUSPENDED            ──(admin: reject)───────────────────▶ SUSPENDED (permanent)
```

## Moderation Workflow

1. **On ad create/update**: Ad enters `PENDING` state.
2. **Sightengine scan**: Image URL + target URL sent to Sightengine API.
3. **Clean result**: `moderation_status → APPROVED`. If payment is complete, ad goes `ACTIVE`.
4. **Flagged result**: `moderation_status → FLAGGED → SUSPENDED`. Ad hidden from search and discovery.
5. **Admin review**: Admin sees flagged ads in moderation queue. Can:
   - **Clear**: Restores ad to `ACTIVE` (if payment valid).
   - **Reject**: Keeps ad `SUSPENDED`. Refund flow triggered if ad was paid.
6. **Notification**: Creator notified of suspension or clearance.

## API Impact

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/moderation/queue` | GET | Admin-only: list flagged/suspended ads |
| `/api/moderation/:ad_id/clear` | POST | Admin clears ad, restores to ACTIVE |
| `/api/moderation/:ad_id/reject` | POST | Admin rejects, keeps SUSPENDED |
| `/api/ads/:id/refund-request` | POST | Creator requests refund for suspended ad (already in API_CONTRACT) |

## Validation Rules

- Sightengine scan is async — ad stays `PENDING` until scan completes.
- Only `SUPER_ADMIN` role can access moderation endpoints.
- One refund request per suspended ad.
- Cleared ads that were previously paid resume `ACTIVE` without re-payment.

## Definition of Done (DoD)

1. Ad creation triggers Sightengine scan automatically.
2. Flagged ads are hidden from discovery immediately.
3. Admin moderation queue surfaces all flagged/suspended ads.
4. Clear/reject actions update state and notify creator.
5. `// @witness [MOD-001]` present in all implementation files.

## Test Coverage Required

- Unit: State transition guards (PENDING → APPROVED/FLAGGED, FLAGGED → SUSPENDED).
- Unit: Admin role enforcement on moderation endpoints.
- Integration: Sightengine mock → ad state transitions correctly.
- E2E: Create ad → flagged → suspended → admin clears → ad goes live.
