// @witness [UI-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);

    const invoices = await db
      .selectFrom('invoices')
      .select(['id', 'amount', 'status', 'generated_at'])
      .where('profile_id', '=', user.id)
      .orderBy('generated_at', 'desc')
      .limit(50)
      .execute();

    return NextResponse.json({ success: true, data: invoices });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch invoices' } },
      { status: 500 }
    );
  }
}
