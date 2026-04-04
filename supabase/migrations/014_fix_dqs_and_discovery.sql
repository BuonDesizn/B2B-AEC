-- =============================================================================
-- Migration 014: Fix DQS deleted filter + blocked user exclusion in discovery
-- =============================================================================

-- Fix 1: dqs_recalculate() must exclude deleted profiles
CREATE OR REPLACE FUNCTION dqs_recalculate()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE profiles p
  SET dqs_score = LEAST(
    1.0,
    GREATEST(
      0.0,
      (0.4 * COALESCE(p.dqs_responsiveness, 0.0)) +
      (0.3 * COALESCE(p.dqs_trust_loops, 0.0)) +
      (0.2 * COALESCE(p.dqs_verification, 0.0)) +
      (0.1 * COALESCE(p.dqs_profile_depth, 0.0))
    )
  )
  WHERE p.deleted_at IS NULL
    AND p.updated_at IS NOT NULL;
END;
$$;

-- Fix 2: searching_nearby_profiles() must exclude blocked users
CREATE OR REPLACE FUNCTION searching_nearby_profiles(
  searcher_lat DOUBLE PRECISION,
  searcher_lng DOUBLE PRECISION,
  radius_km INT DEFAULT 50,
  role_filter TEXT DEFAULT NULL,
  keyword TEXT DEFAULT NULL,
  page_size INT DEFAULT 20,
  page_offset INT DEFAULT 0
)
RETURNS TABLE (
  profile_id UUID,
  display_name TEXT,
  persona_type TEXT,
  city TEXT,
  state TEXT,
  dqs_score NUMERIC,
  distance_km NUMERIC,
  ranked_score NUMERIC,
  subscription_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  w_quality  FLOAT := 0.7;
  w_distance FLOAT := 0.3;
BEGIN
  -- Dynamic weights from system_config (fallback 70/30 if table missing)
  BEGIN
    SELECT
      (value->>'quality_weight')::FLOAT,
      (value->>'distance_weight')::FLOAT
    INTO w_quality, w_distance
    FROM system_config
    WHERE key = 'discovery_ranking_split';
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  RETURN QUERY
  SELECT
    p.id,
    p.org_name AS display_name,
    p.persona_type,
    p.city,
    p.state,
    p.dqs_score::NUMERIC,
    (ST_Distance(p.location, ST_SetSRID(ST_Point(searcher_lng, searcher_lat), 4326)) / 1000.0)::NUMERIC AS distance_km,
    (
      (p.dqs_score * w_quality) +
      (GREATEST(0, 1 - ((ST_Distance(p.location, ST_SetSRID(ST_Point(searcher_lng, searcher_lat), 4326)) / 1000.0) / GREATEST(radius_km, 1))) * w_distance)
    )::NUMERIC AS ranked_score,
    p.subscription_status
  FROM profiles p
  WHERE
    ST_DWithin(p.location, ST_SetSRID(ST_Point(searcher_lng, searcher_lat), 4326), radius_km * 1000.0)
    AND (role_filter IS NULL OR p.persona_type = role_filter)
    AND (keyword IS NULL OR p.org_name ILIKE '%' || keyword || '%')
    AND p.deleted_at IS NULL
    AND p.subscription_status != 'hard_locked'
    AND p.id != auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM connections c
      WHERE c.requester_id = auth.uid()
        AND c.target_id = p.id
        AND c.status = 'BLOCKED'
    )
    AND NOT EXISTS (
      SELECT 1 FROM connections c
      WHERE c.target_id = auth.uid()
        AND c.requester_id = p.id
        AND c.status = 'BLOCKED'
    )
  ORDER BY ranked_score DESC
  LIMIT LEAST(page_size, 50)
  OFFSET GREATEST(page_offset, 0);
END;
$$;
