-- =============================================================================
-- BuonDesizn B2B Marketplace — Schema Reconciliation Migration
-- @audit 2026-04-03 — Service-vs-schema column alignment
-- =============================================================================

-- =============================================================================
-- SECTION 1: subscriptions — Add missing columns
-- =============================================================================

ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS plan TEXT,
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS trial_starts_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_payment_id TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SECTION 2: rfps — Add missing columns
-- =============================================================================

ALTER TABLE rfps
ADD COLUMN IF NOT EXISTS subcategory TEXT,
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS requester_id UUID,
ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326);

-- Backfill from canonical columns
UPDATE rfps SET expiry_date = expires_at WHERE expiry_date IS NULL AND expires_at IS NOT NULL;
UPDATE rfps SET requester_id = creator_id WHERE requester_id IS NULL;
UPDATE rfps SET location = project_location WHERE location IS NULL;

-- Sync trigger: keep aliases in sync with canonical columns
CREATE OR REPLACE FUNCTION sync_rfp_aliases()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.requester_id IS NOT NULL AND NEW.creator_id IS NULL THEN
    NEW.creator_id := NEW.requester_id;
  ELSIF NEW.creator_id IS NOT NULL AND NEW.requester_id IS NULL THEN
    NEW.requester_id := NEW.creator_id;
  END IF;
  IF NEW.location IS NOT NULL AND NEW.project_location IS NULL THEN
    NEW.project_location := NEW.location;
  ELSIF NEW.project_location IS NOT NULL AND NEW.location IS NULL THEN
    NEW.location := NEW.project_location;
  END IF;
  IF NEW.expiry_date IS NOT NULL AND NEW.expires_at IS NULL THEN
    NEW.expires_at := NEW.expiry_date;
  ELSIF NEW.expires_at IS NOT NULL AND NEW.expiry_date IS NULL THEN
    NEW.expiry_date := NEW.expires_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rfp_sync_aliases
  BEFORE INSERT OR UPDATE ON rfps
  FOR EACH ROW EXECUTE FUNCTION sync_rfp_aliases();

CREATE INDEX IF NOT EXISTS idx_rfps_expiry_date ON rfps(expiry_date) WHERE status = 'OPEN';
CREATE INDEX IF NOT EXISTS idx_rfps_requester ON rfps(requester_id);

-- =============================================================================
-- SECTION 3: rfp_responses — Add alias columns
-- =============================================================================

ALTER TABLE rfp_responses
ADD COLUMN IF NOT EXISTS proposal TEXT,
ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(12,2);

-- Sync trigger
CREATE OR REPLACE FUNCTION sync_rfp_response_aliases()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.proposal IS NOT NULL AND NEW.proposal_text IS NULL THEN
    NEW.proposal_text := NEW.proposal;
  ELSIF NEW.proposal_text IS NOT NULL AND NEW.proposal IS NULL THEN
    NEW.proposal := NEW.proposal_text;
  END IF;
  IF NEW.estimated_cost IS NOT NULL AND NEW.bid_amount IS NULL THEN
    NEW.bid_amount := NEW.estimated_cost;
  ELSIF NEW.bid_amount IS NOT NULL AND NEW.estimated_cost IS NULL THEN
    NEW.estimated_cost := NEW.bid_amount;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rfp_response_sync_aliases
  BEFORE INSERT OR UPDATE ON rfp_responses
  FOR EACH ROW EXECUTE FUNCTION sync_rfp_response_aliases();

-- Backfill
UPDATE rfp_responses SET proposal = proposal_text WHERE proposal IS NULL;
UPDATE rfp_responses SET estimated_cost = bid_amount WHERE estimated_cost IS NULL;

-- =============================================================================
-- SECTION 4: ads — Add missing columns
-- =============================================================================

