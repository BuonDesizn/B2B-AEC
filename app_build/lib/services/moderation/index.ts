// @witness [MOD-001]
import { db } from '@/lib/db';

// =============================================================================
// Moderation State Machine
// =============================================================================

export type ModerationState = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED' | 'SUSPENDED' | 'CLEARED';

const MODERATION_TRANSITIONS: Record<ModerationState, ModerationState[]> = {
  PENDING: ['APPROVED', 'FLAGGED'],
  APPROVED: ['FLAGGED'],
  FLAGGED: ['SUSPENDED', 'CLEARED'],
  SUSPENDED: ['CLEARED'],
  CLEARED: ['APPROVED'],
  REJECTED: [],
};

export function canTransitionModeration(current: ModerationState, next: ModerationState): boolean {
  return MODERATION_TRANSITIONS[current]?.includes(next) ?? false;
}

// =============================================================================
// Sightengine Integration
// =============================================================================

interface SightengineResult {
  status: 'success' | 'error';
  flagged: boolean;
  categories?: Record<string, number>;
}

async function scanWithSightengine(imageUrl: string, targetUrl?: string): Promise<SightengineResult> {
  const API_USER = process.env.SIGHTENGINE_API_USER;
  const API_SECRET = process.env.SIGHTENGINE_API_SECRET;

  if (!API_USER || !API_SECRET) {
    console.warn('Sightengine credentials not configured, skipping moderation');
    return { status: 'success', flagged: false };
  }

  const params = new URLSearchParams({
    user: API_USER,
    secret: API_SECRET,
    url: imageUrl,
    models: 'nudity,wad,offensive,face',
  });

  if (targetUrl) {
    params.append('url', targetUrl);
  }

  try {
    const response = await fetch(`https://api.sightengine.com/1.0/check.json?${params}`);
    const data = await response.json();

    if (data.status !== 'success') {
      return { status: 'error', flagged: false };
    }

    // Check if any category exceeds threshold
    const flagged = (data.nudity?.safe ?? 1) < 0.5 ||
                   (data.offensive?.safe ?? 1) < 0.5 ||
                   (data.wad?.safe ?? 1) < 0.5;

    return {
      status: 'success',
      flagged,
      categories: {
        nudity: data.nudity?.safe ?? 1,
        offensive: data.offensive?.safe ?? 1,
        wad: data.wad?.safe ?? 1,
      },
    };
  } catch (error) {
    console.error('Sightengine scan failed:', error);
    return { status: 'error', flagged: false };
  }
}

// =============================================================================
// Moderation Service
// =============================================================================

export interface ScanAdInput {
  ad_id: string;
  image_url: string;
  target_url?: string;
}

