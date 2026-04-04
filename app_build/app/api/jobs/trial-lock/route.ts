// @witness [MON-001]
import { NextResponse } from 'next/server';
import { verifyQStashSignature } from '@/lib/jobs';
import { subscriptionService } from '@/lib/services/subscription';

/**
 * QStash scheduled job: Lock expired trials (H+49)
 * Runs every hour
 */
export async function POST(request: Request) {
  try {
    if (!verifyQStashSignature(request)) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_MISSING', message: 'Invalid QStash signature' } },
        { status: 401 }
      );
    }

    const result = await subscriptionService.lockExpiredTrials();

    return NextResponse.json({
      success: true,
      data: { message: 'Trial lock check complete', locked_count: result.locked_count },
    });
  } catch (error) {
    console.error('Trial lock check failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Trial lock check failed' } },
      { status: 500 }
    );
  }
}
