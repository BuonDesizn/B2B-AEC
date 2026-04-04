// @witness [MON-001]
import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth';
import { paymentService } from '@/lib/services/payments';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const body = await request.json();
    const { plan_name } = body;

    if (!plan_name) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'plan_name is required',
          },
        },
        { status: 400 }
      );
    }

    const result = await paymentService.initPayment(user.id, plan_name);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'AUTH_MISSING', message: 'Authentication required' },
        },
        { status: 401 }
      );
    }

    if (error.message === 'Subscription already active') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SUBSCRIPTION_UPGRADE_ALREADY_ACTIVE',
            message: 'Subscription already active',
          },
        },
        { status: 409 }
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
