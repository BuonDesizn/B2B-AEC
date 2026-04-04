// @witness [RFP-001]
import { NextResponse } from 'next/server';

import { requireAuth, AuthError } from '@/lib/auth';
import { rfpService } from '@/lib/services/rfp';
import { broadcastRFP } from '@/lib/services/rfp/broadcast';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    const rfp = await rfpService.publish(params.id, user.id);

    // Broadcast to nearby professionals (non-blocking)
    broadcastRFP(params.id).catch((err) =>
      console.error(`RFP broadcast failed for ${params.id}:`, err)
    );

    return NextResponse.json({ success: true, data: rfp });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Error publishing RFP:', error);
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_FAILED', message: (error as Error).message } },
      { status: 400 }
    );
  }
}
