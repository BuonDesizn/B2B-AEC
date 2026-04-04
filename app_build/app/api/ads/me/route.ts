// @witness [AD-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);

    const ads = await db
      .selectFrom('ads')
      .selectAll()
      .where('profile_id', '=', user.id)
      .orderBy('created_at', 'desc')
      .execute();

    return NextResponse.json({ success: true, data: ads });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Error fetching ads:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch ads' } },
      { status: 500 }
    );
  }
}
