import { describe, it, expect, vi, beforeEach } from 'vitest';
import { discoveryService } from '@/lib/services/discovery';

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
    id: 'test-profile',
    full_name: 'Test User',
    gstin: '22AAAAA0000A1Z5',
    city: 'Mumbai',
    state: 'Maharashtra',
    dqs_score: 0.75,
  });
  
  return {
    db: {
      insertInto: vi.fn(() => chain),
      selectFrom: vi.fn(() => chain),
      updateTable: vi.fn(() => chain),
    },
  };
});

describe('Discovery Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchNearby', () => {
    it('throws error for invalid radius', async () => {
      await expect(
        discoveryService.searchNearby({
          searcher_lat: 19.076,
          searcher_lng: 72.8777,
          radius_km: 0,
        })
      ).rejects.toThrow('radius_km must be greater than 0');
    });
  });

  describe('calculateDQS', () => {
    it('calculates DQS score for a profile', async () => {
      const score = await discoveryService.calculateDQS('test-profile');

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('throws error if profile not found', async () => {
      vi.mocked(await import('@/lib/db')).db.selectFrom = vi.fn().mockReturnValue(
        createMockQueryBuilder(null)
      );

      await expect(
        discoveryService.calculateDQS('non-existent')
      ).rejects.toThrow('Profile not found');
    });
  });

  describe('DQS component calculations', () => {
    it('calculates verification score correctly', () => {
      const score = discoveryService.calculateVerification({
        gstin: '22AAAAA0000A1Z5',
        org_name: 'Test',
        city: 'Mumbai',
        state: 'MH',
      });

      expect(score).toBe(0.2);
    });

    it('calculates profile depth correctly', () => {
      const score = discoveryService.calculateProfileDepth({
        org_name: 'Test',
        avatar_url: 'http://example.com',
        phone_primary: '123',
        address_line1: '123 St',
        city: 'Mumbai',
        state: 'MH',
        pincode: '400001',
        gstin: '22AAAAA0000A1Z5',
      });

      expect(score).toBe(1.0);
    });

    it('calculates partial profile depth correctly', () => {
      const score = discoveryService.calculateProfileDepth({
        org_name: 'Test',
        city: 'Mumbai',
      });

      expect(score).toBe(0.25);
    });
  });
});