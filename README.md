# BuonDesizn B2B Marketplace
> **Status:** Production Kickoff Preparation
> **Mission:** The definitive AEC (Architecture, Engineering, Construction) procurement platform for India.

---

## 🏗️ Repository Architecture

| Directory | Purpose |
| :--- | :--- |
| [`app_build/`](app_build/) | Next.js 15 (App Router) + Tailwind CSS + Supabase. |
| [`docs/`](docs/) | **Single Source of Truth** for DB schemas, RLS, and Logic. |
| [`.agents/`](.agents/) | Governance rules and skills for the autonomous developer pipeline. |
| [`supabase/`](supabase/) | Migrations, seed data, and local dev config. |

### 📂 Detailed Documentation Map
- 🌌 **[Core Documents](docs/core/)**: `SOUL.md`, `SYSTEM.md`, `ARCHITECTURE.md`, `PATTERNS.md`, `UBIQUITOUS_LANGUAGE.md`, `STYLEGUIDE.md`.
- 🔐 **[Database/Security](docs/database/)**: `db_schema.md`, `rls_policies.md`, `MOCK_DATA_BLUEPRINT.md`.
- 🔌 **[API/Events](docs/api/)**: `API_CONTRACT.md`.
- 📊 **[System/Dashboards](docs/system/)**: `EVENTS.md`, `DASHBOARDS.md`, `STATE_MACHINES.md`, `CONTRACT_ALIGNMENT.md`, `GAP_ANALYSIS_SUMMARY.md`.
- 🤝 **[Business Logic](docs/business/)**: `business_logic_edge_cases.md`.
- 📋 **[Specs](docs/specs/)**: Formal spec documents (ID-001, CON-001, ED-001, AD-001, HD-001, MOD-001, MON-001, PP-001, PS-001, RFP-001, RM-001, UI-001).
- 📁 **[Audit](docs/audit/)**: Flow audits and legacy role documentation.
- 🗺️ **[Strategy](docs/strategy/)**: Strategic planning and execution roadmaps.

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
cd app_build && npm install && cd ..

# 2. Copy env vars and fill in real values
cp .env.example app_build/.env.local

# 3. Start local Supabase (requires supabase CLI)
supabase start

# 4. Apply migrations
supabase db push

# 5. Run the app
cd app_build && npm run dev
```

---

## 🤖 Autonomous Development

Building new features? Use the `/startcycle` command in your AI developer:

```
/startcycle "Describe your feature"
```

This triggers the SDD (Streamlined Development) loop — the full pipeline for spec-driven implementation, code generation, testing, and deployment. See [.agents/BOOTSTRAP.md](.agents/BOOTSTRAP.md) for agent onboarding and [.agents/workflows/startcycle.md](.agents/workflows/startcycle.md) for the workflow definition.

---

## 🤖 Specialized Agent Personas
This project is built and maintained by a specialized agentic fleet:
- **[@pm](.agents/personas/pm.md)**: Product Manager & Architect.
- **[@engineer](.agents/personas/engineer.md)**: Technical Implementation.
- **[@qa](.agents/personas/qa.md)**: Security & Testing.
- **[@devops](.agents/personas/devops.md)**: Infrastructure & Payments.

See **[AGENTS.md](AGENTS.md)** for detailed rules and coordination logic.

---

## 🚀 Active Development
Building out the core B2B marketplace with:
- **Key Personnel Management**: Master representative roster tied to Company DNA (GSTIN)
- **Identity System**: GSTIN linking & Company DNA verification ([ID-001](docs/specs/ID-001_identity_gstin_linking.md))
- **Core Marketplace Flows**: RFP lifecycle, product sellers, equipment dealers, contractors, consultants, project professionals
