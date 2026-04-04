-- Fix UUID generator inconsistency in company_personnel table
-- Change from uuid_generate_v4() to gen_random_uuid() for consistency with other tables

ALTER TABLE company_personnel ALTER COLUMN id SET DEFAULT gen_random_uuid();
