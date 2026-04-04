// @witness [MOD-001]
import { NextResponse } from 'next/server';

import { requireAdmin, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const _user = await requireAdmin(request);

    const purgeStats = await db
      .selectFrom('system_audit_log')
      .select((eb) => eb.fn.count('id').as('count'))
      .where('created_at', '<', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
      .executeTakeFirstOrThrow();

    return NextResponse.json({ success: true, data: { purgeable_count: Number(purgeStats.count), retention_days: 90 } });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch purge stats' } }, { status: 500 });
  }
}
