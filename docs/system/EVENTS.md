---
id: EVENTS
layer: behavior

type: executable
owner: system
mutable: false
criticality: high

depends_on:
    - db_schema
    - STATE_MACHINES

consumes:
    - state_changes

provides:
    - event_definitions
    - triggers

validates:
    - event_consistency

runtime:
    triggers:
        - on_state_transition
    outputs_to:
        - ORCHESTRATION
        - AGENTS

version: 1.0
---

# EVENTS.md — System Event Definitions

## Purpose

Defines all system events used for orchestration, queues, and agent triggering.

Derived strictly from:

- ARCHITECTURE.md flows
- business_logic_edge_cases.md
- db_schema.md triggers

---

## Event Structure

Each event must include:

- event_name
- trigger_source
- payload
- downstream_agents

---

# 1. CORE EVENTS

---

## USER_REGISTERED

Triggered when a new profile is created

---

## PROFILE_VERIFICATION_SUBMITTED

Triggered when user submits verification request

---

## PROFILE_VERIFIED

Triggered when verification is approved

---

## PROFILE_REJECTED

Triggered when verification is rejected

---

# 2. CONNECTION EVENTS

---

## CONNECTION_REQUESTED

### Trigger

- POST /api/connections
- POST /api/ads/:id/connect

---

## CONNECTION_ACCEPTED

### Trigger

- PATCH /api/connections/:id/accept

### Effects

- contact becomes fully visible (email + phone)
- unmasking audit entries created
- entry created in `address_book` (Address Book Persistence)

---

## SUBSCRIPTION_TRIAL_STARTED

### Trigger
- User registration

### Behavior
- 48-hour countdown starts (QStash/Cron)
- Full India access enabled

---

## SUBSCRIPTION_TRIAL_EXPIRED

### Trigger
- 48 hours post-registration

### Behavior
- Dashboard access locked
- Profile/Payment remains accessible

---

## SUBSCRIPTION_ACTIVATED

### Trigger
- Successful PhonePe payment

### Behavior
- Full access restored
- 30 handshake credits added/reset

---

## HANDSHAKE_CREDITS_RESET

### Trigger
- Monthly billing cycle start

### Behavior
- Reset `handshake_credits` to 30

---

## DQS_RECALCULATED

### Trigger
- Daily cron (2 AM)

### Behavior
- All profiles' `dqs_score` updated based on weighted formula

---

## ADDRESS_BOOK_UPDATED

### Trigger
- CONNECTION_ACCEPTED
- RFP_RESPONSE_ACCEPTED

### Behavior
- Permanent entry added to `address_book` table

### Trigger

- PATCH /api/connections/:id/reject

---

## CONNECTION_EXPIRED

### Trigger

- system expiry (30 days)

---

## CONNECTION_BLOCKED

### Trigger

- block action (via connections table, status = 'BLOCKED')

---

# 3. RFP EVENTS

---

## RFP_CREATED

### Trigger

- POST /api/rfps

### Behavior

- RFP becomes OPEN immediately
- notifications sent to users within radius

---

## RFP_RESPONSE_SUBMITTED

### Trigger

- POST /api/rfps/:id/respond

---

## RFP_RESPONSE_ACCEPTED

### Trigger

- accept_rfp_response()

### Effects

- connection created
- contact unmasked
- audit logs created

---

## RFP_CLOSED

### Trigger

- PATCH /api/rfps/:id/close

### Effects

- pending responses → REJECTED
- notifications sent

---

## RFP_CANCELLED

### Trigger

- PATCH /api/rfps/:id/cancel

### Effects

- pending responses → REJECTED
- notifications sent

---

## RFP_EXPIRED

### Trigger

- system expiry

---

# 4. PRIVACY EVENTS

---

## UNMASKING_TRIGGERED

### Trigger

- CONNECTION_ACCEPTED
- RFP_RESPONSE_ACCEPTED

### Effects

- unmasking_audit entries created
- full contact visibility enabled

---

# 5. DISCOVERY EVENTS

---

## SEARCH_EXECUTED

### Trigger

- GET /api/search/profiles

