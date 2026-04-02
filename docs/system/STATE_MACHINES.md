---
title: State Machines
id: STATE_MACHINES
type: technical_specification
status: production_ready
version: 1.0
last_updated: 2026-03-31
owner: @pm
criticality: high
depends_on: [SOUL, SYSTEM, ARCHITECTURE, db_schema]
---

# BuonDesizn State Machines

This document defines all finite state machines (FSMs) governing the platform. These are the **authoritative state references** for:
- `@engineer` when implementing DB columns and transitions
- `@qa` when writing test specs for state coverage
- `@pm` during module sign-off (Architecture Gate)

Any new state or transition requires a PR updating this document first.

---

## 1. Handshake State Machine
_Spec: HD-001 | Tables: `connections`, `address_book`, `unmasking_audit`_

### States

| State | Description | PII Visible? | DB Value |
|-------|-------------|-------------|----------|
| `MASKED` | Default discovery state. No connection exists. | No | _(no connections row)_ |
| `REQUESTED` | Seeker has sent a connection request. | No | `REQUESTED` |
| `ACCEPTED` | Target accepted. PII unmasked permanently. | Yes | `ACCEPTED` |
| `REJECTED` | Target declined the request. | No | `REJECTED` |
| `EXPIRED` | 30 days passed with no response. Auto-set by cron. | No | `EXPIRED` |
| `BLOCKED` | Either party blocked the other. | No | `BLOCKED` |

### Transitions

```
[No Connection] ──(seeker sends request, costs 1 credit)──▶ REQUESTED
REQUESTED       ──(target accepts)──────────────────────▶ ACCEPTED  → triggers address_book insert + unmasking_audit
REQUESTED       ──(target declines)─────────────────────▶ REJECTED
REQUESTED       ──(30 days elapse, pg_cron)─────────────▶ EXPIRED
ACCEPTED        ──(either party blocks)─────────────────▶ BLOCKED   → address_book entry remains
REJECTED        ──(seeker re-initiates, costs 1 credit)─▶ REQUESTED
EXPIRED         ──(seeker re-initiates, costs 1 credit)─▶ REQUESTED
```

### Guards & Invariants

- **Credit Guard**: Transitioning to `REQUESTED` costs 1 `handshake_credits` from requester's profile. Reject if `handshake_credits < 1`.
- **Hard Lock Guard**: If `subscription_status = 'hard_locked'`, block all transitions to `REQUESTED`.
- **Immutable Audit**: Every `REQUESTED → ACCEPTED` transition MUST insert into `unmasking_audit`. No exceptions.
- **Company DNA Rule**: Accepting a handshake with any representative of a GSTIN unmasks ALL `company_personnel` rows sharing that GSTIN.
- **Address Book Permanence**: Accepted handshakes persist in `address_book` even if later BLOCKED. Unmasked contact info remains visible to seeker.

---

## 2. Subscription State Machine
_Spec: MON-001 | Tables: `subscriptions`, `profiles.subscription_status`_

### States

| State | Description | Can Initiate Handshake? | DB Value |
|-------|-------------|------------------------|----------|
| `trial` | 48-hour free trial. 30 credits granted. | Yes (limited) | `trial` |
| `active` | Paid "National Pro" subscription. 30 credits/month. | Yes | `active` |
| `expired` | Subscription lapsed. Features read-only. | No | `expired` |
| `hard_locked` | Trial H+49 elapsed without payment. Full lock. | No | `hard_locked` |

### Transitions

```
[New Registration] ──(auto at signup)────────────────▶ trial (H+0, 30 credits added)
trial              ──(PhonePe payment success)────────▶ active
trial              ──(H+49 elapsed, QStash job)───────▶ hard_locked
active             ──(monthly renewal success)────────▶ active (30 credits reset)
active             ──(payment fails / cancels)────────▶ expired
expired            ──(PhonePe payment success)────────▶ active
hard_locked        ──(PhonePe payment success)────────▶ active (hard lock lifted)
```

### Guards & Invariants

- **Trial Timer**: `trial_started_at` set at registration. QStash job must fire at `trial_started_at + 49 hours` to set `hard_locked`.
- **Credit Reset**: On every `active` renewal, `handshake_credits` reset to 30 and `last_credit_reset_at` updated.
- **Hard Lock**: `hard_locked` blocks: discovery search, handshake initiation, RFP creation, ad placement. Profile remains visible to others.
- **Grace**: `expired` users retain read access to `address_book` but cannot initiate new handshakes.

---

## 3. RFP State Machine
_Spec: RFP-001 | Tables: `rfps`, `rfp_responses`_

### RFP States

| State | Description | DB Value |
|-------|-------------|----------|
| `DRAFT` | Saved but not published. Visible only to creator. | `DRAFT` |
| `OPEN` | Broadcast to matched professionals. Active. | `OPEN` |
| `CLOSED` | Creator manually closed. No new responses. | `CLOSED` |
| `EXPIRED` | Past deadline date. Auto-set by cron. | `EXPIRED` |
| `CANCELLED` | Creator cancelled before closing. | `CANCELLED` |

### RFP Transitions

