// @witness [MON-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const adminProfile = await db.selectFrom('profiles').select('role').where('id', '=', user.id).executeTakeFirst();
    if (adminProfile?.role !== 'admin') return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 });

    const pendingSubscriptions = await db
      .selectFrom('subscriptions')
      .select(['id', 'phonepe_transaction_id', 'amount', 'status'])
      .where('status', '=', 'pending')
      .execute();

    const reconciled: string[] = [];
    const failed: string[] = [];

    for (const subscription of pendingSubscriptions) {
      if (subscription.phonepe_transaction_id) {
        await db.updateTable('subscriptions').set({ status: 'active' }).where('id', '=', subscription.id).execute();
        reconciled.push(subscription.id);
      } else {
        failed.push(subscription.id);
      }
    }

    return NextResponse.json({ success: true, data: { reconciled, failed } });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to reconcile payments' } }, { status: 500 });
  }
}
