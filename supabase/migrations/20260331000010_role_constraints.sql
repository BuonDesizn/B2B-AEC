-- =============================================================================
-- BuonDesizn B2B Marketplace — Role Extension Constraint Enforcement
-- @witness [PP-001, C-001, CON-001, PS-001, ED-001]
-- =============================================================================

-- =============================================================================
-- SECTION 1: project_professionals (PP-001)
-- =============================================================================

-- PP-001: hourly_rate_min must not exceed hourly_rate_max
ALTER TABLE project_professionals
ADD CONSTRAINT pp_rates_order
CHECK (hourly_rate_min IS NULL OR hourly_rate_max IS NULL OR hourly_rate_min <= hourly_rate_max);

-- =============================================================================
-- SECTION 2: consultants (C-001)
-- =============================================================================

-- C-001: services_offered must be non-empty
ALTER TABLE consultants
ADD CONSTRAINT c_services_non_empty
CHECK (array_length(services_offered, 1) IS NOT NULL AND array_length(services_offered, 1) > 0);

-- C-001: min_project_value must not exceed largest_project_value
ALTER TABLE consultants
ADD CONSTRAINT c_project_value_range
CHECK (min_project_value IS NULL OR largest_project_value IS NULL OR min_project_value <= largest_project_value);

-- =============================================================================
-- SECTION 3: contractors (CON-001)
-- =============================================================================

-- CON-001: concurrent_projects_capacity must be >= 1
ALTER TABLE contractors
ADD CONSTRAINT con_capacity_minimum
CHECK (concurrent_projects_capacity >= 1);

-- CON-001: Workforce counts cannot be negative
ALTER TABLE contractors
ADD CONSTRAINT con_employees_non_negative
CHECK (permanent_employees >= 0);

ALTER TABLE contractors
ADD CONSTRAINT con_workers_non_negative
CHECK (skilled_workers >= 0);

-- =============================================================================
-- SECTION 4: product_sellers (PS-001)
-- =============================================================================

-- PS-001: delivery_radius_km must be >= 0
ALTER TABLE product_sellers
ADD CONSTRAINT ps_delivery_radius_non_negative
CHECK (delivery_radius_km >= 0);

-- PS-001: credit_period_days must be >= 0
ALTER TABLE product_sellers
ADD CONSTRAINT ps_credit_period_non_negative
CHECK (credit_period_days >= 0);

-- =============================================================================
-- SECTION 5: equipment_dealers (ED-001)
-- =============================================================================

-- ED-001: total_equipment_count must be >= 0
ALTER TABLE equipment_dealers
ADD CONSTRAINT ed_equipment_count_non_negative
CHECK (total_equipment_count >= 0);
