---
name: audit_code
description: Skill rules for @qa (Security Specialist) to audit marketplace privacy and safety.
---

# Skill: Audit Marketplace Privacy & Safety

This skill governs how the **@qa** persona verifies the integrity of the BuonDesizn marketplace.

---

## 🛡️ Security Audit Checklist

### 1. **Postgres RLS (Row Level Security)**
- Verify each table in `db_schema.md` has an active RLS policy for the 5-role system.
- Ensure no developer bypasses RLS with `SET LOCAL ROLE authenticated`.

### 2. **Server-Side Masking**
- Verify contact information (Phone/Email) is MASKED until a valid `CONNECTION_ACCEPTED` event.
- Ensure that unmasking is done via PostGis/Vault, not client-side logic.

### 3. **Immutable Audit Trails**
- Verify that every `CONNECTION_REQUESTED` and `AD_CLICK` triggers a log entry in the `unmasking_audit` table.

---

## 🛡️ Content Safety & NLP

### 1. **Sightengine Moderation**
- Audit all image uploads (Portfolio, Catalog) for Sightengine-driven safety score validation.
- Block any URL or Image that fails the safety threshold.

### 2. **NLP-Based Moderation**
- Audit text inputs for "Lead Scraping" attempts or off-platform communication bypasses.

---

## 🎯 Verification Criteria
- Audit matches the `Technical_Specification.md` verification plan.
- No PII is exposed in search results.
- Performance: Search latency is <200ms with PostGIS distance weighting.
- Aesthetics: 100% adherence to "UI/UX Pro Max" glassmorphism and micro-animations.
