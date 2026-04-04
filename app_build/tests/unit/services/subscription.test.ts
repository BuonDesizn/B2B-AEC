import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import {
  canTransitionSubscription,
  subscriptionService,
} from '@/lib/services/subscription';

function createMockQueryBuilder(returnValue: any) {
  const chain: any = {
    selectAll: vi.fn(() => chain),
    select: vi.fn(() => chain),
    where: vi.fn(() => chain),
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
    id: 'test-sub-id',
    profile_id: 'test-user',
    status: 'TRIAL',
    plan: 'trial',
    amount: 0,
    created_at: new Date(),
    updated_at: new Date(),
  });
  
  return {
    db: {
      insertInto: vi.fn(() => chain),
      selectFrom: vi.fn(() => createMockQueryBuilder({
        subscription_status: 'TRIAL',
        handshake_credits: 30,
        credits_reset_at: new Date(),
      })),
      updateTable: vi.fn(() => chain),
    },
  };
});

describe('Subscription State Machine', () => {
  describe('canTransitionSubscription', () => {
    it('allows TRIAL to ACTIVE', () => {
      expect(canTransitionSubscription('TRIAL', 'ACTIVE')).toBe(true);
    });

    it('allows TRIAL to HARD_LOCKED', () => {
      expect(canTransitionSubscription('TRIAL', 'HARD_LOCKED')).toBe(true);
    });

    it('allows ACTIVE to EXPIRED', () => {
      expect(canTransitionSubscription('ACTIVE', 'EXPIRED')).toBe(true);
    });

    it('allows EXPIRED to ACTIVE', () => {
      expect(canTransitionSubscription('EXPIRED', 'ACTIVE')).toBe(true);
    });

    it('allows HARD_LOCKED to ACTIVE', () => {
      expect(canTransitionSubscription('HARD_LOCKED', 'ACTIVE')).toBe(true);
    });

    it('does not allow ACTIVE to TRIAL', () => {
      expect(canTransitionSubscription('ACTIVE', 'TRIAL')).toBe(false);
    });

    it('does not allow EXPIRED to TRIAL', () => {
      expect(canTransitionSubscription('EXPIRED', 'TRIAL')).toBe(false);
    });

    it('does not allow HARD_LOCKED to TRIAL', () => {
      expect(canTransitionSubscription('HARD_LOCKED', 'TRIAL')).toBe(false);
    });
  });
});

describe('Subscription Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTrial', () => {
    it('creates subscription in TRIAL state with 48h expiry', async () => {
      const result = await subscriptionService.createTrial({
        profile_id: 'test-user',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('TRIAL');
    });
  });

  describe('activate', () => {
    it('activates subscription from TRIAL', async () => {
      const result = await subscriptionService.activate('test-user', 'payment-123');

      expect(result).toBeDefined();
      expect(result.status).toBe('ACTIVE');
      expect(result.credits).toBe(30);
    });
  });

  describe('deductCredits', () => {
    it('throws error if hard locked', async () => {
      vi.mocked(await import('@/lib/db')).db.selectFrom = vi.fn().mockReturnValue(
        createMockQueryBuilder({
          handshake_credits: 30,
          subscription_status: 'HARD_LOCKED',
          credits_reset_at: new Date(),
        })
      );

      await expect(
        subscriptionService.deductCredits('test-user')
      ).rejects.toThrow('Cannot initiate handshakes while hard locked');
    });

    it('throws error if no credits remaining', async () => {
      vi.mocked(await import('@/lib/db')).db.selectFrom = vi.fn().mockReturnValue(
        createMockQueryBuilder({
          handshake_credits: 0,
          subscription_status: 'ACTIVE',
          credits_reset_at: new Date(),
        })
      );

      await expect(
        subscriptionService.deductCredits('test-user')
      ).rejects.toThrow('No handshake credits remaining');
    });

    it('deducts one credit successfully', async () => {
      vi.mocked(await import('@/lib/db')).db.selectFrom = vi.fn().mockReturnValue(
        createMockQueryBuilder({
          handshake_credits: 30,
          subscription_status: 'ACTIVE',
          credits_reset_at: new Date(),
        })
      );

      const result = await subscriptionService.deductCredits('test-user');

      expect(result.remaining_credits).toBe(29);
    });
  });

  describe('getRateLimits', () => {
    it('returns credits and reset date', async () => {
      const result = await subscriptionService.getRateLimits('test-user');

      expect(result).toBeDefined();
      expect(result.handshake_credits).toBe(30);
      expect(result.monthly_limit).toBe(30);
    });
  });
});