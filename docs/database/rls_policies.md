---
title: Row Level Security Policies
id: RLS_POLICIES
type: security_specification
status: production_ready
version: 3.0
last_updated: 2026-04-02
owner: @qa
criticality: critical
depends_on: [db_schema, SOUL, STATE_MACHINES]
---

# Row Level Security Policies

> **Authority**: These policies ARE the Handshake Economy at the database layer.
> No API route, no server component, and no client can bypass them.
> If a policy is missing from this document, it does not exist — treat the table as unprotected.
>
> **Source of Truth**: This document MUST match the migration SQL files in
> `supabase/migrations/`. Any discrepancy is a bug in this document.

## Enforcement Rules (Non-Negotiable)

1. Every table has `ALTER TABLE <name> ENABLE ROW LEVEL SECURITY` — no exceptions
2. The default posture when no policy matches is **DENY** (Postgres default)
3. PII columns (`phone_primary`, `phone_secondary`, `email_business`) are **never** returned raw from SELECT policies — they are served exclusively via `get_visible_contact_info()`
4. `SECURITY DEFINER` functions bypass RLS — they must enforce the Handshake check internally
5. Service role (used by webhooks and cron jobs) bypasses RLS — use it only for system operations, never in client paths

---

## Helper: `has_accepted_handshake(viewer UUID, target UUID)`

```sql
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
```

---

## Helper: `has_gstin_handshake(viewer UUID, target_gstin TEXT)`

```sql
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
```

---

## 1. `profiles`

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_self_access"
  ON profiles FOR ALL
  USING (auth.uid() = id);
```

---

## 2. `connections`

```sql
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "connections_parties_only"
  ON connections FOR ALL
  USING (auth.uid() IN (requester_id, target_id));
```

---

## 3. `address_book`

```sql
ALTER TABLE address_book ENABLE ROW LEVEL SECURITY;

CREATE POLICY "address_book_owner_only"
  ON address_book FOR ALL
  USING (auth.uid() = owner_id);
```

---

## 4. `company_personnel`

```sql
ALTER TABLE company_personnel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "personnel_owner_or_connected"
  ON company_personnel FOR SELECT
  USING (
    auth.uid() = profile_id
    OR EXISTS (
      SELECT 1 FROM connections c
      JOIN profiles p ON p.id = c.requester_id OR p.id = c.target_id
      WHERE c.status = 'ACCEPTED'
        AND (c.requester_id = auth.uid() OR c.target_id = auth.uid())
        AND p.gstin = company_personnel.company_gstin
        AND p.id != auth.uid()
    )
  );
```

---

## 5. `unmasking_audit`

```sql
ALTER TABLE unmasking_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_insert_only"
  ON unmasking_audit FOR INSERT
  WITH CHECK (auth.uid() = viewer_id);
```

---

## 6. `subscriptions`

```sql
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_self"
  ON subscriptions FOR ALL
  USING (auth.uid() = profile_id);
```

---

## 7. `subscription_plans`

```sql
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscription_plans_select"
  ON subscription_plans FOR SELECT TO authenticated
  USING (is_active = TRUE AND is_public = TRUE);
```

---

## 8. Role Extension Tables

Tables: `project_professionals`, `consultants`, `contractors`, `product_sellers`, `equipment_dealers`

```sql
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
```

---

## 9. `rfps` and `rfp_responses`

```sql
ALTER TABLE rfps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rfps_select_open" ON rfps
  FOR SELECT TO authenticated
  USING (
    status = 'OPEN'
    OR auth.uid() = creator_id
  );

CREATE POLICY "rfps_owner_all" ON rfps
  FOR ALL USING (auth.uid() = creator_id);

-- rfp_responses --
ALTER TABLE rfp_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rfp_responses_select_parties" ON rfp_responses
  FOR SELECT TO authenticated
  USING (
    responder_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM rfps r WHERE r.id = rfp_responses.rfp_id AND r.creator_id = auth.uid()
    )
  );

CREATE POLICY "rfp_responses_responder_create" ON rfp_responses
  FOR INSERT WITH CHECK (auth.uid() = responder_id);

CREATE POLICY "rfp_responses_creator_update" ON rfp_responses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM rfps r WHERE r.id = rfp_responses.rfp_id AND r.creator_id = auth.uid()
    )
  );
```

---

## 10. `rfp_invitations`

```sql
ALTER TABLE rfp_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rfp_invitations_select_parties" ON rfp_invitations
  FOR SELECT TO authenticated
  USING (
    invitee_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM rfps r WHERE r.id = rfp_invitations.rfp_id AND r.creator_id = auth.uid()
    )
  );

CREATE POLICY "rfp_invitations_creator_all" ON rfp_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM rfps r WHERE r.id = rfp_invitations.rfp_id AND r.creator_id = auth.uid()
    )
  );
