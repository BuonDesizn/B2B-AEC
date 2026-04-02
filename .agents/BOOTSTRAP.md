---
title: Agent Bootstrap — Start Here
type: onboarding
audience: all_agents
---

# Agent Bootstrap: BuonDesizn B2B Marketplace

You are operating within the **BuonDesizn multi-agent autonomous development system**. This file is your entry point. Read it fully before taking any action.

---

## Step 1: Understand Your Persona

You will be operating as one of four personas. Identify which one applies to your current task:

| Persona | File | Role |
|---------|------|------|
| @pm | [.agents/personas/pm.md](personas/pm.md) | Orchestration, specs, architecture |
| @engineer | [.agents/personas/engineer.md](personas/engineer.md) | Implementation (Next.js, Supabase, DB) |
| @qa | [.agents/personas/qa.md](personas/qa.md) | TDD, privacy audits, witness verification |
| @devops | [.agents/personas/devops.md](personas/devops.md) | Deployment, infra, PhonePe |

Read your persona file before proceeding. It defines your authority, tools, and constraints.

---

## Step 2: Load Governing Documents (in order)

Read these files **in this sequence**. Earlier files override later ones in case of conflict.

1. [docs/core/SOUL.md](../docs/core/SOUL.md) — Philosophical non-negotiables (Developer's Oath)
2. [docs/core/SYSTEM.md](../docs/core/SYSTEM.md) — Operational constraints (MANDATORY enforcement)
3. [docs/core/ARCHITECTURE.md](../docs/core/ARCHITECTURE.md) — Technical design & explicit exclusions
4. [docs/core/UBIQUITOUS_LANGUAGE.md](../docs/core/UBIQUITOUS_LANGUAGE.md) — Domain glossary (use exact terminology)
5. [docs/core/STYLEGUIDE.md](../docs/core/STYLEGUIDE.md) — Visual DNA (@engineer and @qa only)

---

## Step 3: Check Current State

Before writing any code or spec:

1. Read [production_artifacts/MASTER_PROGRESS.md](../production_artifacts/MASTER_PROGRESS.md)
   - What is currently RED, YELLOW, GREEN, GREY?
   - What spec IDs already exist?
   - Are there open blockers?

2. Check the relevant spec document for your feature in [docs/specs/](../docs/specs/)
   - If no spec exists, @pm must create one before @engineer writes a line of code

---

## Step 4: Load Relevant Domain Documents

Based on your task, load the relevant technical docs:

| Task Area | Document |
|-----------|----------|
| Database / Schema | [docs/database/db_schema.md](../docs/database/db_schema.md) |
| Security / RLS | [docs/database/rls_policies.md](../docs/database/rls_policies.md) |
| API contracts | [docs/api/API_CONTRACT.md](../docs/api/API_CONTRACT.md) |
| State machines | [docs/system/STATE_MACHINES.md](../docs/system/STATE_MACHINES.md) |
| Events / Queues | [docs/system/EVENTS.md](../docs/system/EVENTS.md) |
| Dashboards / UI | [docs/system/DASHBOARDS.md](../docs/system/DASHBOARDS.md) |
| Business logic | [docs/business/business_logic_edge_cases.md](../docs/business/business_logic_edge_cases.md) |
| Test data | [docs/database/MOCK_DATA_BLUEPRINT.md](../docs/database/MOCK_DATA_BLUEPRINT.md) |
| Roadmap | [docs/strategy/execution_roadmap.md](../docs/strategy/execution_roadmap.md) |

---

## Step 5: Load Relevant Skills

Skills are curated best-practice guides in [.agents/skills/](skills/). Load only what you need:

| Task | Skill File |
|------|-----------|
| Next.js implementation | [skills/next-best-practices.md](skills/next-best-practices.md) |
| Supabase / Postgres | [skills/supabase-postgres-best-practices.md](skills/supabase-postgres-best-practices.md) |
| UI/UX components | [skills/ui-ux-pro-max.md](skills/ui-ux-pro-max.md) |
| PhonePe payments | [skills/phonepe-integration.md](skills/phonepe-integration.md) |
| Content moderation | [skills/sightengine-moderation.md](skills/sightengine-moderation.md) |
| Realtime / Supavisor | [skills/supavisor-realtime-patterns.md](skills/supavisor-realtime-patterns.md) |
| E2E testing | [skills/browser_testing.md](skills/browser_testing.md) |
| Writing specs | [skills/write_specs.md](skills/write_specs.md) |
| Parallel dispatch | [skills/dispatch_parallel.md](skills/dispatch_parallel.md) |
| Deployment | [skills/deploy_app.md](skills/deploy_app.md) |
| Zero-mock data | [skills/zero-mock-architecture.md](skills/zero-mock-architecture.md) |

---

## Step 6: Run Guardrail Checks Before Every PR

Every feature touching privacy, discovery, or identity MUST pass all 3 guardrails:

1. [.agents/prompts/guardrails/check_company_dna.md](prompts/guardrails/check_company_dna.md)
2. [.agents/prompts/guardrails/check_handshake_privacy.md](prompts/guardrails/check_handshake_privacy.md)
3. [.agents/prompts/guardrails/check_proximity_logic.md](prompts/guardrails/check_proximity_logic.md)

---

## The Witness Rule (Non-Negotiable)

Every source file you create or modify MUST include a witness tag in its header:

```typescript
// @witness [SPEC-ID]
// Example: // @witness [ID-001]
```

No witness tag = @qa will NOT mark the feature GREEN. No GREEN = @devops will NOT deploy.

---

## The Developer's Oath (from SOUL.md)

Before writing code, commit to these:

1. Never bypass RLS
2. Never store PII in logs (use UUIDs only)
3. Never assume geocoding accuracy (manual pin-drop fallback required)
4. Never skip audit trails
5. Never optimize proximity away (70/30 DQS/Distance is sacred)

---

## Quick Reference: Key Files

| What | Where |
|------|-------|
| Entry command | `/startcycle "feature"` |
| Progress tracker | [production_artifacts/MASTER_PROGRESS.md](../production_artifacts/MASTER_PROGRESS.md) |
| Spec documents | [docs/specs/](../docs/specs/) |
| DB schema | [docs/database/db_schema.md](../docs/database/db_schema.md) |
| Env vars template | [.env.example](../.env.example) |
| Supabase migrations | [supabase/migrations/](../supabase/migrations/) |
| Test configs | [app_build/vitest.config.ts](../app_build/vitest.config.ts) |
| Test stubs | [app_build/tests/](../app_build/tests/) |
