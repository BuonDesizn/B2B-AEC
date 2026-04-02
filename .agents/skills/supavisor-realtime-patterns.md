---
name: supavisor-realtime-patterns
description: Performance architecture for splitting queries between connection pooling (Supavisor) and instant UI updates (WebSockets/Realtime)
---

# Supavisor & Realtime Split Patterns

BuonDesizn enforces strict data flow architecture to prevent rate-limit exhaustion and memory bottlenecks.

## The Problem
Using thousands of active WebSocket connections for trivial metric lookups (like "Total users online") exhausts Postgres connection limits and spikes Supabase costs. Conversely, using cached API routes for instantaneous events (like accepting a Handshake) provides terrible real-time UX.

## The Blueprint Pattern

### Rule 1: Static Read Queries Must Use Supavisor
Any query that does not require millisecond-level reaction times **MUST** be routed through Supavisor (connection pooler) and heavily cached.
- **Example**: Rendering Empty State metrics ("Join 1,200 other contractors on the platform").
- **Example**: Generating the Discovery Map with PostGIS search results.
- **Implementation**: Use Next.js Server Components with `unstable_cache` or `next: { revalidate: 3600 }` alongside the Supavisor connection string (`postgres://postgres.[project_id]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`).

### Rule 2: Instant Overlays Use Supabase Realtime
Reserve WebSockets **strictly** for interactions that require instant UI updates between two or more specific clients.
- **Example**: Accepting a Connection Request / "Handshake" (both users must instantly see contact masking drop).
- **Example**: Responding to an RFP.
- **Implementation**: Subscribing to the `chat_messages` or `connections` tables via `@supabase/supabase-js` Realtime client channels.

## Summary Checklist
1. Are you pulling national counts? -> **Use Supavisor + Next Cachng (ISR).**
2. Are you loading a massive map? -> **Use Supavisor + Next Server Components.**
3. Are two users shaking hands? -> **Use Supabase Realtime (WebSockets).**
4. Are two users chatting? -> **Use Supabase Realtime (WebSockets).**
