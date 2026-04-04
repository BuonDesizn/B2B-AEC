---
id: ARCHITECTURE
layer: implementation
authority: master_governing_document
---

# 🏗️ ARCHITECTURE: Technical System Design & Flow

This document details the vertical slices of the BuonDesizn B2B Marketplace, focusing on discovery, privacy, and procurement.

---

## 🧭 1. Procurement Workflows (RFP & Handshake)

### **A. Discovery & Scoring**
The system uses a **70/30 DQS/Distance** weighting for all roles.
- **RFP Scoring**: Automated "Go/No-Go" scoring for vendors based on their profile's DQS and proximity to the project location.
- **Radius**: Default discovery radius is **50km**.

### **B. The Handshake Protocol**
Trust escalates progressively to protect PII:
1. **MASKED Stage**: PII (Phone/Email) is replaced by `***` or server-side masks by default.
2. **REQUESTED Stage**: User sends a "Connection Request" or "RFP Response".
3. **ACCEPTED (Unmasked)**: Upon acceptance, Postgres RLS policies allow authenticated disclosure, and audit logs are recorded.

> **Note**: Subscription status values are lowercase: `trial`, `active`, `expired`, `hard_locked`. The transition from `expired` to `hard_locked` is immediate.

### **C. Address Book Persistence**
Once a handshake is `ACCEPTED`, the connection is stored permanently in the `public.address_book` table for easy re-discovery.

---

## 🛠️ 2. Data & Security Logic

### **A. Storage Policies**
- **Attachments**: Technical drawings and project docs are stored in Supabase Storage.
- **Access Control**: Attachments are served via **Signed URLs with a 60-minute TTL (Time-To-Live)**.

### **B. Audit Infrastructure**
- **Immutable Ledger**: Every unmasking event, RFP broadcast, and trial lock state change MUST emit an event and be logged to `public.unmasking_audit`.

---

## 📐 3. Engineering Constraints

### **A. Performance Mandates**
- **Indexing**: All geography columns MUST have `GIST` indexes for fast spatial queries.
- **Latency**: Aim for `<300ms` response time on all "Nearby Professional" discovery queries.
- **Caching**: Use **SWR** (or React Query) to handle stale-while-revalidate for radius-based search results.

### **B. Frontend Optimizations**
- **Mobile-First Response**: RFP review and Handshake acceptance UIs must be optimized for on-site tablet/mobile usage for field contractors.
- **Next.js 15**: Use **PPR (Partial Prerendering)** on discovery landing pages to optimize LCP.

### **C. Real-Time Communication**
- **Polling-based** (NOT WebSocket): Use short-interval HTTP polling for real-time features (RFP status updates, connection requests, notifications).
- Polling interval is configurable per page, defaulting to 5 seconds for active views and 30 seconds for background tabs.

### **D. DQS (Design Quality Score) Updates**
- DQS is calculated **on-demand via QStash** — no pg_cron or scheduled jobs.
- When a profile's audit data changes, a QStash webhook triggers a recalculation.
- This eliminates the need for database-level schedulers and scales with traffic.

### **E. CORS Configuration**
- CORS is configured to allow only the production and preview deployment origins.
- Local development (`localhost:3000`) is allowed via environment variable gating.
- All API routes enforce strict origin checking; wildcard `*` is NEVER used in production.

### **F. Rate Limiting**
- Rate limiting is applied at the API route level using an in-memory / Upstash Redis sliding window.
- Default limits: 100 requests/minute for authenticated users, 20 requests/minute for unauthenticated.
- RFP creation and handshake initiation have stricter limits to prevent abuse.
- Rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`) are included in all API responses.

---

## 🛡️ 4. Explicit Exclusions

> [!CAUTION]
> **NO PO GENERATION**: This platform does NOT handle Purchase Order generation, financial transactions between users, or escrow services. The system's boundary ends at the successful **PII Unmasking and Handshake**.

---

## 🔗 Related Documentation
- 🌌 **[SOUL.md](SOUL.md)**: Philosophical Principles.
- ⚙️ **[SYSTEM.md](SYSTEM.md)**: Operational Framework.
- 📖 **[UBIQUITOUS_LANGUAGE.md](UBIQUITOUS_LANGUAGE.md)**: Domain Glossary.
