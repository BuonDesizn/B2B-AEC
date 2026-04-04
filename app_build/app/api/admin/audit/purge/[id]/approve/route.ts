// @witness [MOD-001]
import { NextResponse } from 'next/server';

import { requireAdmin, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const body = await request.json();

    if (body.confirm !== true) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Confirmation required' } },
        { status: 400 }
      );
    }

    const purgeRequest = await db
      .selectFrom('audit_purge_queue')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!purgeRequest) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Purge request not found' } },
        { status: 404 }
      );
    }

    if (purgeRequest.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: 'Purge request is not in pending state' } },
        { status: 400 }
      );
    }

    const profileId = purgeRequest.profile_id;
    const now = new Date();

    await db
      .updateTable('audit_purge_queue')
      .set({ status: 'approved', approved_by: admin.id, completed_at: now })
      .where('id', '=', id)
      .execute();

    await db
      .updateTable('profiles')
      .set({ deleted_at: now })
      .where('id', '=', profileId)
      .execute();

    await db
      .insertInto('unmasking_audit')
      .values({
        viewer_id: admin.id,
        viewed_id: profileId,
        trigger_event: 'ADMIN_ACCESS',
        revealed_fields: ['deleted_at'],
        unmasked_at: now,
        metadata: { action: 'gdpr_purge_approved', purge_request_id: id, reason: purgeRequest.reason },
        retention_expires_at: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
      })
      .execute();

    return NextResponse.json({
      success: true,
      data: {
        purged_profile_id: profileId,
        purged_at: now.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to approve purge request' } },
      { status: 500 }
    );
  }
}
