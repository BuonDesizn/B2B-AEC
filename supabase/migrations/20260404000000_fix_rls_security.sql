-- =============================================================================
-- BuonDesizn B2B Marketplace — Fix RLS Security Holes
-- @audit 2026-04-04 — Close overly-permissive and overly-restrictive policies
-- =============================================================================

-- =============================================================================
-- SECTION 1: Restrict email_queue — was FOR ALL USING (true)
-- Only service role or super_admin should access this table.
-- =============================================================================

DROP POLICY IF EXISTS "email_queue_system_all" ON email_queue;

CREATE POLICY "email_queue_super_admin_all" ON email_queue
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
              AND role = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
              AND role = 'super_admin'
        )
    );

-- =============================================================================
-- SECTION 2: Restrict async_jobs — was FOR ALL USING (true)
-- Only service role or super_admin should access this table.
-- =============================================================================

DROP POLICY IF EXISTS "async_jobs_system_all" ON async_jobs;

CREATE POLICY "async_jobs_super_admin_all" ON async_jobs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
              AND role = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
              AND role = 'super_admin'
        )
    );

-- =============================================================================
-- SECTION 3: Fix system_audit_log SELECT — was USING (false)
-- Allow super_admin to read audit logs.
-- =============================================================================

DROP POLICY IF EXISTS "system_audit_log_admin_select" ON system_audit_log;

CREATE POLICY "system_audit_log_super_admin_select" ON system_audit_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
              AND role = 'super_admin'
        )
    );

-- =============================================================================
-- SECTION 4: Fix audit_purge_queue — was FOR ALL USING (false)
-- Allow super_admin to perform ALL operations.
-- =============================================================================

DROP POLICY IF EXISTS "audit_purge_queue_admin_all" ON audit_purge_queue;

CREATE POLICY "audit_purge_queue_super_admin_all" ON audit_purge_queue
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
              AND role = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
              AND role = 'super_admin'
        )
    );

-- =============================================================================
-- SECTION 5: Tighten role extension table SELECT policies
-- Was: any authenticated user can read ALL rows (if profile not deleted/locked)
-- Now: only the owner can SELECT their own row
-- =============================================================================

-- Project Professionals
DROP POLICY IF EXISTS "pp_select_authenticated" ON project_professionals;

CREATE POLICY "pp_select_owner" ON project_professionals
    FOR SELECT
    USING (auth.uid() = profile_id);

-- Consultants
DROP POLICY IF EXISTS "c_select_authenticated" ON consultants;

CREATE POLICY "c_select_owner" ON consultants
    FOR SELECT
    USING (auth.uid() = profile_id);

-- Contractors
DROP POLICY IF EXISTS "con_select_authenticated" ON contractors;

CREATE POLICY "con_select_owner" ON contractors
    FOR SELECT
    USING (auth.uid() = profile_id);

-- Product Sellers
DROP POLICY IF EXISTS "ps_select_authenticated" ON product_sellers;

CREATE POLICY "ps_select_owner" ON product_sellers
    FOR SELECT
    USING (auth.uid() = profile_id);

-- Equipment Dealers
DROP POLICY IF EXISTS "ed_select_authenticated" ON equipment_dealers;

CREATE POLICY "ed_select_owner" ON equipment_dealers
    FOR SELECT
    USING (auth.uid() = profile_id);
