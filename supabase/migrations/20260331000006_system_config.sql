-- =============================================================================
-- BuonDesizn B2B Marketplace — System Config Migration
-- @witness [RM-001]
-- Source of truth: docs/database/db_schema.md §7
-- =============================================================================

-- =============================================================================
-- SECTION 1: System Config
-- =============================================================================

CREATE TABLE IF NOT EXISTS system_config (
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

-- Only super-admin can modify system config
CREATE POLICY "system_config_select_authenticated" ON system_config
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "system_config_admin_update" ON system_config
  FOR ALL USING (false); -- Service role only

CREATE TRIGGER system_config_updated_at
  BEFORE UPDATE ON system_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SECTION 2: System Audit Log
-- =============================================================================

CREATE TABLE IF NOT EXISTS system_audit_log (
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

CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON system_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON system_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON system_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON system_audit_log(created_at);

ALTER TABLE system_audit_log ENABLE ROW LEVEL SECURITY;

-- Immutable — INSERT only via service role
CREATE POLICY "system_audit_log_insert" ON system_audit_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "system_audit_log_admin_select" ON system_audit_log
  FOR SELECT USING (false); -- Service role only

-- =============================================================================
-- SECTION 3: Audit Purge Queue (GDPR)
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_purge_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  reason TEXT NOT NULL,
  requested_by UUID,
  approved_by UUID,
  status TEXT CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED')) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_purge_queue_profile ON audit_purge_queue(profile_id);
CREATE INDEX IF NOT EXISTS idx_purge_queue_status ON audit_purge_queue(status);

ALTER TABLE audit_purge_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_purge_queue_admin_all" ON audit_purge_queue
  FOR ALL USING (false); -- Service role only

-- =============================================================================
-- SECTION 4: Async Jobs (QStash)
-- =============================================================================

CREATE TABLE IF NOT EXISTS async_jobs (
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

CREATE INDEX IF NOT EXISTS idx_async_jobs_status ON async_jobs(status);
CREATE INDEX IF NOT EXISTS idx_async_jobs_type ON async_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_async_jobs_scheduled ON async_jobs(scheduled_at) WHERE status = 'PENDING';

ALTER TABLE async_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "async_jobs_system_all" ON async_jobs
  FOR ALL USING (true);

CREATE TRIGGER async_jobs_updated_at
  BEFORE UPDATE ON async_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
