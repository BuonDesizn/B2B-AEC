---
title: Database Schema
id: DB_SCHEMA
type: technical_specification
status: production_ready
version: 2.0
last_updated: 2026-04-02
owner: @architect
criticality: high
[ARCHITECTURE]: ../core/ARCHITECTURE.md
[SOUL]: ../core/SOUL.md
[SYSTEM]: ../core/SYSTEM.md

# Complete Database Schema: BuonDesizn B2B Marketplace {#db-schema}

This document defines the relational architecture for the BuonDesizn
marketplace. All tables are optimized for `PostgreSQL 15+` with `PostGIS` and
`pg_cron`.

> [!IMPORTANT]
> **Source of Truth**: This document MUST match the migration SQL files in
> `supabase/migrations/`. Any discrepancy is a bug in this document.

## Schema Architecture

1. [Core Profiles & Identity](#core-profiles-identity)
2. [Role Extensions](#role-extensions)
3. [Connections & Handshakes](#connections-handshakes)
4. [Discovery & RFPs](#discovery-rfps)
5. [Advertising & Tiering](#advertising-tiering)
6. [Monetization & Subs](#monetization-subs)
7. [Catalogs (Products & Equipment)](#catalogs-products-equipment)
8. [Company Personnel](#company-personnel)
9. [Notification & Ops](#notification-ops)
10. [Audit & Privacy](#audit-privacy)
11. [Geospatial Functions](#geospatial-functions)
12. [Spec Traceability Mapping](#spec-traceability-mapping)
13. [System Configuration](#system-configuration)

---

## 12. Spec Traceability Mapping {#spec-traceability-mapping}
*This table maps database schema components to their respective Feature Specifications (Specs) to ensure 100% logic coverage during autonomous development.*

| Table/Component | Spec ID | Traceability Goal |
| :--- | :--- | :--- |
| `profiles` / `auth.users` | `ID-001` | Individual Identity (PAN) & Company DNA (GSTIN) linkage. |
| `project_professionals` | `PP-001` | Professional credentials and portfolio management. |
| `consultants` | `C-001` | Firm-level service scope and engineering compliance. |
| `contractors` | `CON-001` | Workforce, equipment fleet, and safety incident tracking. |
| `product_sellers` | `PS-001` | Bulk inventory, delivery radius, and credit terms. |
| `equipment_dealers` | `ED-001` | Heavy machinery rental, RC monitoring, and operator logistics. |
| `connections` | `HD-001` | Handshake Economy (Progressive trust & unmasking logic). |
| `address_book` | `HD-001` | Permanent relationship establishment post-handshake. |
| `rfps` / `rfp_responses` | `RFP-001` | Quality-First (70/30) Discovery & Asynchronous RFP Broadcaster. |
| `ads` / `ad_analytics` | `AD-001` | Geo-targeted hyper-local visibility for B2B. |
| `subscriptions` | `MON-001` | National Pro Model (India-wide access control). |
| `unmasking_audit` | `QA-001` | Compliance & Privacy (Immutable witness logs). |
| `system_config` | `RM-001` | Dynamic Ranking Weights & DQS parameters. |

---

## 1. Core Profiles & Identity {#core-profiles-identity}

### 1.1 Profiles Table

_The primary identity layer. Anchors **Individual Identity (PAN)** and **Company
DNA (GSTIN)**._

```sql
CREATE TABLE profiles (
  -- Identity
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,

  -- Persona Type (Strict Isolation - Role Fluidity handled via PAN linkage)
  persona_type TEXT NOT NULL CHECK (persona_type IN ('PP', 'C', 'CON', 'PS', 'ED')),

  -- PAN (Individual Identity Key — supports one persona per PAN)
  pan TEXT NOT NULL CHECK (pan ~ '^[A-Z]{5}[0-9]{4}[A-Z]{1}$'),

  -- GSTIN (Company DNA anchor — nullable for individuals)
  gstin TEXT CHECK (gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'),

  -- Display Info
  -- Canonical storage key is org_name (API may expose display_name alias)
  org_name TEXT,
  tagline TEXT,
  city TEXT,
  state TEXT,

  -- Organization Context
  is_individual BOOLEAN DEFAULT FALSE,
  establishment_year INT CHECK (establishment_year >= 1900 AND establishment_year <= EXTRACT(YEAR FROM CURRENT_DATE)),

  -- Geospatial (PostGIS) — nullable until user sets location
  location GEOGRAPHY(POINT, 4326),

  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  pincode TEXT CHECK (pincode ~ '^[0-9]{6}$'),

  -- Financial & Legal
  msme_number TEXT,

  -- PII (masked until ACCEPTED handshake — enforced by RLS)
  phone_primary TEXT CHECK (phone_primary ~ '^\+91[0-9]{10}$'),
  phone_secondary TEXT CHECK (phone_secondary ~ '^\+91[0-9]{10}$'),
  email_business TEXT CHECK (email_business ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  linkedin_url TEXT,

  -- Verification lifecycle
  verification_status TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION'
    CHECK (verification_status IN ('PENDING_VERIFICATION', 'PENDING_ADMIN', 'VERIFIED', 'REJECTED', 'SUSPENDED')),

  -- Monetization
  subscription_status TEXT NOT NULL DEFAULT 'trial'
    CHECK (subscription_status IN ('trial', 'active', 'expired', 'hard_locked')),
  trial_started_at TIMESTAMPTZ,
  handshake_credits INT NOT NULL DEFAULT 30,
  last_credit_reset_at TIMESTAMPTZ,
  has_india_access BOOLEAN DEFAULT FALSE,

  -- DQS (Discovery Quality Score — updated by cron at 2 AM daily)
  dqs_score NUMERIC(4,3) DEFAULT 0.0 CHECK (dqs_score BETWEEN 0.0 AND 1.0),
  dqs_responsiveness NUMERIC(4,3) DEFAULT 0.0,
  dqs_trust_loops NUMERIC(4,3) DEFAULT 0.0,
  dqs_verification NUMERIC(4,3) DEFAULT 0.0,
  dqs_profile_depth NUMERIC(4,3) DEFAULT 0.0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ DEFAULT now(),

  -- Integrity constraints
  CONSTRAINT unique_persona_per_individual UNIQUE (pan, persona_type)
);

-- GiST index for PostGIS proximity queries (<300ms target)
CREATE INDEX idx_profiles_location ON profiles USING GIST (location) WHERE deleted_at IS NULL;
CREATE INDEX idx_profiles_persona_type ON profiles (persona_type);
CREATE INDEX idx_profiles_gstin ON profiles (gstin) WHERE gstin IS NOT NULL;
CREATE INDEX idx_profiles_dqs ON profiles (dqs_score DESC);
CREATE INDEX idx_profiles_subscription_status ON profiles (subscription_status);
CREATE INDEX idx_profiles_deleted_at ON profiles (deleted_at) WHERE deleted_at IS NOT NULL;

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_self_access" ON profiles
  FOR ALL USING (auth.uid() = id);
```

---

## 2. Role Extensions {#role-extensions}

### 2.1 Project Professionals (PP)
```sql
CREATE TABLE project_professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  designation TEXT CHECK (designation IN ('Architect', 'Interior Designer', 'Landscape Architect', 'Urban Planner', 'Other')),
  experience_years INT CHECK (experience_years >= 0 AND experience_years <= 60),
  qualification TEXT,
  specialization TEXT[],
  coa_number TEXT,
  coa_expiry_date DATE,

  portfolio_summary TEXT CHECK (char_length(portfolio_summary) <= 500),
  total_projects INT DEFAULT 0,
  featured_project_ids UUID[],
  awards JSONB DEFAULT '[]'::jsonb,

  software_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  available_for_hire BOOLEAN DEFAULT TRUE,
  hourly_rate_min DECIMAL(10,2),
  hourly_rate_max DECIMAL(10,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pp_profile ON project_professionals(profile_id);
CREATE INDEX idx_pp_designation ON project_professionals(designation);

CREATE TRIGGER project_professionals_updated_at
  BEFORE UPDATE ON project_professionals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2.2 Consultants (C)
```sql
CREATE TABLE consultants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  company_type TEXT CHECK (company_type IN ('Proprietorship', 'Partnership', 'Private Limited', 'LLP', 'Public Limited')),
  annual_turnover_range TEXT CHECK (annual_turnover_range IN ('0-10L', '10L-50L', '50L-1Cr', '1Cr-5Cr', '5Cr-10Cr', '10Cr+')),
  employee_count_range TEXT CHECK (employee_count_range IN ('1-10', '11-50', '51-200', '201-500', '500+')),

  services_offered TEXT[] NOT NULL,
  design_software TEXT[] DEFAULT ARRAY[]::TEXT[],

  iso_9001 BOOLEAN DEFAULT FALSE,
  iso_14001 BOOLEAN DEFAULT FALSE,
  iso_45001 BOOLEAN DEFAULT FALSE,
  other_certifications TEXT[],

  largest_project_value DECIMAL(15,2),
  typical_project_size TEXT CHECK (typical_project_size IN ('Small (<1Cr)', 'Medium (1-10Cr)', 'Large (10Cr+)')),
  accepting_new_projects BOOLEAN DEFAULT TRUE,
  min_project_value DECIMAL(10,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_c_profile ON consultants(profile_id);
CREATE INDEX idx_c_company_type ON consultants(company_type);

CREATE TRIGGER consultants_updated_at
  BEFORE UPDATE ON consultants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2.3 Contractors (CON)
```sql
CREATE TABLE contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  company_type TEXT CHECK (company_type IN ('Proprietorship', 'Partnership', 'Private Limited', 'LLP', 'Public Limited')),
  annual_turnover_range TEXT CHECK (annual_turnover_range IN ('0-1Cr', '1-5Cr', '5-10Cr', '10-25Cr', '25-50Cr', '50Cr+')),

  permanent_employees INT DEFAULT 0,
  skilled_workers INT DEFAULT 0,
  owned_equipment JSONB DEFAULT '[]'::jsonb,

  pf_registration_number TEXT,
  esic_registration_number TEXT,
  iso_9001 BOOLEAN DEFAULT FALSE,
  safety_incidents_last_year INT DEFAULT 0,

  work_categories TEXT[] NOT NULL,
  contractor_license_number TEXT,
  license_class TEXT CHECK (license_class IN ('Class I', 'Class II', 'Class III', 'Unlimited')),
  license_expiry_date DATE,

  concurrent_projects_capacity INT DEFAULT 1,
  largest_project_completed DECIMAL(15,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_con_profile ON contractors(profile_id);
CREATE INDEX idx_con_license_class ON contractors(license_class);

CREATE TRIGGER contractors_updated_at
  BEFORE UPDATE ON contractors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2.4 Product Sellers (PS)
```sql
CREATE TABLE product_sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  business_type TEXT CHECK (business_type IN ('Manufacturer', 'Wholesaler', 'Retailer', 'Distributor')) NOT NULL,
  brand_names TEXT[],
  primary_category TEXT NOT NULL,
  secondary_categories TEXT[],

  min_order_value DECIMAL(10,2),
  accepts_bulk_orders BOOLEAN DEFAULT TRUE,
  delivery_available BOOLEAN DEFAULT TRUE,
  delivery_radius_km INT DEFAULT 0,

  warehouse_locations JSONB DEFAULT '[]'::jsonb,
  total_skus INT DEFAULT 0,
  offers_credit BOOLEAN DEFAULT FALSE,
  credit_period_days INT DEFAULT 0,

  iso_certified BOOLEAN DEFAULT FALSE,
  bis_certified BOOLEAN DEFAULT FALSE,
  warranty_offered BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ps_profile ON product_sellers(profile_id);
CREATE INDEX idx_ps_business_type ON product_sellers(business_type);
CREATE INDEX idx_ps_category ON product_sellers(primary_category);

CREATE TRIGGER product_sellers_updated_at
  BEFORE UPDATE ON product_sellers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2.5 Equipment Dealers (ED)
```sql
CREATE TABLE equipment_dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  business_type TEXT CHECK (business_type IN ('Rental', 'Sales', 'Both')) NOT NULL,
  total_equipment_count INT DEFAULT 0,
  equipment_categories TEXT[] NOT NULL,

  park_location GEOGRAPHY(POINT, 4326),
  park_address TEXT,

  hourly_rental_available BOOLEAN DEFAULT FALSE,
  daily_rental_available BOOLEAN DEFAULT TRUE,
  provides_operators BOOLEAN DEFAULT FALSE,
  provides_transportation BOOLEAN DEFAULT TRUE,

  breakdown_support_24x7 BOOLEAN DEFAULT FALSE,
  all_rc_updated BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ed_profile ON equipment_dealers(profile_id);
CREATE INDEX idx_ed_business_type ON equipment_dealers(business_type);
CREATE INDEX idx_ed_categories ON equipment_dealers USING GIN(equipment_categories);
CREATE INDEX idx_ed_park_location ON equipment_dealers USING GIST(park_location) WHERE park_location IS NOT NULL;

CREATE TRIGGER equipment_dealers_updated_at
  BEFORE UPDATE ON equipment_dealers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 3. Connections & Handshakes {#connections-handshakes}

### 3.1 Connections Table
*The trust state machine. Governs visibility via **Handshake Economy**.*

```sql
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Context
  status TEXT NOT NULL DEFAULT 'REQUESTED'
    CHECK (status IN ('REQUESTED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'BLOCKED')),
  connection_source TEXT CHECK (connection_source IN ('SEARCH', 'RFP_RESPONSE', 'AD_CLICK', 'DIRECT')),
  requester_message TEXT,
  requester_shares_email BOOLEAN DEFAULT FALSE,
  requester_shares_phone BOOLEAN DEFAULT FALSE,
  target_shares_email BOOLEAN DEFAULT FALSE,
  target_shares_phone BOOLEAN DEFAULT FALSE,

  -- Timestamps
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days')
);

-- Partial unique: only one active connection per pair at a time
-- Allows re-request after REJECTED/EXPIRED
CREATE UNIQUE INDEX idx_connections_active_pair
  ON connections (requester_id, target_id)
  WHERE status IN ('REQUESTED', 'ACCEPTED');

CREATE INDEX idx_connections_requester ON connections (requester_id);
CREATE INDEX idx_connections_target ON connections (target_id);
CREATE INDEX idx_connections_status ON connections (status);
CREATE INDEX idx_connections_parties_status ON connections (requester_id, target_id, status);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "connections_parties_only" ON connections
  FOR ALL USING (auth.uid() IN (requester_id, target_id));
```

### 3.2 Address Book

```sql
CREATE TABLE address_book (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  first_handshake_id UUID REFERENCES connections(id),
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, contact_id)
);

ALTER TABLE address_book ENABLE ROW LEVEL SECURITY;

CREATE POLICY "address_book_owner_only" ON address_book
  FOR ALL USING (auth.uid() = owner_id);
```

### 3.3 Handshake Logic (Triggers)

```sql
-- Auto-Populate Address Book on ACCEPTED Handshake (Permanent Reveal)
CREATE OR REPLACE FUNCTION auto_populate_address_book()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'ACCEPTED' AND OLD.status != 'ACCEPTED' THEN
    INSERT INTO address_book (owner_id, contact_id, first_handshake_id)
    VALUES (NEW.requester_id, NEW.target_id, NEW.id)
    ON CONFLICT (owner_id, contact_id) DO NOTHING;

    INSERT INTO address_book (owner_id, contact_id, first_handshake_id)
    VALUES (NEW.target_id, NEW.requester_id, NEW.id)
    ON CONFLICT (owner_id, contact_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER address_book_auto_populate
  AFTER UPDATE ON connections
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_address_book();
```

---

## 4. Company Personnel {#company-personnel}

```sql
CREATE TABLE company_personnel (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_gstin TEXT NOT NULL,

  -- Public Layer
  full_name TEXT NOT NULL,
  designation TEXT NOT NULL,
  qualification TEXT,
  specialty TEXT[] DEFAULT ARRAY[]::TEXT[],
  experience_years INT,

  -- Masked Layer (RLS enforced)
  email TEXT,
  phone TEXT CHECK (phone ~ '^\+91[0-9]{10}$'),
  detailed_bio TEXT,
  profile_image_url TEXT,
  linkedin_url TEXT,

  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_personnel_gstin ON company_personnel (company_gstin);
CREATE INDEX idx_personnel_profile ON company_personnel (profile_id);

ALTER TABLE company_personnel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "personnel_owner_or_connected" ON company_personnel
  FOR SELECT USING (
    auth.uid() = profile_id
    OR EXISTS (
      SELECT 1 FROM connections c
      JOIN profiles p ON p.id = c.requester_id OR p.id = c.target_id
      WHERE c.status = 'ACCEPTED'
        AND (c.requester_id = auth.uid() OR c.target_id = auth.uid())
        AND p.gstin = company_personnel.company_gstin
        AND p.id != auth.uid()
    )
  );
```

---

## 5. Audit & Privacy {#audit-privacy}

```sql
CREATE TABLE unmasking_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trigger_event TEXT NOT NULL DEFAULT 'CONNECTION_ACCEPTED',
  revealed_fields TEXT[] NOT NULL,
  unmasked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  retention_expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '90 days')
);

ALTER TABLE unmasking_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_insert_only" ON unmasking_audit
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- Prevent audit modification (immutable)
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'unmasking_audit records are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_unmasking_update
  BEFORE UPDATE ON unmasking_audit
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_modification();

CREATE TRIGGER prevent_unmasking_delete
  BEFORE DELETE ON unmasking_audit
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_modification();
```

---

## 6. Subscriptions & Monetization {#monetization-subs}

### 6.1 Subscriptions Table

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL DEFAULT 'national_pro',
  status TEXT NOT NULL CHECK (status IN ('trial', 'active', 'expired', 'hard_locked')),
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  phonepe_order_id TEXT,
  phonepe_transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_profile ON subscriptions(profile_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_expires ON subscriptions(expires_at);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_self" ON subscriptions
  FOR ALL USING (auth.uid() = profile_id);
```

### 6.2 Subscription Plans (seed data)

```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT NOT NULL UNIQUE,
  plan_code TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plans_active ON subscription_plans(is_active, is_public);

-- Seed: National Pro plan
INSERT INTO subscription_plans (plan_name, plan_code, display_name, price_monthly, features) VALUES
  ('national_pro', 'NATPRO', 'National Pro', 999.00, '["Unlimited handshakes", "Priority discovery", "Ad campaigns", "Analytics dashboard"]')
ON CONFLICT (plan_code) DO NOTHING;

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscription_plans_select" ON subscription_plans
  FOR SELECT TO authenticated
  USING (is_active = TRUE AND is_public = TRUE);
```

---

## 7. RFP System {#discovery-rfps}

### 7.1 RFPs Table

```sql
CREATE TABLE rfps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 10 AND 100),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 50 AND 2000),

  sector_of_application TEXT NOT NULL,
  category TEXT NOT NULL,

  requirements JSONB NOT NULL,
  attachments TEXT[],

  project_location GEOGRAPHY(POINT, 4326) NOT NULL,
  project_address TEXT,
  project_city TEXT NOT NULL,
  project_state TEXT NOT NULL,

  notification_radius_meters FLOAT DEFAULT 50000 CHECK (notification_radius_meters BETWEEN 1000 AND 200000),

  target_personas TEXT[] NOT NULL CHECK (array_length(target_personas, 1) > 0),

  status TEXT CHECK (status IN ('DRAFT', 'OPEN', 'CLOSED', 'EXPIRED', 'CANCELLED')) DEFAULT 'DRAFT',

  is_public BOOLEAN DEFAULT TRUE,
  allow_direct_responses BOOLEAN DEFAULT TRUE,

  budget_min DECIMAL(12,2),
  budget_max DECIMAL(12,2),
  currency TEXT DEFAULT 'INR',
  estimated_duration_days INT,

  min_dqs_score FLOAT DEFAULT 0,
  verified_only BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  closes_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),

  views_count INT DEFAULT 0,
  responses_count INT DEFAULT 0,

  CONSTRAINT valid_rfp_dates CHECK (published_at IS NULL OR closes_at IS NULL OR closes_at > published_at),
  CONSTRAINT valid_expiry CHECK (closes_at IS NULL OR expires_at IS NULL OR expires_at >= closes_at)
);

CREATE INDEX idx_rfps_creator ON rfps(creator_id);
CREATE INDEX idx_rfps_status ON rfps(status);
CREATE INDEX idx_rfps_location ON rfps USING GIST(project_location) WHERE status = 'OPEN';
CREATE INDEX idx_rfps_category ON rfps(category);
CREATE INDEX idx_rfps_expires ON rfps(expires_at) WHERE status = 'OPEN';

ALTER TABLE rfps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rfps_select_open" ON rfps
  FOR SELECT TO authenticated
  USING (
    status = 'OPEN'
    OR auth.uid() = creator_id
  );

CREATE POLICY "rfps_owner_all" ON rfps
  FOR ALL USING (auth.uid() = creator_id);

CREATE TRIGGER rfps_updated_at
  BEFORE UPDATE ON rfps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 7.2 RFP Responses

```sql
CREATE TABLE rfp_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfp_id UUID NOT NULL REFERENCES rfps(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  proposal_text TEXT NOT NULL,
  bid_amount DECIMAL(12,2),
  estimated_days INT,
  attachments_url TEXT[],

  status TEXT CHECK (status IN ('SUBMITTED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED')) DEFAULT 'SUBMITTED',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rfp_id, responder_id)
);

CREATE INDEX idx_rfp_responses_rfp ON rfp_responses(rfp_id);
CREATE INDEX idx_rfp_responses_responder ON rfp_responses(responder_id);
CREATE INDEX idx_rfp_responses_status ON rfp_responses(status);

ALTER TABLE rfp_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rfp_responses_select_parties" ON rfp_responses
  FOR SELECT TO authenticated
  USING (
    responder_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM rfps r WHERE r.id = rfp_responses.rfp_id AND r.creator_id = auth.uid()
    )
  );

CREATE POLICY "rfp_responses_responder_create" ON rfp_responses
  FOR INSERT WITH CHECK (auth.uid() = responder_id);

CREATE POLICY "rfp_responses_creator_update" ON rfp_responses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM rfps r WHERE r.id = rfp_responses.rfp_id AND r.creator_id = auth.uid()
    )
  );

CREATE TRIGGER rfp_responses_updated_at
  BEFORE UPDATE ON rfp_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 7.3 RFP Invitations

```sql
CREATE TABLE rfp_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfp_id UUID NOT NULL REFERENCES rfps(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  status TEXT CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED')) DEFAULT 'PENDING',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rfp_id, invitee_id)
);

CREATE INDEX idx_rfp_invitations_rfp ON rfp_invitations(rfp_id);
CREATE INDEX idx_rfp_invitations_invitee ON rfp_invitations(invitee_id);

ALTER TABLE rfp_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rfp_invitations_select_parties" ON rfp_invitations
  FOR SELECT TO authenticated
  USING (
    invitee_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM rfps r WHERE r.id = rfp_invitations.rfp_id AND r.creator_id = auth.uid()
    )
  );

CREATE POLICY "rfp_invitations_creator_all" ON rfp_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM rfps r WHERE r.id = rfp_invitations.rfp_id AND r.creator_id = auth.uid()
    )
  );
```

---

## 8. Advertising System {#advertising-tiering}

### 8.1 Ads Table

```sql
CREATE TABLE ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 100),
  description TEXT CHECK (char_length(description) <= 500),
  image_url TEXT,
  target_url TEXT,

  location GEOGRAPHY(POINT, 4326) NOT NULL,
  radius_meters FLOAT DEFAULT 25000 CHECK (radius_meters BETWEEN 1000 AND 100000),

  status TEXT CHECK (status IN (
    'DRAFT', 'PENDING_PAYMENT', 'PENDING_MODERATION',
    'ACTIVE', 'PAUSED', 'EXPIRED', 'SUSPENDED'
  )) DEFAULT 'DRAFT',

  moderation_status TEXT CHECK (moderation_status IN (
    'PENDING', 'APPROVED', 'REJECTED', 'FLAGGED'
  )) DEFAULT 'PENDING',

  placement_type TEXT CHECK (placement_type IN ('HOMEPAGE', 'DISCOVERY', 'PROFILE', 'RFP')) DEFAULT 'HOMEPAGE',
  target_audience_roles TEXT[] DEFAULT ARRAY['PP', 'C', 'CON', 'PS', 'ED']::TEXT[],

  tier TEXT CHECK (tier IN ('FREE', 'BASIC', 'PREMIUM')) DEFAULT 'FREE',
  priority_score INT DEFAULT 0,

  budget_inr DECIMAL(10,2),
  cost_per_click DECIMAL(8,2),

  expires_at TIMESTAMPTZ,
  is_paused BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ads_profile ON ads(profile_id);
CREATE INDEX idx_ads_status ON ads(status);
CREATE INDEX idx_ads_location ON ads USING GIST(location) WHERE status = 'ACTIVE' AND is_paused = FALSE;
CREATE INDEX idx_ads_placement ON ads(placement_type);
CREATE INDEX idx_ads_expires ON ads(expires_at) WHERE status = 'ACTIVE';

ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ads_select_active" ON ads
  FOR SELECT TO authenticated
  USING (
    status = 'ACTIVE' AND is_paused = FALSE
    OR auth.uid() = profile_id
  );

CREATE POLICY "ads_owner_all" ON ads
  FOR ALL USING (auth.uid() = profile_id);

CREATE TRIGGER ads_updated_at
  BEFORE UPDATE ON ads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 8.2 Ad Analytics

```sql
CREATE TABLE ad_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,

  event_type TEXT CHECK (event_type IN ('IMPRESSION', 'CLICK', 'CONNECT')) NOT NULL,
  viewer_id UUID REFERENCES profiles(id),

  viewer_lat FLOAT,
  viewer_lng FLOAT,
  distance_meters FLOAT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ad_analytics_ad ON ad_analytics(ad_id);
CREATE INDEX idx_ad_analytics_event ON ad_analytics(event_type);
CREATE INDEX idx_ad_analytics_created ON ad_analytics(created_at);

ALTER TABLE ad_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ad_analytics_owner_select" ON ad_analytics
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ads a WHERE a.id = ad_analytics.ad_id AND a.profile_id = auth.uid()
    )
  );

CREATE POLICY "ad_analytics_insert_system" ON ad_analytics
  FOR INSERT WITH CHECK (true);
```

---

## 9. Product and Equipment Catalogs {#catalogs-products-equipment}

### 9.1 Products Table

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 3 AND 100),
  description TEXT CHECK (char_length(description) <= 1000),
  category TEXT NOT NULL,
  subcategory TEXT,

  price_per_unit DECIMAL(12,2) NOT NULL,
  unit TEXT DEFAULT 'per piece',
  min_order_quantity INT DEFAULT 1,

  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  available BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_available ON products(available) WHERE available = TRUE;

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select_active" ON products
  FOR SELECT TO authenticated
  USING (
    is_active = TRUE
    OR auth.uid() = seller_id
  );

CREATE POLICY "products_owner_all" ON products
  FOR ALL USING (auth.uid() = seller_id);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 9.2 Equipment Table

```sql
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 3 AND 100),
  description TEXT CHECK (char_length(description) <= 1000),
  category TEXT NOT NULL,
  type TEXT,

  rental_rate_per_day DECIMAL(10,2),
  operator_included BOOLEAN DEFAULT FALSE,

  location GEOGRAPHY(POINT, 4326),
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  available BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_equipment_dealer ON equipment(dealer_id);
CREATE INDEX idx_equipment_category ON equipment(category);
CREATE INDEX idx_equipment_location ON equipment USING GIST(location) WHERE location IS NOT NULL AND available = TRUE;

ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "equipment_select_active" ON equipment
  FOR SELECT TO authenticated
  USING (
    is_active = TRUE AND available = TRUE
    OR auth.uid() = dealer_id
  );

CREATE POLICY "equipment_owner_all" ON equipment
  FOR ALL USING (auth.uid() = dealer_id);

CREATE TRIGGER equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 10. Notification & Ops {#notification-ops}

### 10.1 Notifications

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'CONNECTION_REQUESTED',
    'CONNECTION_ACCEPTED',
    'CONNECTION_REJECTED',
    'CONNECTION_EXPIRED',
    'CONNECTION_BLOCKED',
    'RFP_CREATED',
    'RFP_RESPONSE',
    'RFP_RESPONSE_ACCEPTED',
    'RFP_CLOSED',
    'RFP_NEARBY',
    'AD_APPROVED',
    'AD_REJECTED',
    'AD_SUSPENDED',
    'SUBSCRIPTION_EXPIRING',
    'PAYMENT_SUCCESS',
    'PAYMENT_FAILED',
    'PROFILE_VERIFICATION',
    'SYSTEM_ANNOUNCEMENT'
  )),

  title TEXT NOT NULL,
  message TEXT NOT NULL,

  action_url TEXT,
  action_text TEXT,

  related_entity_type TEXT,
  related_entity_id UUID,

  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  sent_via_app BOOLEAN DEFAULT TRUE,
  sent_via_email BOOLEAN DEFAULT FALSE,
  sent_via_sms BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_read ON notifications(is_read, recipient_id);
CREATE INDEX idx_notifications_created ON notifications(created_at);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_owner_select" ON notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = recipient_id);

CREATE POLICY "notifications_system_insert" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "notifications_owner_update" ON notifications
  FOR UPDATE USING (auth.uid() = recipient_id);
```

### 10.2 Notification Preferences

```sql
CREATE TABLE notification_preferences (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,

  connection_requests BOOLEAN DEFAULT TRUE,
  connection_accepted BOOLEAN DEFAULT TRUE,
  connection_rejected BOOLEAN DEFAULT FALSE,
  rfp_responses BOOLEAN DEFAULT TRUE,
  rfp_nearby BOOLEAN DEFAULT TRUE,
  ad_moderation BOOLEAN DEFAULT TRUE,
  subscription_alerts BOOLEAN DEFAULT TRUE,
  payment_notifications BOOLEAN DEFAULT TRUE,
  system_announcements BOOLEAN DEFAULT TRUE,

  receive_email_notifications BOOLEAN DEFAULT TRUE,
  receive_sms_notifications BOOLEAN DEFAULT FALSE,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_preferences_owner" ON notification_preferences
  FOR ALL USING (auth.uid() = profile_id);
```

### 10.3 Email Queue

```sql
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES profiles(id),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  notification_id UUID REFERENCES notifications(id),

  status TEXT CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'RETRYING')) DEFAULT 'PENDING',
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  last_error TEXT,

  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_queue_status ON email_queue(status) WHERE status = 'PENDING';
CREATE INDEX idx_email_queue_recipient ON email_queue(recipient_id);
CREATE INDEX idx_email_queue_created ON email_queue(created_at);

ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_queue_system_all" ON email_queue
  FOR ALL USING (true);

CREATE TRIGGER email_queue_updated_at
  BEFORE UPDATE ON email_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 11. System Configuration {#system-configuration}

### 11.1 System Config

```sql
CREATE TABLE system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed: Discovery ranking weights (70% quality, 30% distance)
INSERT INTO system_config (key, value, description) VALUES
  ('discovery_ranking_split', '{"quality_weight": 0.7, "distance_weight": 0.3}', 'Weight split for discovery ranking formula'),
  ('max_search_radius_km', '500', 'Maximum search radius in kilometers'),
  ('default_search_radius_km', '50', 'Default search radius in kilometers'),
  ('handshake_credits_monthly', '30', 'Monthly handshake credits for active subscriptions'),
  ('trial_duration_hours', '48', 'Trial period duration in hours'),
  ('connection_expiry_days', '30', 'Days before a REQUESTED connection expires'),
  ('rfp_default_expiry_days', '30', 'Default RFP expiry in days'),
  ('dqs_recurrence_cron', '0 2 * * *', 'Cron schedule for DQS recalculation (UTC)');

ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_config_select_authenticated" ON system_config
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "system_config_admin_update" ON system_config
  FOR ALL USING (false);

CREATE TRIGGER system_config_updated_at
  BEFORE UPDATE ON system_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 11.2 System Audit Log

```sql
CREATE TABLE system_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_actor ON system_audit_log(actor_id);
CREATE INDEX idx_audit_log_action ON system_audit_log(action);
CREATE INDEX idx_audit_log_target ON system_audit_log(target_type, target_id);
CREATE INDEX idx_audit_log_created ON system_audit_log(created_at);

ALTER TABLE system_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_audit_log_insert" ON system_audit_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "system_audit_log_admin_select" ON system_audit_log
  FOR SELECT USING (false);
```

### 11.3 Audit Purge Queue

```sql
CREATE TABLE audit_purge_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  reason TEXT NOT NULL,
  requested_by UUID,
  approved_by UUID,
  status TEXT CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED')) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_purge_queue_profile ON audit_purge_queue(profile_id);
CREATE INDEX idx_purge_queue_status ON audit_purge_queue(status);

ALTER TABLE audit_purge_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_purge_queue_admin_all" ON audit_purge_queue
  FOR ALL USING (false);
```

### 11.4 Async Jobs

```sql
CREATE TABLE async_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  status TEXT CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING')) DEFAULT 'PENDING',
  payload JSONB NOT NULL,
  result JSONB,
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  last_error TEXT,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_async_jobs_status ON async_jobs(status);
CREATE INDEX idx_async_jobs_type ON async_jobs(job_type);
CREATE INDEX idx_async_jobs_scheduled ON async_jobs(scheduled_at) WHERE status = 'PENDING';

ALTER TABLE async_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "async_jobs_system_all" ON async_jobs
  FOR ALL USING (true);

CREATE TRIGGER async_jobs_updated_at
  BEFORE UPDATE ON async_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 12. Geospatial Functions {#geospatial-functions}

### 12.1 searching_nearby_profiles()

```sql
CREATE OR REPLACE FUNCTION searching_nearby_profiles(
  searcher_lat DOUBLE PRECISION,
  searcher_lng DOUBLE PRECISION,
  radius_km INT DEFAULT 50,
  role_filter TEXT DEFAULT NULL,
  keyword TEXT DEFAULT NULL,
  page_size INT DEFAULT 20,
  page_offset INT DEFAULT 0
)
RETURNS TABLE (
  profile_id UUID,
  display_name TEXT,
  persona_type TEXT,
  city TEXT,
  state TEXT,
  dqs_score NUMERIC,
  distance_km NUMERIC,
  ranked_score NUMERIC,
  subscription_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  w_quality  FLOAT := 0.7;
  w_distance FLOAT := 0.3;
BEGIN
  BEGIN
    SELECT
      (value->>'quality_weight')::FLOAT,
      (value->>'distance_weight')::FLOAT
    INTO w_quality, w_distance
    FROM system_config
    WHERE key = 'discovery_ranking_split';
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  RETURN QUERY
  SELECT
    p.id,
    p.org_name AS display_name,
    p.persona_type,
    p.city,
    p.state,
    p.dqs_score::NUMERIC,
    (ST_Distance(p.location, ST_SetSRID(ST_Point(searcher_lng, searcher_lat), 4326)) / 1000.0)::NUMERIC AS distance_km,
    (
      (p.dqs_score * w_quality) +
      (GREATEST(0, 1 - ((ST_Distance(p.location, ST_SetSRID(ST_Point(searcher_lng, searcher_lat), 4326)) / 1000.0) / GREATEST(radius_km, 1))) * w_distance)
    )::NUMERIC AS ranked_score,
    p.subscription_status
  FROM profiles p
  WHERE
    ST_DWithin(p.location, ST_SetSRID(ST_Point(searcher_lng, searcher_lat), 4326), radius_km * 1000.0)
    AND (role_filter IS NULL OR p.persona_type = role_filter)
    AND (keyword IS NULL OR p.org_name ILIKE '%' || keyword || '%')
    AND p.deleted_at IS NULL
    AND p.subscription_status != 'hard_locked'
    AND p.id != auth.uid()
  ORDER BY ranked_score DESC
  LIMIT LEAST(page_size, 50)
  OFFSET GREATEST(page_offset, 0);
END;
$$;
```

### 12.2 dqs_recalculate()

```sql
CREATE OR REPLACE FUNCTION dqs_recalculate()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE profiles p
  SET dqs_score = LEAST(
    1.0,
    GREATEST(
      0.0,
      (0.4 * COALESCE(p.dqs_responsiveness, 0.0)) +
      (0.3 * COALESCE(p.dqs_trust_loops, 0.0)) +
      (0.2 * COALESCE(p.dqs_verification, 0.0)) +
      (0.1 * COALESCE(p.dqs_profile_depth, 0.0))
    )
  )
  WHERE p.updated_at IS NOT NULL;
END;
$$;

SELECT cron.schedule('dqs-daily-recalc', '0 2 * * *', 'SELECT dqs_recalculate()');
```

### 12.3 update_updated_at_column()

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_personnel_updated_at
  BEFORE UPDATE ON company_personnel
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 13. Unmasking Audit Indexes

```sql
CREATE INDEX idx_unmasking_audit_viewer ON unmasking_audit(viewer_id);
CREATE INDEX idx_unmasking_audit_viewed ON unmasking_audit(viewed_id);
CREATE INDEX idx_unmasking_audit_unmasked_at ON unmasking_audit(unmasked_at);
CREATE INDEX idx_unmasking_audit_retention ON unmasking_audit(retention_expires_at) WHERE retention_expires_at < NOW();
```

---

**End of Database Schema Document**

[PP]: #role-extensions
[C]: #role-extensions
[CON]: #role-extensions
[PS]: #role-extensions
[ED]: #role-extensions
