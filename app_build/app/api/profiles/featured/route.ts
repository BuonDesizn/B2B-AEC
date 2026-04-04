// @witness [UI-001]
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const totalProfilesResult = await db
      .selectFrom('profiles')
      .select((eb) => eb.fn.count('id').as('total'))
      .executeTakeFirstOrThrow();

    const totalConnectionsResult = await db
      .selectFrom('connections')
      .select((eb) => eb.fn.count('id').as('total'))
      .where('status', '=', 'ACCEPTED')
      .executeTakeFirstOrThrow();

    const roleCounts = await db
      .selectFrom('profiles')
      .select(['persona_type', db.fn.count('id').as('count')])
      .groupBy('persona_type')
      .execute();

    return NextResponse.json({
      success: true,
      data: {
        total_profiles: Number(totalProfilesResult.total),
        total_connections: Number(totalConnectionsResult.total),
        role_distribution: Object.fromEntries(roleCounts.map(r => [r.persona_type, Number(r.count)])),
      },
    });
  } catch (error) {
    console.error('Error fetching featured profiles:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch featured profiles' } },
      { status: 500 }
    );
  }
}
