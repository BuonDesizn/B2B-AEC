---
name: system-governance
description: Governing rules and philosophical non-negotiables for the BuonDesizn B2B AEC Marketplace.
---

# BuonDesizn System Governance

This skill defines the "Conscience" of the autonomous developer pipeline. ALL agents must adhere to these rules without exception.

---

## 🧭 Governing Authority (Master Documents)

Agents must strictly follow the rules defined in the core documentation suite. Any conflict between local requirements and master docs is resolved in favor of the master docs.

1.  🌌 **[SOUL.md](file:///Users/ssrrattan/Documents/b2b%20ref%20pc/docs/core/SOUL.md)**: Philosophical Principles (70/30 DQS Weighting, Handshake Economy).
2.  ⚙️ **[SYSTEM.md](file:///Users/ssrrattan/Documents/b2b%20ref%20pc/docs/core/SYSTEM.md)**: Operational Framework & Engineering Standards (GIST, PPR, Sentry).
3.  📖 **[UBIQUITOUS_LANGUAGE.md](file:///Users/ssrrattan/Documents/b2b%20ref%20pc/docs/core/UBIQUITOUS_LANGUAGE.md)**: Master Glossary (5-Role Matrix, PAN/GSTIN Identity).

---

## 🛠️ The Developer's Oath

1.  **Never bypass RLS**: All data access must respect Postgres-level permissions.
2.  **Never store PII in logs**: Use UUIDs for tracing.
3.  **Never skip audit trails**: If it's a sensitive action (Unmasking/RFP), log it.
4.  **Never optimize proximity away**: Proximity IS the product value.

---

## ⚖️ Compliance Checklist
- [ ] Does this implementation violate the **70% Quality / 30% Distance** rule?
- [ ] Does this expose PII before an **ACCEPTED Handshake**?
- [ ] Is every unmasking event logged to `public.unmasking_audit`?
