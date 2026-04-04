// @witness [ID-001]
import { sql } from 'kysely';

import { GSTIN_REGEX, PAN_REGEX, SUBSCRIPTION_STATUS, MONTHLY_CREDITS } from '@/lib/constants';
import { db } from '@/lib/db';

// =============================================================================
// Verification State Machine
// =============================================================================

export type VerificationStatus = 'PENDING_VERIFICATION' | 'PENDING_ADMIN' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

const VERIFICATION_TRANSITIONS: Record<VerificationStatus, VerificationStatus[]> = {
  PENDING_VERIFICATION: ['PENDING_ADMIN', 'REJECTED'],
  PENDING_ADMIN: ['VERIFIED', 'REJECTED'],
  VERIFIED: ['SUSPENDED'],
  REJECTED: ['PENDING_ADMIN'],
  SUSPENDED: ['VERIFIED'],
};

export function canTransitionVerification(current: VerificationStatus, next: VerificationStatus): boolean {
  return VERIFICATION_TRANSITIONS[current]?.includes(next) ?? false;
}

// =============================================================================
// Input Types
// =============================================================================

export interface CreateProfileInput {
  persona_type: 'PP' | 'C' | 'CON' | 'PS' | 'ED';
  org_name: string;
  pan: string;
  location?: { lat: number; lng: number };
  gstin?: string;
}

export interface UpdateProfileInput {
  org_name?: string;
  tagline?: string;
  location?: { lat: number; lng: number };
  city?: string;
  state?: string;
  address_line1?: string;
  pincode?: string;
  phone_primary?: string;
  email_business?: string;
  linkedin_url?: string;
}

export interface SubmitVerificationInput {
  pan: string;
  gstin: string;
  org_name: string;
  establishment_year: number;
}

// =============================================================================
// Profile Service
// =============================================================================

