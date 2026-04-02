---
name: startcycle
description: Trigger the autonomous developer pipeline for a new BuonDesizn marketplace feature.
---

# Workflow: Start Production Cycle

This workflow defines the `/startcycle` command that orchestrates the **BuonDesizn Agent Personas** into an autonomous developer pipeline.

---

## 🚀 Execution Logic

### 1. Requirements Discovery (@pm)
- **Goal**: Decompose high-level requests into **Independent Vertical Slices**.
- **Rules**: Use `dispatch_parallel.md` and `write_specs.md` skills to assign unique **Spec IDs**.
- **Status**: Check **[MASTER_PROGRESS.md](../../production_artifacts/MASTER_PROGRESS.md)** for dependencies.
- **Output**: Multi-spec design docs in `docs/` with populated **DoD Blocks**.
- **Approval Gate**: User approves the dispatch plan and spec-split.

### 2. Sub-Agent Dispatch (@pm)
- **Action**: Invoke **Parallel Sub-Agents** using `dispatching-parallel-agents` skill.
- **Isolation**: Each sub-agent is assigned a dedicated **Git Branch** (e.g., `feat/id-linking`).
- **Loop**: Each sub-agent runs the internal **TDD ➡️ Code ➡️ QA Audit** loop for their slice.

### 3. Verification & Witness Audit (@qa)
- **Goal**: Final verification of **Witness Traceability** and **Visual DNA**.
- **Mechanism**: 
  - Compare `// @witness [Spec-ID]` tags against the branch's test artifacts.
  - **Style Audit**: Verify CSS/Components against **[STYLEGUIDE.md](../../docs/core/STYLEGUIDE.md)**.
  - **Schema Audit**: Ensure data models align with **[db_schema.md](../../docs/database/db_schema.md)** traceability mapping.
- **Output**: `WITNESS_REPORT_<SpecID>.md` in `production_artifacts/`.

### 4. Witness Merge-Gate (@pm/@devops)
- **Goal**: Merge verified branches into the main production build.
- **Rule**: Only branches with **Witness Green** status in the dashboard are eligible for merger.
- **Status**: Update **MASTER_PROGRESS.md** to `GREEN` post-merge.

### 5. Deployment (@devops)
- **Goal**: Deploy the unified production build to Vercel/Supabase.
- **Output**: Final Deployment URL and Milestone Confirmation.

---

## 🎯 Trigger Command
**/startcycle "Describe your feature or bugfix here"**
(Gemini will autonomously: write spec → await approval → generate code → QA audit → DevOps deploy).
