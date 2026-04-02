---
id: SOUL
layer: governing
authority: master_governing_document
---

# 🌌 SOUL: The Strategic DNA of BuonDesizn

type: declarative
owner: human
mutable: false
criticality: high

depends_on: []
consumes:
  - product_principles

provides:
  - philosophical_constraints
  - non_negotiables

validates:
  - principle_integrity

runtime:
  triggers: []
  outputs_to:
    - SYSTEM
    - ARCHITECTURE

version: 1.0
---

# 🌌 SOUL: The Strategic DNA of BuonDesizn
> **Mission:** Transform Indian AEC procurement from a price-war bidding race into a trust-first, location-aware professional ecosystem.

---

## 🎯 Strategic Intent: The Problem We Solve
Traditional B2B platforms treat professionals as commodities. BuonDesizn challenges this by prioritizing **Proximity over Price**, **Relationships over Transactions**, and **Privacy over Visibility**.

- **Who's Nearby?** Discovery starts with location, reducing logistics friction.
- **Earned Visibility:** Contact info is a privilege earned through trust, not a public directory.
- **Broadcast Conversations:** RFPs are conversation starters, not auctions.

---

## 🧭 The Non-Negotiables (Core Principles)

### 1. Account Integrity
- **One Account, One Persona:** Roles are rigid to ensure specialized discovery.
- **Company DNA Linking:** Multiple roles (e.g., Contractor + Consultant) must be separate accounts linked by a shared **GSTIN**.

### 2. The Proximity Paradox
- **70/30 Ranking:** Search results weight **70% Quality (DQS)** and **30% Distance**.
- **Execution:** A responsive professional 15km away is superior to an unresponsive one 5km away.

### 3. Connection as Currency
- **Handshake Protocol:** PII (Email/Mobile) is masked until a connection request is **ACCEPTED**.
- **Spam Prevention:** Maintains professional boundaries by forcing intentionality.

### 4. Privacy by Architecture
- **Postgres-Level Enforcement:** Row Level Security (RLS) and server-side masking are foundational.
- **Hard Purge:** GDPR-compliant deletion (purged from storage, not just flagged).

---

## 🏗️ System Worldview

### The Handshake Economy
Trust escalates progressively:
`Masked Discovery` ➡️ `Connection Request` ➡️ `Accepted Handshake` ➡️ `Unmasked Contact`.

### Company DNA Synchronization
Trust is established at the **Entity Level** (GSTIN).
- **Inheritance:** An accepted handshake with a Master Account automatically unlocks visibility for sub-resources (Key Personnel, Equipment Fleets).
- **Control:** Master accounts manage the firm's collective capacity.

### Polymorphic Role Identity
| Role | Core Identity | Primary Filter |
| :--- | :--- | :--- |
| **Project Professional** | Individual Portfolio | Experience & Awards |
| **Consultant** | Key Personnel Roster | Turnover & Team Size |
| **Contractor** | Compliance Certs | Workforce & Capacity |
| **Product Seller** | SKU Catalog | Lead Time & Warranty |
| **Equipment Dealer** | Fleet GPS | Rental Rates & Availability |

---

## ⚖️ Strategic Tensions & Decisions

### 1. Subscription & Credits
- **One Fee, All-India Access:** Nationwide discovery unlocked by a single subscription.
- **Credit Governor:** 30 Handshake Credits/month prevent scraping and maintain quality.
- **Hard Lock:** 48-hour free trial followed by a complete dashboard lock until payment.

### 2. Lasting Connections
- **Permanence:** Once a handshake is accepted, the connection is permanent in the user's address book.

---

## 🔥 The "Legacy Autopsy" (Lessons Learned)
- **Fix:** Server-side masking to replace "Display: None" security theater.
- **Fix:** PostGIS backend enforcement for RFP radius (no client-side bypass).
- **Fix:** BullMQ background jobs for bulk SKU imports (no more timeouts).

---

## 📜 The Developer's Oath
1. **Never bypass RLS.**
2. **Never store PII in logs** (use UUIDs).
3. **Never assume geocoding accuracy** (always allow Manual Pin-Drop).
4. **Never skip audit trails** (log every unmasking event).
5. **Never optimize proximity away.**

---

## 🔗 Related Documentation
- ⚙️ **[SYSTEM.md](SYSTEM.md)**: The Tactical Operational Framework.
- 🏗️ **[ARCHITECTURE.md](ARCHITECTURE.md)**: Technical System Design.
- 🗺️ **[Roadmap](../strategy/execution_roadmap.md)**: Phase 1-4 Execution.

