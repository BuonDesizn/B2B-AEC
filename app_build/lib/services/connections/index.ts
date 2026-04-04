// @witness [HD-001]
import { CONNECTION_STATUS, SUBSCRIPTION_STATUS } from '@/lib/constants';
import { db } from '@/lib/db';

// =============================================================================
// Connection State Machine
// =============================================================================

export type ConnectionState = 'REQUESTED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'BLOCKED';

const CONNECTION_TRANSITIONS: Record<ConnectionState, ConnectionState[]> = {
  REQUESTED: ['ACCEPTED', 'REJECTED', 'BLOCKED', 'EXPIRED'],
  ACCEPTED: ['BLOCKED'],
  REJECTED: ['REQUESTED', 'BLOCKED'],
  EXPIRED: ['REQUESTED', 'BLOCKED'],
  BLOCKED: ['REJECTED'],
};

export function canTransitionConnection(current: ConnectionState, next: ConnectionState): boolean {
  return CONNECTION_TRANSITIONS[current]?.includes(next) ?? false;
}

// =============================================================================
// Connection Service
// =============================================================================

export interface CreateConnectionInput {
  target_id: string;
  message?: string;
}

export interface ListConnectionsFilters {
  status?: ConnectionState;
  role?: string;
  source?: string;
  page?: number;
  page_size?: number;
}

