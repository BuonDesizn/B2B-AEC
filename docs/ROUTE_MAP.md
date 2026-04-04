# BuonDesizn B2B Marketplace - Route Map

## Legend
- ✅ = Built & Connected
- ⚠️ = Built but needs testing
- ❌ = Missing/Not Built
- (A) = Admin Only

---

## 🔐 AUTH ROUTES (Public)
```
┌─────────────────────────────────────────┐
│              / (Landing)                │
│                   │                      │
│         ┌────────┴────────┐             │
│         ▼                 ▼             │
│   /auth/login        /auth/signup       │
│   (✅)               (✅)                │
│         │                 │              │
│         ▼                 ▼             │
│   /auth/callback ←─── (OAuth)          │
│   (✅)                                    │
└─────────────────────────────────────────┘
         │
         ▼
   ┌───────────────┐
   │ /dashboard    │ (Authenticated)
   │ /admin (A)    │ (super_admin only)
   └───────────────┘
```

---

## 👤 USER ROUTES (Authenticated)

### Base Routes (All Roles)
```
/dashboard (✅) → /api/dashboard/metrics
/discover (✅)
/address-book (✅) → /api/address-book
/notifications (✅) → /api/notifications
/plan (✅) → /api/subscriptions/*
/settings/ (✅)
   ├── billing (✅)
   ├── contact (✅)
   ├── gstin (✅)
   ├── integrations (✅)
   ├── notifications (✅)
   ├── password (✅)
   └── privacy (✅)
```

---

### PP - Project Professional
```
/rfps (✅) → /api/rfps
   ├── /rfps/new (✅) → POST /api/rfps
   ├── /rfps/browse (✅) → GET /api/rfps/browse
   └── /rfps/[id] (✅)
        ├── /rfps/[id]/edit (✅) → PATCH /api/rfps/[id]
        ├── /rfps/[id]/responses (✅) → GET /api/rfps/[id]/responses
        └── /rfps/[id]/responses/[responseId] (✅)
             └── → POST /api/rfps/[id]/responses/[responseId]/accept

/portfolio (✅) → /api/profiles/me/portfolio
/my-projects (✅) → /api/projects/me
```

### C - Company
```
All PP routes +
/my-team (✅) → /api/company-personnel
/firm (✅) → /api/profiles/[id]
/services (✅) → /api/services
```

### CON - Contractor
```
All PP routes +
/my-team (✅)
/my-equipment (✅) → /api/equipment
```

### PS - Product Seller
```
/products (✅) → /api/products
   ├── /products/new (✅) → POST /api/products
   ├── /products/[id] (✅)
   └── /products/[id]/edit (✅) → PATCH /api/products/[id]

/ads (✅) → /api/ads
   ├── /ads/new (✅) → POST /api/ads
   └── /ads/[id]/edit (✅)

/enquiries (✅) → /api/rfps/* (responses)
```

### ED - Equipment Dealer
```
/equipment (✅) → /api/equipment
   ├── /equipment/new (✅) → POST /api/equipment
   ├── /equipment/[id] (✅)
   └── /equipment/[id]/edit (✅)

/ads (✅)
/enquiries (✅)
```

---

## 🔧 CONNECTIONS (All Roles)
```
/connections/ (⚠️)
   ├── incoming (✅) → GET /api/connections
   ├── request (✅) → POST /api/connections
   └── [id] (✅)
        ├── → GET /api/connections/[id]
        ├── → POST /api/connections/[id]/accept
        └── → POST /api/connections/[id]/reject
```

---

## 💳 PAYMENT (All Roles)
```
/payment/
   ├── pending (✅)
   ├── success (✅)
   └── failed (✅)
        ↓
   /api/payment/phonepe/*
        ├── init (✅)
        └── callback (✅)
```

---

## 🎯 SYSTEM ROUTES
```
/onboarding/ (✅)
   └── profile (✅)

/verification/ (✅)
   ├── pending (✅)
   └── rejected (✅)

/locked (✅)
/maintenance (✅)
```

---

## 👑 ADMIN ROUTES (super_admin only)

```
/admin (✅) → /api/admin/dashboard
   │
   ├── /admin/identity (⚠️) → /api/admin/identity/*
   │       └── pending (✅)
   │       └── [id]/approve (✅)
   │       └── [id]/reject (✅)
   │
   ├── /admin/moderation (⚠️) → /api/moderation/*
   │       └── history (✅)
   │
   ├── /admin/companies (⚠️) → /api/admin/companies
   │       └── [gstin] (✅)
   │
   ├── /admin/users (⚠️) → /api/admin/users
   │       └── [id] (✅)
   │       └── [id]/suspend (✅)
   │       └── [id]/reinstate (✅)
   │
   ├── /admin/ads (⚠️)
   │       └── [id] (✅)
   │
   ├── /admin/payments (⚠️) → /api/admin/payments
   │       └── reconcile (✅)
   │
   ├── /admin/audit (⚠️) → /api/admin/audit
   │       ├── unmasking (✅)
   │       └── purge (✅)
   │            └── [id]/approve (✅)
   │
   ├── /admin/jobs (⚠️) → /api/jobs/*
   │
   └── /admin/config (⚠️)
        ├── plans (✅) → /api/admin/config/plans
        └── dqs (✅) → /api/admin/config/dqs
```

---

## 📊 API ROUTES SUMMARY

| Category | Count | Status |
|----------|-------|--------|
| Auth | 3 | ✅ Callback only |
| Profiles | 12 | ⚠️ Partial |
| RFPs | 12 | ⚠️ Partial |
| Products | 4 | ⚠️ Partial |
| Equipment | 4 | ⚠️ Partial |
| Ads | 8 | ⚠️ Partial |
| Connections | 7 | ⚠️ Partial |
| Admin | 25+ | ⚠️ Partial |
| Jobs | 5 | ✅ Background |
| Payment | 2 | ✅ PhonePe |
| Notifications | 4 | ✅ |
| Discovery | 3 | ⚠️ Partial |

---

## 🚨 MISSING/GAPS

### Pages Not Built
- [ ] /my-projects (placeholder only)
- [ ] /firm-profile (need /firm alias?)

### API Routes Missing
- [ ] /api/search/* (discovery search)
- [ ] /api/discovery/*

### Features Not Implemented
- [ ] Image upload for products/equipment/rfps
- [ ] Rich text editor
- [ ] Real-time chat/messaging
- [ ] Email notifications (Resend configured but not wired)
- [ ] Advanced search/filters
- [ ] Charts/analytics visualizations

---

## 🔗 FLOW DIAGRAM

```
User Login
    │
    ├─→ super_admin → /admin (Dashboard)
    │       │
    │       ├─→ Identity → /admin/identity
    │       ├─→ Moderation → /admin/moderation
    │       ├─→ Companies → /admin/companies
    │       ├─→ Users → /admin/users
    │       ├─→ Ads → /admin/ads
    │       ├─→ Payments → /admin/payments
    │       ├─→ Audit → /admin/audit
    │       ├─→ Jobs → /admin/jobs
    │       └─→ Config → /admin/config
    │
    └─→ regular_user → /dashboard
            │
            ├─→ Discover → /discover
            ├─→ RFPs → /rfps
            ├─→ Products (PS) → /products
            ├─→ Equipment (ED) → /equipment
            ├─→ Connections → /connections
            └─→ Settings → /settings
```

---

*Last Updated: 2026-04-05*
*Total: 75 pages, 97 API routes*
*Estimated: 65% complete*