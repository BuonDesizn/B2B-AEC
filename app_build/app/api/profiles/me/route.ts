// @witness [ID-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);

    const profile = await db
      .selectFrom('profiles')
      .selectAll()
      .where('id', '=', user.id)
      .executeTakeFirst();

    if (!profile) {
      return NextResponse.json(
        { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Profile not found' } },
        { status: 404 }
      );
    }

    let roleExtension = null;
    const personaType = profile.persona_type;

    if (personaType === 'PP') {
      roleExtension = await db
        .selectFrom('project_professionals')
        .selectAll()
        .where('profile_id', '=', user.id)
        .executeTakeFirst();
    } else if (personaType === 'C') {
      roleExtension = await db
        .selectFrom('consultants')
        .selectAll()
        .where('profile_id', '=', user.id)
        .executeTakeFirst();
    } else if (personaType === 'CON') {
      roleExtension = await db
        .selectFrom('contractors')
        .selectAll()
        .where('profile_id', '=', user.id)
        .executeTakeFirst();
    } else if (personaType === 'PS') {
      roleExtension = await db
        .selectFrom('product_sellers')
        .selectAll()
        .where('profile_id', '=', user.id)
        .executeTakeFirst();
    } else if (personaType === 'ED') {
      roleExtension = await db
        .selectFrom('equipment_dealers')
        .selectAll()
        .where('profile_id', '=', user.id)
        .executeTakeFirst();
    }

    return NextResponse.json({
      success: true,
      data: {
        ...profile,
        role_extension: roleExtension,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch profile' } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    const { id, email, persona_type, role_extension, ...updateData } = body;

    const profile = await db
      .updateTable('profiles')
      .set({ ...updateData, updated_at: new Date() })
      .where('id', '=', user.id)
      .returningAll()
      .executeTakeFirstOrThrow();

    if (role_extension && persona_type) {
      if (persona_type === 'PP') {
        await db
          .insertInto('project_professionals')
          .values({ profile_id: user.id, ...role_extension })
          .onConflict(oc => oc.column('profile_id').doUpdateSet({ ...role_extension, updated_at: new Date() }))
          .execute();
      } else if (persona_type === 'C') {
        await db
          .insertInto('consultants')
          .values({ profile_id: user.id, ...role_extension })
          .onConflict(oc => oc.column('profile_id').doUpdateSet({ ...role_extension, updated_at: new Date() }))
          .execute();
      } else if (persona_type === 'CON') {
        await db
          .insertInto('contractors')
          .values({ profile_id: user.id, ...role_extension })
          .onConflict(oc => oc.column('profile_id').doUpdateSet({ ...role_extension, updated_at: new Date() }))
          .execute();
      } else if (persona_type === 'PS') {
        await db
          .insertInto('product_sellers')
          .values({ profile_id: user.id, ...role_extension })
          .onConflict(oc => oc.column('profile_id').doUpdateSet({ ...role_extension, updated_at: new Date() }))
          .execute();
      } else if (persona_type === 'ED') {
        await db
          .insertInto('equipment_dealers')
          .values({ profile_id: user.id, ...role_extension })
          .onConflict(oc => oc.column('profile_id').doUpdateSet({ ...role_extension, updated_at: new Date() }))
          .execute();
      }
    }

    let roleExtension = null;
    const finalPersonaType = persona_type || profile.persona_type;

    if (finalPersonaType === 'PP') {
      roleExtension = await db
        .selectFrom('project_professionals')
        .selectAll()
        .where('profile_id', '=', user.id)
        .executeTakeFirst();
    } else if (finalPersonaType === 'C') {
      roleExtension = await db
        .selectFrom('consultants')
        .selectAll()
        .where('profile_id', '=', user.id)
        .executeTakeFirst();
    } else if (finalPersonaType === 'CON') {
      roleExtension = await db
        .selectFrom('contractors')
        .selectAll()
        .where('profile_id', '=', user.id)
        .executeTakeFirst();
    } else if (finalPersonaType === 'PS') {
      roleExtension = await db
        .selectFrom('product_sellers')
        .selectAll()
        .where('profile_id', '=', user.id)
        .executeTakeFirst();
    } else if (finalPersonaType === 'ED') {
      roleExtension = await db
        .selectFrom('equipment_dealers')
        .selectAll()
        .where('profile_id', '=', user.id)
        .executeTakeFirst();
    }

    return NextResponse.json({
      success: true,
      data: {
        ...profile,
        role_extension: roleExtension,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_FAILED', message: (error as Error).message } },
      { status: 400 }
    );
  }
}
