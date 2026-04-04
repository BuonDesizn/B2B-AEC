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
    const body = await request.json();

    if (!body.proposal) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'Missing required field: proposal' } },
        { status: 400 }
      );
    }

    const response = await rfpService.submitResponse({
      rfp_id: params.id,
      responder_id: user.id,
      proposal: body.proposal,
      estimated_cost: body.estimated_cost,
      estimated_days: body.estimated_days,
    });

    return NextResponse.json({ success: true, data: response }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Error submitting response:', error);
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_FAILED', message: (error as Error).message } },
      { status: 400 }
    );
  }
}
