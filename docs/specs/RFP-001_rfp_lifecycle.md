---
spec_id: RFP-001
title: RFP Lifecycle and Response Workflow
module: 8 (RFP Lifecycle)
phase: 2
status: GREY
witness_required: true
created: 2026-04-02
owner: @pm
depends_on: [RM-001, HD-001]
---

# Spec RFP-001: RFP Lifecycle and Response Workflow

## Objective

Define the end-to-end RFP publishing, response, and acceptance flow, including geospatial broadcast and handshake transition rules.

## State Authority

- RFP states: `DRAFT -> OPEN -> CLOSED/EXPIRED/CANCELLED`
- Response states: `SUBMITTED -> SHORTLISTED -> ACCEPTED/REJECTED`
- Source of truth: `docs/system/STATE_MACHINES.md`

## Affected Tables

| Table | Operation | Notes |
| --- | --- | --- |
| `rfps` | CREATE/READ/UPDATE | Lifecycle status and target personas |
| `rfp_responses` | CREATE/READ/UPDATE | One response per profile per RFP |
| `notifications` | INSERT | Broadcast + lifecycle updates |
| `connections` | INSERT | Created on accepted response (no credit deduction) |

## API Impact

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/rfps` | POST, GET | Create and list my RFPs |
| `/api/rfps/browse` | GET | Browse OPEN RFPs |
| `/api/rfps/:id` | GET | Read one RFP |
| `/api/rfps/:id/respond` | POST | Submit response |
| `/api/rfps/:id/close` | PATCH | Close RFP |
| `/api/rfps/:id/cancel` | PATCH | Cancel RFP |
| `/api/rfps/:id/responses/:responseId/accept` | POST | Accept response and create connection offer |

## Validation Rules

- Broadcast radius must be server-capped.
- Only OPEN RFPs accept responses.
- One response per user per RFP.
- Creator-only close/cancel actions.

## Definition of Done

1. API contract is fully aligned with OPEN/CLOSED/CANCELLED state names.
2. RFP listing endpoints for my RFPs and browse are contract-defined.
3. Accepting a response emits event and creates handshake offer.
4. `// @witness [RFP-001]` is present in implementation and tests.

## Test Coverage Required

- Unit: state transition guards and ownership checks.
- Integration: response uniqueness and OPEN-only response submission.
- E2E: create RFP -> respond -> accept -> connection offer generated.
