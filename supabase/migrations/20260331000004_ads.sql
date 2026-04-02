-- =============================================================================
-- BuonDesizn B2B Marketplace — Ads System Migration
-- @witness [AD-001] [MOD-001]
-- Source of truth: docs/database/db_schema.md §5
-- =============================================================================

-- =============================================================================
-- SECTION 1: Ads Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS ads (
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

CREATE INDEX IF NOT EXISTS idx_ads_profile ON ads(profile_id);
CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_location ON ads USING GIST(location) WHERE status = 'ACTIVE' AND is_paused = FALSE;
CREATE INDEX IF NOT EXISTS idx_ads_placement ON ads(placement_type);
CREATE INDEX IF NOT EXISTS idx_ads_expires ON ads(expires_at) WHERE status = 'ACTIVE';

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

-- =============================================================================
-- SECTION 2: Ad Analytics
-- =============================================================================

CREATE TABLE IF NOT EXISTS ad_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,

  event_type TEXT CHECK (event_type IN ('IMPRESSION', 'CLICK', 'CONNECT')) NOT NULL,
  viewer_id UUID REFERENCES profiles(id),

  viewer_lat FLOAT,
  viewer_lng FLOAT,
  distance_meters FLOAT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_analytics_ad ON ad_analytics(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_event ON ad_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_created ON ad_analytics(created_at);

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
