-- =============================================================================
-- BuonDesizn B2B Marketplace — RLS Policies & get_visible_contact_info()
-- @witness [HD-001] [ID-001] [QA-001]
-- Source of truth: docs/database/rls_policies.md
-- =============================================================================

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- has_accepted_handshake: reusable sub-expression for RLS policies
CREATE OR REPLACE FUNCTION has_accepted_handshake(viewer UUID, target UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM connections
    WHERE status = 'ACCEPTED'
      AND (
        (requester_id = viewer AND connections.target_id = target)
        OR (requester_id = target AND connections.target_id = viewer)
      )
  );
$$;

-- has_gstin_handshake: Company DNA — viewer connected to ANY rep of a GSTIN
CREATE OR REPLACE FUNCTION has_gstin_handshake(viewer UUID, target_gstin TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM connections c
    JOIN profiles p ON (
      (c.requester_id = p.id AND c.target_id = viewer)
      OR (c.target_id = p.id AND c.requester_id = viewer)
    )
    WHERE c.status = 'ACCEPTED'
      AND p.gstin = target_gstin
      AND p.id != viewer
  );
$$;

-- =============================================================================
-- get_visible_contact_info() — The PII Gate
-- The ONLY authorised path for serving phone/email from profiles.
-- @witness [HD-001]
-- Spec: docs/database/rls_policies.md §get_visible_contact_info
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE contact_info AS (
    phone_primary    TEXT,
    phone_secondary  TEXT,
    email_business   TEXT,
    is_masked        BOOLEAN
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE OR REPLACE FUNCTION get_visible_contact_info(
  p_viewer_id UUID,
  p_target_id UUID
)
RETURNS contact_info
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  result          contact_info;
  v_target_gstin  TEXT;
  v_can_unmask    BOOLEAN := FALSE;
BEGIN
  -- Guard: caller must be the declared viewer (prevent viewer_id spoofing)
  IF auth.uid() != p_viewer_id THEN
    RAISE EXCEPTION 'viewer_id must match the authenticated user'
      USING ERRCODE = 'P0001';
  END IF;

  -- Rule 1: Viewer is the profile owner — full access, no audit needed
  IF p_viewer_id = p_target_id THEN
    SELECT
      p.phone_primary,
      p.phone_secondary,
      p.email_business,
      FALSE
    INTO
      result.phone_primary,
      result.phone_secondary,
      result.email_business,
      result.is_masked
    FROM profiles p
    WHERE p.id = p_target_id;
    RETURN result;
  END IF;

  -- Rule 2: Direct ACCEPTED handshake between viewer and target
  SELECT EXISTS (
    SELECT 1 FROM connections
    WHERE status = 'ACCEPTED'
      AND (
        (requester_id = p_viewer_id AND target_id = p_target_id)
        OR (requester_id = p_target_id AND target_id = p_viewer_id)
      )
  ) INTO v_can_unmask;

  -- Rule 3: Company DNA — ACCEPTED handshake with any rep of target's GSTIN
  IF NOT v_can_unmask THEN
    SELECT gstin INTO v_target_gstin
    FROM profiles
    WHERE id = p_target_id AND gstin IS NOT NULL;

    IF v_target_gstin IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1 FROM connections c
        JOIN profiles p_rep
          ON (c.requester_id = p_rep.id OR c.target_id = p_rep.id)
        WHERE c.status = 'ACCEPTED'
          AND (c.requester_id = p_viewer_id OR c.target_id = p_viewer_id)
          AND p_rep.gstin = v_target_gstin
          AND p_rep.id != p_viewer_id
          AND p_rep.id != p_target_id
      ) INTO v_can_unmask;
    END IF;
  END IF;

  IF v_can_unmask THEN
    -- Return real PII
    SELECT
      p.phone_primary,
      p.phone_secondary,
      p.email_business,
      FALSE
    INTO
      result.phone_primary,
      result.phone_secondary,
      result.email_business,
      result.is_masked
    FROM profiles p
    WHERE p.id = p_target_id;

    -- Immutable audit trail — idempotent, won't duplicate within same calendar day
    INSERT INTO unmasking_audit (
      viewer_id,
      viewed_id,
      trigger_event,
      revealed_fields
    )
    SELECT
      p_viewer_id,
      p_target_id,
      'CONNECTION_ACCEPTED',
      ARRAY['phone_primary', 'phone_secondary', 'email_business']
    WHERE NOT EXISTS (
      SELECT 1 FROM unmasking_audit
      WHERE viewer_id = p_viewer_id
        AND viewed_id = p_target_id
        AND trigger_event = 'CONNECTION_ACCEPTED'
        AND unmasked_at::date = CURRENT_DATE
    );

  ELSE
    -- Masked — return nulls
    result.phone_primary   := NULL;
    result.phone_secondary := NULL;
    result.email_business  := NULL;
    result.is_masked       := TRUE;
  END IF;

  RETURN result;
