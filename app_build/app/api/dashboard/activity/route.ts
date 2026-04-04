// @witness [UI-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '10', 10);

    const activity = await db
      .selectFrom('connections')
      .select(['id', 'status', 'initiated_at', 'requester_id', 'target_id'])
      .where((eb) => eb.or([eb('requester_id', '=', user.id), eb('target_id', '=', user.id)]))
      .orderBy('initiated_at', 'desc')
      .limit(limit)
      .execute();

    return NextResponse.json({ success: true, data: activity });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch activity' } },
      { status: 500 }
    );
  }
}