export const moderationService = {
  /**
   * Scan ad content with Sightengine
   * @witness [MOD-001]
   */
  async scanAd(input: ScanAdInput) {
    const ad = await db
      .selectFrom('ads')
      .select(['id', 'moderation_status'])
      .where('id', '=', input.ad_id)
      .executeTakeFirst();

    if (!ad) {
      throw new Error('Ad not found');
    }

    // Update to PENDING
    await db
      .updateTable('ads')
      .set({
        moderation_status: 'PENDING',
        updated_at: new Date(),
      })
      .where('id', '=', input.ad_id)
      .execute();

    // Scan with Sightengine
    const result = await scanWithSightengine(input.image_url, input.target_url);

    if (result.status === 'error') {
      // On scan error, keep as PENDING for retry
      return { ad_id: input.ad_id, status: 'PENDING', error: 'Scan failed, will retry' };
    }

    if (result.flagged) {
      // Flagged → SUSPENDED
      await db
        .updateTable('ads')
        .set({
          moderation_status: 'FLAGGED',
          updated_at: new Date(),
        })
        .where('id', '=', input.ad_id)
        .execute();

      // Auto-suspend
      await db
        .updateTable('ads')
        .set({
          moderation_status: 'SUSPENDED',
          rejection_reason: 'Content flagged by automated moderation',
          updated_at: new Date(),
        })
        .where('id', '=', input.ad_id)
        .execute();

      // Log to audit
      await db
        .insertInto('system_audit_log')
        .values({
          action: 'AD_MODERATION_FLAGGED',
          target_type: 'ad',
          target_id: input.ad_id,
          new_value: { moderation_status: 'SUSPENDED', categories: result.categories },
        })
        .execute();

      return { ad_id: input.ad_id, status: 'SUSPENDED' };
    }

    // Clean → APPROVED
    await db
      .updateTable('ads')
      .set({
        moderation_status: 'APPROVED',
        updated_at: new Date(),
      })
      .where('id', '=', input.ad_id)
      .execute();

    // Log to audit
    await db
      .insertInto('system_audit_log')
      .values({
        action: 'AD_MODERATION_APPROVED',
        target_type: 'ad',
        target_id: input.ad_id,
        new_value: { moderation_status: 'APPROVED' },
      })
      .execute();

    return { ad_id: input.ad_id, status: 'APPROVED' };
  },

  /**
   * Admin clears a suspended ad
   * @witness [MOD-001]
   */
  async clearAd(adId: string, adminId: string) {
    const ad = await db
      .selectFrom('ads')
      .select(['id', 'moderation_status'])
      .where('id', '=', adId)
      .executeTakeFirst();

    if (!ad) {
      throw new Error('Ad not found');
    }

    if (!canTransitionModeration(ad.moderation_status as ModerationState, 'CLEARED')) {
      throw new Error(`Cannot transition from ${ad.moderation_status} to CLEARED`);
    }

    const now = new Date();

    await db
      .updateTable('ads')
      .set({
        moderation_status: 'CLEARED',
        rejection_reason: null,
        updated_at: now,
      })
      .where('id', '=', adId)
      .execute();

    // If ad was paid, restore to ACTIVE
    await db
      .updateTable('ads')
      .set({
        status: 'ACTIVE',
        updated_at: now,
      })
      .where('id', '=', adId)
      .where('payment_status', '=', 'PAID')
      .execute();

    // Log to audit
    await db
      .insertInto('system_audit_log')
      .values({
        actor_id: adminId,
        action: 'AD_MODERATION_CLEARED',
        target_type: 'ad',
        target_id: adId,
        new_value: { moderation_status: 'CLEARED' },
      })
      .execute();

    return { ad_id: adId, status: 'CLEARED' };
  },

  /**
   * Admin rejects a suspended ad
   * @witness [MOD-001]
   */
  async rejectAd(adId: string, adminId: string, reason?: string) {
    const ad = await db
      .selectFrom('ads')
      .select(['id', 'moderation_status'])
      .where('id', '=', adId)
      .executeTakeFirst();

    if (!ad) {
      throw new Error('Ad not found');
    }

    if (ad.moderation_status !== 'SUSPENDED') {
      throw new Error('Can only reject suspended ads');
    }

    const now = new Date();

    await db
      .updateTable('ads')
      .set({
        moderation_status: 'SUSPENDED',
        rejection_reason: reason ?? 'Admin rejected after review',
        updated_at: now,
      })
      .where('id', '=', adId)
      .execute();

    // Log to audit
    await db
      .insertInto('system_audit_log')
      .values({
        actor_id: adminId,
        action: 'AD_MODERATION_REJECTED',
        target_type: 'ad',
        target_id: adId,
        new_value: { moderation_status: 'SUSPENDED', reason },
      })
      .execute();

    return { ad_id: adId, status: 'SUSPENDED' };
  },

  /**
   * Get moderation queue for admin review
   * @witness [MOD-001]
   */
  async getModerationQueue(status?: 'FLAGGED' | 'SUSPENDED') {
    let query = db
      .selectFrom('ads')
      .selectAll()
      .where((eb) => eb.or([
        eb('moderation_status', '=', 'FLAGGED'),
        eb('moderation_status', '=', 'SUSPENDED'),
      ]))
      .orderBy('updated_at', 'desc');

    if (status) {
      query = query.where('moderation_status', '=', status);
    }

    return await query.execute();
  },
};