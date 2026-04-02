---
spec_id: ID-001
title: Identity — GSTIN Linking & Company DNA
module: 1 (Key Personnel)
status: YELLOW
witness_required: true
created: 2026-03-31
owner: @pm
---

# Spec ID-001: Identity — GSTIN Linking & Company DNA

## Objective

Enable a verified firm representative (Master Rep) to link their Supabase account to a GSTIN. Once linked, all `company_personnel` records under that GSTIN are automatically unmasked to any user who holds an `ACCEPTED` handshake with ANY representative of that GSTIN.

This implements the **Company DNA Synchronization** principle from `docs/core/SOUL.md §Account Integrity`.

## Affected Tables

| Table | Operation | Notes |
|-------|-----------|-------|
| `profiles` | UPDATE | Set `gstin`, trigger verification flow |
| `company_personnel` | CREATE, READ | Linked by `company_gstin` field |
| `connections` | READ | Used in RLS policy to check ACCEPTED status |
| `unmasking_audit` | INSERT | Log every Company DNA unmask event |

## RLS Impact

- `company_personnel` SELECT policy: unmask if `auth.uid() = profile_id` OR ACCEPTED connection exists with any profile sharing `company_gstin`
- See: `docs/database/rls_policies.md §company_personnel`

## API Impact

| Endpoint | Method | Change |
|----------|--------|--------|
| `/api/profiles` | PATCH | Accept `gstin` field, trigger GSTIN validation |
| `/api/company-personnel` | GET, POST, PUT, DELETE | New resource |
| `/api/company-personnel/bulk` | POST | CSV bulk import |

See: `docs/api/API_CONTRACT.md`

## State Machine Impact

- Profile verification: `PENDING_VERIFICATION → PENDING_ADMIN → VERIFIED`
- `PENDING_ADMIN`: Automated API check passed; waiting for Admin Gate approval in settings panel.
- See: `docs/system/STATE_MACHINES.md §4`

## Guardrail Checks (must all PASS before @qa marks GREEN)

- [ ] `check_company_dna.md`: GSTIN binding verified, unmasking inheritance confirmed
- [ ] `check_handshake_privacy.md`: Company personnel PII masked until ACCEPTED
- [ ] `check_proximity_logic.md`: Not applicable for this spec

## Definition of Done (DoD)

1. A user with a verified GSTIN can add, edit, and remove `company_personnel` records
2. Unlinked users see only `{ full_name, designation, qualification, specialty, experience_years }` — all other fields return `null`
3. A user with an ACCEPTED handshake with ANY rep of the same GSTIN sees all fields
4. Bulk CSV import (100+ records) completes without error
5. Every unmask event is logged in `unmasking_audit`
6. `// @witness [ID-001]` present in all implementation files

## Test Coverage Required

- Unit: GSTIN regex validation (valid, invalid, edge cases)
- Unit: RLS policy simulation — unmasked vs masked response shapes
- Unit: Company DNA inheritance — one ACCEPTED handshake → all personnel unmasked
- E2E: "My Team" dashboard — add personnel, view as outsider (masked), view after handshake (unmasked)
- E2E: Bulk CSV import flow

## Implementation Notes

- Use Kysely for all DB queries — no raw Supabase `.from()` chains in server components
- **Verification Gate**:
    1. **Automated**: Validate GSTIN existence and PII match (firm name) via external API.
    2. **Manual**: Admin must toggle `VERIFIED` status in the Admin Settings Panel after confirming documentation.
- Profile image uploads go to Supabase Storage with 60-min signed URL TTL
- See: `docs/plans/2026-03-31-key-personnel-design.md` for full implementation steps
