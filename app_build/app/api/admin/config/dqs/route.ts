// @witness [RM-001]
import { NextResponse } from 'next/server';

import { requireAdmin, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const _user = await requireAdmin(request);

    const config = await db.selectFrom('system_config').select('value').where('key', '=', 'dqs_config').executeTakeFirst();
    return NextResponse.json({ success: true, data: config ? config.value : { quality_weight: 0.7, distance_weight: 0.3 } });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch DQS config' } }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const _user = await requireAdmin(request);

    const body = await request.json();
    const result = await db
      .insertInto('system_config')
      .values({ key: 'dqs_config', value: { quality_weight: body.quality_weight, distance_weight: body.distance_weight }, updated_at: new Date() })
      .onConflict((oc) => oc.column('key').doUpdateSet({ value: { quality_weight: body.quality_weight, distance_weight: body.distance_weight }, updated_at: new Date() }))
      .returningAll()
      .executeTakeFirstOrThrow();

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update DQS config' } }, { status: 500 });
  }
}
