// @witness [AD-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { adsService } from '@/lib/services/ads';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth(request);
    const body = await request.json();

    if (!body.reason) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'Missing required field: reason' } },
        { status: 400 }
      );
    }

    const result = await adsService.requestRefund(id, body.reason, user.id);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }

    const message = error instanceof Error ? error.message : '';

    if (message === 'RESOURCE_NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Ad not found' } },
        { status: 404 }
      );
    }

    if (message === 'ADS_REFUND_NOT_SUSPENDED') {
      return NextResponse.json(
        { success: false, error: { code: 'ADS_REFUND_NOT_SUSPENDED', message: 'Refund can only be requested for suspended ads' } },
        { status: 400 }
      );
    }

    if (message === 'ADS_REFUND_NOT_OWNER') {
      return NextResponse.json(
        { success: false, error: { code: 'ADS_REFUND_NOT_OWNER', message: 'You do not own this ad' } },
        { status: 403 }
      );
    }

    if (message === 'ADS_REFUND_ALREADY_REQUESTED') {
      return NextResponse.json(
        { success: false, error: { code: 'ADS_REFUND_ALREADY_REQUESTED', message: 'A refund request already exists for this ad' } },
        { status: 409 }
      );
    }

    console.error('Error requesting ad refund:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to request refund' } },
      { status: 500 }
    );
  }
}
