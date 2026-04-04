// @witness [ID-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const adminProfile = await db.selectFrom('profiles').select('role').where('id', '=', user.id).executeTakeFirst();
    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 });
    }

    const pending = await db
      .selectFrom('profiles')
      .select(['id', 'org_name', 'pan', 'gstin', 'persona_type', 'created_at'])
      .where('verification_status', '=', 'PENDING_ADMIN')
      .orderBy('created_at', 'asc')
      .execute();

    return NextResponse.json({ success: true, data: pending });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
    console.error('Error fetching pending identities:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch pending identities' } }, { status: 500 });
  }
}
