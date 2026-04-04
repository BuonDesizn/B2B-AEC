import { describe, it, expect, vi, beforeEach } from 'vitest';

import { adsService } from '@/lib/services/ads';

function createMockQueryBuilder(returnValue: any) {
  const chain: any = {
    selectAll: vi.fn(() => chain),
    select: vi.fn(() => chain),
    where: vi.fn(() => chain),
    or: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    offset: vi.fn(() => chain),
    values: vi.fn(() => chain),
    set: vi.fn(() => chain),
    returningAll: vi.fn(() => chain),
    executeTakeFirst: vi.fn().mockResolvedValue(returnValue),
    executeTakeFirstOrThrow: vi.fn().mockResolvedValue(returnValue),
    execute: vi.fn().mockResolvedValue(Array.isArray(returnValue) ? returnValue : [returnValue]),
    deleteFrom: vi.fn(() => chain),
    insertInto: vi.fn(() => chain),
    updateTable: vi.fn(() => chain),
  };
  return chain;
}

vi.mock('@/lib/db', () => {
  const mockAd = {
    id: 'test-ad-id',
    profile_id: 'test-user',
    title: 'Test Ad',
    status: 'DRAFT',
    moderation_status: 'PENDING',
    impressions: 0,
    clicks: 0,
    ctr: 0,
    cpc: 0,
    budget_inr: 2500,
    budget_remaining: 2500,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockProfile = {
    id: 'test-user',
    subscription_status: 'active',
  };

  const mockHardLockedProfile = {
    id: 'test-user',
    subscription_status: 'hard_locked',
  };

  const mockConnection = {
    id: 'test-connection-id',
    requester_id: 'test-viewer',
    target_id: 'test-user',
    status: 'REQUESTED',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockActiveAd = {
    ...mockAd,
    status: 'ACTIVE',
  };

  const mockSuspendedAd = {
    ...mockAd,
    status: 'SUSPENDED',
    rejection_reason: 'Content violation',
  };

  const mockPendingPaymentAd = {
    ...mockAd,
    status: 'PENDING_PAYMENT',
  };

  const chain = createMockQueryBuilder(mockAd);
  const profileChain = createMockQueryBuilder(mockProfile);
  const _hardLockedChain = createMockQueryBuilder(mockHardLockedProfile);
  const connectionChain = createMockQueryBuilder(mockConnection);
  const _activeAdChain = createMockQueryBuilder(mockActiveAd);
  const _suspendedAdChain = createMockQueryBuilder(mockSuspendedAd);
  const _pendingPaymentChain = createMockQueryBuilder(mockPendingPaymentAd);
  const _emptyChain = createMockQueryBuilder(undefined);

  return {
    db: {
      insertInto: vi.fn(() => chain),
      selectFrom: vi.fn((table: string) => {
        if (table === 'profiles') return profileChain;
        if (table === 'connections') return connectionChain;
        return chain;
      }),
      updateTable: vi.fn(() => chain),
      deleteFrom: vi.fn(() => chain),
      transaction: vi.fn(() => ({
        execute: vi.fn(async (cb: any) => {
          const trx = {
            insertInto: vi.fn(() => connectionChain),
            updateTable: vi.fn(() => chain),
          };
          return cb(trx);
        }),
      })),
    },
  };
});

describe('Ads Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAd', () => {
    it('creates ad in DRAFT state for active user', async () => {
      const input = {
        title: 'Test Ad',
        description: 'Test description',
        location: { lat: 18.5204, lng: 73.8567 },
        radius_km: 25,
        budget_inr: 2500,
      };

      const result = await adsService.createAd('test-user', input);

      expect(result).toBeDefined();
      expect(result.status).toBe('DRAFT');
    });

    it('throws ADS_CREATE_SUBSCRIPTION_LOCKED for hard_locked user', async () => {
      const { db } = await import('@/lib/db');
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder({ subscription_status: 'hard_locked' }));

      const input = {
        title: 'Test Ad',
        description: 'Test description',
        location: { lat: 18.5204, lng: 73.8567 },
        radius_km: 25,
        budget_inr: 2500,
      };

      await expect(adsService.createAd('test-user', input)).rejects.toThrow('ADS_CREATE_SUBSCRIPTION_LOCKED');
    });

    it('throws error if profile not found', async () => {
      const { db } = await import('@/lib/db');
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(undefined));

      const input = {
        title: 'Test Ad',
        description: 'Test description',
        location: { lat: 18.5204, lng: 73.8567 },
        radius_km: 25,
        budget_inr: 2500,
      };

      await expect(adsService.createAd('test-user', input)).rejects.toThrow('Profile not found');
    });
  });

  describe('updateAd', () => {
    it('updates ad in DRAFT state', async () => {
      const { db } = await import('@/lib/db');
      const draftAd = {
        id: 'test-ad-id',
        profile_id: 'test-user',
        status: 'DRAFT',
        title: 'Test Ad',
        budget_inr: 2500,
        budget_remaining: 2500,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(draftAd));

      const result = await adsService.updateAd('test-ad-id', { title: 'Updated Ad' }, 'test-user');

      expect(result).toBeDefined();
    });

    it('updates ad in PENDING_PAYMENT state', async () => {
      const { db } = await import('@/lib/db');
      const pendingAd = {
        id: 'test-ad-id',
        profile_id: 'test-user',
        status: 'PENDING_PAYMENT',
        title: 'Test Ad',
        budget_inr: 2500,
        budget_remaining: 2500,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(pendingAd));

      const result = await adsService.updateAd('test-ad-id', { title: 'Updated Ad' }, 'test-user');

      expect(result).toBeDefined();
    });

    it('throws ADS_UPDATE_NOT_DRAFT for ACTIVE ad', async () => {
      const { db } = await import('@/lib/db');
      const activeAd = {
        id: 'test-ad-id',
        profile_id: 'test-user',
        status: 'ACTIVE',
        title: 'Test Ad',
        budget_inr: 2500,
        budget_remaining: 2500,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(activeAd));

      await expect(
        adsService.updateAd('test-ad-id', { title: 'Updated Ad' }, 'test-user')
      ).rejects.toThrow('ADS_UPDATE_NOT_DRAFT');
    });

    it('throws error if user is not owner', async () => {
      const { db } = await import('@/lib/db');
      const draftAd = {
        id: 'test-ad-id',
        profile_id: 'test-user',
        status: 'DRAFT',
        title: 'Test Ad',
        budget_inr: 2500,
        budget_remaining: 2500,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(draftAd));

      await expect(
        adsService.updateAd('test-ad-id', { title: 'Updated Ad' }, 'other-user')
      ).rejects.toThrow('ADS_UPDATE_NOT_OWNER');
    });

    it('throws RESOURCE_NOT_FOUND if ad does not exist', async () => {
      const { db } = await import('@/lib/db');
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(undefined));

      await expect(
        adsService.updateAd('nonexistent-id', { title: 'Updated Ad' }, 'test-user')
      ).rejects.toThrow('RESOURCE_NOT_FOUND');
    });
  });

  describe('deleteAd', () => {
    it('deletes ad in DRAFT state', async () => {
      const { db } = await import('@/lib/db');
      const draftAd = {
        id: 'test-ad-id',
        profile_id: 'test-user',
        status: 'DRAFT',
        title: 'Test Ad',
        budget_inr: 2500,
        budget_remaining: 2500,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(draftAd));

      const result = await adsService.deleteAd('test-ad-id', 'test-user');

      expect(result).toEqual({ deleted: true, ad_id: 'test-ad-id' });
    });

    it('throws ADS_DELETE_ACTIVE for ACTIVE ad', async () => {
      const { db } = await import('@/lib/db');
      const activeAd = {
        id: 'test-ad-id',
        profile_id: 'test-user',
        status: 'ACTIVE',
        title: 'Test Ad',
        budget_inr: 2500,
        budget_remaining: 2500,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(activeAd));

      await expect(
        adsService.deleteAd('test-ad-id', 'test-user')
      ).rejects.toThrow('ADS_DELETE_ACTIVE');
    });

    it('throws error if user is not owner', async () => {
      const { db } = await import('@/lib/db');
      const draftAd = {
        id: 'test-ad-id',
        profile_id: 'test-user',
        status: 'DRAFT',
        title: 'Test Ad',
        budget_inr: 2500,
        budget_remaining: 2500,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(draftAd));

      await expect(
        adsService.deleteAd('test-ad-id', 'other-user')
      ).rejects.toThrow('ADS_DELETE_NOT_OWNER');
    });

    it('throws RESOURCE_NOT_FOUND if ad does not exist', async () => {
      const { db } = await import('@/lib/db');
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(undefined));

      await expect(
        adsService.deleteAd('nonexistent-id', 'test-user')
      ).rejects.toThrow('RESOURCE_NOT_FOUND');
    });
  });

  describe('getAdById', () => {
    it('returns ad if ACTIVE', async () => {
      const { db } = await import('@/lib/db');
      const activeAd = {
        id: 'test-ad-id',
        profile_id: 'test-user',
        status: 'ACTIVE',
        title: 'Test Ad',
        budget_inr: 2500,
        budget_remaining: 2500,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(activeAd));

      const result = await adsService.getAdById('test-ad-id', 'viewer-user');

      expect(result).toBeDefined();
      expect(result.status).toBe('ACTIVE');
    });

    it('returns ad to owner even if not ACTIVE', async () => {
      const { db } = await import('@/lib/db');
      const draftAd = {
        id: 'test-ad-id',
        profile_id: 'test-user',
        status: 'DRAFT',
        title: 'Test Ad',
        budget_inr: 2500,
        budget_remaining: 2500,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(draftAd));

      const result = await adsService.getAdById('test-ad-id', 'test-user');

      expect(result).toBeDefined();
      expect(result.status).toBe('DRAFT');
    });

    it('throws ADS_NOT_ACTIVE for non-owner viewing non-ACTIVE ad', async () => {
      const { db } = await import('@/lib/db');
      const draftAd = {
        id: 'test-ad-id',
        profile_id: 'test-user',
        status: 'DRAFT',
        title: 'Test Ad',
        budget_inr: 2500,
        budget_remaining: 2500,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(draftAd));

      await expect(
        adsService.getAdById('test-ad-id', 'other-user')
      ).rejects.toThrow('ADS_NOT_ACTIVE');
    });

    it('throws RESOURCE_NOT_FOUND if ad does not exist', async () => {
      const { db } = await import('@/lib/db');
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(undefined));

      await expect(
        adsService.getAdById('nonexistent-id', 'test-user')
      ).rejects.toThrow('RESOURCE_NOT_FOUND');
    });
  });

  describe('connectFromAd', () => {
    it('creates connection with REQUESTED status', async () => {
      const { db } = await import('@/lib/db');
      const activeAd = {
        id: 'test-ad-id',
        profile_id: 'test-user',
        status: 'ACTIVE',
        title: 'Test Ad',
        budget_inr: 2500,
        budget_remaining: 2500,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
      };
      const mockConnection = {
        id: 'test-connection-id',
        requester_id: 'viewer-user',
        target_id: 'test-user',
        status: 'REQUESTED',
        created_at: new Date(),
        updated_at: new Date(),
      };
      const adChain = createMockQueryBuilder(activeAd);
      const connSelectChain = createMockQueryBuilder(undefined);
      const connInsertChain = createMockQueryBuilder(mockConnection);
      (db.selectFrom as any).mockImplementation((table: string) => {
        if (table === 'ads') return adChain;
        if (table === 'connections') return connSelectChain;
        return createMockQueryBuilder(undefined);
      });
      (db.insertInto as any).mockReturnValue(connInsertChain);

      const result = await adsService.connectFromAd('test-ad-id', 'Interested in product', 'viewer-user');

      expect(result).toBeDefined();
      expect(result.status).toBe('REQUESTED');
    });

    it('throws ADS_NOT_ACTIVE_FOR_CONNECT for non-ACTIVE ad', async () => {
      const { db } = await import('@/lib/db');
      const draftAd = {
        id: 'test-ad-id',
        profile_id: 'test-user',
        status: 'DRAFT',
        title: 'Test Ad',
        budget_inr: 2500,
        budget_remaining: 2500,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(draftAd));

      await expect(
        adsService.connectFromAd('test-ad-id', 'Interested', 'viewer-user')
      ).rejects.toThrow('ADS_NOT_ACTIVE_FOR_CONNECT');
    });

    it('throws ADS_CONNECT_SELF if viewer is ad owner', async () => {
      const { db } = await import('@/lib/db');
      const activeAd = {
        id: 'test-ad-id',
        profile_id: 'test-user',
        status: 'ACTIVE',
        title: 'Test Ad',
        budget_inr: 2500,
        budget_remaining: 2500,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(activeAd));

      await expect(
        adsService.connectFromAd('test-ad-id', 'Interested', 'test-user')
      ).rejects.toThrow('ADS_CONNECT_SELF');
    });

    it('throws ADS_CONNECT_ALREADY_CONNECTED if connection exists', async () => {
      const { db } = await import('@/lib/db');
      const activeAd = {
        id: 'test-ad-id',
        profile_id: 'test-user',
        status: 'ACTIVE',
        title: 'Test Ad',
        budget_inr: 2500,
        budget_remaining: 2500,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
      };
      const existingConnection = { id: 'existing-connection-id' };
      (db.selectFrom as any).mockImplementation((table: string) => {
        if (table === 'ads') return createMockQueryBuilder(activeAd);
        if (table === 'connections') return createMockQueryBuilder(existingConnection);
        return createMockQueryBuilder(undefined);
      });

      await expect(
        adsService.connectFromAd('test-ad-id', 'Interested', 'viewer-user')
      ).rejects.toThrow('ADS_CONNECT_ALREADY_CONNECTED');
    });
  });

  describe('retryPayment', () => {
    it('initiates payment for DRAFT ad', async () => {
      const { db } = await import('@/lib/db');
      const draftAd = {
        id: 'test-ad-id',
        profile_id: 'test-user',
        status: 'DRAFT',
        title: 'Test Ad',
        budget_inr: 2500,
        budget_remaining: 2500,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(draftAd));

      const result = await adsService.retryPayment('test-ad-id', 'test-user');

      expect(result).toHaveProperty('phonepe_order_id');
      expect(result).toHaveProperty('redirect_url');
    });

    it('initiates payment for PENDING_PAYMENT ad', async () => {
      const { db } = await import('@/lib/db');
      const pendingAd = {
        id: 'test-ad-id',
        profile_id: 'test-user',
        status: 'PENDING_PAYMENT',
        title: 'Test Ad',
        budget_inr: 2500,
        budget_remaining: 2500,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(pendingAd));

      const result = await adsService.retryPayment('test-ad-id', 'test-user');

      expect(result).toHaveProperty('phonepe_order_id');
      expect(result).toHaveProperty('redirect_url');
    });

    it('throws ADS_PAYMENT_RETRY_INVALID_STATE for ACTIVE ad', async () => {
      const { db } = await import('@/lib/db');
      const activeAd = {
        id: 'test-ad-id',
        profile_id: 'test-user',
        status: 'ACTIVE',
        title: 'Test Ad',
        budget_inr: 2500,
        budget_remaining: 2500,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(activeAd));

      await expect(
        adsService.retryPayment('test-ad-id', 'test-user')
      ).rejects.toThrow('ADS_PAYMENT_RETRY_INVALID_STATE');
    });

    it('throws error if user is not owner', async () => {
      const { db } = await import('@/lib/db');
      const draftAd = {
        id: 'test-ad-id',
        profile_id: 'test-user',
        status: 'DRAFT',
        title: 'Test Ad',
        budget_inr: 2500,
        budget_remaining: 2500,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(draftAd));

      await expect(
        adsService.retryPayment('test-ad-id', 'other-user')
      ).rejects.toThrow('ADS_PAYMENT_NOT_OWNER');
    });

    it('throws RESOURCE_NOT_FOUND if ad does not exist', async () => {
      const { db } = await import('@/lib/db');
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(undefined));

      await expect(
        adsService.retryPayment('nonexistent-id', 'test-user')
      ).rejects.toThrow('RESOURCE_NOT_FOUND');
    });
  });

  describe('requestRefund', () => {
    it('creates refund request for SUSPENDED ad', async () => {
      const { db } = await import('@/lib/db');
      const suspendedAd = {
        id: 'test-ad-id',
        profile_id: 'test-user',
        status: 'SUSPENDED',
        title: 'Test Ad',
        budget_inr: 2500,
        budget_remaining: 2500,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
        rejection_reason: null,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(suspendedAd));

      const result = await adsService.requestRefund('test-ad-id', 'Content was valid', 'test-user');

      expect(result).toHaveProperty('refund_request_id');
      expect(result.status).toBe('PENDING_REVIEW');
    });

    it('throws ADS_REFUND_NOT_SUSPENDED for non-SUSPENDED ad', async () => {
      const { db } = await import('@/lib/db');
      const activeAd = {
        id: 'test-ad-id',
        profile_id: 'test-user',
        status: 'ACTIVE',
        title: 'Test Ad',
        budget_inr: 2500,
        budget_remaining: 2500,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
        rejection_reason: null,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(activeAd));

      await expect(
        adsService.requestRefund('test-ad-id', 'Content was valid', 'test-user')
      ).rejects.toThrow('ADS_REFUND_NOT_SUSPENDED');
    });

    it('throws error if user is not owner', async () => {
      const { db } = await import('@/lib/db');
      const suspendedAd = {
        id: 'test-ad-id',
        profile_id: 'test-user',
        status: 'SUSPENDED',
        title: 'Test Ad',
        budget_inr: 2500,
        budget_remaining: 2500,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
        rejection_reason: null,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(suspendedAd));

      await expect(
        adsService.requestRefund('test-ad-id', 'Content was valid', 'other-user')
      ).rejects.toThrow('ADS_REFUND_NOT_OWNER');
    });

    it('throws RESOURCE_NOT_FOUND if ad does not exist', async () => {
      const { db } = await import('@/lib/db');
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(undefined));

      await expect(
        adsService.requestRefund('nonexistent-id', 'Reason', 'test-user')
      ).rejects.toThrow('RESOURCE_NOT_FOUND');
    });
  });

  describe('getAnalytics', () => {
    it('returns analytics for ad owner', async () => {
      const { db } = await import('@/lib/db');
      const activeAd = {
        id: 'test-ad-id',
        profile_id: 'test-user',
        status: 'ACTIVE',
        title: 'Test Ad',
        budget_inr: 2500,
        budget_remaining: 2500,
        impressions: 1250,
        clicks: 87,
        ctr: 0.0696,
        cpc: 0,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(activeAd));

      const result = await adsService.getAnalytics('test-ad-id', 'test-user', {});

      expect(result.ad_id).toBe('test-ad-id');
      expect(result.summary.impressions).toBe(1250);
      expect(result.summary.clicks).toBe(87);
      expect(result.summary.ctr).toBe(0.0696);
      expect(result.meta.page).toBe(1);
      expect(result.meta.page_size).toBe(20);
    });

    it('returns filtered analytics with date range', async () => {
      const { db } = await import('@/lib/db');
      const activeAd = {
        id: 'test-ad-id',
        profile_id: 'test-user',
        status: 'ACTIVE',
        title: 'Test Ad',
        budget_inr: 2500,
        budget_remaining: 2500,
        impressions: 500,
        clicks: 30,
        ctr: 0.06,
        cpc: 0,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(activeAd));

      const result = await adsService.getAnalytics('test-ad-id', 'test-user', {
        event_type: 'CLICK',
        from: '2026-04-01',
        to: '2026-04-02',
        page: 2,
        page_size: 10,
      });

      expect(result.meta.page).toBe(2);
      expect(result.meta.page_size).toBe(10);
    });

    it('throws error if user is not owner', async () => {
      const { db } = await import('@/lib/db');
      const activeAd = {
        id: 'test-ad-id',
        profile_id: 'test-user',
        status: 'ACTIVE',
        title: 'Test Ad',
        budget_inr: 2500,
        budget_remaining: 2500,
        impressions: 1250,
        clicks: 87,
        ctr: 0.0696,
        cpc: 0,
      };
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(activeAd));

      await expect(
        adsService.getAnalytics('test-ad-id', 'other-user', {})
      ).rejects.toThrow('ADS_ANALYTICS_NOT_OWNER');
    });

    it('throws RESOURCE_NOT_FOUND if ad does not exist', async () => {
      const { db } = await import('@/lib/db');
      (db.selectFrom as any).mockReturnValue(createMockQueryBuilder(undefined));

      await expect(
        adsService.getAnalytics('nonexistent-id', 'test-user', {})
      ).rejects.toThrow('RESOURCE_NOT_FOUND');
    });
  });
});
