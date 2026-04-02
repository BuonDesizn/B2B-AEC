---
name: dispatch_parallel
description: Skill for @pm to decompose a high-level request into independent sub-tasks and dispatch them as parallel Claude Code sub-agents using the Agent tool.
---

# Skill: Parallel Sub-Agent Dispatch

This skill governs how **@pm** splits a complex request into independent vertical slices and dispatches each as a Claude Code sub-agent.

---

## Step 1 — Identify Independent Slices

A slice is independent if it shares **no database table** and **no API endpoint** with another slice currently in flight. When in doubt, keep slices sequential. Rules:

- Each slice maps to exactly **one Spec ID** (e.g., `ID-001`, `RM-001`)
- Each slice lives on its own git branch: `feat/<spec-id-slug>` (e.g., `feat/id-001-gstin`)
- Slices that share a table (e.g., `profiles`) must be sequential, not parallel

---

## Step 2 — Dispatch Each Slice as a Sub-Agent

Use the Claude Code **Agent tool** for each independent slice. The exact call format is:

```
Agent tool:
  subagent_type: "general-purpose"
  run_in_background: true        ← parallel execution
  description: "Implement <Spec-ID>: <short title>"
  prompt: |
    You are operating as @engineer in the BuonDesizn SDD pipeline.

    ## Your Task
    Implement Spec <SPEC-ID>: <spec title>.
    Full spec: docs/specs/<spec-file>.md

    ## Before Writing Any Code
    1. Read .agents/BOOTSTRAP.md (agent load order)
    2. Read docs/core/SOUL.md (non-negotiables)
    3. Read docs/core/SYSTEM.md (constraints)
    4. Read docs/core/PATTERNS.md (lib/ structure, Kysely patterns, Supabase client setup)
    5. Read the full spec at docs/specs/<spec-file>.md

    ## Rules
    - Every file you create or modify MUST start with: // @witness [<SPEC-ID>]
    - Work on branch: feat/<branch-name>
    - Follow Zero-Mock Architecture (docs/skills/zero-mock-architecture.md)
    - Run guardrail checks before finishing:
        .agents/prompts/guardrails/check_company_dna.md
        .agents/prompts/guardrails/check_handshake_privacy.md
        .agents/prompts/guardrails/check_proximity_logic.md
    - Write failing Vitest tests FIRST (TDD), then implement
    - Use Kysely for all DB queries — see docs/core/PATTERNS.md §Kysely
    - Output a WITNESS_REPORT_<SPEC-ID>.md in production_artifacts/ when done
```

### Concrete Example — dispatching ID-001 and RM-001 in parallel

These two slices are independent (ID-001 touches `profiles`/`company_personnel`, RM-001 only reads `profiles` via RPC). Call both Agent tools in the **same message**:

```
[Agent tool call 1]
subagent_type: "general-purpose"
run_in_background: true
description: "Implement ID-001: GSTIN Linking"
prompt: |
  You are @engineer. Implement Spec ID-001.
  Read docs/specs/ID-001_identity_gstin_linking.md first.
  Branch: feat/id-001-gstin
  ... (full prompt as above)

[Agent tool call 2]
subagent_type: "general-purpose"
run_in_background: true
description: "Implement RM-001: Proximity Ranking"
prompt: |
  You are @engineer. Implement Spec RM-001.
  Read docs/specs/RM-001_discovery_proximity_ranking.md first.
  Branch: feat/rm-001-proximity
  ... (full prompt as above)
```

Both run simultaneously. You will be notified when each completes.

---

## Step 3 — Collect and Verify Results

When a sub-agent completes:

1. Read `production_artifacts/WITNESS_REPORT_<SPEC-ID>.md`
2. Verify every implementation file has `// @witness [<SPEC-ID>]`
3. Verify all Vitest tests pass: `cd app_build && npm run test`
4. Run @qa audit: dispatch a **foreground** @qa agent with the branch name
5. Only then: merge `feat/<branch>` → `main` and update `MASTER_PROGRESS.md` → GREEN

---

## Dependency Rules (When NOT to Parallelise)

| Condition | Action |
|-----------|--------|
| Slice B reads a table Slice A creates | Sequential: A first, then B |
| Two slices modify the same API route | Sequential |
| Slice B's tests depend on Slice A's seed data | Sequential |
| Completely different tables + routes | Parallel ✓ |
| One reads, one writes the same table | Parallel only if no schema change ✓ |

---

## MASTER_PROGRESS.md Updates

When dispatching:
1. Add new rows for each slice with status `GREY` (planned)
2. Change to `YELLOW` when sub-agent is running
3. Change to `GREEN` only after @qa witness audit passes
4. Never merge a `RED` branch
