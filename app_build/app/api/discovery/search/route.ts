// @witness [RM-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { discoveryService, SearchNearbyInput } from '@/lib/services/discovery';

export async function POST(request: Request) {
  try {
    await requireAuth(request);
    const body = await request.json();

    if (!body.searcher_lat || !body.searcher_lng) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'searcher_lat and searcher_lng are required' } },
        { status: 400 }
      );
    }

    const input: SearchNearbyInput = {
      searcher_lat: body.searcher_lat,
      searcher_lng: body.searcher_lng,
      radius_km: body.radius_km,
      role_filter: body.role_filter,
      keyword: body.keyword,
      page_size: body.page_size,
      page_offset: body.page_offset,
    };

    const results = await discoveryService.searchNearby(input);

    return NextResponse.json({
      success: true,
      data: results,
      meta: { count: results.length },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Discovery search failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: (error as Error).message } },
      { status: 400 }
    );
  }
}
