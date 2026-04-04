// @witness [MOD-001]
import { NextResponse } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/auth';
import { moderationService } from '@/lib/services/moderation';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'FLAGGED' | 'SUSPENDED' | null;

    const queue = await moderationService.getModerationQueue(status ?? undefined);

    return NextResponse.json({ success: true, data: queue });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Failed to get moderation queue:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get moderation queue' } },
      { status: 500 }
    );
  }
}
