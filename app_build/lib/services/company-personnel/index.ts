// @witness [ID-001]
import { db } from '@/lib/db';

// =============================================================================
// Input Types
// =============================================================================

export interface CreatePersonnelInput {
  full_name: string;
  designation: string;
  qualification?: string;
  specialty?: string[];
  experience_years?: number;
  email?: string;
  phone?: string;
  detailed_bio?: string;
}

export interface UpdatePersonnelInput {
  full_name?: string;
  designation?: string;
  qualification?: string;
  specialty?: string[];
  experience_years?: number;
  email?: string;
  phone?: string;
  detailed_bio?: string;
  profile_image_url?: string;
  linkedin_url?: string;
}

export interface ListPersonnelFilters {
  include_deleted?: boolean;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

export interface BulkPersonnelInput {
  personnel: CreatePersonnelInput[];
}

// =============================================================================
// Personnel Service
// =============================================================================

export const personnelService = {
  /**
   * List personnel under caller's GSTIN
   * @witness [ID-001]
   */
  async listPersonnel(gstin: string, filters: ListPersonnelFilters = {}) {
    let query = db
      .selectFrom('company_personnel')
      .selectAll()
      .where('company_gstin', '=', gstin);

    if (!filters.include_deleted) {
      query = query.where('is_active', '=', true);
    }

    query = query.orderBy('created_at', 'desc');

    const page = filters.page ?? 1;
    const pageSize = Math.min(filters.page_size ?? 20, 50);
    const offset = (page - 1) * pageSize;

    const items = await query
      .limit(pageSize)
      .offset(offset)
      .execute();

    const countResult = await db
      .selectFrom('company_personnel')
      .select(db.fn.count('id').as('count'))
      .where('company_gstin', '=', gstin)
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
   * Get single personnel record by ID
   * @witness [ID-001]
   */
  async getPersonnelById(id: string, userId: string) {
    const personnel = await db
      .selectFrom('company_personnel')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!personnel) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    if (personnel.profile_id !== userId) {
      const hasAccess = await db
        .selectFrom('connections')
        .innerJoin('profiles as p1', 'p1.id', 'connections.requester_id')
        .innerJoin('profiles as p2', 'p2.id', 'connections.target_id')
        .select('connections.id')
        .where('connections.status', '=', 'ACCEPTED')
        .where((eb) => eb.or([
          eb('connections.requester_id', '=', userId),
          eb('connections.target_id', '=', userId),
        ]))
        .where((eb) => eb.or([
          eb('p1.gstin', '=', personnel.company_gstin),
          eb('p2.gstin', '=', personnel.company_gstin),
        ]))
        .executeTakeFirst();

      if (!hasAccess) {
        throw new Error('AUTH_INSUFFICIENT_ROLE');
      }
    }

    return personnel;
  },

  /**
   * Create personnel record
   * @witness [ID-001]
   */
  async createPersonnel(profileId: string, input: CreatePersonnelInput) {
    const profile = await db
      .selectFrom('profiles')
      .select(['id', 'gstin', 'verification_status'])
      .where('id', '=', profileId)
      .executeTakeFirst();

    if (!profile) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    if (!profile.gstin || profile.verification_status !== 'VERIFIED') {
      throw new Error('VALIDATION_FAILED');
    }

    const result = await db
      .insertInto('company_personnel')
      .values({
        profile_id: profileId,
        company_gstin: profile.gstin,
        full_name: input.full_name,
        designation: input.designation,
        qualification: input.qualification ?? null,
        specialty: input.specialty ?? [],
        experience_years: input.experience_years ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        detailed_bio: input.detailed_bio ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  },

  /**
   * Update personnel record
   * @witness [ID-001]
   */
  async updatePersonnel(id: string, input: UpdatePersonnelInput, userId: string) {
    const personnel = await db
      .selectFrom('company_personnel')
      .select(['id', 'profile_id', 'company_gstin'])
      .where('id', '=', id)
      .executeTakeFirst();

    if (!personnel) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    if (personnel.profile_id !== userId) {
      const adminCheck = await db
        .selectFrom('profiles')
        .select('id')
        .where('id', '=', userId)
        .where('gstin', '=', personnel.company_gstin)
        .where('verification_status', '=', 'VERIFIED')
        .executeTakeFirst();

      if (!adminCheck) {
        throw new Error('AUTH_INSUFFICIENT_ROLE');
      }
    }

    const updateData: Record<string, any> = {};

    if (input.full_name !== undefined) updateData.full_name = input.full_name;
    if (input.designation !== undefined) updateData.designation = input.designation;
    if (input.qualification !== undefined) updateData.qualification = input.qualification;
    if (input.specialty !== undefined) updateData.specialty = input.specialty;
    if (input.experience_years !== undefined) updateData.experience_years = input.experience_years;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.detailed_bio !== undefined) updateData.detailed_bio = input.detailed_bio;
    if (input.profile_image_url !== undefined) updateData.profile_image_url = input.profile_image_url;
    if (input.linkedin_url !== undefined) updateData.linkedin_url = input.linkedin_url;

    if (Object.keys(updateData).length === 0) {
      throw new Error('VALIDATION_FAILED');
    }

    updateData.updated_at = new Date();

    const result = await db
      .updateTable('company_personnel')
      .set(updateData)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  },

  /**
   * Bulk create personnel records
   * @witness [ID-001]
   */
  async bulkCreatePersonnel(profileId: string, inputs: CreatePersonnelInput[]) {
    if (!inputs || inputs.length === 0) {
      throw new Error('VALIDATION_FAILED');
    }

    if (inputs.length > 50) {
      throw new Error('VALIDATION_FAILED');
    }

    const profile = await db
      .selectFrom('profiles')
      .select(['id', 'gstin', 'verification_status'])
      .where('id', '=', profileId)
      .executeTakeFirst();

    if (!profile) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    if (!profile.gstin || profile.verification_status !== 'VERIFIED') {
      throw new Error('VALIDATION_FAILED');
    }

    const companyGstin = profile.gstin;
    if (!companyGstin) {
      throw new Error('VALIDATION_FAILED');
    }

    const values = inputs.map((input) => ({
      profile_id: profileId,
      company_gstin: companyGstin,
      full_name: input.full_name,
      designation: input.designation,
      qualification: input.qualification ?? null,
      specialty: input.specialty ?? [],
      experience_years: input.experience_years ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      detailed_bio: input.detailed_bio ?? null,
    }));

    const results = await db
      .insertInto('company_personnel')
      .values(values)
      .returningAll()
      .execute();

    return {
      created: results.length,
      items: results,
    };
  },

  /**
   * Soft-delete personnel (sets is_active to false)
   * @witness [ID-001]
   */
  async deletePersonnel(id: string, userId: string) {
    const personnel = await db
      .selectFrom('company_personnel')
      .select(['id', 'profile_id', 'company_gstin'])
      .where('id', '=', id)
      .executeTakeFirst();

    if (!personnel) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    if (personnel.profile_id !== userId) {
      const adminCheck = await db
        .selectFrom('profiles')
        .select('id')
        .where('id', '=', userId)
        .where('gstin', '=', personnel.company_gstin)
        .where('verification_status', '=', 'VERIFIED')
        .executeTakeFirst();

      if (!adminCheck) {
        throw new Error('AUTH_INSUFFICIENT_ROLE');
      }
    }

    const result = await db
      .updateTable('company_personnel')
      .set({
        is_active: false,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  },
};
