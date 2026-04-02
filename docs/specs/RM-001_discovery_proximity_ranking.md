---
spec_id: RM-001
title: Discovery — 70/30 Proximity Ranking (DQS + Distance)
module: 2 (Discovery)
status: RED
witness_required: true
created: 2026-03-31
owner: @pm
---

# Spec RM-001: Discovery — 70/30 Proximity Ranking

## Objective

Implement the **Quality-First Discovery** engine: a PostGIS-powered search RPC that ranks professionals using a 70/30 weighted formula — 70% Discovery Quality Score (DQS) + 30% proximity (distance from searcher). This is the core of the **Proximity Paradox** architectural decision in `docs/core/SOUL.md §Proximity Paradox`.

## Formula

```
ranked_score = (w_quality × dqs_score) + (w_dist × (1 - LEAST(distance_km / radius_km, 1.0)))
```

- `w_quality`: Dynamic weight from `system_config` (default: 0.7)
- `w_dist`: Dynamic weight from `system_config` (default: 0.3)

- `dqs_score`: stored in `profiles.dqs_score` (updated daily by pg_cron at 2 AM)
- `distance_km`: PostGIS ST_Distance between searcher and profile coordinates
- `radius_km`: default 50, overridable by searcher (server-enforced cap: 500km)
- Result: Higher DQS at 50km outranks lower DQS at 5km

## DQS Components (daily recalculation)

| Component | Weight | Source |
|-----------|--------|--------|
| Responsiveness | 40% | Average handshake response time |
| Trust Loops | 30% | Repeat handshakes & long engagements |
| Verification | 20% | GSTIN validated + admin office visit |
| Profile Depth | 10% | Portfolio/SKU metadata completeness |

## Affected Tables

| Table | Operation | Notes |
|-------|-----------|-------|
| `profiles` | READ | `dqs_score`, `location`, `persona_type` |
| `profiles` | UPDATE | `dqs_score`, `dqs_*` sub-components (cron) |

## API Impact

**New RPC**: `searching_nearby_profiles()` — full spec in `docs/api/API_CONTRACT.md §searching_nearby_profiles`

| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| `searcher_lat` | DOUBLE PRECISION | required | From user's location |
| `searcher_lng` | DOUBLE PRECISION | required | From user's location |
| `radius_km` | INT | 50 | Server-enforced max: 500 |
| `role_filter` | TEXT | NULL | One of: PP, C, CON, PS, ED |
| `keyword` | TEXT | NULL | Matches `display_name`, `tagline` |
| `page_size` | INT | 20 | Max: 50 |
| `page_offset` | INT | 0 | Pagination offset |

**Returns**: `profile_id`, `display_name`, `persona_type`, `city`, `state`, `dqs_score`, `distance_km`, `ranked_score`, `subscription_status`

## State Machine Impact

- DQS recalculation: fired by pg_cron daily. Updates `profiles.dqs_score`.
- See: `docs/system/STATE_MACHINES.md §DQS`

## Guardrail Checks

- [ ] **Proximity Logic**: 70/30 formula verified, GiST index present, <300ms latency confirmed
- [ ] **Company DNA**: Not primary concern but GSTIN-verified profiles must get verification boost
- [ ] **Handshake Privacy**: Search results must NOT include phone/email/linkedin regardless of connection status

## Definition of Done (DoD)

1. `searching_nearby_profiles()` RPC returns results sorted by `ranked_score DESC`
2. Profile A (DQS=0.95, 50km) ranks above Profile B (DQS=0.60, 5km) — per MOCK_DATA_BLUEPRINT.md test case
3. `role_filter` correctly filters to single persona type
4. `keyword` search matches `display_name` and `tagline` (case-insensitive)
5. Search results NEVER include `phone`, `email`, `linkedin_url` (masked at RPC level)
6. Query latency <300ms at p95 with GiST index (test with `EXPLAIN ANALYZE`)
7. `hard_locked` profiles are excluded from results
8. `// @witness [RM-001]` present in all implementation files

## Test Coverage Required

- Unit: Formula verification — given DQS and distance inputs, ranked_score is correct
- Unit: Edge cases — radius_km=0, single result, no results in radius
- Unit: hard_locked profiles excluded from results
- Integration: Real PostGIS query with local Supabase — EXPLAIN ANALYZE confirms GiST index use
- E2E: Search UI shows results ranked by score, not distance alone

## Implementation Notes

- RPC must be `SECURITY DEFINER` to bypass RLS for discovery (results are intentionally public)
- **Dynamic Weights**: Fetch `discovery_ranking_split` from `system_config` at runtime. Fallback to 70/30 if missing.
- BUT: `phone`, `email`, `linkedin_url` must be excluded from SELECT list
- Manual pin-drop fallback: if `profiles.location` is NULL, exclude from search results (not an error)
- Use `ST_DWithin` for initial radius filter (uses GiST index) THEN apply 70/30 formula
- See: `docs/strategy/2026-03-30-strategic-realignment-design.md §Proximity` for pin-drop requirement
