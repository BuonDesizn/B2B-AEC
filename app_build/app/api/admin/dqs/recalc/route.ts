// @witness [RM-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const adminProfile = await db.selectFrom('profiles').select('role').where('id', '=', user.id).executeTakeFirst();
    if (adminProfile?.role !== 'admin') return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 });

    await db
      .updateTable('profiles')
      .set((eb) => ({
        dqs_score: eb('dqs_score', '+', 0),
      }))
      .execute();

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to trigger DQS recalc' } }, { status: 500 });
  }
}
