---
spec_id: ED-001
title: Equipment Dealer Role Extension
module: 1 (Identity and Role Extensions)
phase: 1
status: GREY
witness_required: true
created: 2026-04-02
owner: @pm
depends_on: [ID-001, RM-001]
---

# Spec ED-001: Equipment Dealer Role Extension

## Objective

Define equipment dealer identity extension fields for rental capability, compliance tracking, and proximity-aware discovery.

## Affected Tables

| Table | Operation | Notes |
| --- | --- | --- |
| `equipment_dealers` | CREATE/READ/UPDATE | Role extension for `persona_type = 'ED'` |
| `profiles` | READ | Discovery and contact context |

## API Impact

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/profiles/:id` | GET | Return merged profile + ED extension |
| `/api/profiles` | POST/PATCH | Capture ED-specific fleet and park-location metadata |

## Validation Rules

- `total_equipment_count >= 0`.
- `park_location` must be valid geospatial point when present.

## Definition of Done

1. Equipment dealer extension supports rental/discovery requirements.
2. Park-location metadata enables geospatial matching and dashboard metrics.
3. Compliance fields are queryable by admin review flows.
4. `// @witness [ED-001]` is present in implementation and tests.

## Test Coverage Required

- Unit: numeric and geospatial validation.
- Integration: ED extension joins with profile contract.
- E2E: ED onboarding and discovery visibility.
