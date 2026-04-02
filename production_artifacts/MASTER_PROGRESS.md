# Master Progress Dashboard

This dashboard tracks planning-to-build traceability. Current state: all specs, schema, and migrations are aligned and production-ready. Implementation (API routes + UI) is next.

## Active Feature Roadmap

| Feature / Module | Spec ID | Depends On | Spec Doc | API Contract | Schema Alignment | Code Evidence (`@witness`) | Test Evidence | Progress | Final Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Identity and GSTIN linking | `ID-001` | - | DONE | DONE | DONE | MISSING | PLANNED | 70% | GREEN |
| Discovery ranking (70/30) | `RM-001` | `ID-001` | DONE | DONE | DONE | MISSING | PLANNED | 70% | GREEN |
| Handshake economy | `HD-001` | `ID-001` | DONE | DONE | DONE | MISSING | PLANNED | 70% | GREEN |
| Marketplace UI shell | `UI-001` | `ID-001`, `RM-001`, `HD-001` | DONE | DONE | DONE | MISSING | PLANNED | 60% | YELLOW |
| Project Professional extension | `PP-001` | `ID-001` | DONE | PARTIAL | DONE | MISSING | PLANNED | 55% | YELLOW |
| Consultant extension | `C-001` | `ID-001`, `RM-001` | DONE | PARTIAL | DONE | MISSING | PLANNED | 55% | YELLOW |
| Contractor extension | `CON-001` | `ID-001`, `RM-001` | DONE | PARTIAL | DONE | MISSING | PLANNED | 55% | YELLOW |
| Product Seller extension | `PS-001` | `ID-001`, `RM-001` | DONE | PARTIAL | DONE | MISSING | PLANNED | 55% | YELLOW |
| Equipment Dealer extension | `ED-001` | `ID-001`, `RM-001` | DONE | PARTIAL | DONE | MISSING | PLANNED | 55% | YELLOW |
| RFP lifecycle | `RFP-001` | `RM-001`, `HD-001` | DONE | DONE | DONE | MISSING | PLANNED | 65% | GREEN |
| Ads lifecycle and monetization | `AD-001` | `MON-001`, `RM-001`, `HD-001` | DONE | DONE | DONE | MISSING | PLANNED | 65% | GREEN |
| Subscription and credits | `MON-001` | `HD-001` | DONE | DONE | DONE | MISSING | PLANNED | 65% | GREEN |
| Communications and inbox orchestration | `COM-001` | `HD-001`, `RFP-001` | DONE | PARTIAL | DONE | MISSING | PLANNED | 50% | YELLOW |
| Moderation workflow | `MOD-001` | `AD-001` | DONE | PARTIAL | DONE | MISSING | PLANNED | 50% | YELLOW |
| AI discovery assist | `AI-001` | `RM-001` | PENDING | PENDING | PENDING | MISSING | PLANNED | 0% | GREY |
| Analytics dashboards | `ANL-001` | `RM-001`, `RFP-001`, `AD-001`, `MON-001` | PENDING | PENDING | PENDING | MISSING | PLANNED | 0% | GREY |

Status meanings:
- `GREEN`: Spec + API + schema aligned + witnessed code + passing tests.
- `YELLOW`: Planning mostly done; implementation pending.
- `RED`: Hard planning gap blocks autonomous implementation.
- `GREY`: Planned but not started.

---

## Intervention and Block Log

| Date | Feature | Reason for Block | Tracked By | Resolved? |
| --- | --- | --- | --- | --- |
| 2026-04-02 | Schema alignment | Naming/state mismatches across schema/api/state docs | `@pm` | Yes — 2026-04-02 |
| 2026-04-02 | Product and equipment APIs | Contract not yet defined in API_CONTRACT | `@pm` | Yes — added to API_CONTRACT |
| 2026-04-02 | Migration sequence gaps | Missing tables in migration sequence | `@pm` | Yes — all tables now defined |

---

## Operational Rules

1. No implementation starts for a spec unless spec doc exists and dependency specs are DONE.
2. No module is marked build-ready unless API Contract and state values are aligned.
3. No module is GREEN without `@witness` code evidence and passing tests.
4. Migration SQL files are the source of truth. All docs must match them.
