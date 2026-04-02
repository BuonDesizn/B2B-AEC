# Supabase Postgres Best Practices

Source: https://www.skills.sh/supabase/agent-skills/supabase-postgres-best-practices

## Core Principles

- **Security First**: Always use Row-Level Security (RLS) for privacy.
- **Performance**: Optimize PostGIS queries for "Proximity First" search.
- **Schema Design**: Use polymorphic profiles for the 5 distinct roles in AEC.

## Rule Categories

### 1. Security & RLS (Critical)
- Use `auth.uid()` or `auth.jwt() ->> 'org_id'` for tenant isolation.
- Avoid wide-open policies; explicitly define `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
- Mask PII at the DB level where possible.

### 2. Query Performance
- **Indexes**: Ensure partial indexes for frequently filtered columns (e.g., `where is_verified = true`).
- **PostGIS**: Use GIST indexes for location coordinates. Use `ST_DWithin` for radius searches.
- **EXPLAIN**: Periodically run `EXPLAIN ANALYZE` on discovery queries.

### 3. Connection Management (Serverless)
- Since we use **Serverless Vercel**, use the Supabase client efficiently.
- Prefer `supabase-js` for simple RLS-bound queries.
- Use Edge Functions for any operation exceeding the Vercel function timeout.

## Proximity Search Pattern (BuonDesizn)
```sql
-- Search for professionals within a radius
SELECT *
FROM profiles
WHERE role = 'Contractor'
  AND ST_DWithin(location, ST_MakePoint(lon, lat)::geography, radius_meters)
ORDER BY location <-> ST_MakePoint(lon, lat)::geography;
```
