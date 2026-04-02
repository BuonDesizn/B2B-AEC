---
description: Trigger autonomous build pipeline for a Phase
agent: build
---

# Autonomous Build Pipeline: $PHASE

You are orchestrating the multi-agent autonomous development pipeline for the BuonDesizn B2B Marketplace.
Execute the full 5-stage pipeline for the requested phase: **$PHASE**.

## Stage 1: Requirements Discovery (@pm)
1. Read @.agents/personas/pm.md
2. Check current state in @production_artifacts/MASTER_PROGRESS.md
3. Decompose $PHASE into independent vertical slices
4. Verify all dependency specs are DONE before proceeding
5. Output a dispatch plan for user approval

## Stage 2: Sub-Agent Dispatch (@engineer)
1. Read @.agents/personas/engineer.md
2. For each vertical slice:
   - Load relevant spec from @docs/specs/
   - Write failing tests first per @production_artifacts/TEST_MATRIX.md
   - Implement with `// @witness [SPEC-ID]` tags
   - Run guardrails:
     - @.agents/prompts/guardrails/check_company_dna.md
     - @.agents/prompts/guardrails/check_handshake_privacy.md
     - @.agents/prompts/guardrails/check_proximity_logic.md

## Stage 3: Verification & Witness Audit (@qa)
1. Read @.agents/personas/qa.md
2. For each feature:
   - Compare witness tags against test artifacts
   - Style audit against @docs/core/STYLEGUIDE.md
   - Schema audit against @docs/database/db_schema.md
   - RLS verification against @docs/database/rls_policies.md
   - State machine alignment against @docs/system/STATE_MACHINES.md
3. Produce `WITNESS_REPORT_<SpecID>.md` in @production_artifacts/

## Stage 4: Merge-Gate
1. Merge only branches with Witness Green status
2. Update @production_artifacts/MASTER_PROGRESS.md to GREEN
3. Output merge summary

## Stage 5: Deployment (@devops)
1. Read @.agents/personas/devops.md
2. Confirm Vercel deployment
3. Output final URL

## Non-Negotiable Rules
- **Developer's Oath**: Read @docs/core/SOUL.md
- **No Mocks**: Zero-mock architecture enforced (@.agents/skills/zero-mock-architecture.md)
- **TDD**: Tests before code
- **Witness Tags**: Every file must have `// @witness [SPEC-ID]`
- **RLS**: Never bypass Row Level Security
