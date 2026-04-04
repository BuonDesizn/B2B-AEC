import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  canTransitionConnection,
  connectionService,
} from '@/lib/services/connections';

function createMockQueryBuilder(returnValue: any) {
  const chain: any = {
    selectAll: vi.fn(() => chain),
    select: vi.fn(() => chain),
    where: vi.fn(() => chain),
    or: vi.fn(() => chain),
    and: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    offset: vi.fn(() => chain),
    values: vi.fn(() => chain),
    set: vi.fn(() => chain),
    returningAll: vi.fn(() => chain),
    innerJoin: vi.fn(() => chain),
    on: vi.fn(() => chain),
    executeTakeFirst: vi.fn().mockResolvedValue(returnValue),
    executeTakeFirstOrThrow: vi.fn().mockResolvedValue(returnValue),
    execute: vi.fn().mockResolvedValue(Array.isArray(returnValue) ? returnValue : [returnValue]),
  };
  return chain;
}

const mockDb = {
  insertInto: vi.fn(),
  selectFrom: vi.fn(),
  updateTable: vi.fn(),
  fn: {
    count: vi.fn(() => ({ as: vi.fn(() => 'count') })),
  },
  transaction: vi.fn(),
};

vi.mock('@/lib/db', () => ({
  get db() {
    return mockDb;
  },
}));

describe('Connection State Machine', () => {
  describe('canTransitionConnection', () => {
    it('allows REQUESTED to ACCEPTED', () => {
      expect(canTransitionConnection('REQUESTED', 'ACCEPTED')).toBe(true);
    });

    it('allows REQUESTED to REJECTED', () => {
      expect(canTransitionConnection('REQUESTED', 'REJECTED')).toBe(true);
    });

    it('allows REQUESTED to BLOCKED', () => {
      expect(canTransitionConnection('REQUESTED', 'BLOCKED')).toBe(true);
    });

    it('allows REQUESTED to EXPIRED', () => {
      expect(canTransitionConnection('REQUESTED', 'EXPIRED')).toBe(true);
    });

    it('allows ACCEPTED to BLOCKED', () => {
      expect(canTransitionConnection('ACCEPTED', 'BLOCKED')).toBe(true);
    });

    it('does not allow ACCEPTED to REJECTED', () => {
      expect(canTransitionConnection('ACCEPTED', 'REJECTED')).toBe(false);
    });

    it('does not allow ACCEPTED to REQUESTED', () => {
      expect(canTransitionConnection('ACCEPTED', 'REQUESTED')).toBe(false);
    });

    it('allows REJECTED to REQUESTED (re-request)', () => {
      expect(canTransitionConnection('REJECTED', 'REQUESTED')).toBe(true);
    });

    it('allows REJECTED to BLOCKED', () => {
      expect(canTransitionConnection('REJECTED', 'BLOCKED')).toBe(true);
    });

    it('does not allow REJECTED to ACCEPTED', () => {
      expect(canTransitionConnection('REJECTED', 'ACCEPTED')).toBe(false);
    });

    it('allows EXPIRED to REQUESTED (re-request)', () => {
      expect(canTransitionConnection('EXPIRED', 'REQUESTED')).toBe(true);
    });

    it('allows BLOCKED to REJECTED (unblock)', () => {
      expect(canTransitionConnection('BLOCKED', 'REJECTED')).toBe(true);
    });

    it('does not allow BLOCKED to ACCEPTED', () => {
      expect(canTransitionConnection('BLOCKED', 'ACCEPTED')).toBe(false);
    });

    it('does not allow EXPIRED to ACCEPTED', () => {
      expect(canTransitionConnection('EXPIRED', 'ACCEPTED')).toBe(false);
    });
  });
});