export const profileService = {
  /**
   * Create a new profile
   * @witness [ID-001]
   */
  async createProfile(input: CreateProfileInput, userId: string, email: string) {
    if (input.persona_type !== 'PP' && !input.gstin) {
      throw new Error('IDENTITY_VERIFY_INVALID_GSTIN');
    }

    if (input.gstin && !GSTIN_REGEX.test(input.gstin)) {
      throw new Error('IDENTITY_VERIFY_INVALID_GSTIN');
    }

    const result = await db
      .insertInto('profiles')
      .values({
        id: userId,
        email,
        persona_type: input.persona_type,
        pan: input.pan,
        org_name: input.org_name,
        gstin: input.gstin ?? null,
        location: input.location
          ? sql`ST_SetSRID(ST_MakePoint(${input.location.lng}, ${input.location.lat}), 4326)`
          : null,
        verification_status: 'PENDING_VERIFICATION',
        subscription_status: SUBSCRIPTION_STATUS.TRIAL,
        handshake_credits: MONTHLY_CREDITS,
      })
      .returning(['id', 'persona_type', 'org_name', 'gstin', 'verification_status', 'subscription_status', 'handshake_credits', 'created_at'])
      .executeTakeFirstOrThrow();

    return result;
  },

  /**
   * Get profile by ID (masked if no connection)
   * @witness [ID-001]
   */
  async getProfileById(profileId: string, viewerId: string) {
    const profile = await db
      .selectFrom('profiles')
      .select([
        'profiles.id',
        'profiles.persona_type',
        'profiles.org_name',
        'profiles.city',
        'profiles.state',
        'profiles.verification_status',
        'profiles.dqs_score',
        'profiles.handshake_credits',
        'profiles.subscription_status',
      ])
      .where('profiles.id', '=', profileId)
      .where('profiles.deleted_at', 'is', null)
      .executeTakeFirst();

    if (!profile) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    const blockedCheck = await db
      .selectFrom('connections')
      .select('id')
      .where((eb) => eb.or([
        eb.and([
          eb('requester_id', '=', viewerId),
          eb('target_id', '=', profileId),
          eb('status', '=', 'BLOCKED'),
        ]),
        eb.and([
          eb('requester_id', '=', profileId),
          eb('target_id', '=', viewerId),
          eb('status', '=', 'BLOCKED'),
        ]),
      ]))
      .executeTakeFirst();

    if (blockedCheck) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    let contact: { email: string; phone_primary: string };

    if (viewerId === profileId) {
      const fullProfile = await db
        .selectFrom('profiles')
        .select(['email_business', 'phone_primary'])
        .where('id', '=', profileId)
        .executeTakeFirst();

      contact = {
        email: fullProfile?.email_business ?? '***@***',
        phone_primary: fullProfile?.phone_primary ?? '+91**********',
      };
    } else {
      try {
        const contactResult = await db
          .selectFrom('profiles')
          .select((eb) =>
            eb.fn('get_visible_contact_info', [
              eb.val(profileId),
              eb.val(viewerId),
            ]).as('contact')
          )
          .executeTakeFirst();

        if (contactResult?.contact) {
          const c = contactResult.contact as { email: string; phone: string };
          contact = {
            email: c.email ?? '***@***',
            phone_primary: c.phone ?? '+91**********',
          };
        } else {
          contact = { email: '***@***', phone_primary: '+91**********' };
        }
      } catch {
        contact = { email: '***@***', phone_primary: '+91**********' };
      }
    }

    const location = await db
      .selectFrom('profiles')
      .select((eb) =>
        sql<{ lat: number; lng: number }>`
          json_build_object(
            'lat', ST_Y(${eb.ref('profiles.location')}),
            'lng', ST_X(${eb.ref('profiles.location')})
          )
        `.as('location')
      )
      .where('profiles.id', '=', profileId)
      .executeTakeFirst();

    return {
      id: profile.id,
      persona_type: profile.persona_type,
      org_name: profile.org_name,
      location: location?.location ?? null,
      verification_status: profile.verification_status,
      dqs_score: profile.dqs_score,
      handshake_credits: profile.handshake_credits,
      subscription_status: profile.subscription_status,
      contact,
    };
  },

  /**
   * Update profile fields
   * @witness [ID-001]
   */
  async updateProfile(profileId: string, input: UpdateProfileInput, userId: string) {
    if (profileId !== userId) {
      throw new Error('AUTH_INSUFFICIENT_ROLE');
    }

    const existing = await db
      .selectFrom('profiles')
      .select(['id', 'gstin', 'pan'])
      .where('id', '=', profileId)
      .executeTakeFirst();

    if (!existing) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    const updateData: Record<string, any> = {};

    if (input.org_name !== undefined) updateData.org_name = input.org_name;
    if (input.tagline !== undefined) updateData.tagline = input.tagline;
    if (input.city !== undefined) updateData.city = input.city;
    if (input.state !== undefined) updateData.state = input.state;
    if (input.address_line1 !== undefined) updateData.address_line1 = input.address_line1;
    if (input.pincode !== undefined) updateData.pincode = input.pincode;
    if (input.phone_primary !== undefined) updateData.phone_primary = input.phone_primary;
    if (input.email_business !== undefined) updateData.email_business = input.email_business;
    if (input.linkedin_url !== undefined) updateData.linkedin_url = input.linkedin_url;

    if (input.location) {
      updateData.location = sql`ST_SetSRID(ST_MakePoint(${input.location.lng}, ${input.location.lat}), 4326)`;
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('VALIDATION_FAILED');
    }

    updateData.updated_at = new Date();

    const result = await db
      .updateTable('profiles')
      .set(updateData)
      .where('id', '=', profileId)
      .returning(['id', 'org_name', 'tagline', 'city', 'state', 'verification_status', 'updated_at'])
      .executeTakeFirstOrThrow();

    return result;
  },

  /**
   * Submit verification (PAN + GSTIN)
   * @witness [ID-001]
   */
  async submitVerification(profileId: string, input: SubmitVerificationInput) {
    if (!PAN_REGEX.test(input.pan)) {
      throw new Error('IDENTITY_VERIFY_INVALID_GSTIN');
    }

    if (!GSTIN_REGEX.test(input.gstin)) {
      throw new Error('IDENTITY_VERIFY_INVALID_GSTIN');
    }

    const profile = await db
      .selectFrom('profiles')
      .select(['id', 'pan', 'gstin', 'verification_status', 'persona_type'])
      .where('id', '=', profileId)
      .executeTakeFirst();

    if (!profile) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    const existingPan = await db
      .selectFrom('profiles')
      .select('id')
      .where('pan', '=', input.pan)
      .where('persona_type', '=', profile.persona_type)
      .where('id', '!=', profileId)
      .executeTakeFirst();

    if (existingPan) {
      throw new Error('IDENTITY_CREATE_DUPLICATE_PAN');
    }

    const existingGstin = await db
      .selectFrom('profiles')
      .select('id')
      .where('gstin', '=', input.gstin)
      .where('id', '!=', profileId)
      .executeTakeFirst();

    if (existingGstin) {
      throw new Error('IDENTITY_VERIFY_DUPLICATE_GSTIN');
    }

    const result = await db
      .updateTable('profiles')
      .set({
        pan: input.pan,
        gstin: input.gstin,
        org_name: input.org_name,
        establishment_year: input.establishment_year,
        verification_status: 'PENDING_ADMIN',
        updated_at: new Date(),
      })
      .where('id', '=', profileId)
      .returning(['id', 'verification_status', 'pan', 'gstin'])
      .executeTakeFirstOrThrow();

    return {
      profile_id: result.id,
      verification_status: result.verification_status,
      pan: result.pan ? result.pan.slice(0, 5) + '****' + result.pan.slice(-1) : null,
      gstin: result.gstin ? result.gstin.slice(0, 5) + '*****' + result.gstin.slice(-3) : null,
    };
  },

  /**
   * Admin verify profile
   * @witness [ID-001]
   */
  async adminVerifyProfile(profileId: string, action: 'approve' | 'reject', _adminId: string) {
    const profile = await db
      .selectFrom('profiles')
      .select(['id', 'verification_status'])
      .where('id', '=', profileId)
      .executeTakeFirst();

    if (!profile) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    const targetStatus = action === 'approve' ? 'VERIFIED' : 'REJECTED';

    if (!canTransitionVerification(profile.verification_status as VerificationStatus, targetStatus)) {
      throw new Error('VALIDATION_FAILED');
    }

    const result = await db
      .updateTable('profiles')
      .set({
        verification_status: targetStatus,
        updated_at: new Date(),
      })
      .where('id', '=', profileId)
      .returning(['id', 'verification_status'])
      .executeTakeFirstOrThrow();

    return result;
  },

  /**
   * Request GSTIN change
   * @witness [ID-001]
   */
  async requestGstinChange(profileId: string, newGstin: string, reason: string) {
    if (!GSTIN_REGEX.test(newGstin)) {
      throw new Error('IDENTITY_VERIFY_INVALID_GSTIN');
    }

    const profile = await db
      .selectFrom('profiles')
      .select(['id', 'gstin', 'verification_status'])
      .where('id', '=', profileId)
      .executeTakeFirst();

    if (!profile) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    if (profile.verification_status !== 'VERIFIED') {
      throw new Error('VALIDATION_FAILED');
    }

    const existingGstin = await db
      .selectFrom('profiles')
      .select('id')
      .where('gstin', '=', newGstin)
      .where('id', '!=', profileId)
      .executeTakeFirst();

    if (existingGstin) {
      throw new Error('IDENTITY_VERIFY_DUPLICATE_GSTIN');
    }

    const pendingRequest = await db
      .selectFrom('profiles')
      .select('id')
      .where('id', '=', profileId)
      .where('verification_status', '=', 'PENDING_ADMIN')
      .executeTakeFirst();

    if (pendingRequest) {
      throw new Error('IDENTITY_GSTIN_CHANGE_PENDING');
    }

    const result = await db
      .insertInto('system_audit_log')
      .values({
        actor_id: profileId,
        action: 'GSTIN_CHANGE_REQUEST',
        target_type: 'profile',
        target_id: profileId,
        new_value: { new_gstin: newGstin, reason },
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    return {
      request_id: result.id,
      status: 'PENDING_ADMIN',
    };
  },

  /**
   * Admin approve/reject GSTIN change
   * @witness [ID-001]
   */
  async approveGstinChange(requestId: string, action: 'approve' | 'reject', adminId: string, notes?: string) {
    const request = await db
      .selectFrom('system_audit_log')
      .selectAll()
      .where('id', '=', requestId)
      .where('action', '=', 'GSTIN_CHANGE_REQUEST')
      .executeTakeFirst();

    if (!request) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    const newValue = request.new_value as { new_gstin?: string } | null;

    if (!newValue?.new_gstin) {
      throw new Error('RESOURCE_NOT_FOUND');
    }

    if (action === 'approve') {
      await db
        .updateTable('profiles')
        .set({
          gstin: newValue.new_gstin,
          updated_at: new Date(),
        })
        .where('id', '=', request.target_id as string)
        .execute();
    }

    await db
      .updateTable('system_audit_log')
      .set({
        new_value: { ...newValue, action, notes, admin_id: adminId },
      })
      .where('id', '=', requestId)
      .execute();

    return {
      request_id: requestId,
      action,
      profile_id: request.target_id,
    };
  },
};
