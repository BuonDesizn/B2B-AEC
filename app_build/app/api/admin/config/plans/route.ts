// @witness [MON-001]
import { NextResponse } from 'next/server';

import { requireAdmin, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const _user = await requireAdmin(request);

    const plans = await db.selectFrom('subscription_plans').selectAll().orderBy('price_monthly', 'asc').execute();
    return NextResponse.json({ success: true, data: plans });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch plans' } }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const _user = await requireAdmin(request);

    const body = await request.json();
    const result = await db
      .updateTable('subscription_plans')
      .set(body)
      .where('id', '=', body.id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update plan' } }, { status: 500 });
  }
}