END;
$$;

-- =============================================================================
-- RLS POLICIES: profiles
-- =============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Public discovery: any authenticated user can see non-deleted, non-hard-locked rows
-- PII columns are NOT selected here — always use get_visible_contact_info()
CREATE POLICY "profiles_select_authenticated"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND subscription_status != 'hard_locked'
  );

-- Own profile: full row access (overrides the above for the owner)
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Insert: user can only create their own row
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Update: user can only update their own row
-- dqs_score, subscription_status, handshake_credits → service role only (enforced at API layer)
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- No DELETE policy for authenticated — soft delete via UPDATE (deleted_at = NOW())
-- Hard purge: service role only

-- =============================================================================
-- RLS POLICIES: connections
-- =============================================================================

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "connections_parties_select"
  ON connections FOR SELECT
  TO authenticated
  USING (
    auth.uid() = requester_id
    OR auth.uid() = target_id
  );

CREATE POLICY "connections_insert_as_requester"
  ON connections FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = requester_id
    AND requester_id != target_id
    -- Block if already ACCEPTED or BLOCKED with this party
    AND NOT EXISTS (
      SELECT 1 FROM connections ex
      WHERE ex.status IN ('ACCEPTED', 'BLOCKED')
        AND (
          (ex.requester_id = auth.uid() AND ex.target_id = connections.target_id)
          OR (ex.requester_id = connections.target_id AND ex.target_id = auth.uid())
        )
    )
  );

CREATE POLICY "connections_update_parties"
  ON connections FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = requester_id OR auth.uid() = target_id
  )
  WITH CHECK (
    -- Target accepts or rejects a pending request
    (auth.uid() = target_id
      AND status = 'REQUESTED'
      AND status IN ('ACCEPTED', 'REJECTED'))
    -- Either party blocks (from any non-expired state)
    OR (status = 'BLOCKED' AND status NOT IN ('EXPIRED', 'BLOCKED'))
  );

-- No DELETE policy

-- =============================================================================
-- RLS POLICIES: address_book
-- =============================================================================

ALTER TABLE address_book ENABLE ROW LEVEL SECURITY;

-- Clients can only read their own address book
CREATE POLICY "address_book_owner_select"
  ON address_book FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

-- Clients can update alias/notes on their own entries
CREATE POLICY "address_book_owner_update"
  ON address_book FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- No client INSERT (trigger-only) | No DELETE (permanent)

-- =============================================================================
-- RLS POLICIES: company_personnel
-- =============================================================================

ALTER TABLE company_personnel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "personnel_select_owner_or_connected"
  ON company_personnel FOR SELECT
  TO authenticated
  USING (
    auth.uid() = profile_id
    OR has_accepted_handshake(auth.uid(), profile_id)
    OR has_gstin_handshake(auth.uid(), company_gstin)
  );

CREATE POLICY "personnel_insert_owner"
  ON company_personnel FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "personnel_update_owner"
  ON company_personnel FOR UPDATE
  TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "personnel_delete_owner"
  ON company_personnel FOR DELETE
  TO authenticated
  USING (auth.uid() = profile_id);

-- =============================================================================
-- RLS POLICIES: unmasking_audit
-- =============================================================================

ALTER TABLE unmasking_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_select_own_viewer"
  ON unmasking_audit FOR SELECT
  TO authenticated
  USING (auth.uid() = viewer_id);

CREATE POLICY "audit_insert_own"
  ON unmasking_audit FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = viewer_id);

-- No UPDATE (also blocked by prevent_unmasking_update trigger in initial migration)
-- No DELETE for clients

-- =============================================================================
-- RLS POLICIES: subscriptions
-- =============================================================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = profile_id);

-- INSERT / UPDATE / DELETE: service role only (PhonePe webhook)

-- =============================================================================
-- NOTE: Role extension tables RLS policies
-- These tables are defined in migration 000002_role_extensions.sql
-- RLS policies are co-located in that migration file per the
-- "RLS lives with its table" convention. See rls_policies.md for the policy specs.
-- =============================================================================
