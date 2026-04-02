<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. After `npm install` is run inside `app_build/`, read the relevant guide in `app_build/node_modules/next/dist/docs/plans/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# 🤖 Specialized Agent Personas

This repository uses a multi-agent persona architecture for autonomous development. Each persona is defined in `.agents/personas/` and coordinates via the **SDD (Streamlined Development) Loop**.

- **[@pm](.agents/personas/pm.md)**: Product Manager & Marketplace Architect. Orchestrates logic and architecture.
- **[@engineer](.agents/personas/engineer.md)**: Technical Implementation Specialist. Builds Next.js/Supabase logic.
- **[@qa](.agents/personas/qa.md)**: Security & Integrity Specialist. Ensures privacy and functional correctness (TDD).
- **[@devops](.agents/personas/devops.md)**: Infrastructure & Payments Guardian. Manages deployment and monetization pipelines.