ALTER TABLE ads
ADD COLUMN IF NOT EXISTS dealer_id UUID,
ADD COLUMN IF NOT EXISTS campaign_name TEXT,
ADD COLUMN IF NOT EXISTS impressions INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicks INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS ctr NUMERIC(5,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cpc NUMERIC(8,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS budget_total DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS budget_remaining DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED'));

-- Sync trigger
CREATE OR REPLACE FUNCTION sync_ads_aliases()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.dealer_id IS NOT NULL AND NEW.profile_id IS NULL THEN
    NEW.profile_id := NEW.dealer_id;
  ELSIF NEW.profile_id IS NOT NULL AND NEW.dealer_id IS NULL THEN
    NEW.dealer_id := NEW.profile_id;
  END IF;
  IF NEW.campaign_name IS NOT NULL AND NEW.title IS NULL THEN
    NEW.title := NEW.campaign_name;
  ELSIF NEW.title IS NOT NULL AND NEW.campaign_name IS NULL THEN
    NEW.campaign_name := NEW.title;
  END IF;
  IF NEW.budget_total IS NOT NULL AND NEW.budget_inr IS NULL THEN
    NEW.budget_inr := NEW.budget_total;
  ELSIF NEW.budget_inr IS NOT NULL AND NEW.budget_total IS NULL THEN
    NEW.budget_total := NEW.budget_inr;
  END IF;
  IF NEW.budget_remaining IS NULL AND NEW.budget_total IS NOT NULL THEN
    NEW.budget_remaining := NEW.budget_total;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ads_sync_aliases
  BEFORE INSERT OR UPDATE ON ads
  FOR EACH ROW EXECUTE FUNCTION sync_ads_aliases();

-- Backfill
UPDATE ads SET dealer_id = profile_id WHERE dealer_id IS NULL;
UPDATE ads SET campaign_name = title WHERE campaign_name IS NULL;
UPDATE ads SET budget_total = budget_inr WHERE budget_total IS NULL;
UPDATE ads SET budget_remaining = budget_inr WHERE budget_remaining IS NULL;

CREATE INDEX IF NOT EXISTS idx_ads_payment_status ON ads(payment_status);
CREATE INDEX IF NOT EXISTS idx_ads_dealer ON ads(dealer_id);

-- =============================================================================
-- SECTION 5: connections — Add updated_at
-- =============================================================================

ALTER TABLE connections
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE TRIGGER connections_updated_at
  BEFORE UPDATE ON connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SECTION 6: notifications — Add type alias and metadata
-- =============================================================================

ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Sync trigger
CREATE OR REPLACE FUNCTION sync_notification_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type IS NOT NULL AND NEW.notification_type IS NULL THEN
    NEW.notification_type := NEW.type;
  ELSIF NEW.notification_type IS NOT NULL AND NEW.type IS NULL THEN
    NEW.type := NEW.notification_type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_sync_type
  BEFORE INSERT OR UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION sync_notification_type();

-- Backfill
UPDATE notifications SET type = notification_type WHERE type IS NULL;

-- =============================================================================
-- SECTION 7: notification_preferences — Add user_id alias and extra toggles
-- =============================================================================

ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS receive_push_notifications BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS connection_requested BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS rfp_response_submitted BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS ad_payment_success BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS subscription_expiring BOOLEAN DEFAULT TRUE;

-- Sync trigger
CREATE OR REPLACE FUNCTION sync_notification_prefs_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND NEW.profile_id IS NULL THEN
    NEW.profile_id := NEW.user_id;
  ELSIF NEW.profile_id IS NOT NULL AND NEW.user_id IS NULL THEN
    NEW.user_id := NEW.profile_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_prefs_sync_user_id
  BEFORE INSERT OR UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION sync_notification_prefs_user_id();

-- Backfill
UPDATE notification_preferences SET user_id = profile_id WHERE user_id IS NULL;

-- Update RLS to work with both columns
DROP POLICY IF EXISTS "notification_preferences_owner" ON notification_preferences;
CREATE POLICY "notification_preferences_owner" ON notification_preferences
  FOR ALL USING (auth.uid() = profile_id OR auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user_id ON notification_preferences(user_id);

-- =============================================================================
-- SECTION 8: email_queue — Add body alias
-- =============================================================================

ALTER TABLE email_queue
ADD COLUMN IF NOT EXISTS body TEXT;

CREATE OR REPLACE FUNCTION sync_email_queue_body()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.body IS NOT NULL AND NEW.body_html IS NULL THEN
    NEW.body_html := NEW.body;
  ELSIF NEW.body_html IS NOT NULL AND NEW.body IS NULL THEN
    NEW.body := NEW.body_html;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_queue_sync_body
  BEFORE INSERT OR UPDATE ON email_queue
  FOR EACH ROW EXECUTE FUNCTION sync_email_queue_body();

-- Backfill
UPDATE email_queue SET body = body_html WHERE body IS NULL;

-- =============================================================================
-- SECTION 9: products — Add specifications
-- =============================================================================

ALTER TABLE products
ADD COLUMN IF NOT EXISTS specifications JSONB;

-- =============================================================================
-- SECTION 10: equipment — Add missing columns
-- =============================================================================

ALTER TABLE equipment
ADD COLUMN IF NOT EXISTS daily_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS weekly_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS monthly_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Sync trigger
CREATE OR REPLACE FUNCTION sync_equipment_rates()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.daily_rate IS NOT NULL AND NEW.rental_rate_per_day IS NULL THEN
    NEW.rental_rate_per_day := NEW.daily_rate;
  ELSIF NEW.rental_rate_per_day IS NOT NULL AND NEW.daily_rate IS NULL THEN
    NEW.daily_rate := NEW.rental_rate_per_day;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER equipment_sync_rates
  BEFORE INSERT OR UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION sync_equipment_rates();

-- Backfill
UPDATE equipment SET daily_rate = rental_rate_per_day WHERE daily_rate IS NULL;

-- =============================================================================
-- SECTION 11: product_sellers — Add sku_capacity
-- =============================================================================

ALTER TABLE product_sellers
ADD COLUMN IF NOT EXISTS sku_capacity INT;

-- =============================================================================
-- SECTION 12: contractors — Add missing columns
-- =============================================================================

ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS workforce_count INT,
ADD COLUMN IF NOT EXISTS specializations TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS fleet_size INT;

-- =============================================================================
-- SECTION 13: equipment_dealers — Add rental_categories
-- =============================================================================

ALTER TABLE equipment_dealers
ADD COLUMN IF NOT EXISTS rental_categories TEXT[] DEFAULT ARRAY[]::TEXT[];

-- =============================================================================
-- SECTION 14: profiles — Add missing columns for discovery depth calc
-- =============================================================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS credits_reset_at TIMESTAMPTZ;

-- Backfill credits_reset_at from last_credit_reset_at
UPDATE profiles SET credits_reset_at = last_credit_reset_at WHERE credits_reset_at IS NULL;

-- =============================================================================
-- SECTION 15: Wrapper for get_visible_contact_info with reversed args
-- =============================================================================

CREATE OR REPLACE FUNCTION get_visible_contact_info_by_target(
  p_target_id UUID,
  p_viewer_id UUID
)
RETURNS contact_info
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN get_visible_contact_info(p_viewer_id, p_target_id);
END;
$$;
