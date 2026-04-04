// @witness [MON-001]
import { NextResponse } from 'next/server';
import { verifyQStashSignature } from '@/lib/jobs';
import { subscriptionService } from '@/lib/services/subscription';

/**
 * QStash scheduled job: Reset monthly credits for active subscriptions
 * Runs monthly on the 1st
 */
export async function POST(request: Request) {
  try {
    if (!verifyQStashSignature(request)) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_MISSING', message: 'Invalid QStash signature' } },
        { status: 401 }
      );
    }

    const result = await subscriptionService.resetMonthlyCredits();

    return NextResponse.json({
      success: true,
      data: { message: 'Monthly credit reset complete', reset_count: result.reset_count },
    });
  } catch (error) {
    console.error('Monthly credit reset failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Monthly credit reset failed' } },
      { status: 500 }
    );
  }
}
