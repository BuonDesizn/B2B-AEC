// @witness [RM-001]
import { sql } from 'kysely';

import { DQS_WEIGHTS, DQS_FORMULA_WEIGHTS, SUBSCRIPTION_STATUS, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/lib/constants';
import { db } from '@/lib/db';

// =============================================================================
// Discovery Ranking Constants
// =============================================================================

const DEFAULT_QUALITY_WEIGHT = DQS_WEIGHTS.QUALITY;
const DEFAULT_DISTANCE_WEIGHT = DQS_WEIGHTS.DISTANCE;
const DEFAULT_RADIUS_KM = 50;
const MAX_RADIUS_KM = 500;

// =============================================================================
// Discovery Service
// =============================================================================

export interface SearchNearbyInput {
  searcher_lat: number;
  searcher_lng: number;
  radius_km?: number;
  role_filter?: string;
  keyword?: string;
  page_size?: number;
  page_offset?: number;
}

export interface SearchResult {
  profile_id: string;
  display_name: string;
  persona_type: string;
  city: string | null;
  state: string | null;
  dqs_score: number | null;
  distance_km: number;
  ranked_score: number;
  subscription_status: string | null;
}

export const discoveryService = {
  /**
   * Search for nearby professionals using 70/30 ranking formula
   * 70% DQS + 30% proximity
   * @witness [RM-001]
   */
  async searchNearby(input: SearchNearbyInput): Promise<SearchResult[]> {
    // Validate inputs
    const radiusKm = Math.min(input.radius_km ?? DEFAULT_RADIUS_KM, MAX_RADIUS_KM);
    const pageSize = Math.min(input.page_size ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const pageOffset = input.page_offset ?? 0;

    if (radiusKm <= 0) {
      throw new Error('radius_km must be greater than 0');
    }

    // Get dynamic weights from system_config
    const configResult = await db
      .selectFrom('system_config')
      .select('value')
      .where('key', '=', 'discovery_ranking_split')
      .executeTakeFirst();

    let qualityWeight = DEFAULT_QUALITY_WEIGHT;
    let distanceWeight = DEFAULT_DISTANCE_WEIGHT;

    if (configResult && typeof configResult.value === 'object' && configResult.value !== null) {
      const config = configResult.value as any;
      if (config.quality_weight && config.distance_weight) {
        qualityWeight = config.quality_weight;
        distanceWeight = config.distance_weight;
      }
    }

    // Build the PostGIS query with 70/30 ranking
    // Note: This assumes PostGIS is enabled on the database
    const results = await sql<SearchResult>`
      SELECT
        p.id as profile_id,
        p.org_name as display_name,
        p.persona_type,
        p.city,
        p.state,
        p.dqs_score,
        ST_Distance(
          p.location::geography,
          ST_SetSRID(ST_MakePoint(${input.searcher_lng}, ${input.searcher_lat}), 4326)::geography
        ) / 1000.0 as distance_km,
        (${qualityWeight} * COALESCE(p.dqs_score, 0)) +
        (${distanceWeight} * (1 - LEAST(
          ST_Distance(
            p.location::geography,
            ST_SetSRID(ST_MakePoint(${input.searcher_lng}, ${input.searcher_lat}), 4326)::geography
          ) / 1000.0 / ${radiusKm},
          1.0
        ))) as ranked_score,
        p.subscription_status
      FROM profiles p
      WHERE p.location IS NOT NULL
        AND p.subscription_status != ${SUBSCRIPTION_STATUS.HARD_LOCKED}
        AND ST_DWithin(
          p.location::geography,
          ST_SetSRID(ST_MakePoint(${input.searcher_lng}, ${input.searcher_lat}), 4326)::geography,
          ${radiusKm} * 1000
        )
        ${input.role_filter ? sql`AND p.persona_type = ${input.role_filter}` : sql``}
        ${input.keyword ? sql`AND (
          p.org_name ILIKE ${'%' + input.keyword + '%'}
        )` : sql``}
      ORDER BY ranked_score DESC
      LIMIT ${pageSize}
      OFFSET ${pageOffset}
    `.execute(db);

    return results.rows;
  },

  /**
   * Calculate DQS score for a profile
   * Components: 40% responsiveness, 30% trust, 20% verification, 10% profile depth
   * @witness [RM-001]
   */
  async calculateDQS(profileId: string): Promise<number> {
    // Get profile data
    const profile = await db
      .selectFrom('profiles')
      .selectAll()
      .where('id', '=', profileId)
      .executeTakeFirst();

    if (!profile) {
      throw new Error('Profile not found');
    }

    // Calculate components
    const responsiveness = await this.calculateResponsiveness(profileId);
    const trustLoops = await this.calculateTrustLoops(profileId);
    const verification = this.calculateVerification(profile);
    const profileDepth = this.calculateProfileDepth(profile);

    // Weighted DQS score
    const dqs = (
      (DQS_FORMULA_WEIGHTS.RESPONSIVENESS * responsiveness) +
      (DQS_FORMULA_WEIGHTS.TRUST_LOOPS * trustLoops) +
      (DQS_FORMULA_WEIGHTS.VERIFICATION * verification) +
      (DQS_FORMULA_WEIGHTS.PROFILE_DEPTH * profileDepth)
    );

    // Update profile with new DQS score
    await db
      .updateTable('profiles')
      .set({
        dqs_score: dqs,
        updated_at: new Date(),
      })
      .where('id', '=', profileId)
      .execute();

    return dqs;
  },

  /**
   * Calculate responsiveness component (40% of DQS)
   * Based on average handshake response time
   */
  async calculateResponsiveness(profileId: string): Promise<number> {
    const result = await db
      .selectFrom('connections')
      .select((eb) => [
        eb.fn.avg(
          sql<number>`EXTRACT(EPOCH FROM (updated_at - initiated_at)) / 3600`
        ).as('avg_response_time_hours'),
      ])
      .where((eb) => eb.or([
        eb('requester_id', '=', profileId),
        eb('target_id', '=', profileId),
      ]))
      .where('status', '=', 'ACCEPTED')
      .executeTakeFirst();

    const avgHours = result?.avg_response_time_hours ?? null;

    if (!avgHours) {
      return 0.5; // Default score for new profiles
    }

    // Score inversely proportional to response time
    // < 4h = 1.0, 24h = 0.5, > 72h = 0.1
    const hours = Number(avgHours);
    if (hours <= 4) return 1.0;
    if (hours >= 72) return 0.1;
    return 1.0 - ((hours - 4) / 68) * 0.9;
  },

  /**
   * Calculate trust loops component (30% of DQS)
   * Based on repeat handshakes and long engagements
   */
  async calculateTrustLoops(profileId: string): Promise<number> {
    const result = await db
      .selectFrom('connections')
      .select((eb) => [
        eb.fn.count('id').as('total_connections'),
        eb.fn.count(
          eb.case()
            .when('status', '=', 'ACCEPTED')
            .then(1)
            .else(null)
            .end()
        ).as('accepted_connections'),
      ])
      .where((eb) => eb.or([
        eb('requester_id', '=', profileId),
        eb('target_id', '=', profileId),
      ]))
      .executeTakeFirst();

    const total = Number(result?.total_connections ?? 0);
    const accepted = Number(result?.accepted_connections ?? 0);

    if (total === 0) return 0.5;

    // Acceptance rate as trust indicator
    const acceptanceRate = accepted / total;

    // Bonus for repeat connections (simplified)
    const repeatBonus = Math.min(total / 10, 0.2);

    return Math.min(acceptanceRate + repeatBonus, 1.0);
  },

  /**
   * Calculate verification component (20% of DQS)
   * GSTIN validated + admin office visit
   */
  calculateVerification(profile: any): number {
    let score = 0;

    if (profile.gstin) {
      score += 0.15; // GSTIN verified
    }

    // Admin office visit would be tracked separately
    // For now, assume 0.05 if profile is complete
    if (profile.org_name && profile.city && profile.state) {
      score += 0.05;
    }

    return score;
  },

  /**
   * Calculate profile depth component (10% of DQS)
   * Based on portfolio/SKU metadata completeness
   */
  calculateProfileDepth(profile: any): number {
    let fieldsCompleted = 0;
    const totalFields = 8;

    if (profile.org_name) fieldsCompleted++;
    if (profile.avatar_url) fieldsCompleted++;
    if (profile.phone_primary) fieldsCompleted++;
    if (profile.address_line1) fieldsCompleted++;
    if (profile.city) fieldsCompleted++;
    if (profile.state) fieldsCompleted++;
    if (profile.pincode) fieldsCompleted++;
    if (profile.gstin) fieldsCompleted++;

    return fieldsCompleted / totalFields;
  },

  /**
   * Recalculate DQS for all profiles (scheduled job)
   * Called by QStash daily at 2 AM UTC
   * @witness [RM-001]
   */
  async recalculateAllDQS(): Promise<void> {
    const profiles = await db
      .selectFrom('profiles')
      .select('id')
      .where('deleted_at', 'is', null)
      .where('subscription_status', '!=', 'hard_locked')
      .execute();

    for (const profile of profiles) {
      try {
        await this.calculateDQS(profile.id);
      } catch (error) {
        console.error(`Failed to calculate DQS for profile ${profile.id}:`, error);
      }
    }
  },
};