// @witness [MON-001]
import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/services/payments';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('X-VERIFY');

    if (!signature) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'X-VERIFY header is required',
          },
        },
        { status: 400 }
      );
    }

    const result = await paymentService.handleCallback(body, signature);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error.message === 'Invalid webhook signature') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Invalid webhook signature',
          },
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message || 'Internal server error' },
      },
      { status: 500 }
    );
  }
}
