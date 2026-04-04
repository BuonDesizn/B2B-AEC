// @witness [AD-001]
import { sql } from 'kysely';
import { NextResponse } from 'next/server';

import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

const DEFAULT_RADIUS_KM = 50;
const MAX_RADIUS_KM = 500;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);

    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'lat and lng query parameters are required' } },
        { status: 400 }
      );
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radiusKm = Math.min(
      searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : DEFAULT_RADIUS_KM,
      MAX_RADIUS_KM
    );
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(
      searchParams.get('page_size') ? parseInt(searchParams.get('page_size')!, 10) : DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    );
    const offset = (page - 1) * pageSize;

    const point = `SRID=4326;POINT(${lngNum} ${latNum})`;
    const radiusMeters = radiusKm * 1000;

    const countResult = await sql<{ total_count: number }>`
      SELECT COUNT(*)::int as total_count
      FROM ads a
      WHERE a.status = 'ACTIVE'
        AND a.is_paused = false
        AND a.location IS NOT NULL
        AND ST_DWithin(
          a.location::geography,
          ST_GeomFromText(${point})::geography,
          ${radiusMeters}
        )
        AND a.profile_id NOT IN (
          SELECT CASE
            WHEN c.requester_id = ${user.id} THEN c.target_id
            ELSE c.requester_id
          END
          FROM connections c
          WHERE c.status = 'BLOCKED'
            AND (c.requester_id = ${user.id} OR c.target_id = ${user.id})
        )
    `.execute(db);

    const totalCount = countResult.rows[0]?.total_count ?? 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const adsResult = await sql`
      SELECT
        a.id,
        a.profile_id,
        a.title,
        a.description,
        a.image_url,
        a.target_url,
        a.radius_meters,
        a.placement_type,
        a.tier,
        a.priority_score,
        a.cost_per_click,
        a.created_at,
        ST_Distance(
          a.location::geography,
          ST_GeomFromText(${point})::geography
        ) / 1000.0 as distance_km
      FROM ads a
      WHERE a.status = 'ACTIVE'
        AND a.is_paused = false
        AND a.location IS NOT NULL
        AND ST_DWithin(
          a.location::geography,
          ST_GeomFromText(${point})::geography,
          ${radiusMeters}
        )
        AND a.profile_id NOT IN (
          SELECT CASE
            WHEN c.requester_id = ${user.id} THEN c.target_id
            ELSE c.requester_id
          END
          FROM connections c
          WHERE c.status = 'BLOCKED'
            AND (c.requester_id = ${user.id} OR c.target_id = ${user.id})
        )
      ORDER BY distance_km ASC, a.priority_score DESC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `.execute(db);

    return NextResponse.json({
      success: true,
      data: {
        items: adsResult.rows,
        meta: {
          page,
          page_size: pageSize,
          total_count: totalCount,
          total_pages: totalPages,
        },
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Search ads failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to search ads' } },
      { status: 500 }
    );
  }
}
