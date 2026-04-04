// @witness [MON-001]
import { sql } from 'kysely';
import { NextResponse } from 'next/server';

import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);

    const subscription = await db
      .selectFrom('subscriptions')
      .select(['id', 'status', 'current_period_end', 'plan_name'])
      .where('profile_id', '=', user.id)
      .where('status', '=', 'ACTIVE')
      .orderBy('created_at', 'desc')
      .executeTakeFirst();

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: { code: 'SUBSCRIPTION_DOWNGRADE_NOT_ACTIVE', message: 'No active subscription found' } },
        { status: 400 }
      );
    }

    const downgradeScheduledAt = subscription.current_period_end ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await sql`
      ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS downgrade_scheduled_at TIMESTAMP WITH TIME ZONE
    `.execute(db);

    await db
      .updateTable('subscriptions')
      .set({
        downgrade_scheduled_at: downgradeScheduledAt,
        updated_at: new Date(),
      })
      .where('id', '=', subscription.id)
      .execute();

    return NextResponse.json({
      success: true,
      data: { downgrade_scheduled_at: downgradeScheduledAt.toISOString() },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Schedule downgrade failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to schedule downgrade' } },
      { status: 500 }
    );
  }
}
