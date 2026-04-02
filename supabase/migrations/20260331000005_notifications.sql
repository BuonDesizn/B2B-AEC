-- =============================================================================
-- BuonDesizn B2B Marketplace — Notifications System Migration
-- @witness [COM-001]
-- Source of truth: docs/database/db_schema.md §9
-- =============================================================================

-- =============================================================================
-- SECTION 1: Notifications
-- =============================================================================

CREATE TABLE IF NOT EXISTS notifications (
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

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read, recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_owner_select" ON notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = recipient_id);

CREATE POLICY "notifications_system_insert" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "notifications_owner_update" ON notifications
  FOR UPDATE USING (auth.uid() = recipient_id);

-- =============================================================================
-- SECTION 2: Notification Preferences
-- =============================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
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

-- =============================================================================
-- SECTION 3: Email Queue
-- =============================================================================

CREATE TABLE IF NOT EXISTS email_queue (
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

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_email_queue_recipient ON email_queue(recipient_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_created ON email_queue(created_at);

ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_queue_system_all" ON email_queue
  FOR ALL USING (true);

CREATE TRIGGER email_queue_updated_at
  BEFORE UPDATE ON email_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
