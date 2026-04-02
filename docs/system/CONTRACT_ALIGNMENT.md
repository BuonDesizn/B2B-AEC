---
id: CONTRACT_ALIGNMENT
layer: planning
type: technical_specification
owner: @pm
mutable: controlled
criticality: high
version: 1.1
last_updated: 2026-04-02
---

# Contract Alignment Matrix

Purpose: remove implementation paralysis by locking canonical names, units, and state values across `db_schema`, `STATE_MACHINES`, and `API_CONTRACT`.

## Locked Decisions

| Area | Canonical Decision | Notes |
| --- | --- | --- |
| Handshake request status | `REQUESTED` | API responses and DB/state must use this value only |
| RFP live state | `OPEN` | Replace any `ACTIVE` references in RFP lifecycle contexts |
| Discovery RPC name | `searching_nearby_profiles()` | Treat `search_nearby_profiles()` as legacy alias only |
| Discovery distance unit | `distance_km` | Internal meters allowed for PostGIS math, API output in km |
| Discovery rank output field | `ranked_score` | Normalize away `weighted_score` in client contracts |
| Search radius input | `radius_km` | Convert to meters at query execution layer |
| Contact visibility source | `get_visible_contact_info()` | Never bypass through raw profile select in clients |
| Profile label naming | Persist `org_name`; expose `display_name` as API/UI alias | Product-approved on 2026-04-02 |
| PAN uniqueness model | `UNIQUE(pan, persona_type)` | Supports role fluidity with strict one-persona-per-PAN rule |
| Verification field | `profiles.verification_status` with FSM values | Must align with registration verification machine |
| Personnel canonical fields | `specialty` as array, `detailed_bio` as long text | Keep API and schema names identical |
| DQS recompute contract | `dqs_recalculate()` at `02:00 UTC` with 40/30/20/10 formula | API/schema/state docs must match exactly |
| Pagination standard | Offset-based, default 20, max 50 | All list endpoints follow this envelope |
| Error code format | `DOMAIN_ACTION_REASON` | e.g., `HANDSHAKE_INITIATE_INSUFFICIENT_CREDITS` |

## Change Protocol (GOV-001)

All changes to schema, API contracts, or state machines must follow this sequence:

1. **PM authors the change** — Update the relevant spec doc first. If no spec exists, create one.
2. **Engineer implements** — Write migration file + code that matches the spec exactly.
3. **QA gates** — Verify implementation against spec. Any deviation is a blocking defect.

### Rules

- Schema changes require a new migration file before code is written.
- API changes require the affected spec to be updated first.
- State machine changes require `STATE_MACHINES.md` to be updated before any endpoint code.
- No endpoint may bypass privacy, state enforcement, or contract alignment decisions.
- `@qa` treats deviations from this protocol as blocking defects.
- `MASTER_PROGRESS.md` cannot mark a module GREEN if any dependency violates this protocol.

## Implementation Impact

1. Any spec/contract/migration update must reference this file when changing naming or state values.
2. `@qa` should treat deviations from locked decisions as blocking defects.
3. `MASTER_PROGRESS.md` cannot mark a module GREEN if any dependency violates this matrix.
