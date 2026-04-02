---
name: b2b-aec-procurement
description: Architecture for discovery and **Handshake Economy** unmasking logic.
---

# B2B AEC Procurement Logic

This skill governs the high-fidelity discovery and unmasking workflow (see [`SOUL.md`](file:///Users/ssrrattan/Documents/b2b%20ref%20pc/docs/core/SOUL.md)).

---

## 🧭 Workflow Authority (Master Architecture)

Agents must strictly follow the procurement flows defined in:
📖 **[ARCHITECTURE.md](file:///Users/ssrrattan/Documents/b2b%20ref%20pc/docs/core/ARCHITECTURE.md)**

---

## 🔄 Core Logic: RFP & Handshake

1.  **Discovery**: Find professionals via **70/30 DQS/Distance** weighting.
2.  **Intent**: Select "Request Proposal" or "Connect".
3.  **Escalation**:
    - Contact info is **MASKED** per [`UBIQUITOUS_LANGUAGE.md`](file:///Users/ssrrattan/Documents/b2b%20ref%20pc/docs/core/UBIQUITOUS_LANGUAGE.md).
    - User sends request ➡️ Vendor accepts ➡️ **The Handshake**.
    - Masking is removed; PII is revealed via Postgres **RLS**.
4.  **Audit**: Every unmasking event MUST be logged in the `public.unmasking_audit`.

---

## 🚫 EXCLUSIONS (MANDATORY)

> [!CAUTION]
> **NO PO GENERATION**: Do NOT implement or reference Purchase Order generation, financial transactions, or escrow logic. This system is for **Discovery and Contact Unmasking** only.

---

## 🛠️ Technical Implementation
- **RPF Scoring**: Automated scoring based on DQS/Proximity.
- **Atomic Transactions**: Ensure RFP status updates and vendor notifications happen in a single Supabase transaction.
- **Attachment Storage**: project docs are served via **Signed URLs with a 60-minute TTL**.
