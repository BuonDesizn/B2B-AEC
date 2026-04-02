---
spec_id: PS-001
title: Product Seller Role Extension
module: 1 (Identity and Role Extensions)
phase: 1
status: GREY
witness_required: true
created: 2026-04-02
owner: @pm
depends_on: [ID-001, RM-001]
---

# Spec PS-001: Product Seller Role Extension

## Objective

Define product-seller business metadata to support catalog trust, logistics fit, and lead qualification.

## Affected Tables

| Table | Operation | Notes |
| --- | --- | --- |
| `product_sellers` | CREATE/READ/UPDATE | Role extension for `persona_type = 'PS'` |
| `profiles` | READ | Identity and location context |

## API Impact

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/profiles/:id` | GET | Return merged profile + PS extension |
| `/api/profiles` | POST/PATCH | Capture seller business terms and SKU capacity |

## Validation Rules

- `business_type` must be controlled enum.
- `delivery_radius_km >= 0`.
- `credit_period_days >= 0`.

## Definition of Done

1. Product seller extension fields are persisted and exposed by contract.
2. Discovery can filter by seller business attributes.
3. Commercial terms are available for inquiry qualification.
4. `// @witness [PS-001]` is present in implementation and tests.

## Test Coverage Required

- Unit: enum and non-negative numeric validation.
- Integration: PS extension mapping to profile reads.
- E2E: PS profile setup and discoverability.
