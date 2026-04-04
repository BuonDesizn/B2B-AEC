import { db } from '@/lib/db';
import { sql } from 'kysely';
import type { DB } from '@/lib/db/types';
import { RFP_STATUS, RFP_RESPONSE_STATUS, ERROR_CODES, CONNECTION_STATUS } from '@/lib/constants';

type Rfp = DB['rfps'];
type RfpResponse = DB['rfp_responses'];

// =============================================================================
// RFP State Machine
// =============================================================================

export type RfpState = 'DRAFT' | 'OPEN' | 'CLOSED' | 'EXPIRED' | 'CANCELLED';
export type RfpResponseState = 'SUBMITTED' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED';

// State transition guards
const RFP_TRANSITIONS: Record<RfpState, RfpState[]> = {
  DRAFT: ['OPEN', 'CANCELLED'],
  OPEN: ['CLOSED', 'EXPIRED', 'CANCELLED'],
  CLOSED: [],
  EXPIRED: [],
  CANCELLED: [],
};

const RESPONSE_TRANSITIONS: Record<RfpResponseState, RfpResponseState[]> = {
  SUBMITTED: ['SHORTLISTED', 'ACCEPTED', 'REJECTED'],
  SHORTLISTED: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: [],
  REJECTED: [],
};

export function canTransitionRfp(current: RfpState, next: RfpState): boolean {
  return RFP_TRANSITIONS[current]?.includes(next) ?? false;
}

export function canTransitionResponse(current: RfpResponseState, next: RfpResponseState): boolean {
  return RESPONSE_TRANSITIONS[current]?.includes(next) ?? false;
}

// =============================================================================
// RFP Service
// =============================================================================

export interface CreateRfpInput {
  requester_id: string;
  request_type?: 'PRODUCT' | 'SERVICE' | 'EQUIPMENT' | 'PROJECT';
  title: string;
  description?: string;
  category: string;
  subcategory?: string;
  budget_min?: number;
  budget_max?: number;
  location: string;
  project_city?: string;
  project_state?: string;
  sector_of_application?: string;
  target_personas?: string[];
  requirements?: Record<string, any>;
  expiry_date: Date;
}

export interface UpdateRfpInput {
  title?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  budget_min?: number;
  budget_max?: number;
  location?: string;
  expiry_date?: Date;
}

export interface SubmitResponseInput {
  rfp_id: string;
  responder_id: string;
  proposal: string;
  estimated_cost?: number;
  estimated_days?: number;
}

