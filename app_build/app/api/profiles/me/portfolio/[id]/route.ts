// @witness [RM-001]
import { NextResponse } from 'next/server';

import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    await db
      .deleteFrom('portfolio_items')
      .where('id', '=', id)
      .where('profile_id', '=', user.id)
      .execute();

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Error deleting portfolio item:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete portfolio item' } },
      { status: 500 }
    );
  }
}
