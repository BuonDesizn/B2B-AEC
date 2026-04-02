# Test Matrix Crosswalk

Purpose: map every spec to required test layers with coverage thresholds.

## Coverage Standards

| Layer | Threshold | Scope |
| --- | --- | --- |
| Unit | 80%+ | All guards, validations, state transitions, formula calculations |
| Integration | 70%+ | DB queries, RLS policies, RPC functions, API endpoints |
| E2E | Critical paths only | Happy path + 1-2 key edge cases per feature |

## Spec → Test Mapping

| Spec ID | Unit Tests | Integration Tests | E2E Tests |
| --- | --- | --- | --- |
| `ID-001` | GSTIN regex, PAN uniqueness, verification state transitions | Profile create/update with GSTIN linkage, RLS on personnel | Onboarding flow: register → GSTIN → verify → see team |
| `RM-001` | 70/30 formula, weight fallback, hard_locked exclusion | `searching_nearby_profiles()` with PostGIS, GiST index usage | Search page: results ranked by score, not distance |
| `HD-001` | Credit deduction, hard lock guard, address book permanence | Connection lifecycle: REQUESTED → ACCEPTED → unmasking_audit | Discover → request → accept → contact revealed |
| `UI-001` | Sidebar rendering per role, hard lock overlay logic | Profile card masked/unmasked response shapes | Full dashboard navigation per role |
| `PP-001` | Designation enum, experience bounds, rate ordering | PP extension read/write with persona guard | PP onboarding + profile update |
| `C-001` | Services_offered required, enum/range validation | Consultant extension mapping to profile reads | Consultant onboarding + discovery visibility |
| `CON-001` | Non-negative workforce counts, license class enum | Contractor extension joins with profile contract | Contractor onboarding + search visibility |
| `PS-001` | Business type enum, non-negative numeric validation | PS extension mapping to profile reads | PS profile setup + discoverability |
| `ED-001` | Numeric/geospatial validation, operator count bounds | ED extension joins with profile contract | ED onboarding + discovery visibility |
| `RFP-001` | State transition guards, ownership checks, response uniqueness | RFP create → respond → accept pipeline | Create RFP → receive response → accept → connection offer |
| `AD-001` | State guard validation per endpoint, payment state transitions | Ad create → pay → active → connect flow | Create ad → pay → active → connect request |
| `MON-001` | Transition guards by status, credit reset logic | Payment callbacks update status and credits | Trial → hard lock → payment → active restoration |
| `COM-001` | Notification creation per event, read/unread state | Event → notification pipeline, preferences update | Receive notification → mark read → inbox reflects |
| `MOD-001` | Moderation state transitions, admin role enforcement | Sightengine mock → ad state transitions | Create ad → flagged → suspended → admin clears |
| `AI-001` | Prompt validation, safety guardrails, response format checks | AI service integration with Supabase context | AI-assisted search returns relevant results |
| `ANL-001` | KPI calculation accuracy, aggregation logic, date range filters | Dashboard query performance, data freshness | Dashboard renders correct metrics per role |

## Test File Naming Convention

- Unit: `tests/unit/<module>/<feature>.test.ts`
- Integration: `tests/integration/<module>/<feature>.test.ts`
- E2E: `tests/e2e/<module>/<feature>.spec.ts`

## Witness Tag Requirement

Every test file must include the spec witness tag:
```typescript
// @witness [SPEC-ID]
```