export const rfpService = {
  /**
   * Create a new RFP in DRAFT state
   * @witness [RFP-001]
   */
  async create(input: CreateRfpInput) {
    if (input.title && (input.title.length < 10 || input.title.length > 100)) {
      throw new Error(ERROR_CODES.RFP_TITLE_LENGTH_INVALID);
    }
    if (input.description && (input.description.length < 50 || input.description.length > 2000)) {
      throw new Error(ERROR_CODES.RFP_DESCRIPTION_LENGTH_INVALID);
    }
    if (!input.description) {
      throw new Error(ERROR_CODES.RFP_DESCRIPTION_REQUIRED);
    }

    const result = await db
      .insertInto('rfps')
      .values({
        creator_id: input.requester_id,
        request_type: input.request_type ?? 'PROJECT',
        title: input.title,
        description: input.description,
        category: input.category,
        subcategory: input.subcategory ?? null,
        sector_of_application: input.sector_of_application ?? '',
        requirements: input.requirements ?? {},
        target_personas: input.target_personas ?? [],
        project_location: input.location,
        project_city: input.project_city ?? '',
        project_state: input.project_state ?? '',
        budget_min: input.budget_min ?? null,
        budget_max: input.budget_max ?? null,
        expires_at: input.expiry_date,
        status: RFP_STATUS.DRAFT,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  },

  /**
   * Update an existing RFP (only DRAFT or OPEN state)
   * @witness [RFP-001]
   */
  async update(id: string, input: UpdateRfpInput, requesterId: string) {
    const rfp = await this.getById(id);

    if (!rfp) {
      throw new Error('RFP not found');
    }

    if (rfp.creator_id !== requesterId) {
      throw new Error('Only the creator can update this RFP');
    }

    if (rfp.status !== RFP_STATUS.DRAFT && rfp.status !== RFP_STATUS.OPEN) {
      throw new Error(`Cannot update Rfp in ${rfp.status} state`);
    }

    const updateSet: Record<string, unknown> = {
      updated_at: new Date(),
    };
    if (input.title !== undefined) updateSet.title = input.title;
    if (input.description !== undefined) updateSet.description = input.description;
    if (input.category !== undefined) updateSet.category = input.category;
    if (input.subcategory !== undefined) updateSet.subcategory = input.subcategory;
    if (input.budget_min !== undefined) updateSet.budget_min = input.budget_min;
    if (input.budget_max !== undefined) updateSet.budget_max = input.budget_max;
    if (input.location !== undefined) updateSet.project_location = input.location;
    if (input.expiry_date !== undefined) updateSet.expires_at = input.expiry_date;

    const result = await db
      .updateTable('rfps')
      .set(updateSet)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  },

  /**
   * Get RFP by ID
   * @witness [RFP-001]
   */
  async getById(id: string) {
    return await db
      .selectFrom('rfps')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  },

  /**
   * List RFPs for a specific requester
   * @witness [RFP-001]
   */
  async listByRequester(requesterId: string, limit = 20, offset = 0) {
    return await db
      .selectFrom('rfps')
      .selectAll()
      .where('creator_id', '=', requesterId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();
  },

  /**
   * Browse OPEN RFPs (for potential responders)
   * @witness [RFP-001]
   */
  async browseOpenRfps(limit = 20, offset = 0, category?: string, state?: string) {
    let query = db
      .selectFrom('rfps')
      .selectAll()
      .where('status', '=', RFP_STATUS.OPEN)
      .where('expires_at', '>', new Date())
      .orderBy('created_at', 'desc');

    if (category) {
      query = query.where('category', '=', category);
    }

    if (state) {
      query = query.where('project_state', '=', state);
    }

    return await query.limit(limit).offset(offset).execute();
  },

  /**
   * Transition RFP to OPEN state
   * @witness [RFP-001]
   */
  async publish(id: string, requesterId: string) {
    const rfp = await this.getById(id);

    if (!rfp) {
      throw new Error('RFP not found');
    }

    if (rfp.creator_id !== requesterId) {
      throw new Error('Only the creator can publish this RFP');
    }

    if (!canTransitionRfp(rfp.status as RfpState, RFP_STATUS.OPEN)) {
      throw new Error(`Cannot transition from ${rfp.status} to OPEN`);
    }

    return await db
      .updateTable('rfps')
      .set({ status: RFP_STATUS.OPEN, updated_at: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  /**
   * Close an OPEN RFP
   * @witness [RFP-001]
   */
  async close(id: string, requesterId: string) {
    const rfp = await this.getById(id);

    if (!rfp) {
      throw new Error('RFP not found');
    }

    if (rfp.creator_id !== requesterId) {
      throw new Error('Only the creator can close this RFP');
    }

    if (!canTransitionRfp(rfp.status as RfpState, RFP_STATUS.CLOSED)) {
      throw new Error(`Cannot transition from ${rfp.status} to CLOSED`);
    }

    return await db
      .updateTable('rfps')
      .set({ status: RFP_STATUS.CLOSED, updated_at: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  /**
   * Cancel a RFP (from DRAFT or OPEN)
   * @witness [RFP-001]
   */
  async cancel(id: string, requesterId: string) {
    const rfp = await this.getById(id);

    if (!rfp) {
      throw new Error('RFP not found');
    }

    if (rfp.creator_id !== requesterId) {
      throw new Error('Only the creator can cancel this RFP');
    }

    if (!canTransitionRfp(rfp.status as RfpState, RFP_STATUS.CANCELLED)) {
      throw new Error(`Cannot transition from ${rfp.status} to CANCELLED`);
    }

    return await db
      .updateTable('rfps')
      .set({ status: RFP_STATUS.CANCELLED, updated_at: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  /**
   * Submit a response to an OPEN RFP
   * One response per user per RFP enforced
   * @witness [RFP-001]
   */
  async submitResponse(input: SubmitResponseInput) {
    const rfp = await this.getById(input.rfp_id);

    if (!rfp) {
      throw new Error('RFP not found');
    }

    if (rfp.status !== RFP_STATUS.OPEN) {
      throw new Error(`Cannot respond to RFP in ${rfp.status} state. Only OPEN RFPs accept responses`);
    }

    if (rfp.expires_at! < new Date()) {
      throw new Error('RFP has expired');
    }

    // Check for existing response
    const existing = await db
      .selectFrom('rfp_responses')
      .select('id')
      .where('rfp_id', '=', input.rfp_id)
      .where('responder_id', '=', input.responder_id)
      .executeTakeFirst();

    if (existing) {
      throw new Error('You have already responded to this RFP');
    }

    return await db
      .insertInto('rfp_responses')
      .values({
        rfp_id: input.rfp_id,
        responder_id: input.responder_id,
        proposal_text: input.proposal,
        bid_amount: input.estimated_cost ?? null,
        estimated_days: input.estimated_days ?? null,
        status: RFP_RESPONSE_STATUS.SUBMITTED,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  /**
   * Accept a response and create connection
   * @witness [RFP-001]
   */
  async acceptResponse(rfpId: string, responseId: string, requesterId: string) {
    const rfp = await this.getById(rfpId);

    if (!rfp) {
      throw new Error('RFP not found');
    }

    if (rfp.creator_id !== requesterId) {
      throw new Error('Only the RFP creator can accept responses');
    }

    const response = await db
      .selectFrom('rfp_responses')
      .selectAll()
      .where('id', '=', responseId)
      .where('rfp_id', '=', rfpId)
      .executeTakeFirst();

    if (!response) {
      throw new Error('Response not found');
    }

    if (!canTransitionResponse(response.status as RfpResponseState, RFP_RESPONSE_STATUS.ACCEPTED)) {
      throw new Error(`Cannot transition response from ${response.status} to ACCEPTED`);
    }

    // Use transaction to update response and create connection
    return await db.transaction().execute(async (trx) => {
      // Update response status
      await trx
        .updateTable('rfp_responses')
        .set({ status: RFP_RESPONSE_STATUS.ACCEPTED })
        .where('id', '=', responseId)
        .execute();

      // Create connection (no credit deduction for RFP-accepted connections)
      const connection = await trx
        .insertInto('connections')
        .values({
          requester_id: rfp.creator_id,
          target_id: response.responder_id,
          status: CONNECTION_STATUS.ACCEPTED,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return { response, connection };
    });
  },

  /**
   * Reject a response
   * @witness [RFP-001]
   */
  async rejectResponse(rfpId: string, responseId: string, requesterId: string) {
    const rfp = await this.getById(rfpId);

    if (!rfp) {
      throw new Error('RFP not found');
    }

    if (rfp.creator_id !== requesterId) {
      throw new Error('Only the RFP creator can reject responses');
    }

    const response = await db
      .selectFrom('rfp_responses')
      .selectAll()
      .where('id', '=', responseId)
      .where('rfp_id', '=', rfpId)
      .executeTakeFirst();

    if (!response) {
      throw new Error('Response not found');
    }

    if (!canTransitionResponse(response.status as RfpResponseState, RFP_RESPONSE_STATUS.REJECTED)) {
      throw new Error(`Cannot transition response from ${response.status} to REJECTED`);
    }

    return await db
      .updateTable('rfp_responses')
      .set({ status: RFP_RESPONSE_STATUS.REJECTED })
      .where('id', '=', responseId)
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  /**
   * Get all responses for an RFP
   * @witness [RFP-001]
   */
  async getResponses(rfpId: string, userId: string, filters?: { status?: string; page?: number; pageSize?: number }) {
    const rfp = await this.getById(rfpId);
    if (!rfp) throw new Error('RFP not found');

    let query = db
      .selectFrom('rfp_responses')
      .selectAll()
      .where('rfp_id', '=', rfpId);

    if (filters?.status) {
      query = query.where('status', '=', filters.status);
    }

    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const items = await query
      .orderBy('created_at', 'desc')
      .limit(pageSize)
      .offset(offset)
      .execute();

    const totalResult = await db
      .selectFrom('rfp_responses')
      .select((eb) => eb.fn.count('id').as('total'))
      .where('rfp_id', '=', rfpId)
      .executeTakeFirst();

    const total = Number(totalResult?.total ?? 0);

    return {
      items,
      meta: { page, page_size: pageSize, total_count: total, total_pages: Math.ceil(total / pageSize) },
    };
  },

  /**
   * Invite a specific profile to respond to an RFP
   * @witness [RFP-001]
   */
  async inviteProfile(rfpId: string, inviteeId: string, requesterId: string) {
    const rfp = await this.getById(rfpId);
    if (!rfp) throw new Error('RFP not found');
    if (rfp.creator_id !== requesterId) throw new Error('Only the RFP creator can invite');
    if (rfp.status !== RFP_STATUS.OPEN) throw new Error('Can only invite to OPEN RFPs');

    const existing = await db
      .selectFrom('rfp_invitations')
      .select('id')
      .where('rfp_id', '=', rfpId)
      .where('invitee_id', '=', inviteeId)
      .executeTakeFirst();

    if (existing) throw new Error('Profile already invited to this RFP');

    return await db
      .insertInto('rfp_invitations')
      .values({ rfp_id: rfpId, invitee_id: inviteeId, status: 'PENDING' })
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  /**
   * Expire RFPs past their expiry date
   * Called by QStash scheduled job
   * @witness [RFP-001]
   */
  async expireRfps() {
    const result = await db
      .updateTable('rfps')
      .set({ status: RFP_STATUS.EXPIRED, updated_at: new Date() })
      .where('status', '=', RFP_STATUS.OPEN)
      .where('expires_at', '<', new Date())
      .execute();

    return result;
  },
};