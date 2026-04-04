-- =============================================================================
-- BuonDesizn B2B Marketplace — Standardize Soft Deletes
-- @witness [QA-001] [ID-001]
-- =============================================================================
-- Migrate all tables from is_active BOOLEAN to deleted_at TIMESTAMPTZ
-- to match the canonical soft-delete pattern used by profiles.
-- =============================================================================

-- =============================================================================
-- SECTION 1: company_personnel
-- =============================================================================

ALTER TABLE company_personnel
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

UPDATE company_personnel
  SET deleted_at = NOW()
  WHERE is_active = false;

DROP POLICY IF EXISTS "personnel_owner_or_connected" ON company_personnel;

CREATE POLICY "personnel_owner_or_connected" ON company_personnel
  FOR SELECT USING (
    deleted_at IS NULL
    AND (
      auth.uid() = profile_id
      OR EXISTS (
        SELECT 1 FROM connections c
        JOIN profiles p ON p.id = c.requester_id OR p.id = c.target_id
        WHERE c.status = 'ACCEPTED'
          AND (c.requester_id = auth.uid() OR c.target_id = auth.uid())
          AND p.gstin = company_personnel.company_gstin
          AND p.id != auth.uid()
      )
    )
  );

ALTER TABLE company_personnel
  DROP COLUMN IF EXISTS is_active;

-- =============================================================================
-- SECTION 2: products
-- =============================================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

UPDATE products
  SET deleted_at = NOW()
  WHERE is_active = false;

DROP POLICY IF EXISTS "products_select_active" ON products;

CREATE POLICY "products_select_active" ON products
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    OR auth.uid() = seller_id
  );

ALTER TABLE products
  DROP COLUMN IF EXISTS is_active;

-- =============================================================================
-- SECTION 3: equipment
-- =============================================================================

ALTER TABLE equipment
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

UPDATE equipment
  SET deleted_at = NOW()
  WHERE is_active = false;

DROP POLICY IF EXISTS "equipment_select_active" ON equipment;

CREATE POLICY "equipment_select_active" ON equipment
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL AND available = TRUE
    OR auth.uid() = dealer_id
  );

ALTER TABLE equipment
  DROP COLUMN IF EXISTS is_active;

-- =============================================================================
-- SECTION 4: portfolio_items
-- =============================================================================

ALTER TABLE portfolio_items
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

UPDATE portfolio_items
  SET deleted_at = NOW()
  WHERE is_active = false;

DROP INDEX IF EXISTS idx_portfolio_items_active;
CREATE INDEX IF NOT EXISTS idx_portfolio_items_deleted_at ON portfolio_items(deleted_at) WHERE deleted_at IS NOT NULL;

DROP POLICY IF EXISTS "portfolio_items_select_public" ON portfolio_items;

CREATE POLICY "portfolio_items_select_public" ON portfolio_items
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    OR auth.uid() = profile_id
  );

ALTER TABLE portfolio_items
  DROP COLUMN IF EXISTS is_active;

-- =============================================================================
-- SECTION 5: services
-- =============================================================================

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

UPDATE services
  SET deleted_at = NOW()
  WHERE is_active = false;

DROP INDEX IF EXISTS idx_services_active;
CREATE INDEX IF NOT EXISTS idx_services_deleted_at ON services(deleted_at) WHERE deleted_at IS NOT NULL;

DROP POLICY IF EXISTS "services_select_active" ON services;

CREATE POLICY "services_select_active" ON services
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    OR auth.uid() = profile_id
  );

ALTER TABLE services
  DROP COLUMN IF EXISTS is_active;
