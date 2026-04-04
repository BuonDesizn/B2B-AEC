// @witness [MOD-001]
import { NextResponse } from 'next/server';

import { requireAdmin, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const _user = await requireAdmin(request);

    const totalUsers = await db.selectFrom('profiles').select((eb) => eb.fn.count('id').as('count')).executeTakeFirstOrThrow();
    const trialUsers = await db.selectFrom('profiles').select((eb) => eb.fn.count('id').as('count')).where('subscription_status', '=', 'trial').executeTakeFirstOrThrow();
    const hardLocked = await db.selectFrom('profiles').select((eb) => eb.fn.count('id').as('count')).where('subscription_status', '=', 'hard_locked').executeTakeFirstOrThrow();
    const todayHandshakes = await db.selectFrom('connections').select((eb) => eb.fn.count('id').as('count')).where('initiated_at', '>=', new Date(new Date().toDateString())).executeTakeFirstOrThrow();
    const openRfps = await db.selectFrom('rfps').select((eb) => eb.fn.count('id').as('count')).where('status', '=', 'OPEN').executeTakeFirstOrThrow();
    const activeAds = await db.selectFrom('ads').select((eb) => eb.fn.count('id').as('count')).where('status', '=', 'ACTIVE').executeTakeFirstOrThrow();
    const pendingVerifications = await db.selectFrom('profiles').select((eb) => eb.fn.count('id').as('count')).where('verification_status', '=', 'PENDING_ADMIN').executeTakeFirstOrThrow();
    const flaggedAds = await db.selectFrom('ads').select((eb) => eb.fn.count('id').as('count')).where('moderation_status', '=', 'FLAGGED').executeTakeFirstOrThrow();

    return NextResponse.json({
      success: true,
      data: {
        total_users: Number(totalUsers.count),
        trial_users: Number(trialUsers.count),
        hard_locked: Number(hardLocked.count),
        today_handshakes: Number(todayHandshakes.count),
        open_rfps: Number(openRfps.count),
        active_ads: Number(activeAds.count),
        pending_verifications: Number(pendingVerifications.count),
        flagged_ads: Number(flaggedAds.count),
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Error fetching admin dashboard:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch dashboard' } },
      { status: 500 }
    );
  }
}
