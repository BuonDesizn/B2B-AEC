-- =============================================================================
-- BuonDesizn B2B Marketplace — Role Extensions Migration
-- @witness [PP-001] [C-001] [CON-001] [PS-001] [ED-001]
-- Source of truth: docs/database/db_schema.md §2
-- =============================================================================

-- =============================================================================
-- SECTION 1: Project Professionals (PP)
-- =============================================================================

CREATE TABLE IF NOT EXISTS project_professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  designation TEXT CHECK (designation IN ('Architect', 'Interior Designer', 'Landscape Architect', 'Urban Planner', 'Other')),
  experience_years INT CHECK (experience_years >= 0 AND experience_years <= 60),
  qualification TEXT,
  specialization TEXT[],
  coa_number TEXT,
  coa_expiry_date DATE,

  portfolio_summary TEXT CHECK (char_length(portfolio_summary) <= 500),
  total_projects INT DEFAULT 0,
  featured_project_ids UUID[],
  awards JSONB DEFAULT '[]'::jsonb,

  software_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  available_for_hire BOOLEAN DEFAULT TRUE,
  hourly_rate_min DECIMAL(10,2),
  hourly_rate_max DECIMAL(10,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pp_profile ON project_professionals(profile_id);
CREATE INDEX IF NOT EXISTS idx_pp_designation ON project_professionals(designation);

CREATE TRIGGER project_professionals_updated_at
  BEFORE UPDATE ON project_professionals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SECTION 2: Consultants (C)
-- =============================================================================

CREATE TABLE IF NOT EXISTS consultants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  company_type TEXT CHECK (company_type IN ('Proprietorship', 'Partnership', 'Private Limited', 'LLP', 'Public Limited')),
  annual_turnover_range TEXT CHECK (annual_turnover_range IN ('0-10L', '10L-50L', '50L-1Cr', '1Cr-5Cr', '5Cr-10Cr', '10Cr+')),
  employee_count_range TEXT CHECK (employee_count_range IN ('1-10', '11-50', '51-200', '201-500', '500+')),

  services_offered TEXT[] NOT NULL,
  design_software TEXT[] DEFAULT ARRAY[]::TEXT[],

  iso_9001 BOOLEAN DEFAULT FALSE,
  iso_14001 BOOLEAN DEFAULT FALSE,
  iso_45001 BOOLEAN DEFAULT FALSE,
  other_certifications TEXT[],

  largest_project_value DECIMAL(15,2),
  typical_project_size TEXT CHECK (typical_project_size IN ('Small (<1Cr)', 'Medium (1-10Cr)', 'Large (10Cr+)')),
  accepting_new_projects BOOLEAN DEFAULT TRUE,
  min_project_value DECIMAL(10,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_c_profile ON consultants(profile_id);
CREATE INDEX IF NOT EXISTS idx_c_company_type ON consultants(company_type);

CREATE TRIGGER consultants_updated_at
  BEFORE UPDATE ON consultants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SECTION 3: Contractors (CON)
-- =============================================================================

CREATE TABLE IF NOT EXISTS contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  company_type TEXT CHECK (company_type IN ('Proprietorship', 'Partnership', 'Private Limited', 'LLP', 'Public Limited')),
  annual_turnover_range TEXT CHECK (annual_turnover_range IN ('0-1Cr', '1-5Cr', '5-10Cr', '10-25Cr', '25-50Cr', '50Cr+')),

  permanent_employees INT DEFAULT 0,
  skilled_workers INT DEFAULT 0,
  owned_equipment JSONB DEFAULT '[]'::jsonb,

  pf_registration_number TEXT,
  esic_registration_number TEXT,
  iso_9001 BOOLEAN DEFAULT FALSE,
  safety_incidents_last_year INT DEFAULT 0,

  work_categories TEXT[] NOT NULL,
  contractor_license_number TEXT,
  license_class TEXT CHECK (license_class IN ('Class I', 'Class II', 'Class III', 'Unlimited')),
  license_expiry_date DATE,

  concurrent_projects_capacity INT DEFAULT 1,
  largest_project_completed DECIMAL(15,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_con_profile ON contractors(profile_id);
CREATE INDEX IF NOT EXISTS idx_con_license_class ON contractors(license_class);

CREATE TRIGGER contractors_updated_at
  BEFORE UPDATE ON contractors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SECTION 4: Product Sellers (PS)
-- =============================================================================

CREATE TABLE IF NOT EXISTS product_sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  business_type TEXT CHECK (business_type IN ('Manufacturer', 'Wholesaler', 'Retailer', 'Distributor')) NOT NULL,
  brand_names TEXT[],
  primary_category TEXT NOT NULL,
  secondary_categories TEXT[],

  min_order_value DECIMAL(10,2),
  accepts_bulk_orders BOOLEAN DEFAULT TRUE,
  delivery_available BOOLEAN DEFAULT TRUE,
  delivery_radius_km INT DEFAULT 0,

  warehouse_locations JSONB DEFAULT '[]'::jsonb,
  total_skus INT DEFAULT 0,
  offers_credit BOOLEAN DEFAULT FALSE,
  credit_period_days INT DEFAULT 0,

  iso_certified BOOLEAN DEFAULT FALSE,
  bis_certified BOOLEAN DEFAULT FALSE,
  warranty_offered BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ps_profile ON product_sellers(profile_id);
CREATE INDEX IF NOT EXISTS idx_ps_business_type ON product_sellers(business_type);
CREATE INDEX IF NOT EXISTS idx_ps_category ON product_sellers(primary_category);

CREATE TRIGGER product_sellers_updated_at
  BEFORE UPDATE ON product_sellers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SECTION 5: Equipment Dealers (ED)
-- =============================================================================

CREATE TABLE IF NOT EXISTS equipment_dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  business_type TEXT CHECK (business_type IN ('Rental', 'Sales', 'Both')) NOT NULL,
  total_equipment_count INT DEFAULT 0,
  equipment_categories TEXT[] NOT NULL,

  park_location GEOGRAPHY(POINT, 4326),
  park_address TEXT,

  hourly_rental_available BOOLEAN DEFAULT FALSE,
  daily_rental_available BOOLEAN DEFAULT TRUE,
  provides_operators BOOLEAN DEFAULT FALSE,
  provides_transportation BOOLEAN DEFAULT TRUE,

  breakdown_support_24x7 BOOLEAN DEFAULT FALSE,
  all_rc_updated BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ed_profile ON equipment_dealers(profile_id);
CREATE INDEX IF NOT EXISTS idx_ed_business_type ON equipment_dealers(business_type);
CREATE INDEX IF NOT EXISTS idx_ed_categories ON equipment_dealers USING GIN(equipment_categories);
CREATE INDEX IF NOT EXISTS idx_ed_park_location ON equipment_dealers USING GIST(park_location) WHERE park_location IS NOT NULL;

CREATE TRIGGER equipment_dealers_updated_at
  BEFORE UPDATE ON equipment_dealers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SECTION 6: RLS Policies for Role Extensions
-- =============================================================================

-- Project Professionals
ALTER TABLE project_professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pp_select_authenticated" ON project_professionals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = project_professionals.profile_id
        AND p.deleted_at IS NULL
        AND p.subscription_status != 'hard_locked'
    )
  );

CREATE POLICY "pp_owner_update" ON project_professionals
  FOR ALL USING (auth.uid() = profile_id);

-- Consultants
ALTER TABLE consultants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "c_select_authenticated" ON consultants
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = consultants.profile_id
        AND p.deleted_at IS NULL
        AND p.subscription_status != 'hard_locked'
    )
  );

CREATE POLICY "c_owner_update" ON consultants
  FOR ALL USING (auth.uid() = profile_id);

-- Contractors
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "con_select_authenticated" ON contractors
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = contractors.profile_id
        AND p.deleted_at IS NULL
        AND p.subscription_status != 'hard_locked'
    )
  );

CREATE POLICY "con_owner_update" ON contractors
  FOR ALL USING (auth.uid() = profile_id);

-- Product Sellers
ALTER TABLE product_sellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ps_select_authenticated" ON product_sellers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = product_sellers.profile_id
        AND p.deleted_at IS NULL
        AND p.subscription_status != 'hard_locked'
    )
  );

CREATE POLICY "ps_owner_update" ON product_sellers
  FOR ALL USING (auth.uid() = profile_id);

-- Equipment Dealers
ALTER TABLE equipment_dealers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ed_select_authenticated" ON equipment_dealers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = equipment_dealers.profile_id
        AND p.deleted_at IS NULL
        AND p.subscription_status != 'hard_locked'
    )
  );

CREATE POLICY "ed_owner_update" ON equipment_dealers
  FOR ALL USING (auth.uid() = profile_id);
