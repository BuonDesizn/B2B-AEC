// @witness [MON-001]
import { NextResponse } from 'next/server';

import { requireAdmin, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const _user = await requireAdmin(request);

    const payments = await db
      .selectFrom('invoices')
      .selectAll()
      .orderBy('generated_at', 'desc')
      .limit(100)
      .execute();

    return NextResponse.json({ success: true, data: payments });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch payments' } }, { status: 500 });
  }
}
