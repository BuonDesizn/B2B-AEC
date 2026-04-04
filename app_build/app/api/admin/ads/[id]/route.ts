// @witness [AD-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const adminProfile = await db.selectFrom('profiles').select('role').where('id', '=', user.id).executeTakeFirst();
    if (adminProfile?.role !== 'admin') return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 });

    const ad = await db.selectFrom('ads').selectAll().where('id', '=', id).executeTakeFirst();
    if (!ad) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Ad not found' } }, { status: 404 });

    const creator = await db.selectFrom('profiles').select('org_name').where('id', '=', ad.profile_id).executeTakeFirst();

    return NextResponse.json({ success: true, data: { ...ad, creator_name: creator?.org_name } });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch ad' } }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const adminProfile = await db.selectFrom('profiles').select('role').where('id', '=', user.id).executeTakeFirst();
    if (adminProfile?.role !== 'admin') return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 });

    const body = await request.json();
    const result = await db.updateTable('ads').set(body).where('id', '=', id).returningAll().executeTakeFirstOrThrow();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update ad' } }, { status: 500 });
  }
}