describe('Connection Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createConnection', () => {
    it('creates connection in REQUESTED state', async () => {
      const profileChain = createMockQueryBuilder({
        subscription_status: 'active',
        handshake_credits: 25,
      });
      const noExistingChain = createMockQueryBuilder(null);
      const noBlockedChain = createMockQueryBuilder(null);
      const newConnChain = createMockQueryBuilder({
        id: 'new-conn-id',
        requester_id: 'test-user',
        target_id: 'test-target',
        status: 'REQUESTED',
      });
      const updateProfileChain = createMockQueryBuilder(1);

      let callCount = 0;
      mockDb.selectFrom = vi.fn((table: string) => {
        callCount++;
        if (table === 'profiles') return profileChain;
        return callCount === 2 ? noExistingChain : noBlockedChain;
      });
      mockDb.insertInto = vi.fn(() => newConnChain);
      mockDb.updateTable = vi.fn(() => updateProfileChain);
      mockDb.transaction = vi.fn(() => ({
        execute: vi.fn(async (cb: any) => {
          const trx = {
            insertInto: vi.fn(() => newConnChain),
            updateTable: vi.fn(() => updateProfileChain),
          };
          return cb(trx);
        }),
      }));

      const result = await connectionService.createConnection('test-user', {
        target_id: 'test-target',
        message: 'Hello',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('REQUESTED');
    });

    it('throws HANDSHAKE_INITIATE_SELF_CONNECT when connecting to self', async () => {
      await expect(
        connectionService.createConnection('test-user', {
          target_id: 'test-user',
        })
      ).rejects.toThrow('HANDSHAKE_INITIATE_SELF_CONNECT');
    });

    it('throws HANDSHAKE_INITIATE_SUBSCRIPTION_LOCKED when hard_locked', async () => {
      const profileChain = createMockQueryBuilder({
        subscription_status: 'hard_locked',
        handshake_credits: 25,
      });

      mockDb.selectFrom = vi.fn(() => profileChain);

      await expect(
        connectionService.createConnection('test-user', {
          target_id: 'test-target',
        })
      ).rejects.toThrow('HANDSHAKE_INITIATE_SUBSCRIPTION_LOCKED');
    });

    it('throws HANDSHAKE_INITIATE_INSUFFICIENT_CREDITS when no credits', async () => {
      const profileChain = createMockQueryBuilder({
        subscription_status: 'active',
        handshake_credits: 0,
      });

      mockDb.selectFrom = vi.fn(() => profileChain);

      await expect(
        connectionService.createConnection('test-user', {
          target_id: 'test-target',
        })
      ).rejects.toThrow('HANDSHAKE_INITIATE_INSUFFICIENT_CREDITS');
    });

    it('throws HANDSHAKE_INITIATE_ALREADY_CONNECTED when active connection exists', async () => {
      const profileChain = createMockQueryBuilder({
        subscription_status: 'active',
        handshake_credits: 25,
      });
      const existingChain = createMockQueryBuilder({ id: 'existing-conn' });

      let callCount = 0;
      mockDb.selectFrom = vi.fn(() => {
        callCount++;
        return callCount === 1 ? profileChain : existingChain;
      });

      await expect(
        connectionService.createConnection('test-user', {
          target_id: 'test-target',
        })
      ).rejects.toThrow('HANDSHAKE_INITIATE_ALREADY_CONNECTED');
    });

    it('throws HANDSHAKE_INITIATE_BLOCKED_USER when user is blocked', async () => {
      const profileChain = createMockQueryBuilder({
        subscription_status: 'active',
        handshake_credits: 25,
      });
      const noExistingChain = createMockQueryBuilder(null);
      const blockedChain = createMockQueryBuilder({ id: 'blocked-conn' });

      let callCount = 0;
      mockDb.selectFrom = vi.fn(() => {
        callCount++;
        if (callCount === 1) return profileChain;
        if (callCount === 2) return noExistingChain;
        return blockedChain;
      });

      await expect(
        connectionService.createConnection('test-user', {
          target_id: 'test-target',
        })
      ).rejects.toThrow('HANDSHAKE_INITIATE_BLOCKED_USER');
    });
  });

  describe('acceptConnection', () => {
    it('accepts connection and transitions to ACCEPTED', async () => {
      const connChain = createMockQueryBuilder({
        id: 'test-connection-id',
        requester_id: 'test-user',
        target_id: 'test-target',
        status: 'REQUESTED',
      });
      const auditChain = createMockQueryBuilder({ id: 'audit-1' });

      mockDb.selectFrom = vi.fn(() => connChain);
      mockDb.transaction = vi.fn(() => ({
        execute: vi.fn(async (cb: any) => {
          const trx = {
            updateTable: vi.fn(() => connChain),
            insertInto: vi.fn(() => auditChain),
          };
          return cb(trx);
        }),
      }));

      const result = await connectionService.acceptConnection('test-connection-id', 'test-target');

      expect(result).toBeDefined();
    });

    it('throws HANDSHAKE_ACCEPT_NOT_TARGET when non-target tries to accept', async () => {
      const connChain = createMockQueryBuilder({
        id: 'test-connection-id',
        requester_id: 'test-user',
        target_id: 'test-target',
        status: 'REQUESTED',
      });

      mockDb.selectFrom = vi.fn(() => connChain);

      await expect(
        connectionService.acceptConnection('test-connection-id', 'other-user')
      ).rejects.toThrow('HANDSHAKE_ACCEPT_NOT_TARGET');
    });

    it('throws RESOURCE_NOT_FOUND when connection does not exist', async () => {
      const nullChain = createMockQueryBuilder(null);

      mockDb.selectFrom = vi.fn(() => nullChain);

      await expect(
        connectionService.acceptConnection('nonexistent-id', 'test-user')
      ).rejects.toThrow('RESOURCE_NOT_FOUND');
    });

    it('throws error when accepting non-REQUESTED connection', async () => {
      const connChain = createMockQueryBuilder({
        id: 'test-connection-id',
        requester_id: 'test-user',
        target_id: 'test-target',
        status: 'REJECTED',
      });

      mockDb.selectFrom = vi.fn(() => connChain);

      await expect(
        connectionService.acceptConnection('test-connection-id', 'test-target')
      ).rejects.toThrow(/Cannot accept connection in REJECTED state/);
    });
  });

  describe('rejectConnection', () => {
    it('rejects connection and transitions to REJECTED', async () => {
      const connChain = createMockQueryBuilder({
        id: 'test-connection-id',
        requester_id: 'test-user',
        target_id: 'test-target',
        status: 'REQUESTED',
      });

      mockDb.selectFrom = vi.fn(() => connChain);
      mockDb.updateTable = vi.fn(() => connChain);

      const result = await connectionService.rejectConnection('test-connection-id', 'test-target');

      expect(result).toBeDefined();
    });

    it('throws HANDSHAKE_ACCEPT_NOT_TARGET when non-target tries to reject', async () => {
      const connChain = createMockQueryBuilder({
        id: 'test-connection-id',
        requester_id: 'test-user',
        target_id: 'test-target',
        status: 'REQUESTED',
      });

      mockDb.selectFrom = vi.fn(() => connChain);

      await expect(
        connectionService.rejectConnection('test-connection-id', 'other-user')
      ).rejects.toThrow('HANDSHAKE_ACCEPT_NOT_TARGET');
    });

    it('throws RESOURCE_NOT_FOUND when connection does not exist', async () => {
      const nullChain = createMockQueryBuilder(null);

      mockDb.selectFrom = vi.fn(() => nullChain);

      await expect(
        connectionService.rejectConnection('nonexistent-id', 'test-user')
      ).rejects.toThrow('RESOURCE_NOT_FOUND');
    });
  });

  describe('listConnections', () => {
    it('returns paginated connections for user', async () => {
      const connChain = createMockQueryBuilder([
        { id: 'conn-1', status: 'REQUESTED' },
        { id: 'conn-2', status: 'ACCEPTED' },
      ]);
      const countChain = createMockQueryBuilder({ count: '5' });

      let callCount = 0;
      mockDb.selectFrom = vi.fn(() => {
        callCount++;
        return callCount === 1 ? connChain : countChain;
      });

      const result = await connectionService.listConnections('test-user');

      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
      expect(result.meta).toBeDefined();
      expect(result.meta.page).toBe(1);
      expect(result.meta.page_size).toBe(20);
    });

    it('filters by status', async () => {
      const connChain = createMockQueryBuilder([
        { id: 'conn-1', status: 'ACCEPTED' },
      ]);
      const countChain = createMockQueryBuilder({ count: '1' });

      let callCount = 0;
      mockDb.selectFrom = vi.fn(() => {
        callCount++;
        return callCount === 1 ? connChain : countChain;
      });

      const result = await connectionService.listConnections('test-user', {
        status: 'ACCEPTED',
      });

      expect(result).toBeDefined();
    });

    it('respects custom pagination', async () => {
      const connChain = createMockQueryBuilder([]);
      const countChain = createMockQueryBuilder({ count: '0' });

      let callCount = 0;
      mockDb.selectFrom = vi.fn(() => {
        callCount++;
        return callCount === 1 ? connChain : countChain;
      });

      const result = await connectionService.listConnections('test-user', {
        page: 2,
        page_size: 10,
      });

      expect(result.meta.page).toBe(2);
      expect(result.meta.page_size).toBe(10);
    });
  });

  describe('getConnections', () => {
    it('returns all connections for user', async () => {
      const connChain = createMockQueryBuilder([
        { id: 'conn-1', status: 'REQUESTED' },
        { id: 'conn-2', status: 'ACCEPTED' },
      ]);

      mockDb.selectFrom = vi.fn(() => connChain);

      const result = await connectionService.getConnections('test-user');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('blockUser', () => {
    it('blocks a user and transitions to BLOCKED', async () => {
      const existingChain = createMockQueryBuilder({
        id: 'existing-conn',
        requester_id: 'test-user',
        target_id: 'test-target',
        status: 'REQUESTED',
      });
      const updatedChain = createMockQueryBuilder({
        id: 'existing-conn',
        requester_id: 'test-user',
        target_id: 'test-target',
        status: 'BLOCKED',
      });

      mockDb.selectFrom = vi.fn(() => existingChain);
      mockDb.transaction = vi.fn(() => ({
        execute: vi.fn(async (cb: any) => {
          const trx = {
            updateTable: vi.fn(() => updatedChain),
          };
          return cb(trx);
        }),
      }));

      const result = await connectionService.blockUser('test-user', 'test-target');

      expect(result).toBeDefined();
      expect(result.status).toBe('BLOCKED');
    });

    it('throws HANDSHAKE_INITIATE_SELF_CONNECT when blocking self', async () => {
      await expect(
        connectionService.blockUser('test-user', 'test-user')
      ).rejects.toThrow('HANDSHAKE_INITIATE_SELF_CONNECT');
    });

    it('creates new BLOCKED connection if none exists', async () => {
      const nullChain = createMockQueryBuilder(null);
      const newConnChain = createMockQueryBuilder({
        id: 'new-blocked-id',
        requester_id: 'test-user',
        target_id: 'test-target',
        status: 'BLOCKED',
      });

      mockDb.selectFrom = vi.fn(() => nullChain);
      mockDb.transaction = vi.fn(() => ({
        execute: vi.fn(async (cb: any) => {
          const trx = {
            insertInto: vi.fn(() => newConnChain),
          };
          return cb(trx);
        }),
      }));

      const result = await connectionService.blockUser('test-user', 'test-target');

      expect(result).toBeDefined();
      expect(result.status).toBe('BLOCKED');
    });
  });

  describe('unblockUser', () => {
    it('unblocks user and transitions to REJECTED', async () => {
      const blockedChain = createMockQueryBuilder({
        id: 'blocked-conn',
        requester_id: 'test-user',
        target_id: 'test-target',
        status: 'BLOCKED',
      });
      const updatedChain = createMockQueryBuilder({
        id: 'blocked-conn',
        requester_id: 'test-user',
        target_id: 'test-target',
        status: 'REJECTED',
      });

      mockDb.selectFrom = vi.fn(() => blockedChain);
      mockDb.updateTable = vi.fn(() => updatedChain);

      const result = await connectionService.unblockUser('test-user', 'test-target');

      expect(result).toBeDefined();
      expect(result.status).toBe('REJECTED');
    });

    it('throws RESOURCE_NOT_FOUND when no blocked connection exists', async () => {
      const nullChain = createMockQueryBuilder(null);

      mockDb.selectFrom = vi.fn(() => nullChain);

      await expect(
        connectionService.unblockUser('test-user', 'test-target')
      ).rejects.toThrow('RESOURCE_NOT_FOUND');
    });
  });

  describe('getAddressBook', () => {
    it('returns address book entries for user', async () => {
      const addrChain = createMockQueryBuilder([
        {
          id: 'addr-1',
          org_name: 'ABC Designs',
          email_business: 'abc@example.com',
          phone_primary: '+919876543210',
        },
      ]);

      mockDb.selectFrom = vi.fn(() => addrChain);

      const result = await connectionService.getAddressBook('test-user');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
