import { db } from '@/lib/db';
import { PERSONA_TYPES, SUBSCRIPTION_STATUS, ERROR_CODES } from '@/lib/constants';

// @witness [ED-001]

// =============================================================================
// Equipment Service
// =============================================================================

export interface CreateEquipmentInput {
  name: string;
  description?: string;
  category: string;
  type?: string;
  rental_rate_per_day?: number;
  operator_included?: boolean;
  location?: { lat: number; lng: number } | string;
  images?: string[];
  available?: boolean;
}

export interface UpdateEquipmentInput {
  name?: string;
  description?: string;
  category?: string;
  type?: string;
  rental_rate_per_day?: number;
  operator_included?: boolean;
  location?: { lat: number; lng: number } | string;
  images?: string[];
  available?: boolean;
}

export interface ListEquipmentFilters {
  dealer_id?: string;
  category?: string;
  available_only?: boolean;
  page?: number;
  page_size?: number;
}

export interface ListEquipmentResult {
  items: any[];
  meta: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
}

export const equipmentService = {
  /**
   * Create a new equipment listing
   * @witness [ED-001]
   */
  async createEquipment(dealerId: string, input: CreateEquipmentInput) {
    const profile = await db
      .selectFrom('profiles')
      .select(['persona_type', 'subscription_status'])
      .where('id', '=', dealerId)
      .executeTakeFirst();

    if (!profile) {
      throw new Error('Profile not found');
    }

    if (profile.persona_type !== PERSONA_TYPES.ED) {
      throw new Error(ERROR_CODES.EQUIPMENT_CREATE_NOT_ED);
    }

    if (profile.subscription_status === SUBSCRIPTION_STATUS.HARD_LOCKED) {
      throw new Error(ERROR_CODES.EQUIPMENT_CREATE_SUBSCRIPTION_LOCKED);
    }

    const locationValue = input.location
      ? (typeof input.location === 'string' ? input.location : JSON.stringify(input.location))
      : null;

    const result = await db
      .insertInto('equipment')
      .values({
        dealer_id: dealerId,
        name: input.name,
        category: input.category,
        description: input.description ?? null,
        rental_rate_per_day: input.rental_rate_per_day ?? null,
        weekly_rate: null,
        monthly_rate: null,
        location: locationValue ?? null,
        available: input.available ?? true,
        images: input.images ?? [],
        features: input.operator_included ? ['operator_included'] : [],
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  },

  /**
   * List equipment with pagination and filters
   * @witness [ED-001]
   */
  async listEquipment(filters: ListEquipmentFilters): Promise<ListEquipmentResult> {
    const page = filters.page ?? 1;
    const pageSize = Math.min(filters.page_size ?? 20, 50);
    const offset = (page - 1) * pageSize;

    let query = db
      .selectFrom('equipment')
      .selectAll();

    if (filters.dealer_id) {
      query = query.where('dealer_id', '=', filters.dealer_id);
    }

    query = query.where('deleted_at', 'is', null);

    if (filters.available_only) {
      query = query.where('available', '=', true);
    }

    const items = await query
      .orderBy('created_at', 'desc')
      .limit(pageSize)
      .offset(offset)
      .execute();

    let countQuery = db
      .selectFrom('equipment')
      .select((eb) => eb.fn.countAll().as('count'));

    if (filters.dealer_id) {
      countQuery = countQuery.where('dealer_id', '=', filters.dealer_id);
    }

    if (filters.available_only) {
      countQuery = countQuery.where('available', '=', true);
    }
    countQuery = countQuery.where('deleted_at', 'is', null);

    const countResult = await countQuery.executeTakeFirst();
    const totalCount = Number(countResult?.count ?? 0);
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      items,
      meta: {
        page,
        page_size: pageSize,
        total_count: totalCount,
        total_pages: totalPages,
      },
    };
  },

  /**
   * Get equipment by ID
   * @witness [ED-001]
   */
  async getEquipmentById(id: string) {
    const equipment = await db
      .selectFrom('equipment')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!equipment) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    return equipment;
  },

  /**
   * Update equipment details (owner only)
   * @witness [ED-001]
   */
  async updateEquipment(id: string, input: UpdateEquipmentInput, userId: string) {
    const equipment = await this.getEquipmentById(id);

    if (!equipment) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    if (equipment.dealer_id !== userId) {
      throw new Error('EQUIPMENT_UPDATE_NOT_OWNER');
    }

    const updates: Record<string, any> = {
      updated_at: new Date(),
    };

    if (input.name !== undefined) updates.name = input.name;
    if (input.description !== undefined) updates.description = input.description;
    if (input.rental_rate_per_day !== undefined) updates.rental_rate_per_day = input.rental_rate_per_day;
    if (input.available !== undefined) updates.available = input.available;
    if (input.images !== undefined) updates.images = input.images;

    if (input.location !== undefined) {
      updates.location = typeof input.location === 'string'
        ? input.location
        : JSON.stringify(input.location);
    }

    if (input.operator_included !== undefined) {
      updates.features = input.operator_included ? ['operator_included'] : [];
    }

    const result = await db
      .updateTable('equipment')
      .set(updates)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  },

  /**
   * Soft-delete equipment (set deleted_at)
   * @witness [ED-001]
   */
  async deleteEquipment(id: string, userId: string) {
    const equipment = await this.getEquipmentById(id);

    if (!equipment) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    if (equipment.dealer_id !== userId) {
      throw new Error('EQUIPMENT_DELETE_NOT_OWNER');
    }

    await db
      .updateTable('equipment')
      .set({ deleted_at: new Date(), updated_at: new Date() })
      .where('id', '=', id)
      .execute();

    return { deleted: true, equipment_id: id };
  },
};
