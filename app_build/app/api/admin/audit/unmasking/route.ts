// @witness [HD-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const adminProfile = await db.selectFrom('profiles').select('role').where('id', '=', user.id).executeTakeFirst();
    if (adminProfile?.role !== 'admin') return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 });

    const logs = await db
      .selectFrom('unmasking_audit')
      .selectAll()
      .orderBy('unmasked_at', 'desc')
      .limit(100)
      .execute();

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch unmasking audit' } }, { status: 500 });
  }
}
