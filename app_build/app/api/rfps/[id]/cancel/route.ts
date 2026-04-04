// @witness [RFP-001]
import { NextResponse } from 'next/server';

import { requireAuth, AuthError } from '@/lib/auth';
import { rfpService } from '@/lib/services/rfp';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const rfp = await rfpService.cancel(params.id, user.id);
    return NextResponse.json({ success: true, data: rfp });
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
