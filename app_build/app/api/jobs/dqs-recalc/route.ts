// @witness [RM-001]
import { NextResponse } from 'next/server';

import { verifyQStashSignature } from '@/lib/jobs';
import { discoveryService } from '@/lib/services/discovery';

/**
 * QStash scheduled job: Recalculate DQS for all profiles daily at 2 AM UTC
 */
export async function POST(request: Request) {
  try {
    if (!(await verifyQStashSignature(request))) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_MISSING', message: 'Invalid QStash signature' } },
        { status: 401 }
      );
    }

    await discoveryService.recalculateAllDQS();

    return NextResponse.json({ success: true, data: { message: 'DQS recalculation complete' } });
  } catch (error) {
    console.error('DQS recalculation failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'DQS recalculation failed' } },
      { status: 500 }
    );
  }
}
