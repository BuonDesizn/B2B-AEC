// @witness [MON-001]
import { NextResponse } from 'next/server';

import { requireAuth, AuthError } from '@/lib/auth';
import { subscriptionService } from '@/lib/services/subscription';

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const limits = await subscriptionService.getRateLimits(user.id);
    return NextResponse.json({ success: true, data: limits });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Failed to get rate limits:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: (error as Error).message } },
      { status: 400 }
    );
  }
}
