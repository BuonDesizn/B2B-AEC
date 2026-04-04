import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  canTransitionModeration,
  moderationService,
} from '@/lib/services/moderation';

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
  };
  return chain;
}

vi.mock('@/lib/db', () => {
  const chain = createMockQueryBuilder({
    id: 'test-ad-id',
    moderation_status: 'PENDING',
  });
  
  return {
    db: {
      insertInto: vi.fn(() => chain),
      selectFrom: vi.fn(() => chain),
      updateTable: vi.fn(() => chain),
    },
  };
});

vi.mock('@/lib/services/moderation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/services/moderation')>();
  return {
    ...actual,
    scanWithSightengine: vi.fn().mockResolvedValue({
      status: 'success',
      flagged: false,
    }),
  };
});

describe('Moderation State Machine', () => {
  describe('canTransitionModeration', () => {
    it('allows PENDING to APPROVED', () => {
      expect(canTransitionModeration('PENDING', 'APPROVED')).toBe(true);
    });

    it('allows PENDING to FLAGGED', () => {
      expect(canTransitionModeration('PENDING', 'FLAGGED')).toBe(true);
    });

    it('allows FLAGGED to SUSPENDED', () => {
      expect(canTransitionModeration('FLAGGED', 'SUSPENDED')).toBe(true);
    });

    it('allows SUSPENDED to CLEARED', () => {
      expect(canTransitionModeration('SUSPENDED', 'CLEARED')).toBe(true);
    });

    it('allows CLEARED to APPROVED', () => {
      expect(canTransitionModeration('CLEARED', 'APPROVED')).toBe(true);
    });

    it('does not allow APPROVED to PENDING', () => {
      expect(canTransitionModeration('APPROVED', 'PENDING')).toBe(false);
    });

    it('does not allow SUSPENDED to APPROVED directly', () => {
      expect(canTransitionModeration('SUSPENDED', 'APPROVED')).toBe(false);
    });

    it('does not allow CLEARED to SUSPENDED', () => {
      expect(canTransitionModeration('CLEARED', 'SUSPENDED')).toBe(false);
    });
  });
});

describe('Moderation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('scanAd', () => {
    it('scans ad and returns APPROVED status', async () => {
      const result = await moderationService.scanAd({
        ad_id: 'test-ad-id',
        image_url: 'https://example.com/image.jpg',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('APPROVED');
    });

    it('throws error if ad not found', async () => {
      vi.mocked(await import('@/lib/db')).db.selectFrom = vi.fn().mockReturnValue(
        createMockQueryBuilder(null)
      );

      await expect(
        moderationService.scanAd({
          ad_id: 'non-existent',
          image_url: 'https://example.com/image.jpg',
        })
      ).rejects.toThrow('Ad not found');
    });
  });

  describe('clearAd', () => {
    it('clears a suspended ad', async () => {
      vi.mocked(await import('@/lib/db')).db.selectFrom = vi.fn().mockReturnValue(
        createMockQueryBuilder({
          id: 'test-ad-id',
          moderation_status: 'SUSPENDED',
        })
      );

      const result = await moderationService.clearAd('test-ad-id', 'admin-id');

      expect(result).toBeDefined();
      expect(result.status).toBe('CLEARED');
    });

    it('throws error if ad not found', async () => {
      vi.mocked(await import('@/lib/db')).db.selectFrom = vi.fn().mockReturnValue(
        createMockQueryBuilder(null)
      );

      await expect(
        moderationService.clearAd('non-existent', 'admin-id')
      ).rejects.toThrow('Ad not found');
    });
  });

  describe('rejectAd', () => {
    it('rejects a suspended ad', async () => {
      vi.mocked(await import('@/lib/db')).db.selectFrom = vi.fn().mockReturnValue(
        createMockQueryBuilder({
          id: 'test-ad-id',
          moderation_status: 'SUSPENDED',
        })
      );

      const result = await moderationService.rejectAd(
        'test-ad-id',
        'admin-id',
        'Policy violation'
      );

      expect(result).toBeDefined();
      expect(result.status).toBe('SUSPENDED');
    });

    it('throws error if ad is not suspended', async () => {
      vi.mocked(await import('@/lib/db')).db.selectFrom = vi.fn().mockReturnValue(
        createMockQueryBuilder({
          id: 'test-ad-id',
          moderation_status: 'PENDING',
        })
      );

      await expect(
        moderationService.rejectAd('test-ad-id', 'admin-id')
      ).rejects.toThrow('Can only reject suspended ads');
    });
  });

  describe('getModerationQueue', () => {
    it('returns flagged and suspended ads', async () => {
      const result = await moderationService.getModerationQueue();

      expect(Array.isArray(result)).toBe(true);
    });

    it('filters by status when provided', async () => {
      const result = await moderationService.getModerationQueue('FLAGGED');

      expect(Array.isArray(result)).toBe(true);
    });
  });
});