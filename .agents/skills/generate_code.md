---
name: generate_code
description: Skill rules for @engineer (Developer) to implement Next.js marketplace logic.
---

# Skill: Generate Marketplace Code

This skill governs how the **@engineer** persona scaffolds and implements logic for the BuonDesizn marketplace.

---

## 💻 Tech Stack & Standards

### 1. **Next.js App Router (AEC Pattern)**
- Strict use of Server Components for RLS-based data fetching.
- Use Client Components ONLY for interaction-heavy UI and Webhooks.

### 2. **Proximity-First Coding**
- Always include the `st_distance` query in discovery modules.
- Distance must be weighted (60/40) using the standardized Postgres trigger or helper function.

### 3. **UI/UX Pro Max (Aesthetics)**
- Premium, dark-mode-first styling using Tailwind CSS and Radix UI.
- Use subtle micro-animations (e.g., PostGis search loading skeletal UI).
- Ensure 5-role visual isolation (distinct color themes/badges for each role).

### 4. **Zero-Mock Architecture**
- Forbidden: "Lorem Ipsum" or fake UI placeholders.
- Requirement: All components must consume valid PostgreSQL data shapes or official seed scripts.

---

## 🛠️ Logic Hooks (The 10-Module Blueprint)

### 1. **Identity & Persona**
- Implement `identity_persona_specialist` logic: Email-to-role binding at the Auth Hook level.

### 2. **Discovery & Search**
- Use `discovery_proximity_specialist` rules: No client-side search filtering for PII.

### 3. **Handshake & Privacy**
- Use `handshake_privacy_specialist` hooks: Server-side masking for `unmasking_audit` events.

### 4. **Payments & Ads**
- Implement `phonepe_payments_specialist` PG logic: Activation/Expiry triggers.

---

## 🎯 Completion Criteria
- Code matches the approved `Technical_Specification.md`.
- No bypass of Row Level Security (RLS).
- All new components include a `README.md` explaining their role dependency.