---

## ADS_FETCHED

### Trigger

- GET /api/search/ads

---

# 6. ADS EVENTS

---

## AD_CREATED

### Trigger

- ad creation (DRAFT)

---

## AD_PAYMENT_INITIATED

### Trigger

- payment start

---

## AD_ACTIVATED

### Trigger

- successful payment

---

## AD_EXPIRED

### Trigger

- time-based expiry

---

## AD_SUSPENDED

### Trigger

- admin action or verification downgrade

---

# 7. SYSTEM EVENTS

---

## RATE_LIMIT_EXCEEDED

### Trigger

- RFP response limit
- connection request restriction

---

## BLOCK_RULE_TRIGGERED

### Trigger

- blocked user interaction attempt

---

# 8. QUEUE MAPPING

---

## rfp_queue

- RFP_CREATED
- RFP_RESPONSE_SUBMITTED
- RFP_RESPONSE_ACCEPTED
- RFP_CLOSED
- RFP_CANCELLED
- RFP_EXPIRED

---

## connection_queue

- CONNECTION_REQUESTED
- CONNECTION_ACCEPTED
- CONNECTION_REJECTED
- CONNECTION_BLOCKED
- CONNECTION_EXPIRED

---

## compliance_queue

- PROFILE_VERIFICATION_SUBMITTED
- PROFILE_VERIFIED
- PROFILE_REJECTED

---

## ads_queue

- AD_CREATED
- AD_PAYMENT_INITIATED
- AD_ACTIVATED
- AD_EXPIRED
- AD_SUSPENDED

---

# GLOBAL RULES

- Every state change must emit an event
- Events must be the trigger for orchestration
- No direct state mutation without event emission
- All privacy-related events must trigger audit logging

---

# 9. QSTASH JOB SPECIFICATIONS

QStash is used for all async, delayed, and retryable jobs. Events are emitted from API routes or Postgres triggers via the QStash REST API. Each job has a defined payload shape, handler URL, retry policy, and timeout.

## Global QStash Config
```
Base URL:      https://qstash.upstash.io/v2/publish/<handler-url>
Authorization: Bearer $QSTASH_TOKEN
Retry policy:  3 retries, exponential backoff (1s, 4s, 16s)
Dead letter:   Log to Sentry after final retry failure
```

Handler URLs are Next.js API routes at `/api/jobs/<event-name>`.

---

## CONNECTION_ACCEPTED

**Handler**: `POST /api/jobs/connection-accepted`
**Emitted by**: `PATCH /api/connections/:id` when status transitions to `ACCEPTED`
**Queue**: `connection_queue`

```json
{
  "event": "CONNECTION_ACCEPTED",
  "connection_id": "uuid",
  "requester_id": "uuid",
  "target_id": "uuid",
  "accepted_at": "2026-03-31T10:00:00Z"
}
```

**Handler responsibilities**:
1. Call `accept_handshake()` RPC (atomic: connections + address_book + unmasking_audit)
2. Emit `DQS_RECALCULATED` for both parties (responsiveness score update)
3. Send in-app notification to requester

---

## CONNECTION_REJECTED

**Handler**: `POST /api/jobs/connection-rejected`
**Emitted by**: `PATCH /api/connections/:id/reject` when status transitions to `REJECTED`
**Queue**: `connection_queue`

```json
{
  "event": "CONNECTION_REJECTED",
  "connection_id": "uuid",
  "requester_id": "uuid",
  "target_id": "uuid",
  "rejected_at": "2026-03-31T10:00:00Z"
}
```

**Handler responsibilities**:
1. Update `connections.status = 'REJECTED'`
2. Send notification to requester (connection declined)
3. Emit `DQS_RECALCULATED` for target (responsiveness score update)

---

## CONNECTION_BLOCKED

**Handler**: `POST /api/jobs/connection-blocked`
**Emitted by**: `POST /api/connections/block` when user blocks another
**Queue**: `connection_queue`

```json
{
  "event": "CONNECTION_BLOCKED",
  "connection_id": "uuid",
  "blocker_id": "uuid",
  "blocked_id": "uuid",
  "blocked_at": "2026-03-31T10:00:00Z"
}
```

