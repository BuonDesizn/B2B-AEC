---
name: write_specs
description: Skill rules for @pm (Marketplace Architect) to generate AEC-specific technical specifications.
---

# Skill: Write Marketplace Specs

This skill governs how the **@pm** persona generates the `Technical_Specification.md` for new marketplace features.

---

## 🏗️ Technical Specification Requirement (AEC)

All specifications generated must adhere to:

1.  **Role Context**: Reference the **5-Persona Rule** in [`UBIQUITOUS_LANGUAGE.md`](file:///Users/ssrrattan/Documents/b2b%20ref%20pc/docs/core/UBIQUITOUS_LANGUAGE.md).
2.  **Discovery Logic**: Define PostGIS query requirements via the **70/30 DQS/Distance** weighting in [`SYSTEM.md`](file:///Users/ssrrattan/Documents/b2b%20ref%20pc/docs/core/SYSTEM.md).
3.  **Proximity**: Default discovery radius is **50km**.
4.  **Handshake & Privacy State**: Map the connection lifecycle from **MASKED** ➡️ **REQUESTED** ➡️ **ACCEPTED** (Unmasked).
5.  **Audit**: Every state change must emit an event and log to `public.unmasking_audit`.

---

## 📋 Methodology: The "AEC Spec-Match"

1.  **Analyze**: Reference [`ARCHITECTURE.md`](file:///Users/ssrrattan/Documents/b2b%20ref%20pc/docs/core/ARCHITECTURE.md) and `db_schema.md`.
2.  **Drafting**: Write a spec that follows the Marketplace Master Blueprint.
3.  **Validation**: Confirm the spec does not violate the **Proximity Paradox**.

---

## 🎯 Done Criteria
- Spec is written to `docs/Technical_Specification.md`.
- Spec includes a unique **Spec ID** (e.g., `KP-001`, `ID-002`).
- Spec includes a Mermaid `STATE_MACHINE` for the feature lifecycle.
- Spec identifies the specific Supabase tables/triggers affected.
- **`[EXCLUSION]`**: No Purchase Order (PO) or transaction logic.

---

## 🏁 Mandatory: Definition of Done (DoD) Block

Every spec must end with the following **AEC-Standard DoD Table**:

| Criterion | Requirement | Evidence Link (to be filled by @qa) |
| :--- | :--- | :--- |
| **Witness Signature** | Mandatory `// @witness [Spec-ID]` in all source headers. | |
| **Logic (Unit)** | Vitest passing for core business rules. | `[Link to Test Artifact]` |
| **UI/State (E2E)** | Playwright passing for connection lifecycle. | `[Link to Test Artifact]` |
| **Privacy (RLS)** | Supabase RLS policies verified for 5-persona roles. | |
| **Weighting (70/30)** | 70% Quality / 30% Distance logic confirmed. | |
