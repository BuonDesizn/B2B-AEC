import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  canTransitionRfp,
  canTransitionResponse,
  rfpService,
} from '@/lib/services/rfp';

function createMockQueryBuilder(returnValue: unknown) {
  const chain = {
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
  } as any;
  return chain;
}

vi.mock('@/lib/db', () => {
  const mockRfp = {
    id: 'test-rfp-id',
    creator_id: 'test-user',
    title: 'Test RFP',
    status: 'DRAFT',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockConnection = {
    id: 'test-connection-id',
    requester_id: 'test-user',
    target_id: 'test-responder',
    status: 'ACCEPTED',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockResponse = {
    id: 'test-response-id',
    rfp_id: 'test-rfp-id',
    responder_id: 'test-responder',
    proposal: 'Test proposal',
    status: 'SUBMITTED',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const chain = createMockQueryBuilder(mockRfp);
  const responseChain = createMockQueryBuilder(mockResponse);
  const connectionChain = createMockQueryBuilder(mockConnection);
  
  return {
    db: {
      insertInto: vi.fn(() => chain),
      selectFrom: vi.fn((table: string) => {
        if (table === 'rfp_responses') return responseChain;
        if (table === 'connections') return connectionChain;
        return chain;
      }),
      updateTable: vi.fn(() => chain),
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

describe('RFP State Machine', () => {
  describe('canTransitionRfp', () => {
    it('allows DRAFT to OPEN', () => {
      expect(canTransitionRfp('DRAFT', 'OPEN')).toBe(true);
    });

    it('allows DRAFT to CANCELLED', () => {
      expect(canTransitionRfp('DRAFT', 'CANCELLED')).toBe(true);
    });

    it('allows OPEN to CLOSED', () => {
      expect(canTransitionRfp('OPEN', 'CLOSED')).toBe(true);
    });

    it('allows OPEN to EXPIRED', () => {
      expect(canTransitionRfp('OPEN', 'EXPIRED')).toBe(true);
    });

    it('allows OPEN to CANCELLED', () => {
      expect(canTransitionRfp('OPEN', 'CANCELLED')).toBe(true);
    });

    it('does not allow CLOSED to any state', () => {
      expect(canTransitionRfp('CLOSED', 'OPEN')).toBe(false);
      expect(canTransitionRfp('CLOSED', 'DRAFT')).toBe(false);
    });

    it('does not allow EXPIRED to any state', () => {
      expect(canTransitionRfp('EXPIRED', 'OPEN')).toBe(false);
    });

    it('does not allow CANCELLED to any state', () => {
      expect(canTransitionRfp('CANCELLED', 'OPEN')).toBe(false);
    });
  });

  describe('canTransitionResponse', () => {
    it('allows SUBMITTED to SHORTLISTED', () => {
      expect(canTransitionResponse('SUBMITTED', 'SHORTLISTED')).toBe(true);
    });

    it('allows SUBMITTED to ACCEPTED', () => {
      expect(canTransitionResponse('SUBMITTED', 'ACCEPTED')).toBe(true);
    });

    it('allows SUBMITTED to REJECTED', () => {
      expect(canTransitionResponse('SUBMITTED', 'REJECTED')).toBe(true);
    });

    it('allows SHORTLISTED to ACCEPTED', () => {
      expect(canTransitionResponse('SHORTLISTED', 'ACCEPTED')).toBe(true);
    });

    it('allows SHORTLISTED to REJECTED', () => {
      expect(canTransitionResponse('SHORTLISTED', 'REJECTED')).toBe(true);
    });

    it('does not allow ACCEPTED to any state', () => {
      expect(canTransitionResponse('ACCEPTED', 'REJECTED')).toBe(false);
    });

    it('does not allow REJECTED to any state', () => {
      expect(canTransitionResponse('REJECTED', 'ACCEPTED')).toBe(false);
    });
  });
});

describe('RFP Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('creates RFP in DRAFT state', async () => {
      const input = {
        requester_id: 'test-user',
        title: 'Bulk Cement Requirement for Pune Project',
        description: 'We are looking for a reliable supplier for 500 MT of OPC 53 Grade cement for our upcoming residential project in Pune. Delivery is required within 15 days.',
        category: 'construction',
        location: 'New York',
        expiry_date: new Date('2026-05-01'),
      };

      const result = await rfpService.create(input);

      expect(result).toBeDefined();
      expect(result.status).toBe('DRAFT');
    });
  });

  describe('publish', () => {
    it('transitions DRAFT to OPEN', async () => {
      const result = await rfpService.publish('test-rfp-id', 'test-user');
      expect(result).toBeDefined();
    });

    it('throws error if user is not creator', async () => {
      await expect(rfpService.publish('test-rfp-id', 'other-user')).rejects.toThrow(
        'Only the creator can publish this RFP'
      );
    });
  });

  describe('close', () => {
    it('throws error if user is not creator', async () => {
      await expect(rfpService.close('test-rfp-id', 'other-user')).rejects.toThrow(
        'Only the creator can close this RFP'
      );
    });
  });

  describe('cancel', () => {
    it('cancels DRAFT RFP', async () => {
      const result = await rfpService.cancel('test-rfp-id', 'test-user');
      expect(result).toBeDefined();
    });
  });

  describe('submitResponse', () => {
    it('throws error if RFP not in OPEN state', async () => {
      await expect(
        rfpService.submitResponse({
          rfp_id: 'test-rfp-id',
          responder_id: 'test-responder',
          proposal: 'Test proposal',
        })
      ).rejects.toThrow(/Cannot respond to RFP in DRAFT state/);
    });
  });

  describe('acceptResponse', () => {
    it('throws error if user is not creator', async () => {
      await expect(
        rfpService.acceptResponse('test-rfp-id', 'test-response-id', 'other-user')
      ).rejects.toThrow('Only the RFP creator can accept responses');
    });
  });
});