---
name: deploy_app
description: Skill rules for @devops (Guardian) to manage environment integrity and PhonePe lifecycles.
---

# Skill: Deploy Marketplace App

This skill governs how the **@devops** persona manages infrastructure, deployment, and environment secrets for the BuonDesizn marketplace.

---

## 🏗️ Deployment Lifecycle

### 1. **Vercel/Supabase Integrity**
- Standard: Hands-free Vercel and Supabase deployment.
- Requirement: Synchronize Postgres schemas and Edge Functions before frontend deployment.

### 2. **PhonePe Activation Lifecycle**
- Implement Module 7 specs:
  - PhonePe Payment Gateway Dummy credentials as provided.
  - Activation/Expiry triggers for PG callbacks.
  - Verification of connectivity to the PG webhook.

### 3. **Environment Management**
- Use Vault for all API keys (Sightengine, PhonePe, Upstash).
- Ensure zero-secret exposure in application logs.

---

## 🛠️ Infrastructure Monitoring

### 1. **Asynchronous Jobs (Upstash)**
- Audit all Upstash QStash-driven jobs:
  - Trial termination (48hr).
  - RFP broadcast (Proximity-based).
  - Failure/Fallback callbacks.

### 2. **CI/CD Quality Gate**
- Block deployment if `audit_code.md` or `run_tests.md` report failures.

---

## 🎯 Verification Criteria
- `Technical_Specification.md` deployment plan is followed.
- PhonePe dummy transaction test: SUCCESS.
- Staging-to-production health check: 100% (No regressions in AEC logic).
