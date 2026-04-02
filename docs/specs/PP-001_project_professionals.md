---
spec_id: PP-001
title: Project Professional Role Extension
module: 1 (Identity and Role Extensions)
phase: 1
status: GREY
witness_required: true
created: 2026-04-02
owner: @pm
depends_on: [ID-001]
---

# Spec PP-001: Project Professional Role Extension

## Objective

Define the Project Professional (`PP`) profile extension so identity, discovery, and trust scoring can use structured credential data instead of free-form profile text.

## Affected Tables

| Table | Operation | Notes |
| --- | --- | --- |
| `project_professionals` | CREATE/READ/UPDATE | Role extension for `profiles.persona_type = 'PP'` |
| `profiles` | READ | Source of identity, location, subscription state |

## API Impact

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/profiles/:id` | GET | Return merged profile + PP extension (non-PII only) |
| `/api/profiles` | POST/PATCH | Allow PP-specific fields during onboarding/edit |

## Validation Rules

- `designation` must be in controlled enum.
- `experience_years` must be between 0 and 60.
- `portfolio_summary` max 500 chars.
- `hourly_rate_min <= hourly_rate_max` when both present.

## Definition of Done

1. PP extension schema and validations are implemented as per `docs/database/db_schema.md`.
2. Discovery filters can use PP specialization and availability metadata.
3. Profile completeness score includes PP role fields.
4. `// @witness [PP-001]` is present in implementation and tests.

## Test Coverage Required

- Unit: field validation (designation enum, experience bounds, rates ordering).
- Integration: profile read returns PP extension only for PP users.
- E2E: PP onboarding and profile update flow.
