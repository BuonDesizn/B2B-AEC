---
id: execution_roadmap
layer: planning

type: reference
owner: human
mutable: true
criticality: medium

depends_on:
  - ARCHITECTURE
  - STATE_MACHINES

consumes:
  - implementation_phases

provides:
  - build_sequence
  - milestones

validates:
  - phase_alignment

runtime:
  triggers: []
  outputs_to: []

version: 1.0
---

# Execution Roadmap & Implementation Strategy

This document defines the development journey for the BuonDesizn B2B
Marketplace, synchronized with the **10-Module Master Blueprint** and the
**14-Agent Specialist Fleet**.

---

## 1. The 14-Agent Task Matrix

To ensure 100% execution coverage, we employ a tiered specialist fleet. Every
phase is managed by a **Lead Specialist**, supported by **Implementation** and
**Audit** agents.

### Phase 0: The Clean Foundation (Current)

| Module             | Lead Specialist                  | Implementation Support      | Quality & Audit             |
| :----------------- | :------------------------------- | :-------------------------- | :-------------------------- |
| **Scaffolding**    | `devops-integrity-specialist`    | `nextjs-app-specialist`     | `project-orchestrator`      |
| **Schema/PostGIS** | `discovery-proximity-specialist` | `aec-marketplace-architect` | `security-audit-specialist` |

---

### Phase 1: Core Identity & Discovery (Months 1-2)

| Module                | Lead Specialist                  | Implementation Support      | Quality & Audit             |
| :-------------------- | :------------------------------- | :-------------------------- | :-------------------------- |
| **1. Identity**       | `identity-persona-specialist`    | `nextjs-app-specialist`     | `security-audit-specialist` |
| **- Key Personnel** | `aec-marketplace-architect`      | `nextjs-app-specialist`     | **ACTIVE — Design locked Mar 31. Next: `company_personnel` migration + sidebar UI** |
| **2. Discovery**      | `discovery-proximity-specialist` | `aec-marketplace-architect` | `project-orchestrator`      |
| **6. Marketplace UI** | `frontend-aesthetic-specialist`  | `nextjs-app-specialist`     | `aec-marketplace-architect` |

**Goal**: Functional search for AEC providers with proximity weighting and
5-role isolation.

---

### Phase 2: Handshake & Workflow (Months 3-4)

| Module               | Lead Specialist                | Implementation Support          | Quality & Audit             |
| :------------------- | :----------------------------- | :------------------------------ | :-------------------------- |
| **3. Privacy/Vault** | `handshake-privacy-specialist` | `aec-marketplace-architect`     | `security-audit-specialist` |
| **4. Chat/Comm**     | `rfp-workflow-specialist`      | `nextjs-app-specialist`         | `project-orchestrator`      |
| **8. RFP Lifecycle** | `rfp-workflow-specialist`      | `frontend-aesthetic-specialist` | `aec-marketplace-architect` |

**Goal**: RFP broadcasting, selective privacy masking, and bid-to-connection
management.

---

### Phase 3: Monetization & Ad System (Months 5-6)

| Module              | Lead Specialist                 | Implementation Support           | Quality & Audit             |
| :------------------ | :------------------------------ | :------------------------------- | :-------------------------- |
| **7. Payments/Ads** | `phonepe-payments-specialist`   | `discovery-proximity-specialist` | `security-audit-specialist` |
| **5. Safety/NLP**   | `content-moderation-specialist` | `aec-marketplace-architect`      | `project-orchestrator`      |

**Goal**: PhonePe activation, membership gating, and automated safe-URL/image
moderation.

---

### Phase 4: Intelligence & Insights (Months 7+)

| Module              | Lead Specialist                 | Implementation Support           | Quality & Audit             |
| :------------------ | :------------------------------ | :------------------------------- | :-------------------------- |
| **9. AI Discovery** | `ai-assistant-specialist`       | `discovery-proximity-specialist` | `aec-marketplace-architect` |
| **10. Analytics**   | `analytics-insights-specialist` | `nextjs-app-specialist`          | `project-orchestrator`      |

**Goal**: AI-driven partner matching and transactional business intelligence
dashboards.

---

## 2. Operational Integrity

- **Protocol**: 100% adherence to **Subagent-Driven Development (SDD)**.
- **Verification**: No code enters production without **Spec-Match** (Architect)
  and **Quality-Audit** (Orchestrator) sign-offs.
- **Payment Strategy**: PhonePe PG is the primary monetization engine.

---

## 2.5 Module Sign-Off Checklist (Per Module)

The new system is built **on top of the legacy system** — each module must clear all four gates:

| Gate | Action | Source |
| :--- | :--- | :--- |
| **1. Parity** | Every mandatory field/flow from legacy UAT is reproduced or superseded | `docs/audit/` |
| **2. Gap** | The specific architectural fix for this module's legacy flaw is verified implemented | `system/GAP_ANALYSIS_SUMMARY.md` |
| **3. Architecture** | Schema, state machines, and API contract match the spec docs | `database/db_schema.md`, `system/STATE_MACHINES.md`, `api/API_CONTRACT.md` |
| **4. Strategy** | Any interaction with DQS, privacy, or monetization passes the strategic guardrails | `strategy/2026-03-30-strategic-realignment-design.md` |

> All four gates must pass before a module is handed to `quality-audit-specialist`.

---

## 3. UAT Environment Reference

- **Analysis (uat.buondesizn.com)**: 5-role testing (Project Prof, Consultant,
  Contractor, Dealer, Guest).
- **Payment Sandbox**: PhonePe Dummy credentials as provided in Module 7 specs.
