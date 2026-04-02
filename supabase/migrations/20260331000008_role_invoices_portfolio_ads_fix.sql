-- =============================================================================
-- BuonDesizn B2B Marketplace — Role, Invoices, Portfolio, Ads Fix Migration
-- @witness [MON-001] [SET-04] [PP-001] [CON-001] [MOD-001]
-- Source of truth: docs/system/SCREENS.md, API_CONTRACT.md, MOD-001 spec
-- =============================================================================

-- =============================================================================
-- SECTION 1: Add role column to profiles for admin/super_admin guards
-- Required by: All admin endpoints, moderation guards, audit protection
-- =============================================================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'super_admin'));

-- =============================================================================
-- SECTION 2: Fix ads.moderation_status CHECK constraint
-- Missing CLEARED and SUSPENDED states per API contract and MOD-001 spec
-- =============================================================================

ALTER TABLE ads
DROP CONSTRAINT IF EXISTS ads_moderation_status_check,
ADD CONSTRAINT ads_moderation_status_check
    CHECK (moderation_status IN (
        'PENDING',
        'APPROVED',
        'REJECTED',
        'FLAGGED',
        'SUSPENDED',
        'CLEARED'
    ));

-- =============================================================================
-- SECTION 3: Create invoices table for billing history
-- Required by: SCR-SET04 Billing & Invoices screen
-- API Endpoints: GET /api/subscriptions/invoices, GET /api/subscriptions/receipts/:id
-- Purpose: Persistent audit trail of all PhonePe subscription payments
-- =============================================================================

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    phonepe_transaction_id TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    billing_period_start TIMESTAMPTZ NOT NULL,
    billing_period_end TIMESTAMPTZ NOT NULL,
    invoice_pdf_url TEXT,
    status TEXT NOT NULL DEFAULT 'PAID'
        CHECK (status IN ('PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED')),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_profile ON invoices(profile_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_generated_at ON invoices(generated_at);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_owner_select" ON invoices
    FOR SELECT TO authenticated
    USING (auth.uid() = profile_id);

CREATE TRIGGER invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SECTION 4: Create portfolio_items table for portfolio CRUD
-- Required by: SCR-PP05 (Portfolio/Work Samples), SCR-CON03 (Contractor Portfolio)
-- API Endpoints: GET/POST/DELETE /api/profiles/me/portfolio/:id
-- Purpose: Individual portfolio items with images, descriptions, CRUD operations
-- =============================================================================

CREATE TABLE IF NOT EXISTS portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    drawings_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_profile ON portfolio_items(profile_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_active ON portfolio_items(is_active);

ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portfolio_items_select_public" ON portfolio_items
    FOR SELECT TO authenticated
    USING (
        is_active = TRUE
        OR auth.uid() = profile_id
    );

CREATE POLICY "portfolio_items_owner_all" ON portfolio_items
    FOR ALL USING (auth.uid() = profile_id);

CREATE TRIGGER portfolio_items_updated_at
    BEFORE UPDATE ON portfolio_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SECTION 5: Remove equipment_bookings references (if any exist)
-- Decision: Equipment RFQs only, no platform-managed bookings
-- =============================================================================

-- No action needed - table was never created.
-- SCR-ED06 should be marked "Coming Soon" or removed from Phase 1 scope.
