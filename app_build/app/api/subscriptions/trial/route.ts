// @witness [MON-001]
import { NextResponse } from 'next/server';

import { requireAuth, AuthError } from '@/lib/auth';
import { subscriptionService } from '@/lib/services/subscription';

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);

    const subscription = await subscriptionService.createTrial({
      profile_id: user.id,
    });

    return NextResponse.json({ success: true, data: subscription }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Failed to create trial:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: (error as Error).message } },
      { status: 400 }
    );
  }
}
