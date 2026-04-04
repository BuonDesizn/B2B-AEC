// @witness [MOD-001]
import { NextResponse } from 'next/server';

import { requireAdmin, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const _user = await requireAdmin(request);

    const body = await request.json();
    const days = body.days || 90;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await db.deleteFrom('system_audit_log').where('created_at', '<', cutoffDate).executeTakeFirst();

    return NextResponse.json({ success: true, data: { deleted: Number(result.numDeletedRows) } });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to purge audit logs' } }, { status: 500 });
  }
}
