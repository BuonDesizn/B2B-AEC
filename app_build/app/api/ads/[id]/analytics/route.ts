// @witness [AD-001]
import { NextResponse } from 'next/server';

import { requireAuth, AuthError } from '@/lib/auth';
import { adsService } from '@/lib/services/ads';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);

    const filters = {
      event_type: searchParams.get('event_type') || undefined,
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      page: parseInt(searchParams.get('page') ?? '1', 10),
      page_size: parseInt(searchParams.get('page_size') ?? '20', 10),
    };

    const result = await adsService.getAnalytics(id, user.id, filters);

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

    if (message === 'ADS_ANALYTICS_NOT_OWNER') {
      return NextResponse.json(
        { success: false, error: { code: 'ADS_ANALYTICS_NOT_OWNER', message: 'You do not own this ad' } },
        { status: 403 }
      );
    }

    console.error('Error fetching ad analytics:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch ad analytics' } },
      { status: 500 }
    );
  }
}
