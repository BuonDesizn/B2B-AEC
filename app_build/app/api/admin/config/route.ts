// @witness [UI-001]
import { NextResponse } from 'next/server';

import { requireAdmin, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const _user = await requireAdmin(request);

    const config = await db.selectFrom('system_config').selectAll().where('key', 'like', 'general.%').execute();
    return NextResponse.json({ success: true, data: Object.fromEntries(config.map(c => [c.key, c.value])) });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch config' } }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const _user = await requireAdmin(request);

    const body = await request.json();
    const updates = Object.entries(body).map(([key, value]) => ({ key, value: value as any, updated_at: new Date() }));

    for (const update of updates) {
      await db
        .insertInto('system_config')
        .values(update)
        .onConflict((oc) => oc.column('key').doUpdateSet({ value: update.value, updated_at: new Date() }))
        .execute();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update config' } }, { status: 500 });
  }
}
