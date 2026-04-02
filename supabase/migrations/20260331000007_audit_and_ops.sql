-- =============================================================================
-- BuonDesizn B2B Marketplace — Audit & Ops Migration
-- @witness [QA-001] [HD-001]
-- Source of truth: docs/database/db_schema.md §10, §12
-- =============================================================================

-- =============================================================================
-- SECTION 1: Products Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS products (
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

CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(available) WHERE available = TRUE;

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

-- =============================================================================
-- SECTION 2: Equipment Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS equipment (
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

CREATE INDEX IF NOT EXISTS idx_equipment_dealer ON equipment(dealer_id);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category);
CREATE INDEX IF NOT EXISTS idx_equipment_location ON equipment USING GIST(location) WHERE location IS NOT NULL AND available = TRUE;

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

-- =============================================================================
-- SECTION 3: Unmasking Audit Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_unmasking_audit_viewer ON unmasking_audit(viewer_id);
CREATE INDEX IF NOT EXISTS idx_unmasking_audit_viewed ON unmasking_audit(viewed_id);
CREATE INDEX IF NOT EXISTS idx_unmasking_audit_unmasked_at ON unmasking_audit(unmasked_at);
CREATE INDEX IF NOT EXISTS idx_unmasking_audit_retention ON unmasking_audit(retention_expires_at);

-- =============================================================================
-- SECTION 4: Prevent Audit Modification
-- =============================================================================

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

-- =============================================================================
-- SECTION 5: Address Book Auto-Populate Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION auto_populate_address_book()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'ACCEPTED' AND OLD.status != 'ACCEPTED' THEN
    -- Insert for requester
    INSERT INTO address_book (owner_id, contact_id, first_handshake_id)
    VALUES (NEW.requester_id, NEW.target_id, NEW.id)
    ON CONFLICT (owner_id, contact_id) DO NOTHING;

    -- Insert for target
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
