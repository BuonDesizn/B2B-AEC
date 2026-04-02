---
name: run_tests
description: Skill rules for @qa (Security Specialist) to implement TDD for AEC marketplace.
---

# Skill: Run Marketplace Tests (TDD)

This skill governs how the **@qa** persona implements and executes tests for the BuonDesizn marketplace.

---

## 🧪 TDD Workflow (Red-Green-Refactor)

1. **Vitest-First**: Author Vitest `.spec.ts` files in `app_build/tests/unit/` against the `Technical_Specification.md` BEFORE logic is implementation.
2. **AEC Logic Focus**: Verify:
    - **Proximity Filtering**: Map specific lat/long pairs and verify `st_distance` logic results match expected radii.
    - **Handshake Flow**: Verify state transitions in the Postgres RPC calls (Masked → CONNECTION_REQUESTED → CONNECTION_ACCEPTED → Unmasked).
    - **Role Isolation**: Unit test the `profiles` RLS logic using `pgTAP` or Vitest-mocked Supabase clients.
3. **Autonomous Execution**: `@qa` runs `vitest run` in the terminal and provides failure context to `@engineer` for remediation.

---

## 🛠️ Testing Environment

- **Database**: Use a fresh Supabase branch (Zero-Mock Architecture).
- **Secrets**: Use PhonePe Dummy and Sightengine test keys.
- **Reports**: Generate a coverage report focusing on RLS-heavy modules.

---

## 🎯 Verification Criteria
- 100% test coverage for the 5-role identity and connection logic.
- Zero failures in the "Proximity Radius Broadcast" test.
- The `audit_code.md` skill reports 100% security compliance.
