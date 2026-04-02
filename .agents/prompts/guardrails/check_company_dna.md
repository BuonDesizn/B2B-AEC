# 🛡️ Guardrail Check: Company DNA Sync (GSTIN-Linking)

**Status**: MANDATORY for personnel, inventory, and fleet modules.

## 📋 Compliance Checklist

- [ ] **GSTIN Binding**: Are roles (PP, CON, C, etc.) correctly linked to a shared `GSTIN` for the parent entity?
- [ ] **Unmasking Inheritance**: If a "Master Account" is unmasked via an accepted handshake, do all sub-resources (Personnel, Fleets) also unmask their PII for that connection?
- [ ] **Master Identity**: Verify that individual identities are locked via **PAN** while entities are locked via **GSTIN**.
- [ ] **Audit Trail**: Does the audit trail capture both the unmasked resource and the parent "Company DNA" used for authorization?

---

## 🚫 Rejection Criteria
- Any sub-resource (Team member, Equipment item) that requires a SEPARATE handshake if the master connection already exists for that GSTIN.
- Any profile that allows changing GSTIN without triggering a "Verification Reset".
