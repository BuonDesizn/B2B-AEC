// @witness [MON-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { subscriptionService } from '@/lib/services/subscription';

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    if (!body.plan_name) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'plan_name is required' } },
        { status: 400 }
      );
    }

    const result = await subscriptionService.initiateUpgrade(user.id, body.plan_name);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_FAILED', message: (error as Error).message } },
      { status: 400 }
    );
  }
}
