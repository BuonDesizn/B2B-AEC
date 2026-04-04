-- =============================================================================
-- Migration 015: Fix FK ON DELETE behaviors, add missing indexes & timestamps
-- =============================================================================

-- =============================================================================
-- SECTION 1: Fix FK ON DELETE CASCADE / SET NULL
-- =============================================================================

-- 1. address_book.first_handshake_id — CASCADE (when connection deleted, remove address book entry)
ALTER TABLE address_book
  DROP CONSTRAINT IF EXISTS address_book_first_handshake_id_fkey,
  ADD CONSTRAINT address_book_first_handshake_id_fkey
    FOREIGN KEY (first_handshake_id) REFERENCES connections(id) ON DELETE CASCADE;

-- 2. ad_analytics.viewer_id — SET NULL (analytics should survive profile deletion)
ALTER TABLE ad_analytics
  DROP CONSTRAINT IF EXISTS ad_analytics_viewer_id_fkey,
  ADD CONSTRAINT ad_analytics_viewer_id_fkey
    FOREIGN KEY (viewer_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 3. email_queue.recipient_id — CASCADE
ALTER TABLE email_queue
  DROP CONSTRAINT IF EXISTS email_queue_recipient_id_fkey,
  ADD CONSTRAINT email_queue_recipient_id_fkey
    FOREIGN KEY (recipient_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 4. email_queue.notification_id — SET NULL
ALTER TABLE email_queue
  DROP CONSTRAINT IF EXISTS email_queue_notification_id_fkey,
  ADD CONSTRAINT email_queue_notification_id_fkey
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE SET NULL;

-- 5. audit_purge_queue.profile_id — CASCADE
ALTER TABLE audit_purge_queue
  DROP CONSTRAINT IF EXISTS audit_purge_queue_profile_id_fkey,
  ADD CONSTRAINT audit_purge_queue_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 6. audit_purge_queue.requested_by — SET NULL
ALTER TABLE audit_purge_queue
  ADD CONSTRAINT audit_purge_queue_requested_by_fkey
    FOREIGN KEY (requested_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- 7. audit_purge_queue.approved_by — SET NULL
ALTER TABLE audit_purge_queue
  ADD CONSTRAINT audit_purge_queue_approved_by_fkey
    FOREIGN KEY (approved_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- 8. system_audit_log.actor_id — SET NULL
ALTER TABLE system_audit_log
  ADD CONSTRAINT system_audit_log_actor_id_fkey
    FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- =============================================================================
-- SECTION 2: Add missing indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_rfps_subcategory ON rfps(subcategory);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_viewer ON ad_analytics(viewer_id);
CREATE INDEX IF NOT EXISTS idx_personnel_deleted_at ON company_personnel(deleted_at);

-- =============================================================================
-- SECTION 3: Add missing timestamps
-- =============================================================================

-- connections: add created_at as alias to initiated_at for consistency
ALTER TABLE connections
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill created_at from initiated_at
UPDATE connections SET created_at = initiated_at WHERE created_at IS NULL;

-- address_book: add updated_at
ALTER TABLE address_book
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

CREATE TRIGGER address_book_updated_at
  BEFORE UPDATE ON address_book
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- rfp_invitations: add updated_at
ALTER TABLE rfp_invitations
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- notifications: add updated_at
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

CREATE TRIGGER notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
