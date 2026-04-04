// @witness [MOD-001]
import { NextResponse } from 'next/server';

import { requireAdmin, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const _user = await requireAdmin(request);

    const history = await db
      .selectFrom('system_audit_log')
      .select(['id', 'actor_id', 'action', 'target_type', 'target_id', 'old_value', 'new_value', 'created_at'])
      .where('target_type', 'in', ['ads', 'profiles', 'rfps'])
      .orderBy('created_at', 'desc')
      .limit(100)
      .execute();

    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch moderation history' } }, { status: 500 });
  }
}