export const connectionService = {
  /**
   * Create a new connection request
   * @witness [HD-001]
   */
  async createConnection(requesterId: string, input: CreateConnectionInput) {
    const targetId = input.target_id;

    if (requesterId === targetId) {
      throw new Error('HANDSHAKE_INITIATE_SELF_CONNECT');
    }

    const requesterProfile = await db
      .selectFrom('profiles')
      .select(['subscription_status', 'handshake_credits'])
      .where('id', '=', requesterId)
      .executeTakeFirst();

    if (!requesterProfile) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    if (requesterProfile.subscription_status === SUBSCRIPTION_STATUS.HARD_LOCKED) {
      throw new Error('HANDSHAKE_INITIATE_SUBSCRIPTION_LOCKED');
    }

    if (requesterProfile.handshake_credits <= 0) {
      throw new Error('HANDSHAKE_INITIATE_INSUFFICIENT_CREDITS');
    }

    const existingConnection = await db
      .selectFrom('connections')
      .select('id')
      .where('requester_id', '=', requesterId)
      .where('target_id', '=', targetId)
      .where('status', 'in', [CONNECTION_STATUS.REQUESTED, CONNECTION_STATUS.ACCEPTED])
      .executeTakeFirst();

    if (existingConnection) {
      throw new Error('HANDSHAKE_INITIATE_ALREADY_CONNECTED');
    }

    const blockedCheck = await db
      .selectFrom('connections')
      .select('id')
      .where((eb) => eb.or([
        eb.and([
          eb('requester_id', '=', requesterId),
          eb('target_id', '=', targetId),
          eb('status', '=', CONNECTION_STATUS.BLOCKED),
        ]),
        eb.and([
          eb('requester_id', '=', targetId),
          eb('target_id', '=', requesterId),
          eb('status', '=', CONNECTION_STATUS.BLOCKED),
        ]),
      ]))
      .executeTakeFirst();

    if (blockedCheck) {
      throw new Error('HANDSHAKE_INITIATE_BLOCKED_USER');
    }

    const result = await db.transaction().execute(async (trx) => {
      const connection = await trx
        .insertInto('connections')
        .values({
          requester_id: requesterId,
          target_id: targetId,
          status: CONNECTION_STATUS.REQUESTED,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      await trx
        .updateTable('profiles')
        .set({
          handshake_credits: (eb) => eb('handshake_credits', '-', 1),
          updated_at: new Date(),
        })
        .where('id', '=', requesterId)
        .execute();

      return connection;
    });

    return result;
  },

  /**
   * Accept a connection request
   * @witness [HD-001]
   */
  async acceptConnection(connectionId: string, userId: string) {
    const connection = await db
      .selectFrom('connections')
      .selectAll()
      .where('id', '=', connectionId)
      .executeTakeFirst();

    if (!connection) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    if (connection.target_id !== userId) {
      throw new Error('HANDSHAKE_ACCEPT_NOT_TARGET');
    }

    if (connection.status !== CONNECTION_STATUS.REQUESTED) {
      throw new Error(`Cannot accept connection in ${connection.status} state`);
    }

    const result = await db.transaction().execute(async (trx) => {
      const updated = await trx
        .updateTable('connections')
        .set({
          status: CONNECTION_STATUS.ACCEPTED,
          responded_at: new Date(),
          updated_at: new Date(),
        })
        .where('id', '=', connectionId)
        .returningAll()
        .executeTakeFirstOrThrow();

      await trx
        .insertInto('unmasking_audit')
        .values({
          viewer_id: connection.requester_id,
          viewed_id: connection.target_id,
          trigger_event: 'CONNECTION_ACCEPTED',
          revealed_fields: ['phone_primary', 'email_business'],
          unmasked_at: new Date(),
          retention_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        })
        .execute();

      await trx
        .insertInto('unmasking_audit')
        .values({
          viewer_id: connection.target_id,
          viewed_id: connection.requester_id,
          trigger_event: 'CONNECTION_ACCEPTED',
          revealed_fields: ['phone_primary', 'email_business'],
          unmasked_at: new Date(),
          retention_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        })
        .execute();

      return updated;
    });

    return result;
  },

  /**
   * Reject a connection request
   * @witness [HD-001]
   */
  async rejectConnection(connectionId: string, userId: string) {
    const connection = await db
      .selectFrom('connections')
      .selectAll()
      .where('id', '=', connectionId)
      .executeTakeFirst();

    if (!connection) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    if (connection.target_id !== userId) {
      throw new Error('HANDSHAKE_ACCEPT_NOT_TARGET');
    }

    if (connection.status !== CONNECTION_STATUS.REQUESTED) {
      throw new Error(`Cannot reject connection in ${connection.status} state`);
    }

    const result = await db
      .updateTable('connections')
      .set({
        status: CONNECTION_STATUS.REJECTED,
        responded_at: new Date(),
        updated_at: new Date(),
      })
      .where('id', '=', connectionId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  },

  /**
   * List connections for a user (as requester or target)
   * @witness [HD-001]
   */
  async listConnections(userId: string, filters: ListConnectionsFilters = {}) {
    let query = db
      .selectFrom('connections')
      .selectAll()
      .where((eb) => eb.or([
        eb('requester_id', '=', userId),
        eb('target_id', '=', userId),
      ]));

    if (filters.status) {
      query = query.where('status', '=', filters.status);
    }

    query = query.orderBy('initiated_at', 'desc');

    const page = filters.page ?? 1;
    const pageSize = Math.min(filters.page_size ?? 20, 50);
    const offset = (page - 1) * pageSize;

    const items = await query
      .limit(pageSize)
      .offset(offset)
      .execute();

    const countResult = await db
      .selectFrom('connections')
      .select(db.fn.count('id').as('count'))
      .where((eb) => eb.or([
        eb('requester_id', '=', userId),
        eb('target_id', '=', userId),
      ]))
      .executeTakeFirst();

    const totalCount = Number(countResult?.count ?? 0);

    return {
      items,
      meta: {
        page,
        page_size: pageSize,
        total_count: totalCount,
        total_pages: Math.ceil(totalCount / pageSize),
      },
    };
  },

  /**
   * Get all connections for a user (alias for listConnections without pagination)
   * @witness [HD-001]
   */
  async getConnections(userId: string) {
    return db
      .selectFrom('connections')
      .selectAll()
      .where((eb) => eb.or([
        eb('requester_id', '=', userId),
        eb('target_id', '=', userId),
      ]))
      .orderBy('initiated_at', 'desc')
      .execute();
  },

  /**
   * Block a user
   * @witness [HD-001]
   */
  async blockUser(userId: string, targetId: string) {
    if (userId === targetId) {
      throw new Error('HANDSHAKE_INITIATE_SELF_CONNECT');
    }

    const existingConnection = await db
      .selectFrom('connections')
      .selectAll()
      .where((eb) => eb.or([
        eb.and([
          eb('requester_id', '=', userId),
          eb('target_id', '=', targetId),
        ]),
        eb.and([
          eb('requester_id', '=', targetId),
          eb('target_id', '=', userId),
        ]),
      ]))
      .orderBy('initiated_at', 'desc')
      .executeTakeFirst();

    const result = await db.transaction().execute(async (trx) => {
      let connection;

      if (existingConnection) {
        connection = await trx
          .updateTable('connections')
          .set({
            status: CONNECTION_STATUS.BLOCKED,
            updated_at: new Date(),
          })
          .where('id', '=', existingConnection.id)
          .returningAll()
          .executeTakeFirstOrThrow();
      } else {
        connection = await trx
          .insertInto('connections')
          .values({
            requester_id: userId,
            target_id: targetId,
            status: CONNECTION_STATUS.BLOCKED,
          })
          .returningAll()
          .executeTakeFirstOrThrow();
      }

      return connection;
    });

    return result;
  },

  /**
   * Unblock a user (soft unblock — sets status to REJECTED, row preserved)
   * @witness [HD-001]
   */
  async unblockUser(userId: string, targetId: string) {
    const blockedConnection = await db
      .selectFrom('connections')
      .selectAll()
      .where('requester_id', '=', userId)
      .where('target_id', '=', targetId)
      .where('status', '=', CONNECTION_STATUS.BLOCKED)
      .executeTakeFirst();

    if (!blockedConnection) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    const result = await db
      .updateTable('connections')
      .set({
        status: CONNECTION_STATUS.REJECTED,
        updated_at: new Date(),
      })
      .where('id', '=', blockedConnection.id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  },

  /**
   * Fetch address book (permanent connections) for a user
   * @witness [HD-001]
   */
  async getAddressBook(userId: string) {
    return db
      .selectFrom('address_book')
      .innerJoin('profiles', 'profiles.id', 'address_book.contact_id')
      .select([
        'address_book.id',
        'profiles.org_name',
        'profiles.email_business',
        'profiles.phone_primary',
      ])
      .where('address_book.owner_id', '=', userId)
      .orderBy('address_book.added_at', 'desc')
      .execute();
  },
};
