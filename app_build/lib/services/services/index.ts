// @witness [C-001]
import { db } from '@/lib/db';

export interface CreateServiceInput {
  title: string;
  description?: string;
  category: string;
  subcategory?: string;
  price_per_hour?: number;
  price_per_project?: number;
  delivery_time_days?: number;
  requires_site_visit?: boolean;
  images?: string[];
}

export interface UpdateServiceInput {
  title?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  price_per_hour?: number;
  price_per_project?: number;
  delivery_time_days?: number;
  requires_site_visit?: boolean;
  images?: string[];
}

export const servicesService = {
  async create(profileId: string, input: CreateServiceInput) {
    const profile = await db
      .selectFrom('profiles')
      .select('persona_type')
      .where('id', '=', profileId)
      .executeTakeFirst();

    if (!profile) throw new Error('RESOURCE_NOT_FOUND');
    if (profile.persona_type !== 'C') throw new Error('SERVICES_CREATE_NOT_CONSULTANT');

    const result = await db
      .insertInto('services')
      .values({
        profile_id: profileId,
        title: input.title,
        description: input.description ?? null,
        category: input.category,
        subcategory: input.subcategory ?? null,
        price_per_hour: input.price_per_hour ?? null,
        price_per_project: input.price_per_project ?? null,
        delivery_time_days: input.delivery_time_days ?? null,
        requires_site_visit: input.requires_site_visit ?? false,
        images: input.images ?? [],
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  },

  async listByProfile(profileId: string, activeOnly = true) {
    let query = db
      .selectFrom('services')
      .selectAll()
      .where('profile_id', '=', profileId);

    if (activeOnly) {
      query = query.where('is_active', '=', true);
    }

    return await query.orderBy('created_at', 'desc').execute();
  },

  async getById(id: string) {
    return await db
      .selectFrom('services')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  },

  async update(id: string, input: UpdateServiceInput, profileId: string) {
    const existing = await db
      .selectFrom('services')
      .select('profile_id')
      .where('id', '=', id)
      .executeTakeFirst();

    if (!existing) throw new Error('RESOURCE_NOT_FOUND');
    if (existing.profile_id !== profileId) throw new Error('AUTH_INSUFFICIENT_ROLE');

    return await db
      .updateTable('services')
      .set({ ...input, updated_at: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  async deactivate(id: string, profileId: string) {
    const existing = await db
      .selectFrom('services')
      .select('profile_id')
      .where('id', '=', id)
      .executeTakeFirst();

    if (!existing) throw new Error('RESOURCE_NOT_FOUND');
    if (existing.profile_id !== profileId) throw new Error('AUTH_INSUFFICIENT_ROLE');

    return await db
      .updateTable('services')
      .set({ is_active: false, updated_at: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  },
};
