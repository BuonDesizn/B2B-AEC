---
name: browser_testing
description: Skill rules for @qa to use Playwright and browser-agent for autonomous UI/UX verification.
---

# Skill: Autonomous Browser Testing

This skill allows the **@qa** persona to verify the visual and interaction integrity of the BuonDesizn marketplace.

---

## 🎭 Playwright Scenarios (Handshake Economy)

### 1. Privacy Masking Verification
- **Scenario**: Navigate to a "Contractor" profile as an unauthenticated or "un-handshaked" user.
- **Verification**: Assert that the `email` and `mobile` elements are visually masked or missing from the DOM.

### 2. Proximity Marker Logic
- **Scenario**: Define a user location and a search radius (e.g., 50km).
- **Verification**: Verify that the Leaflet map renders the correct number of markers corresponding to the mock data coordinates.

### 3. Role-Based Dashboard Access
- **Scenario**: Login as a "Project Professional".
- **Verification**: Verify that the "Equipment Dealer Fleet" tab is NOT visible in the navigation sidebar.

---

## 🤖 Browser-Agent Orchestration

1. **Setup**: `@qa` authors Playwright scripts in `app_build/tests/e2e/`.
2. **Execution**: Use `browser-agent` to run the Playwright test suite in a headless environment.
3. **Audit**: Take screenshots of failures and save them to `docs/TEST_REPORTS/`.

---

## 🎯 Completion Criteria
- Playwright assertions for "Role Isolation" pass 100%.
- No PII is visible to unauthorized personas in snapshots.
- Interaction latency for unmasking events is <500ms.
