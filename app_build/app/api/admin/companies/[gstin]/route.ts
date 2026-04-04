// @witness [C-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ gstin: string }> }) {
  try {
    const user = await requireAuth(request);
    const { gstin } = await params;
    const adminProfile = await db.selectFrom('profiles').select('role').where('id', '=', user.id).executeTakeFirst();
    if (adminProfile?.role !== 'admin') return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 });

    const company = await db.selectFrom('profiles').selectAll().where('gstin', '=', gstin).executeTakeFirst();
    if (!company) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Company not found' } }, { status: 404 });

    const personnel = await db.selectFrom('company_personnel').selectAll().where('company_gstin', '=', gstin).execute();

    return NextResponse.json({ success: true, data: { company, personnel } });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch company' } }, { status: 500 });
  }
}
