// @witness [RFP-001]
import { NextResponse } from 'next/server';

import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string; responseId: string }> }) {
  try {
    const user = await requireAuth(request);
    const { id, responseId } = await params;

    const rfp = await db
      .selectFrom('rfps')
      .select(['id', 'creator_id'])
      .where('id', '=', id)
      .executeTakeFirst();

    if (!rfp) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'RFP not found' } },
        { status: 404 }
      );
    }

    const isCreator = rfp.creator_id === user.id;

    let query = db
      .selectFrom('rfp_responses')
      .selectAll()
      .where('id', '=', responseId)
      .where('rfp_id', '=', id);

    if (!isCreator) {
      query = query.where('responder_id', '=', user.id);
    }

    const response = await query.executeTakeFirst();

    if (!response) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Response not found' } },
        { status: 404 }
      );
    }

    let responderName = null;
    let responderPersona = null;
    if (response.responder_id) {
      const profile = await db
        .selectFrom('profiles')
        .select(['org_name', 'persona_type'])
        .where('id', '=', response.responder_id)
        .executeTakeFirst();
      if (profile) {
        responderName = profile.org_name;
        responderPersona = profile.persona_type;
      }
    }

    return NextResponse.json({ success: true, data: { ...response, responder_name: responderName, responder_persona: responderPersona } });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Error fetching RFP response:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch response' } },
      { status: 500 }
    );
  }
}
