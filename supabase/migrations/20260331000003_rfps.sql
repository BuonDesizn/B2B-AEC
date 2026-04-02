-- =============================================================================
-- BuonDesizn B2B Marketplace — RFP System Migration
-- @witness [RFP-001]
-- Source of truth: docs/database/db_schema.md §4
-- =============================================================================

-- =============================================================================
-- SECTION 1: RFPs Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS rfps (
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

CREATE INDEX IF NOT EXISTS idx_rfps_creator ON rfps(creator_id);
CREATE INDEX IF NOT EXISTS idx_rfps_status ON rfps(status);
CREATE INDEX IF NOT EXISTS idx_rfps_location ON rfps USING GIST(project_location) WHERE status = 'OPEN';
CREATE INDEX IF NOT EXISTS idx_rfps_category ON rfps(category);
CREATE INDEX IF NOT EXISTS idx_rfps_expires ON rfps(expires_at) WHERE status = 'OPEN';

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

-- =============================================================================
-- SECTION 2: RFP Responses
-- =============================================================================

CREATE TABLE IF NOT EXISTS rfp_responses (
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

CREATE INDEX IF NOT EXISTS idx_rfp_responses_rfp ON rfp_responses(rfp_id);
CREATE INDEX IF NOT EXISTS idx_rfp_responses_responder ON rfp_responses(responder_id);
CREATE INDEX IF NOT EXISTS idx_rfp_responses_status ON rfp_responses(status);

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

-- =============================================================================
-- SECTION 3: RFP Invitations
-- =============================================================================

CREATE TABLE IF NOT EXISTS rfp_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfp_id UUID NOT NULL REFERENCES rfps(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  status TEXT CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED')) DEFAULT 'PENDING',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rfp_id, invitee_id)
);

CREATE INDEX IF NOT EXISTS idx_rfp_invitations_rfp ON rfp_invitations(rfp_id);
CREATE INDEX IF NOT EXISTS idx_rfp_invitations_invitee ON rfp_invitations(invitee_id);

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
