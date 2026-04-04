// @witness [ID-001]
import { NextResponse } from 'next/server';

import { requireAdmin, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const _user = await requireAdmin(request);
    const { id } = await params;

    const profile = await db.selectFrom('profiles').selectAll().where('id', '=', id).executeTakeFirst();
    if (!profile) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } }, { status: 404 });

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch user' } }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const _user = await requireAdmin(request);
    const { id } = await params;

    const body = await request.json();
    const allowed = ['verification_status', 'org_name', 'subscription_status'] as const;
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_FAILED', message: 'No valid fields to update' } }, { status: 400 });
    }
    const result = await db.updateTable('profiles').set(update).where('id', '=', id).returningAll().executeTakeFirstOrThrow();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update user' } }, { status: 500 });
  }
}
