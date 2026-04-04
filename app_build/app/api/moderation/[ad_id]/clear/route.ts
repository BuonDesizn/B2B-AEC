// @witness [MOD-001]
import { NextResponse } from 'next/server';

import { requireAdmin, AuthError } from '@/lib/auth';
import { moderationService } from '@/lib/services/moderation';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ad_id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { ad_id } = await params;

    const result = await moderationService.clearAd(ad_id, admin.id);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Failed to clear ad:', error);
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_FAILED', message: (error as Error).message } },
      { status: 400 }
    );
  }
}
