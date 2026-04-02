---
id: DASHBOARDS
layer: interface

type: declarative
owner: system
mutable: true
criticality: high

depends_on:
  - db_schema
  - STATE_MACHINES

consumes:
  - analytics
  - rls_policies

provides:
  - dashboard_specs

validates:
  - role_consistency

runtime:
  triggers: []
  outputs_to: []

version: 1.0
---

# DASHBOARDS.md — Role & Admin Metrics

This document defines dashboard metrics for each role and the admin console.
All metrics map directly to existing schema fields or explicitly added tables.

---

## 1. Project Professional (PP)

| Metric | Source |
| --- | --- |
| Active RFPs | `rfps` (creator_id, status = 'OPEN') |
| Handshake Success Rate | `connections` (accepted / total for requester_id) |
| Nearby Consultants | `searching_nearby_profiles()` count for persona_type = 'C' |
| Searches Performed | `notifications` (notification_type = 'RFP_NEARBY') |
| RFP Responses | `rfp_responses` linked to creator's RFPs |

---

## 2. Consultant (C)

| Metric | Source |
| --- | --- |
| Inbound Connections | `connections` where target_id = profile_id |
| Team Strength | `company_personnel` count where profile_id = owner |
| Services Offered Count | `consultants.services_offered` length |
| Profile Updated Recently | `consultants.updated_at` recency |
| Organization Age | `profiles.establishment_year` |

---

## 3. Contractor (CON)

| Metric | Source |
| --- | --- |
| Workforce Stats | `contractors` staff fields |
| Fleet Size | `contractors.owned_equipment` length |
| Compliance Status | `contractors` ISO/OHSAS flags |
| Verified Team Size | `company_personnel` count (is_active = TRUE) |
| Project Capacity | `contractors.concurrent_projects_capacity` |
| RFP Acceptance Rate | `rfp_responses` (accepted / submitted by responder_id) |

---

## 4. Product Seller (PS)

| Metric | Source |
| --- | --- |
| Catalog SKU Count | `product_sellers.total_skus` |
| Inbound Connections | `connections` where target_id = profile_id |
| Products with MOQ | `products.min_order_quantity` not null |
| Priced SKUs % | `products.price_per_unit` or `price_range` present |
| Lead Velocity | monthly `connections` count |

---

## 5. Equipment Dealer (ED)

| Metric | Source |
| --- | --- |
| Fleet Availability | `equipment.current_status` counts |
| Maintenance Due Soon | `equipment.next_maintenance_due_date` within 30 days |
| Rental Revenue | `equipment_bookings.total_amount` where `payment_status = 'COMPLETED'` |
| Late Returns | `equipment_bookings.returned_at > end_date` |
| Park Location Completeness | `equipment_dealers.park_location` not null |

---

## 6. Admin Dashboard

| Module | Source |
| --- | --- |
| Identity Review | `profiles.verification_status`, GSTIN fields |
| Moderation Queue | `ads.status`, moderation flags |
| Personnel Audit | `unmasking_audit` (revealed_fields contains 'personnel_email') |
| Audit Explorer | `unmasking_audit`, `system_audit_log` |
| Global Toggles | `system_config` |
| Audit Purge Queue | `audit_purge_queue` |

---

## Notes

- The system has **no bid concept**. Any legacy “bid win rate” references are replaced by **RFP acceptance rate**.
- Search and profile visibility metrics are derived from `notifications` and `connections` activity.
