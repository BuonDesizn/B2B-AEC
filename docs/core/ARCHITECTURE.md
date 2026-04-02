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

---

## 🛡️ 4. Explicit Exclusions

> [!CAUTION]
> **NO PO GENERATION**: This platform does NOT handle Purchase Order generation, financial transactions between users, or escrow services. The system's boundary ends at the successful **PII Unmasking and Handshake**.

---

## 🔗 Related Documentation
- 🌌 **[SOUL.md](SOUL.md)**: Philosophical Principles.
- ⚙️ **[SYSTEM.md](SYSTEM.md)**: Operational Framework.
- 📖 **[UBIQUITOUS_LANGUAGE.md](UBIQUITOUS_LANGUAGE.md)**: Domain Glossary.
