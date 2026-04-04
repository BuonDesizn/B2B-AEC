// @witness [MON-001]
import { NextResponse } from 'next/server';

import { requireAuth, AuthError } from '@/lib/auth';
import { subscriptionService } from '@/lib/services/subscription';

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    if (!body.payment_id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'payment_id is required' } },
        { status: 400 }
      );
    }

    const result = await subscriptionService.activate(user.id, body.payment_id);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Failed to activate subscription:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: (error as Error).message } },
      { status: 400 }
    );
  }
}
