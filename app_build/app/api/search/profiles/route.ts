// @witness [RM-001]
import { NextResponse } from 'next/server';

import { requireAuth, AuthError } from '@/lib/auth';
import { discoveryService, SearchNearbyInput } from '@/lib/services/discovery';

/**
 * GET /api/search/profiles
 * Contract-aligned endpoint for proximity search.
 * Redirects to POST /api/discovery/search internally.
 */
export async function GET(request: Request) {
  try {
    await requireAuth(request);
    const { searchParams } = new URL(request.url);

    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'lat and lng query parameters are required' } },
        { status: 400 }
      );
    }

    const input: SearchNearbyInput = {
      searcher_lat: parseFloat(lat),
      searcher_lng: parseFloat(lng),
      radius_km: searchParams.get('radius') ? parseInt(searchParams.get('radius')!, 10) : undefined,
      role_filter: searchParams.get('persona_type') ?? searchParams.get('role') ?? undefined,
      keyword: searchParams.get('keyword') ?? searchParams.get('q') ?? undefined,
      page_size: searchParams.get('page_size') ? parseInt(searchParams.get('page_size')!, 10) : undefined,
      page_offset: searchParams.get('page') ? (parseInt(searchParams.get('page')!, 10) - 1) * 20 : undefined,
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
    console.error('Search profiles failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: (error as Error).message } },
      { status: 400 }
    );
  }
}
