---
spec_id: C-001
title: Consultant Role Extension
module: 1 (Identity and Role Extensions)
phase: 1
status: GREY
witness_required: true
created: 2026-04-02
owner: @pm
depends_on: [ID-001, RM-001]
---

# Spec C-001: Consultant Role Extension

## Objective

Define consultant firm metadata needed for quality-first discovery, compliance checks, and matching against RFP requirements.

## Affected Tables

| Table | Operation | Notes |
| --- | --- | --- |
| `consultants` | CREATE/READ/UPDATE | Role extension for `persona_type = 'C'` |
| `profiles` | READ | Identity, GSTIN, geolocation, subscription |

## API Impact

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/profiles/:id` | GET | Return merged profile + consultant extension |
| `/api/profiles` | POST/PATCH | Collect consultant service/compliance fields |

## Validation Rules

- `services_offered` is required, non-empty.
- `company_type` and `annual_turnover_range` must use controlled values.
- `min_project_value <= largest_project_value` when both present.

## Definition of Done

1. Consultant extension fields are persisted and queryable.
2. Discovery and RFP logic can filter by consultant services.
3. Compliance flags (ISO variants) are included in response contracts.
4. `// @witness [C-001]` is present in implementation and tests.

## Test Coverage Required

- Unit: enum and range validation.
- Integration: consultant-only fields hidden for non-consultant personas.
- E2E: consultant onboarding + discovery listing visibility.
