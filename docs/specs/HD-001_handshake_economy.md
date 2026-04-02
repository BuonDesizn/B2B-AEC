---
spec_id: HD-001
title: Handshake Economy — Progressive Trust & PII Unmasking
module: 3 (Privacy/Vault)
status: GREY
witness_required: true
created: 2026-03-31
owner: @pm
---

# Spec HD-001: Handshake Economy — Progressive Trust & PII Unmasking

## Objective

Implement the full **Handshake Economy**: the four-stage trust escalation that protects professional contact information until a deliberate mutual connection is established.

> "Connection as Currency" — `docs/core/SOUL.md §Connection as Currency`

Stages: `Masked Discovery` → `Connection Request` → `Accepted Handshake` → `Unmasked Contact`

## Core Rules

1. **Default state is MASKED**: `phone_primary`, `phone_secondary`, `email_business`, `linkedin_url` are NEVER sent to client before ACCEPTED
2. **Masking is server-side**: Postgres RLS + API-level omission. NOT frontend CSS hiding
3. **Credits are consumed** on REQUESTED (not on ACCEPTED). 1 credit per new initiation
4. **Address Book is permanent**: Once ACCEPTED, contact is stored forever in `address_book` — even if later BLOCKED
5. **Company DNA Unmask**: Accepting a handshake with one GSTIN rep unmasks ALL personnel under that GSTIN
6. **Audit trail is immutable**: Every ACCEPTED transition MUST insert into `unmasking_audit`

## Affected Tables

| Table | Operation | Notes |
|-------|-----------|-------|
| `connections` | CREATE, UPDATE | Full lifecycle management |
| `address_book` | CREATE, READ | Inserted on ACCEPTED |
| `profiles` | UPDATE | Decrement `handshake_credits` on REQUESTED |
| `unmasking_audit` | INSERT | Every ACCEPTED transition |
| `company_personnel` | READ | Unmasked via Company DNA RLS |

## API Impact

| Endpoint | Method | Action |
|----------|--------|--------|
| `/api/connections` | POST | Initiate handshake (costs 1 credit) |
| `/api/connections/:id` | PATCH | Accept, reject, block |
| `/api/connections` | GET | List requester's connections |
| `/api/address-book` | GET | List permanently unmasked contacts |
| `/api/profiles/:id` | GET | Returns masked or unmasked based on connection status |

## State Machine Impact

Full Handshake FSM: `docs/system/STATE_MACHINES.md §1`

Key transitions to implement:
- `POST /api/connections` → insert `REQUESTED` row, decrement credits
- `PATCH /api/connections/:id { status: 'ACCEPTED' }` → update row, insert `address_book`, insert `unmasking_audit`, trigger Company DNA unmask

## Guardrail Checks

- [ ] `check_handshake_privacy.md`: PII masked in default state, server-side enforcement confirmed
- [ ] `check_company_dna.md`: GSTIN-wide unmask on single acceptance
- [ ] `check_proximity_logic.md`: Not primary concern

## Definition of Done (DoD)

1. `GET /api/profiles/:id` returns `{ phone_primary: null, phone_secondary: null, email_business: null, linkedin_url: null }` for unconnected users
2. `GET /api/profiles/:id` returns real values for `ACCEPTED` connection holders
3. Initiating a handshake deducts 1 credit from `profiles.handshake_credits`
4. Initiating fails with `HANDSHAKE_INITIATE_INSUFFICIENT_CREDITS` error if `handshake_credits < 1`
5. Initiating fails with `HANDSHAKE_INITIATE_SUBSCRIPTION_LOCKED` error if `subscription_status = 'hard_locked'`
6. Accepting inserts into `address_book` AND `unmasking_audit` in a single DB transaction
7. Company DNA: accepting one rep's handshake unmasks all `company_personnel` with same GSTIN
8. `address_book` contact survives even after BLOCKED state
9. `// @witness [HD-001]` present in all implementation files

## Test Coverage Required

- Unit: Profile response shape — masked vs unmasked based on connection status
- Unit: Credit deduction — correct balance after initiation
- Unit: Credit guard — returns error at zero credits
- Unit: Hard lock guard — returns error when subscription locked
- Unit: Address book persistence — entry survives BLOCKED transition
- Unit: Company DNA unmask — one ACCEPTED → all personnel unmasked
- Integration: Full handshake lifecycle on local Supabase (REQUESTED → ACCEPTED → unmasking_audit row exists)
- E2E: Playwright — discover profile (masked) → request handshake → accept → see unmasked contact

## Implementation Notes

- All PII omission must happen at the API route layer (`/api/profiles/:id`) — check connection status via Kysely before selecting fields
- Use a DB transaction for the ACCEPTED transition: update connections + insert address_book + insert unmasking_audit must be atomic
- QStash job: Schedule `connection.expires_at` cleanup (REQUESTED → EXPIRED after 30 days)
- See: `docs/strategy/2026-03-30-strategic-realignment-design.md §Handshake Economy`