**Handler responsibilities**:
1. Update `connections.status = 'BLOCKED'`
2. Remove any pending notifications between the two parties
3. No credit refund — block is independent of handshake economy

---

## CONNECTION_EXPIRED

**Handler**: `POST /api/jobs/connection-expired`
**Emitted by**: pg_cron job, daily at 3 AM UTC — finds REQUESTED connections older than 30 days
**Queue**: `connection_queue`

```json
{
  "event": "CONNECTION_EXPIRED",
  "connection_id": "uuid",
  "requester_id": "uuid",
  "target_id": "uuid",
  "expired_at": "2026-03-31T03:00:00Z"
}
```

**Handler responsibilities**:
1. `UPDATE connections SET status='EXPIRED'`
2. Send notification to requester (connection request expired)

---

## SUBSCRIPTION_TRIAL_STARTED

**Handler**: `POST /api/jobs/trial-started`
**Emitted by**: `POST /api/profiles` (registration) immediately after profile creation
**Queue**: `compliance_queue`
**Delay**: 0 seconds (immediate), but schedules a delayed job for hard lock

```json
{
  "event": "SUBSCRIPTION_TRIAL_STARTED",
  "profile_id": "uuid",
  "trial_started_at": "2026-03-31T10:00:00Z",
  "hard_lock_at": "2026-04-02T10:00:00Z"
}
```

**Handler responsibilities**:
1. Schedule a delayed QStash job: `SUBSCRIPTION_TRIAL_EXPIRED` to fire at `hard_lock_at` (H+49)
2. Set `profiles.subscription_status = 'trial'`, `trial_started_at = NOW()`
3. Grant 30 `handshake_credits`

---

## SUBSCRIPTION_TRIAL_EXPIRED

**Handler**: `POST /api/jobs/trial-expired`
**Emitted by**: Delayed QStash job scheduled by `SUBSCRIPTION_TRIAL_STARTED`
**Queue**: `compliance_queue`
**Delay**: 49 hours from trial start (scheduled at registration)

```json
{
  "event": "SUBSCRIPTION_TRIAL_EXPIRED",
  "profile_id": "uuid",
  "locked_at": "2026-04-02T10:00:00Z"
}
```

**Handler responsibilities**:
1. If `subscription_status` is still `trial`: set to `hard_locked`
2. If already `active` (paid): no-op (user paid before expiry)
3. Revoke active sessions (force re-login to show lock screen)

---

## SUBSCRIPTION_ACTIVATED

**Handler**: `POST /api/jobs/subscription-activated`
**Emitted by**: PhonePe webhook `POST /api/webhooks/phonepe` on successful payment
**Queue**: `compliance_queue`

```json
{
  "event": "SUBSCRIPTION_ACTIVATED",
  "profile_id": "uuid",
  "phonepe_order_id": "string",
  "phonepe_transaction_id": "string",
  "plan_name": "national_pro",
  "activated_at": "2026-03-31T10:00:00Z",
  "expires_at": "2026-04-30T10:00:00Z"
}
```

**Handler responsibilities**:
1. Set `profiles.subscription_status = 'active'`
2. Reset `handshake_credits = 30`, `last_credit_reset_at = NOW()`
3. If was `hard_locked`: lift lock, restore session
4. Insert row into `subscriptions` table
5. Schedule `HANDSHAKE_CREDITS_RESET` 30 days out

---

## HANDSHAKE_CREDITS_RESET

**Handler**: `POST /api/jobs/credits-reset`
**Emitted by**: Delayed QStash job scheduled by `SUBSCRIPTION_ACTIVATED`
**Queue**: `compliance_queue`

```json
{
  "event": "HANDSHAKE_CREDITS_RESET",
  "profile_id": "uuid",
  "reset_at": "2026-04-30T10:00:00Z"
}
```

**Handler responsibilities**:
1. If `subscription_status = 'active'`: set `handshake_credits = 30`, `last_credit_reset_at = NOW()`
2. Schedule next reset 30 days out
3. If `subscription_status != 'active'`: do not reset (subscription lapsed)

