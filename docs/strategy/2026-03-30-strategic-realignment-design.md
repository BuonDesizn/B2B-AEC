# Strategic Realignment Design: The Quality-First "National Pro" Marketplace

**Date**: 2026-03-30  
**Status**: 🟢 **Approved & Locked**  
**Stakeholder**: Human Admin

## 1. Executive Summary
This document codifies the five critical "Strategic Tension" resolutions decided during the March 2026 Architectural Sync. It shifts the platform from a "Proximity-First Directory" to a "Quality-Led Professional Network" with a unified India-wide monetization model.

---

## 2. The Trust Engine (DynaQual Score - DQS)

### 2.1 The 70/30 Rule
Discovery ranking is no longer dominated by KM distance. It uses a weighted formula to prioritize performance.
- **70% Weight**: Dynamic Quality Score (DQS)
- **30% Weight**: Proximity (Distance Score)

### 2.2 DQS Components
The system autonomously calculates the DQS periodically:
| Metric | Weight | Measurement |
| :--- | :--- | :--- |
| **Responsiveness** | 40% | Average time to respond to handshake requests (Handshake Latency). |
| **Trust Loops** | 30% | Number of repeat handshakes or "Extended Engagements" between the same pair. |
| **Verification** | 20% | Binary state of GSTIN/Identity validation + Admin "Office Visit" flag. |
| **Profile Depth** | 10% | Completeness of high-res portfolios and SKU metadata. |

---

## 3. Monetization: The "National Pro" Model

### 3.1 Tier Structure
We have removed all "Regional" or "State" tiers. 
- **The Subscription**: Unified "India Access" for a fixed monthly fee.

### 3.2 Handshake Economy
- **30 Credits/Month**: Every paid user receives 30 credits to initiate *new* unmasking handshakes.
- **Permanent Reveals**: Once a handshake is accepted, the connection is **permanent**. The profile remains unmasked for that user forever.
- **Address Book**: Revealed contacts are stored in a persistent `address_book` table.

### 3.3 The 48-Hour Trial
- **Initial Phase**: 48 hours of full, "India-Access" features.
- **The Hard Lock**: At H+49, the entire dashboard is locked (Search/RFP/Messages) until the subscription is activated.

---

## 4. Identity Architecture: Shared Company DNA

### 4.1 Multi-Acount Policy
- **Rule**: "One Email = One Role" remains to maintain UX purity.
- **Fluidity**: Users who operate as both (e.g.) Consultant and Contractor can create two accounts.

### 4.2 Shared Verification
- Accounts are linked via a shared **GSTIN/Registration ID**.
- If Account A is verified by an Admin, the status is automatically mirrored to all linked accounts sharing the same Company DNA.
### 4.3 Company DNA Personnel Visibility
- **Rule**: Handshakes are **GSTIN-wide**.
- **Sync**: An `ACCEPTED` handshake between a Seeker and *any* role account sharing a GSTIN (e.g., Contractor or Consultant) automatically unmasks the **Key Personnel** for both accounts to that Seeker.
- **Privacy-by-Architecture**: Enforced via Postgres RLS checking `connections` status against the `profiles.gstin` linkage.

---

## 5. Geolocation: Map Pin-Drop Fallback

### 5.1 The Rural Challenge
To solve for sparse GPS/Address data in rural India:
- **System**: If Places Autocomplete fails or lacks precision, the user is presented with a satellite map.
- **Action**: User manually "Drops a Pin" at their exact site or office location.
- **Data**: We store the resulting Lat/Lng as the absolute source of truth for the 30% Distance ranking.

---

## 6. Implementation Guardrails

- [ ] **Database**: Implement `handshake_credits` (int) and `last_credit_reset_at` (timestamp) in `public.profiles`.
- [ ] **Database**: Create `public.address_book` (uuid owner_id, uuid contact_id).
- [ ] **Logic**: Update Search RPC to use the 70/30 DQS/Dist formula.
- [ ] **Security**: Implement Supabase Vault for PhonePe/GSTIN secrets.
- [ ] **Admin**: Create "Multi-Identity Verification" dashboard for linked accounts.
