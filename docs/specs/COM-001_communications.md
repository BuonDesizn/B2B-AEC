---
spec_id: COM-001
title: Communications — In-App Notifications and Inbox Orchestration
module: 4 (Communications)
phase: 2
status: GREY
witness_required: true
created: 2026-04-02
owner: @pm
depends_on: [HD-001, RFP-001, AD-001, MON-001]
---

# Spec COM-001: Communications — In-App Notifications and Inbox

## Objective

Define the notification system that surfaces marketplace events to users through an in-app inbox with read/unread state, delivery channel preferences, and event-driven creation.

This spec covers **in-app notifications only**. Real-time chat/messaging is out of scope for Phase 1/2.

## Affected Tables

| Table | Operation | Notes |
| --- | --- | --- |
| `notifications` | CREATE/READ/UPDATE | Inbox entries triggered by system events |
| `notification_preferences` | READ/UPDATE | Per-user channel toggles |
| `email_queue` | CREATE/READ | Fallback email delivery when in-app not read |

## Event-to-Notification Mapping

| System Event | Notification Type | Title Template | Target Recipient(s) |
| --- | --- | --- | --- |
| `CONNECTION_REQUESTED` | `CONNECTION_REQUESTED` | "New connection request" | Target profile |
| `CONNECTION_ACCEPTED` | `CONNECTION_ACCEPTED` | "Your handshake was accepted" | Requester |
| `CONNECTION_REJECTED` | `CONNECTION_REJECTED` | "Connection request declined" | Requester |
| `CONNECTION_BLOCKED` | `CONNECTION_BLOCKED` | "User blocked" | Target profile |
| `CONNECTION_EXPIRED` | `CONNECTION_EXPIRED` | "Connection request expired" | Requester |
| `RFP_CREATED` | `RFP_CREATED` | "RFP published successfully" | RFP creator |
| `RFP_RESPONSE_SUBMITTED` | `RFP_RESPONSE` | "New response to your RFP" | RFP creator |
| `RFP_RESPONSE_ACCEPTED` | `RFP_RESPONSE_ACCEPTED` | "Your RFP response was accepted" | Responder |
| `RFP_NEARBY` | `RFP_NEARBY` | "New RFP near your location" | Matched professionals |
| `RFP_CLOSED` / `RFP_CANCELLED` | `RFP_CLOSED` | "RFP has been closed" | All responders |
| `AD_PAYMENT_SUCCESS` | `AD_APPROVED` | "Your ad is now live" | Ad creator |
| `AD_SUSPENDED` | `AD_SUSPENDED` | "Your ad was flagged for review" | Ad creator |
| `SUBSCRIPTION_EXPIRING` | `SUBSCRIPTION_EXPIRING` | "Subscription expiring soon" | Profile owner |
| `SUBSCRIPTION_ACTIVATED` | `PAYMENT_SUCCESS` | "Payment confirmed" | Profile owner |
| `SUBSCRIPTION_EXPIRED` | `PAYMENT_FAILED` | "Subscription renewal failed" | Profile owner |

## API Impact

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/notifications` | GET | List inbox notifications with pagination |
| `/api/notifications/:id/read` | PATCH | Mark single notification as read |
| `/api/notifications/read-all` | PATCH | Mark all notifications as read |
| `/api/notifications/preferences` | GET/PATCH | Read/update notification channel preferences |

## Validation Rules

- Notifications are paginated: offset-based, default 20, max 50.
- Unread notifications appear first in list (sorted by `created_at DESC`).
- `read-all` marks all unread notifications for the caller as read in one operation.
- Email/SMS fallback is triggered only if user has those channels enabled in preferences.

## State Machine Impact

- Notifications are created as side effects of state transitions in Handshake, RFP, Ads, and Subscription machines.
- No independent state machine — notifications are append-only with read/unread toggle.

## Guardrail Checks

- [ ] `check_handshake_privacy.md`: No PII exposed in notification payloads
- [ ] `check_proximity_logic.md`: Not applicable
- [ ] `check_company_dna.md`: Not applicable

## Definition of Done (DoD)

1. Every system event listed in the mapping table creates a notification row.
2. Inbox lists unread-first, paginated, with correct title/message templates.
3. Mark-as-read updates `is_read` and `read_at` timestamp.
4. Preferences endpoint toggles `receive_email_notifications`, `receive_sms_notifications`, and per-type toggles.
5. `// @witness [COM-001]` present in all implementation files.

## Test Coverage Required

- Unit: Notification creation for each event type with correct recipient resolution.
- Unit: Read/unread state transitions.
- Unit: Preferences validation (boolean fields only).
- Integration: Event → notification pipeline on local Supabase.
- E2E: User receives notification after handshake request → marks as read → inbox reflects state.
