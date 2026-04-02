# Strategy: Business Logic & Edge Cases

This document describes the unique strategic logic implemented in the BuonDesizn B2B Marketplace.

## 1. The Proximity Paradox (70/30)
**Problem**: Traditional "distance-only" ranking promotes low-quality local options over high-quality regional experts.
**Solution**: A weighted 70/30 ranking system:
- **70%**: Design Quality Score (DQS), calculated from past performance and audit tags.
- **30%**: Haversine geographical distance.
- **Result**: Users see the *best* available profiles first, even if they are slightly further away.

## 2. The Handshake Economy
**Problem**: B2B firms want to protect their personnel rosters from poaching and cold-calling.
**Solution**: Sequential Unmasking:
1. **Discover**: Publicly see firm specialty and DQS.
2. **Connect**: Initiate a "Handshake" (requires mutual acceptance).
3. **Reveal**: Upon acceptance, the full `company_personnel` (email/phone) and specific `unmasking_audit` logs are shared.

## 3. Role Fluidity & Identity
**Problem**: Users often change firms or operate in multiple roles (e.g., a Consultant who also Bids as a Contractor).
**Solution**: Single PAN Identity:
- A user's reputation follows their permanent PAN ID.
- Swappable dashboards allow them to switch personas while maintaining a single login/identity.

## 4. Rural Geocoding & Edge Coverage
**Problem**: Many Tier-2 and Tier-3 rural locations in India have unreliable GPS/Zip mapping.
**Solution**: Admin-curated fallbacks:
- If a location is not automatically geocoded, it is queued for admin review in the **Waiting Room**.
- PostGIS functions provide a "nearest regional hub" fallback to ensure zero-empty search results.
