// @witness [RFP-001]
import { NextResponse } from 'next/server';

import { verifyQStashSignature } from '@/lib/jobs';
import { rfpService } from '@/lib/services/rfp';

/**
 * QStash scheduled job: Expire RFPs past their expiry date
 * Runs every hour
 */
export async function POST(request: Request) {
  try {
    if (!(await verifyQStashSignature(request))) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_MISSING', message: 'Invalid QStash signature' } },
        { status: 401 }
      );
    }

    const result = await rfpService.expireRfps();

    return NextResponse.json({
      success: true,
      data: { message: 'RFP expiry check complete', expired_count: result.length },
    });
  } catch (error) {
    console.error('RFP expiry check failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'RFP expiry check failed' } },
      { status: 500 }
    );
  }
}
