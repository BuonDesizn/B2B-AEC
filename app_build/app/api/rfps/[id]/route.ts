// @witness [RFP-001]
import { NextResponse } from 'next/server';

import { requireAuth, AuthError } from '@/lib/auth';
import { rfpService } from '@/lib/services/rfp';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(_request);
    const rfp = await rfpService.getById(params.id);

    if (!rfp) {
      return NextResponse.json(
        { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'RFP not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: rfp });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Error fetching RFP:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch RFP' } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    const rfp = await rfpService.update(params.id, body, user.id);

    return NextResponse.json({ success: true, data: rfp });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Error updating RFP:', error);
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_FAILED', message: (error as Error).message } },
      { status: 400 }
    );
  }
}