```
[Creator drafts] ──(save)────────────────────────────▶ DRAFT
DRAFT            ──(creator publishes)────────────────▶ OPEN  → broadcast to matched profiles within radius
OPEN             ──(deadline passes, pg_cron)──────────▶ EXPIRED
OPEN             ──(creator closes)───────────────────▶ CLOSED
OPEN             ──(creator cancels)──────────────────▶ CANCELLED
DRAFT            ──(creator cancels)──────────────────▶ CANCELLED
```

### RFP Response States

| State | DB Value | Meaning |
|-------|----------|---------|
| `SUBMITTED` | `SUBMITTED` | Response sent by professional |
| `SHORTLISTED` | `SHORTLISTED` | Creator shortlisted this response |
| `ACCEPTED` | `ACCEPTED` | Creator accepted — triggers connection offer |
| `REJECTED` | `REJECTED` | Creator rejected |

### Guards & Invariants

- **GSTIN Guard**: RFP creator must have verified GSTIN before broadcasting.
- **Broadcast Radius**: Capped at `rfp_broadcast_radius` table value. Server-side enforcement only.
- **Response Window**: Responses only allowed while RFP is `OPEN`.
- **Single Response Rule**: One profile can submit only one response per RFP.

---

## 4. User Registration & Verification State Machine
_Spec: ID-001 | Tables: `profiles`_

### States

| State | Description |
|-------|-------------|
| `PENDING_VERIFICATION` | Account created, validation not yet started. |
| `PENDING_ADMIN` | Automated GSTIN/PAN API check passed; waiting for Admin approval. |
| `VERIFIED` | Admin approved; full marketplace access granted. |
| `REJECTED` | Verification failed (duplicate PAN, invalid GSTIN, or Admin rejection). |
| `SUSPENDED` | Admin action — account suspended. |

### Transitions

```
[Signup] ─────(complete profile)───────────────────────▶ PENDING_VERIFICATION
PENDING_VERIF ──(GSTIN API lookup passes)─────────────▶ PENDING_ADMIN
PENDING_ADMIN ──(SUPER_ADMIN approves in settings)─────▶ VERIFIED
PENDING_VERIF ──(Invalid GSTIN / Duplicate PAN)───────▶ REJECTED
PENDING_ADMIN ──(SUPER_ADMIN rejects docs)────────────▶ REJECTED
VERIFIED ─────(Admin suspension)──────────────────────▶ SUSPENDED
SUSPENDED ────(Admin reinstatement)───────────────────▶ VERIFIED
```

---

## 5. Advertisement State Machine
_Spec: AD-001 | Tables: `ads`_

### States

| State | DB Value | Description |
|-------|----------|-------------|
| `DRAFT` | `DRAFT` | Created but not paid |
| `PENDING_PAYMENT` | `PENDING_PAYMENT` | PhonePe payment initiated |
| `PENDING_MODERATION` | `PENDING_MODERATION` | Awaiting Sightengine scan |
| `ACTIVE` | `ACTIVE` | Payment confirmed, ad live |
| `PAUSED` | `PAUSED` | Creator paused ad (can be resumed) |
| `EXPIRED` | `EXPIRED` | Ad duration elapsed |
| `SUSPENDED` | `SUSPENDED` | Content moderation flag or admin action |

### Transitions

```
[Creator submits ad] ──────────────────────────────▶ DRAFT
DRAFT               ──(initiates PhonePe payment)──▶ PENDING_PAYMENT
PENDING_PAYMENT     ──(PhonePe webhook: success)───▶ ACTIVE
PENDING_PAYMENT     ──(PhonePe webhook: failed)────▶ DRAFT
ACTIVE              ──(creator pauses)─────────────▶ PAUSED
PAUSED              ──(creator resumes)────────────▶ ACTIVE
ACTIVE              ──(duration ends, pg_cron)─────▶ EXPIRED
ACTIVE              ──(Sightengine flags content)──▶ SUSPENDED
SUSPENDED           ──(admin clears flag)───────────▶ ACTIVE
EXPIRED             ──(creator renews + pays)───────▶ ACTIVE
```

---

## Cross-Machine Interactions

| Trigger | Source Machine | Effect on Target |
|---------|---------------|-----------------|
| Handshake ACCEPTED | Handshake | DQS recalculated for both parties |
| Subscription HARD_LOCKED | Subscription | Blocks Handshake REQUESTED transition |
| RFP Response ACCEPTED | RFP | Triggers Handshake REQUESTED (at no credit cost) |
| Ad PENDING_PAYMENT | Advertisement | QStash job scheduled for expiry |
| Trial H+49 elapsed | Subscription | Blocks all active features |
| Handshake REQUESTED | Handshake | Credits decremented on requester's profile |

---

## 6. DQS Recalculation Contract
_Spec: RM-001 | Table: `profiles` | Runtime: pg_cron_

### Trigger

- Daily at `02:00 UTC` via `dqs-daily-recalc` cron job.

### Formula

```
dqs_score = (0.4 * dqs_responsiveness)
          + (0.3 * dqs_trust_loops)
          + (0.2 * dqs_verification)
          + (0.1 * dqs_profile_depth)
```

### Invariants

- Result must be clamped between `0.0` and `1.0`.
- Only non-deleted profiles are recalculated.
- Discovery ranking consumes the latest persisted `profiles.dqs_score`.
