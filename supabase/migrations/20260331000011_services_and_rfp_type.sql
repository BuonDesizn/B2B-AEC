-- =============================================================================
-- BuonDesizn B2B Marketplace — Services Table & RFP Request Type
-- @witness [C-001] [RFP-001]
-- =============================================================================

-- =============================================================================
-- SECTION 1: Create services table for Consultants (C role)
-- =============================================================================

CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 100),
    description TEXT CHECK (char_length(description) <= 1000),
    category TEXT NOT NULL,
    subcategory TEXT,
    price_per_hour DECIMAL(10,2),
    price_per_project DECIMAL(10,2),
    delivery_time_days INT,
    requires_site_visit BOOLEAN DEFAULT FALSE,
    images TEXT[] DEFAULT ARRAY[]::TEXT[] CHECK (array_length(images, 1) IS NULL OR array_length(images, 1) <= 5),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_profile ON services(profile_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services_select_active" ON services
    FOR SELECT TO authenticated
    USING (is_active = TRUE OR auth.uid() = profile_id);

CREATE POLICY "services_owner_all" ON services
    FOR ALL USING (auth.uid() = profile_id);

CREATE TRIGGER services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SECTION 2: Add request_type to rfps table
-- Allows RFPs to target Products, Services, Equipment, or Projects
-- =============================================================================

ALTER TABLE rfps
ADD COLUMN IF NOT EXISTS request_type TEXT
    CHECK (request_type IN ('PRODUCT', 'SERVICE', 'EQUIPMENT', 'PROJECT'));

-- Backfill existing RFPs to default to 'PROJECT'
UPDATE rfps SET request_type = 'PROJECT' WHERE request_type IS NULL;

-- =============================================================================
-- SECTION 3: Enforce max 5 images on existing tables
-- =============================================================================

-- products
ALTER TABLE products
DROP CONSTRAINT IF EXISTS products_images_max_5,
ADD CONSTRAINT products_images_max_5
    CHECK (array_length(images, 1) IS NULL OR array_length(images, 1) <= 5);

-- equipment
ALTER TABLE equipment
DROP CONSTRAINT IF EXISTS equipment_images_max_5,
ADD CONSTRAINT equipment_images_max_5
    CHECK (array_length(images, 1) IS NULL OR array_length(images, 1) <= 5);

-- portfolio_items
ALTER TABLE portfolio_items
DROP CONSTRAINT IF EXISTS portfolio_items_images_max_5,
ADD CONSTRAINT portfolio_items_images_max_5
    CHECK (array_length(images, 1) IS NULL OR array_length(images, 1) <= 5);