---

## DQS_RECALCULATED

**Handler**: `POST /api/jobs/dqs-recalculate`
**Emitted by**: pg_cron daily at 2 AM UTC (batch for all profiles), OR immediately after CONNECTION_ACCEPTED (for two parties)
**Queue**: `compliance_queue`

```json
{
  "event": "DQS_RECALCULATED",
  "profile_id": "uuid",
  "triggered_by": "cron | connection_accepted | profile_updated",
  "recalculated_at": "2026-03-31T02:00:00Z"
}
```

**Handler responsibilities**:
1. Compute DQS sub-scores from live data:
   - Responsiveness (40%): avg time from CONNECTION_REQUESTED to ACCEPTED/REJECTED
   - Trust Loops (30%): count of distinct ACCEPTED connections
   - Verification (20%): `1.0` if GSTIN verified + admin approved, else `0.5`
   - Profile Depth (10%): completeness fraction of optional fields
2. Write new `dqs_score` and sub-scores to `profiles`
3. Formula: `dqs = 0.4*responsiveness + 0.3*trust + 0.2*verification + 0.1*depth`

---

## AD_ACTIVATED

**Handler**: `POST /api/jobs/ad-activated`
**Emitted by**: PhonePe webhook on ad payment success
**Queue**: `ads_queue`

```json
{
  "event": "AD_ACTIVATED",
  "ad_id": "uuid",
  "profile_id": "uuid",
  "phonepe_transaction_id": "string",
  "activated_at": "2026-03-31T10:00:00Z",
  "expires_at": "2026-04-30T10:00:00Z"
}
```

**Handler responsibilities**:
1. Set `ads.status = 'ACTIVE'`
2. Run Sightengine content moderation on ad image/URL
3. Schedule `AD_EXPIRED` job at `expires_at`
4. If Sightengine flags content: emit `AD_SUSPENDED` instead

---

## Emission Pattern (from API Routes)

```typescript
// @witness [SPEC-ID]
// How to emit a QStash event from an API route

async function emitEvent(event: object, handlerPath: string, delaySeconds?: number) {
  const url = `https://qstash.upstash.io/v2/publish/${process.env.NEXT_PUBLIC_APP_URL}${handlerPath}`
  await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.QSTASH_TOKEN}`,
      'Content-Type': 'application/json',
      ...(delaySeconds ? { 'Upstash-Delay': `${delaySeconds}s` } : {}),
    },
    body: JSON.stringify(event),
  })
}

// Example: emit CONNECTION_ACCEPTED after DB update
await emitEvent(
  { event: 'CONNECTION_ACCEPTED', connection_id: id, requester_id, target_id, accepted_at: new Date().toISOString() },
  '/api/jobs/connection-accepted'
)
```

## Handler Signature (all job handlers)

```typescript
// @witness [SPEC-ID]
// app/api/jobs/connection-accepted/route.ts
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs'

export const POST = verifySignatureAppRouter(async (req: Request) => {
  const payload = await req.json()
  // ... handler logic
  return new Response('OK', { status: 200 })
})
```

`verifySignatureAppRouter` validates the QStash signature using `QSTASH_CURRENT_SIGNING_KEY` and `QSTASH_NEXT_SIGNING_KEY` from `.env.local`. Never skip this — it prevents spoofed job execution.

---

# FINAL DIRECTIVE

Events are the trigger layer of the system.

- APIs generate events
- Orchestration consumes events
- Agents act on events

No system behavior should bypass event emission.

EVENT → AGENT RESPONSIBILITY

CONNECTION_REQUESTED → handshake-privacy-specialist CONNECTION_ACCEPTED →
handshake-privacy-specialist + security-audit-specialist

RFP_CREATED → discovery-proximity-specialist RFP_RESPONSE_SUBMITTED →
rfp-workflow-specialist RFP_RESPONSE_ACCEPTED → rfp-workflow-specialist

PROFILE_VERIFIED → identity-persona-specialist AD_ACTIVATED →
phonepe-payments-specialist
