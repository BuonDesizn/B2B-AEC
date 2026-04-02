---
name: performance_scalability_audit
description: Rules for identifying and fixing common AEC-marketplace performance bottlenecks.
---

# Skill: Performance & Scalability Audit

This skill allows agents to proactively suggest architectural optimizations to prevent the "Empty Screen" and "Slow Search" failures.

---

## 🏎️ Database Performance (PostGIS)

- **Rule: Spatial Indexing**: Every table with a `geography` or `geometry` column MUST have a `GIST` index.
  - *Reference*: `CREATE INDEX idx_profiles_location ON profiles USING GIST (location);`
- **Rule: Result Set Caching**: Proximity search results for non-authenticated users must use **SWR** or **React Query** with a 60-second stale-time to avoid redundant ST_Distance calculations.
- **Rule: Materialized Views**: If search latency for "All Service Providers" exceeds 500ms, `@engineer` must propose a Materialized View for distance calculations.

---

## 🌐 Frontend Performance (Next.js 15)

- **Rule: PPR (Partial Prerendering)**: Static landing page content must be separated from dynamic "Distance-Weighted" results using Next.js `Suspense` and `PPR`.
- **Rule: Map Throttling**: Leaflet map bounds-change events must be debounced by at least 300ms before triggering a database fetch.
- **Rule: Asset Optimization**: All ad images MUST be served via **Supabase Storage Image Transformation** (WebP/Resized) to prevent high LCP (Largest Contentful Paint).

---

## 📈 Scalability Rules

1. **Connection Pooling**: Use the Supabase Transaction Pooler (:6543) for high-concurrency connection requests.
2. **Observability**: `@devops` must verify that **Sentry** captures all 5xx errors from Edge Functions.
3. **Queue Health**: `@devops` must monitor **Upstash QStash** delivery metrics for the 48-hour trial expiry.

---

## 🎯 Success Metrics
- **Discovery Latency**: <300ms for a 50km radius search.
- **Hydration Sync**: Zero hydration mismatches for the "Masked Info" client-side flip.
- **Core Web Vitals**: LCP <2.5s on 4G connections.
