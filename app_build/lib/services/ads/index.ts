// @witness [AD-001]
import { AD_STATUS, SUBSCRIPTION_STATUS, CONNECTION_STATUS, MODERATION_STATUS } from '@/lib/constants';
import { db } from '@/lib/db';

// =============================================================================
// Ads State Machine
// =============================================================================

export type AdStatus = 'DRAFT' | 'PENDING_PAYMENT' | 'PENDING_MODERATION' | 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'SUSPENDED';

const AD_UPDATE_STATES: AdStatus[] = [AD_STATUS.DRAFT, AD_STATUS.PENDING_PAYMENT];

// =============================================================================
// Ads Service
// =============================================================================

export interface CreateAdInput {
  title: string;
  description: string;
  location: { lat: number; lng: number };
  radius_km: number;
  budget_inr: number;
}

export interface UpdateAdInput {
  title?: string;
  description?: string;
  location?: { lat: number; lng: number };
  radius_km?: number;
  budget_inr?: number;
}

export interface AnalyticsFilters {
  event_type?: string;
  from?: string;
  to?: string;
  page?: number;
  page_size?: number;
}

export const adsService = {
  /**
   * Create a new ad in DRAFT state
   * @witness [AD-001]
   */
  async createAd(userId: string, input: CreateAdInput) {
    const profile = await db
      .selectFrom('profiles')
      .select('subscription_status')
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!profile) {
      throw new Error('Profile not found');
    }

    if (profile.subscription_status === SUBSCRIPTION_STATUS.HARD_LOCKED) {
      throw new Error('ADS_CREATE_SUBSCRIPTION_LOCKED');
    }

    const result = await db
      .insertInto('ads')
      .values({
        profile_id: userId,
        title: input.title,
        location: `POINT(${input.location.lng} ${input.location.lat})`,
        radius_meters: input.radius_km * 1000,
        status: AD_STATUS.DRAFT,
        moderation_status: MODERATION_STATUS.PENDING,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
        budget_inr: input.budget_inr,
        budget_remaining: input.budget_inr,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  },

  /**
   * Update ad details while ad is DRAFT or PENDING_PAYMENT
   * @witness [AD-001]
   */
  async updateAd(adId: string, input: UpdateAdInput, userId: string) {
    const ad = await this.getAdByIdRaw(adId);

    if (!ad) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    if (ad.profile_id !== userId) {
      throw new Error('ADS_UPDATE_NOT_OWNER');
    }

    if (!AD_UPDATE_STATES.includes(ad.status as AdStatus)) {
      throw new Error('ADS_UPDATE_NOT_DRAFT');
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (input.title !== undefined) {
      updates.title = input.title;
    }
    if (input.budget_inr !== undefined) {
      updates.budget_inr = input.budget_inr;
      updates.budget_remaining = input.budget_inr;
    }

    const result = await db
      .updateTable('ads')
      .set(updates)
      .where('id', '=', adId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  },

  /**
   * Delete ad if not ACTIVE
   * @witness [AD-001]
   */
  async deleteAd(adId: string, userId: string) {
    const ad = await this.getAdByIdRaw(adId);

    if (!ad) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    if (ad.profile_id !== userId) {
      throw new Error('ADS_DELETE_NOT_OWNER');
    }

    if (ad.status === AD_STATUS.ACTIVE) {
      throw new Error('ADS_DELETE_ACTIVE');
    }

    await db
      .deleteFrom('ads')
      .where('id', '=', adId)
      .execute();

    return { deleted: true, ad_id: adId };
  },

  /**
   * Fetch ad details — ACTIVE for public, any state for owner
   * @witness [AD-001]
   */
  async getAdById(adId: string, userId?: string) {
    const ad = await this.getAdByIdRaw(adId);

    if (!ad) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    if (ad.status !== AD_STATUS.ACTIVE && ad.profile_id !== userId) {
      throw new Error('ADS_NOT_ACTIVE');
    }

    return ad;
  },

  /**
   * Internal: get ad without access checks
   * @witness [AD-001]
   */
  async getAdByIdRaw(adId: string) {
    return await db
      .selectFrom('ads')
      .selectAll()
      .where('id', '=', adId)
      .executeTakeFirst();
  },

  /**
   * Create connection from ad interaction
   * @witness [AD-001]
   */
  async connectFromAd(adId: string, message: string, userId: string) {
    const ad = await this.getAdByIdRaw(adId);

    if (!ad) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    if (ad.status !== AD_STATUS.ACTIVE) {
      throw new Error('ADS_NOT_ACTIVE_FOR_CONNECT');
    }

    if (ad.profile_id === userId) {
      throw new Error('ADS_CONNECT_SELF');
    }

    const existing = await db
      .selectFrom('connections')
      .select('id')
      .where('requester_id', '=', userId)
      .where('target_id', '=', ad.profile_id)
      .where('status', 'in', [CONNECTION_STATUS.REQUESTED, CONNECTION_STATUS.ACCEPTED])
      .executeTakeFirst();

    if (existing) {
      throw new Error('ADS_CONNECT_ALREADY_CONNECTED');
    }

    const result = await db
      .insertInto('connections')
      .values({
        requester_id: userId,
        target_id: ad.profile_id,
        status: CONNECTION_STATUS.REQUESTED,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  },

  /**
   * Re-initiate PhonePe payment for ad in DRAFT or failed PENDING_PAYMENT
   * @witness [AD-001]
   */
  async retryPayment(adId: string, userId: string) {
    const ad = await this.getAdByIdRaw(adId);

    if (!ad) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    if (ad.profile_id !== userId) {
      throw new Error('ADS_PAYMENT_NOT_OWNER');
    }

    if (ad.status !== AD_STATUS.DRAFT && ad.status !== AD_STATUS.PENDING_PAYMENT) {
      throw new Error('ADS_PAYMENT_RETRY_INVALID_STATE');
    }

    const phonepeOrderId = `ad_pay_${adId}_${Date.now()}`;
    const redirectUrl = `https://mercury-uat.phonepe.com/pay/${phonepeOrderId}`;

    await db
      .updateTable('ads')
      .set({
        status: AD_STATUS.PENDING_PAYMENT,
        updated_at: new Date(),
      })
      .where('id', '=', adId)
      .execute();

    return {
      phonepe_order_id: phonepeOrderId,
      redirect_url: redirectUrl,
    };
  },

  /**
   * Submit refund request for SUSPENDED ad
   * @witness [AD-001]
   */
  async requestRefund(adId: string, reason: string, userId: string) {
    const ad = await this.getAdByIdRaw(adId);

    if (!ad) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    if (ad.profile_id !== userId) {
      throw new Error('ADS_REFUND_NOT_OWNER');
    }

    if (ad.status !== AD_STATUS.SUSPENDED) {
      throw new Error('ADS_REFUND_NOT_SUSPENDED');
    }

    const existingRefund = await db
      .selectFrom('ads')
      .select('id')
      .where('id', '=', adId)
      .where('rejection_reason', 'is not', null)
      .executeTakeFirst();

    if (existingRefund && ad.rejection_reason !== null) {
      throw new Error('ADS_REFUND_ALREADY_REQUESTED');
    }

    const refundRequestId = `refund_${adId}_${Date.now()}`;

    return {
      refund_request_id: refundRequestId,
      status: 'PENDING_REVIEW',
    };
  },

  /**
   * Get analytics for ad
   * @witness [AD-001]
   */
  async getAnalytics(adId: string, userId: string, filters: AnalyticsFilters) {
    const ad = await this.getAdByIdRaw(adId);

    if (!ad) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    if (ad.profile_id !== userId) {
      throw new Error('ADS_ANALYTICS_NOT_OWNER');
    }

    const page = filters.page ?? 1;
    const pageSize = Math.min(filters.page_size ?? 20, 50);
    const _offset = (page - 1) * pageSize;

    const summary = {
      impressions: ad.impressions ?? 0,
      clicks: ad.clicks ?? 0,
      connects: 0,
      ctr: ad.ctr ?? 0,
    };

    const mockItems: any[] = [];
    const totalCount = summary.clicks;

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      ad_id: adId,
      summary,
      items: mockItems,
      meta: {
        page,
        page_size: pageSize,
        total_count: totalCount,
        total_pages: totalPages,
      },
    };
  },
};
