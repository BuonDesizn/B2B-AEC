---
spec_id: CON-001
title: Contractor Role Extension
module: 1 (Identity and Role Extensions)
phase: 1
status: GREY
witness_required: true
created: 2026-04-02
owner: @pm
depends_on: [ID-001, RM-001]
---

# Spec CON-001: Contractor Role Extension

## Objective

Define contractor capability, workforce, and compliance fields required for reliable matching and credibility scoring.

## Affected Tables

| Table | Operation | Notes |
| --- | --- | --- |
| `contractors` | CREATE/READ/UPDATE | Role extension for `persona_type = 'CON'` |
| `profiles` | READ | Identity and geospatial anchor |

## API Impact

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/profiles/:id` | GET | Return merged profile + contractor extension |
| `/api/profiles` | POST/PATCH | Capture contractor-specific workforce/compliance data |

## Validation Rules

- Workforce counts cannot be negative.
- `license_class` must be in controlled enum.
- `concurrent_projects_capacity >= 1`.

## Definition of Done

1. Contractor extension supports workforce and fleet metadata.
2. Discovery ranking can consume contractor depth fields for DQS profile depth.
3. Contractor RFP eligibility filters are feasible from stored fields.
4. `// @witness [CON-001]` is present in implementation and tests.

## Test Coverage Required

- Unit: non-negative numeric and enum checks.
- Integration: contractor extension read/write with persona guard.
- E2E: contractor onboarding and search visibility.
