import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    const connection = await db
      .selectFrom('connections')
      .selectAll()
      .where('id', '=', id)
      .where((eb) => eb.or([
        eb('requester_id', '=', user.id),
        eb('target_id', '=', user.id),
      ]))
      .executeTakeFirst();

    if (!connection) {
      return NextResponse.json(
        { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Connection not found' } },
        { status: 404 }
      );
    }

    const otherProfileId = connection.requester_id === user.id
      ? connection.target_id
      : connection.requester_id;

    const otherProfile = await db
      .selectFrom('profiles')
      .select([
        'id',
        'org_name',
        'persona_type',
        'city',
        'phone_primary',
        'email_business',
        'linkedin_url',
      ])
      .where('id', '=', otherProfileId)
      .executeTakeFirst();

    const result = {
      ...connection,
      other_party_id: otherProfileId,
      requester_name: otherProfile?.org_name ?? null,
      requester_persona_type: otherProfile?.persona_type ?? null,
      requester_city: otherProfile?.city ?? null,
      phone: connection.status === 'ACCEPTED' ? otherProfile?.phone_primary ?? null : null,
      email: connection.status === 'ACCEPTED' ? otherProfile?.email_business ?? null : null,
      linkedin_url: otherProfile?.linkedin_url ?? null,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }

    console.error('Error fetching connection:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch connection' } },
      { status: 500 }
    );
  }
}
