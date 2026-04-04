// @witness [ID-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);

    const profile = await db
      .selectFrom('profiles')
      .select(['persona_type', 'subscription_status', 'handshake_credits', 'trial_started_at'])
      .where('id', '=', user.id)
      .executeTakeFirst();

    if (!profile) {
      return NextResponse.json(
        { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Profile not found' } },
        { status: 404 }
      );
    }

    const activeConnections = await db
      .selectFrom('connections')
      .select(db.fn.count('id').as('count'))
      .where('status', '=', 'ACCEPTED')
      .where(eb => eb.or([
        eb('requester_id', '=', user.id),
        eb('target_id', '=', user.id),
      ]))
      .executeTakeFirst();

    const metrics: Record<string, any> = {
      active_connections: Number(activeConnections?.count ?? 0),
      subscription_status: profile.subscription_status,
      handshake_credits: profile.handshake_credits,
      trial_started_at: profile.trial_started_at,
      persona_type: profile.persona_type,
    };

    const personaType = profile.persona_type;

    if (personaType === 'PP' || personaType === 'C' || personaType === 'CON') {
      const openRfps = await db
        .selectFrom('rfps')
        .select(db.fn.count('id').as('count'))
        .where('status', '=', 'OPEN')
        .where(eb => eb.or([
          eb('creator_id', '=', user.id),
          eb('requester_id', '=', user.id),
        ]))
        .executeTakeFirst();

      const responses = await db
        .selectFrom('rfp_responses')
        .select(db.fn.count('id').as('count'))
        .where('responder_id', '=', user.id)
        .executeTakeFirst();

      metrics.open_rfps = Number(openRfps?.count ?? 0);
      metrics.responses_count = Number(responses?.count ?? 0);
    }

    if (personaType === 'PS') {
      const productsListed = await db
        .selectFrom('products')
        .select(db.fn.count('id').as('count'))
        .where('seller_id', '=', user.id)
        .where('is_active', '=', true)
        .executeTakeFirst();

      const enquiriesReceived = await db
        .selectFrom('rfp_responses')
        .select(db.fn.count('id').as('count'))
        .where('responder_id', '=', user.id)
        .executeTakeFirst();

      const activeAds = await db
        .selectFrom('ads')
        .select(db.fn.count('id').as('count'))
        .where('profile_id', '=', user.id)
        .where('status', '=', 'ACTIVE')
        .executeTakeFirst();

      metrics.products_listed = Number(productsListed?.count ?? 0);
      metrics.enquiries_received = Number(enquiriesReceived?.count ?? 0);
      metrics.active_ads = Number(activeAds?.count ?? 0);
    }

    if (personaType === 'ED') {
      const equipmentListed = await db
        .selectFrom('equipment')
        .select(db.fn.count('id').as('count'))
        .where('dealer_id', '=', user.id)
        .where('is_active', '=', true)
        .executeTakeFirst();

      const requestsReceived = await db
        .selectFrom('rfp_responses')
        .select(db.fn.count('id').as('count'))
        .where('responder_id', '=', user.id)
        .executeTakeFirst();

      const activeAds = await db
        .selectFrom('ads')
        .select(db.fn.count('id').as('count'))
        .where('profile_id', '=', user.id)
        .where('status', '=', 'ACTIVE')
        .executeTakeFirst();

      metrics.equipment_listed = Number(equipmentListed?.count ?? 0);
      metrics.requests_received = Number(requestsReceived?.count ?? 0);
      metrics.active_ads = Number(activeAds?.count ?? 0);
    }

    return NextResponse.json({ success: true, data: metrics });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch dashboard metrics' } },
      { status: 500 }
    );
  }
}
