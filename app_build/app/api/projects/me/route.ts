// @witness [RFP-001]
import { NextResponse } from 'next/server';

import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);

    const projects = await db
      .selectFrom('rfp_responses')
      .innerJoin('rfps', 'rfp_responses.rfp_id', 'rfps.id')
      .select(['rfps.id', 'rfps.title', 'rfps.status', 'rfps.created_at', 'rfp_responses.status as response_status'])
      .where('rfp_responses.responder_id', '=', user.id)
      .orderBy('rfps.created_at', 'desc')
      .execute();

    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch projects' } }, { status: 500 });
  }
}
