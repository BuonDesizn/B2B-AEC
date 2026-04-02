-- =============================================================================
-- BuonDesizn B2B Marketplace — Initial Schema Migration
-- @witness [ID-001] [HD-001] [RM-001] [RFP-001] [AD-001] [MON-001] [QA-001]
-- Source of truth: docs/database/db_schema.md
-- =============================================================================
-- AGENT INSTRUCTION: This file is the canonical migration stub.
-- @engineer must translate every table in docs/database/db_schema.md into SQL
-- here. Run `supabase db push` to apply. Never hand-write logic that contradicts
-- db_schema.md. Cross-check RLS policies in docs/database/rls_policies.md.
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- SECTION 1: Core Profiles & Identity
-- Spec: ID-001 | docs/database/db_schema.md §1
-- =============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  -- Identity
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,

  -- Persona Type
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
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles USING GIST (location) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_persona_type ON profiles (persona_type);
CREATE INDEX IF NOT EXISTS idx_profiles_gstin ON profiles (gstin) WHERE gstin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_dqs ON profiles (dqs_score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles (subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles (deleted_at) WHERE deleted_at IS NOT NULL;

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own profile
-- PII (phone, linkedin_url) masking handled at API layer — no RLS read restriction needed
-- for own profile, but SELECT for others is restricted to non-PII columns via view/RPC
CREATE POLICY "profiles_self_access" ON profiles
  FOR ALL USING (auth.uid() = id);

-- =============================================================================
-- SECTION 2: Connections & Handshakes
-- Spec: HD-001 | docs/database/db_schema.md §3
-- =============================================================================

CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'REQUESTED'
    CHECK (status IN ('REQUESTED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'BLOCKED')),
  connection_source TEXT CHECK (connection_source IN ('SEARCH', 'RFP_RESPONSE', 'AD_CLICK', 'DIRECT')),
  requester_message TEXT,
  requester_shares_email BOOLEAN DEFAULT FALSE,
  requester_shares_phone BOOLEAN DEFAULT FALSE,
  target_shares_email BOOLEAN DEFAULT FALSE,
  target_shares_phone BOOLEAN DEFAULT FALSE,
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days')
);

-- Partial unique: only one active connection per pair at a time
-- Allows re-request after REJECTED/EXPIRED
CREATE UNIQUE INDEX IF NOT EXISTS idx_connections_active_pair
  ON connections (requester_id, target_id)
  WHERE status IN ('REQUESTED', 'ACCEPTED');

CREATE INDEX IF NOT EXISTS idx_connections_requester ON connections (requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_target ON connections (target_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections (status);
CREATE INDEX IF NOT EXISTS idx_connections_parties_status ON connections (requester_id, target_id, status);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "connections_parties_only" ON connections
  FOR ALL USING (auth.uid() IN (requester_id, target_id));

-- Address Book: permanent post-handshake relationships
CREATE TABLE IF NOT EXISTS address_book (
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

-- =============================================================================
-- SECTION 3: Company Personnel
-- Spec: ID-001 | docs/database/db_schema.md §8
-- docs/plans/2026-03-31-key-personnel-design.md
-- =============================================================================

CREATE TABLE IF NOT EXISTS company_personnel (
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

CREATE INDEX IF NOT EXISTS idx_personnel_gstin ON company_personnel (company_gstin);
CREATE INDEX IF NOT EXISTS idx_personnel_profile ON company_personnel (profile_id);

ALTER TABLE company_personnel ENABLE ROW LEVEL SECURITY;

-- Unmask if: owner OR ACCEPTED connection exists with ANY profile sharing same GSTIN
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

-- =============================================================================
-- SECTION 4: Audit & Privacy
-- Spec: QA-001 | docs/database/db_schema.md §10
-- =============================================================================

CREATE TABLE IF NOT EXISTS unmasking_audit (
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

-- Immutable — no UPDATE or DELETE policies
ALTER TABLE unmasking_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_insert_only" ON unmasking_audit
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- =============================================================================
-- SECTION 5: Subscriptions & Monetization
-- Spec: MON-001 | docs/database/db_schema.md §6
-- =============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
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

CREATE INDEX IF NOT EXISTS idx_subscriptions_profile ON subscriptions(profile_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires ON subscriptions(expires_at);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_self" ON subscriptions
  FOR ALL USING (auth.uid() = profile_id);

-- =============================================================================
-- SECTION 5b: Subscription Plans (seed data)
-- =============================================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
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

CREATE INDEX IF NOT EXISTS idx_plans_active ON subscription_plans(is_active, is_public);

-- Seed: National Pro plan
INSERT INTO subscription_plans (plan_name, plan_code, display_name, price_monthly, features) VALUES
  ('national_pro', 'NATPRO', 'National Pro', 999.00, '["Unlimited handshakes", "Priority discovery", "Ad campaigns", "Analytics dashboard"]')
ON CONFLICT (plan_code) DO NOTHING;

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscription_plans_select" ON subscription_plans
  FOR SELECT TO authenticated
  USING (is_active = TRUE AND is_public = TRUE);

-- =============================================================================
-- SECTION 6: Geospatial Discovery RPC
-- Spec: RM-001 | docs/database/db_schema.md §11
-- Full spec: docs/api/API_CONTRACT.md §searching_nearby_profiles
-- =============================================================================

-- Canonical discovery RPC: 70/30 quality-first ranking
-- @witness [RM-001]

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
  -- Dynamic weights from system_config (fallback 70/30 if table missing)
  BEGIN
    SELECT
      (value->>'quality_weight')::FLOAT,
      (value->>'distance_weight')::FLOAT
    INTO w_quality, w_distance
    FROM system_config
    WHERE key = 'discovery_ranking_split';
  EXCEPTION WHEN undefined_table THEN
    -- system_config not yet created — use defaults
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

-- =============================================================================
-- SECTION 7: DQS Recalculation Cron (2 AM daily)
-- Spec: RM-001 | docs/system/STATE_MACHINES.md §DQS
-- =============================================================================

-- dqs_recalculate() — canonical DQS formula
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

-- pg_cron job — schedule DQS recalc at 2 AM UTC daily
SELECT cron.schedule('dqs-daily-recalc', '0 2 * * *', 'SELECT dqs_recalculate()');

-- =============================================================================
-- SECTION 8: Updated_at auto-trigger
-- =============================================================================

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

-- =============================================================================
-- NOTE: Remaining tables (role extensions, RFPs, ads, catalogs, notifications)
-- must be added by @engineer in subsequent migrations, following
-- docs/database/db_schema.md exactly. Use numbered migration files:
--   20260331000002_role_extensions.sql
--   20260331000003_rfps.sql
--   20260331000004_ads_monetization.sql
--   20260331000005_catalogs.sql
--   20260331000006_notifications_ops.sql
-- =============================================================================
