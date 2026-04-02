# 🛡️ Guardrail Check: Proximity-First Discovery Logic

**Status**: MANDATORY for all search/filtering modules.

## 📋 Compliance Checklist

- [ ] **DQS Calculation**: Does the logic weight **Quality (DQS)** at **70%** and **Distance** at **30%**? (See **Proximity Paradox** in [`SOUL.md`](file:///Users/ssrrattan/Documents/b2b%20ref%20pc/docs/core/SOUL.md))
- [ ] **Distance Logic**: Are we using **PostGIS (Geography)** for centroid-based distance instead of simple Euclidean math? (See [`SYSTEM.md`](file:///Users/ssrrattan/Documents/b2b%20ref%20pc/docs/core/SYSTEM.md))
- [ ] **Manual Override**: Does the system allow a user to manually drop a pin to reset their "discovery center"?
- [ ] **Radius Enforcement**: Is the discovery radius enforced server-side (using `ST_DWithin`)? (Standard: 50km radius)
- [ ] **Performance Audit**: Does the query maintain `<300ms` latency with `GiST` indexing?

---

## 🚫 Rejection Criteria
- Any search module where "Price" or "Name" is the default primary sort.
- Any module where the radius is filtered only on the client side.
