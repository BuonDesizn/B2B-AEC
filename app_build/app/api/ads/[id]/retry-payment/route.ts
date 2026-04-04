// @witness [AD-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { adsService } from '@/lib/services/ads';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth(_request);

    const result = await adsService.retryPayment(id, user.id);

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

    if (message === 'ADS_PAYMENT_RETRY_INVALID_STATE') {
      return NextResponse.json(
        { success: false, error: { code: 'ADS_PAYMENT_RETRY_INVALID_STATE', message: 'Ad not in DRAFT or PENDING_PAYMENT state' } },
        { status: 400 }
      );
    }

    if (message === 'ADS_PAYMENT_NOT_OWNER') {
      return NextResponse.json(
        { success: false, error: { code: 'ADS_PAYMENT_NOT_OWNER', message: 'You do not own this ad' } },
        { status: 403 }
      );
    }

    console.error('Error retrying ad payment:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to retry payment' } },
      { status: 500 }
    );
  }
}
