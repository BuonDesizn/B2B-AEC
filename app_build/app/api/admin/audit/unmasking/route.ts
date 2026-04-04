// @witness [HD-001]
import { NextResponse } from 'next/server';

import { requireAdmin, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const _user = await requireAdmin(request);

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
