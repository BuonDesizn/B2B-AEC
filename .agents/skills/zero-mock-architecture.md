---
name: zero-mock-architecture
description: Strict requirement forbidding placeholder UI data in the BuonDesizn application. Enforces Server Component action-driven data retrieval.
---

# Zero-Mock Architecture Enforcement

BuonDesizn aims to be a production-ready system from the first line of code. The platform requires absolute adherence to the "Zero-Mock" philosophy.

## The Rule
You, as an Agent, are strictly forbidden from writing frontend code that uses hardcoded, placeholder UI arrays or generic mock strings for rendering lists, properties, or metrics.

### Allowed
- **Fetching database counts directly on empty states** (e.g., pulling a Live count of `SELECT count(*) from profiles WHERE persona_type = 'CONTRACTOR'` via Supabase).
- **Relying on database table properties for rendering UI layouts**. 

### Forbidden
- **Empty State "Lorem Ipsum" Strings**. (No "Start your journey by making 3 proposals" unless it relies on actual logic).
- **Fake UI Elements**. (No "Card UI Template [Demo Image] [Demo Name]". Use genuine, validated schemas).

## Implementation Directives

1. **Leverage Action-Driven Component Models**
   Build empty states that are purely action-driven ("You have no active RFPs. Start your first RFP here").
2. **Dynamic Placeholders**
   When mocking is unavoidable (e.g., seeding data during development), use official seed scripts connected strictly to the PostgreSQL definitions provided in `db_schema.md` or the `supabase/seed.sql` file.

Failure to follow this standard leads to data duplication issues, technical debt, and a high likelihood of bugs. All components created must instantly be able to consume production shapes.
