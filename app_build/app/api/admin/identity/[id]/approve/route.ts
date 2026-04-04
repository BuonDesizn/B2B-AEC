// @witness [ID-001]
import { NextResponse } from 'next/server';

import { requireAdmin, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const _user = await requireAdmin(request);
    const { id } = await params;

    await db.updateTable('profiles').set({ verification_status: 'VERIFIED' }).where('id', '=', id).execute();
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to approve' } }, { status: 500 });
  }
}
