// @witness [ID-001]
import { NextResponse } from 'next/server';

import { requireAdmin, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const target = await db.selectFrom('profiles').select('verification_status').where('id', '=', id).executeTakeFirst();
    const restoreStatus = target?.verification_status === 'SUSPENDED' ? 'VERIFIED' : (target?.verification_status ?? 'VERIFIED');
    await db.updateTable('profiles').set({ verification_status: restoreStatus }).where('id', '=', id).execute();
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to reinstate user' } }, { status: 500 });
  }
}