```

---

## 11. `ads`

```sql
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ads_select_active" ON ads
  FOR SELECT TO authenticated
  USING (
    status = 'ACTIVE' AND is_paused = FALSE
    OR auth.uid() = profile_id
  );

CREATE POLICY "ads_owner_all" ON ads
  FOR ALL USING (auth.uid() = profile_id);
```

---

## 12. `ad_analytics`

```sql
ALTER TABLE ad_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ad_analytics_owner_select" ON ad_analytics
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ads a WHERE a.id = ad_analytics.ad_id AND a.profile_id = auth.uid()
    )
  );

CREATE POLICY "ad_analytics_insert_system" ON ad_analytics
  FOR INSERT WITH CHECK (true);
```

---

## 13. `notifications`

```sql
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_owner_select" ON notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = recipient_id);

CREATE POLICY "notifications_system_insert" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "notifications_owner_update" ON notifications
  FOR UPDATE USING (auth.uid() = recipient_id);
```

---

## 14. `notification_preferences`

```sql
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_preferences_owner" ON notification_preferences
  FOR ALL USING (auth.uid() = profile_id);
```

---

## 15. `email_queue`

```sql
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_queue_system_all" ON email_queue
  FOR ALL USING (true);
```

---

## 16. `products`

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select_active" ON products
  FOR SELECT TO authenticated
  USING (
    is_active = TRUE
    OR auth.uid() = seller_id
  );

CREATE POLICY "products_owner_all" ON products
  FOR ALL USING (auth.uid() = seller_id);
```

---

## 17. `equipment`

```sql
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "equipment_select_active" ON equipment
  FOR SELECT TO authenticated
  USING (
    is_active = TRUE AND available = TRUE
    OR auth.uid() = dealer_id
  );

CREATE POLICY "equipment_owner_all" ON equipment
  FOR ALL USING (auth.uid() = dealer_id);
```

---

## 18. `system_config`

```sql
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_config_select_authenticated" ON system_config
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "system_config_admin_update" ON system_config
  FOR ALL USING (false);
```

---

## 19. `system_audit_log`

```sql
ALTER TABLE system_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_audit_log_insert" ON system_audit_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "system_audit_log_admin_select" ON system_audit_log
  FOR SELECT USING (false);
```

---

## 20. `audit_purge_queue`

```sql
ALTER TABLE audit_purge_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_purge_queue_admin_all" ON audit_purge_queue
  FOR ALL USING (false);
```

---

## 21. `async_jobs`

```sql
ALTER TABLE async_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "async_jobs_system_all" ON async_jobs
  FOR ALL USING (true);
```

---

## `get_visible_contact_info()` — The PII Gate

This function is **the single authoritative path** for serving PII from `profiles`. No API route, server component, or RPC may SELECT `phone_primary`, `phone_secondary`, or `email_business` directly. They must call this function.

### Logic

```
1. Viewer IS the target                    → return all fields (own profile)
2. Direct ACCEPTED handshake exists        → return all fields
3. Company DNA: viewer has ACCEPTED with
   ANY profile sharing target's GSTIN      → return all fields
4. None of the above                       → return all NULLs, is_masked = TRUE
```

### Definition

```sql
CREATE TYPE contact_info AS (
  phone_primary    TEXT,
  phone_secondary  TEXT,
  email_business   TEXT,
  is_masked        BOOLEAN
);

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
  IF auth.uid() != p_viewer_id THEN
    RAISE EXCEPTION 'viewer_id must match the authenticated user'
      USING ERRCODE = 'P0001';
  END IF;

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

  SELECT EXISTS (
    SELECT 1 FROM connections
    WHERE status = 'ACCEPTED'
      AND (
        (requester_id = p_viewer_id AND target_id = p_target_id)
        OR (requester_id = p_target_id AND target_id = p_viewer_id)
      )
  ) INTO v_can_unmask;

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
    result.phone_primary   := NULL;
    result.phone_secondary := NULL;
    result.email_business  := NULL;
    result.is_masked       := TRUE;
  END IF;

  RETURN result;
END;
$$;
```

---

## Audit Checklist (for @qa)

Before marking any feature GREEN that touches profiles, connections, or company_personnel:

- [ ] `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` present for every new table
- [ ] No SELECT policy returns `phone_primary`, `phone_secondary`, or `email_business` directly
- [ ] All PII access routes through `get_visible_contact_info()`
- [ ] `unmasking_audit` receives an INSERT on every `ACCEPTED` transition
- [ ] `hard_locked` profiles are excluded from public SELECT policies
- [ ] Soft-deleted profiles (`deleted_at IS NOT NULL`) excluded from public SELECT
- [ ] `connections` UPDATE policy cannot transition `ACCEPTED → REQUESTED` (one-way)
- [ ] `address_book` has no client INSERT policy (trigger-only population)
- [ ] Service role paths are documented and never used in client-facing code
