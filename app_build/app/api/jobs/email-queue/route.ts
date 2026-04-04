// @witness [COM-001]
import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { sendEmail } from '@/lib/services/email/resend';

/**
 * POST /api/jobs/email-queue
 * QStash scheduled job: Process pending emails from the queue.
 * Sends emails via Resend and updates queue status.
 */
export async function POST(request: Request) {
  try {
    const { verifyQStashSignature } = await import('@/lib/jobs');
    if (!(await verifyQStashSignature(request))) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_MISSING', message: 'Invalid QStash signature' } },
        { status: 401 }
      );
    }

    // Fetch pending emails (max 50 per batch)
    const pendingEmails = await db
      .selectFrom('email_queue')
      .selectAll()
      .where('status', '=', 'PENDING')
      .where((eb) => eb.or([
        eb('scheduled_at', 'is', null),
        eb('scheduled_at', '<=', new Date()),
      ]))
      .orderBy('created_at', 'asc')
      .limit(50)
      .execute();

    if (pendingEmails.length === 0) {
      return NextResponse.json({ success: true, data: { processed: 0, message: 'No pending emails' } });
    }

    let succeeded = 0;
    let failed = 0;

    for (const email of pendingEmails) {
      try {
        await sendEmail({
          to: email.to_email,
          subject: email.subject,
          bodyHtml: email.body_html,
        });

        await db
          .updateTable('email_queue')
          .set({ status: 'SENT', updated_at: new Date() })
          .where('id', '=', email.id)
          .execute();

        succeeded++;
      } catch (error) {
        const attempts = (email.attempts ?? 0) + 1;
        const maxAttempts = email.max_attempts ?? 3;
        const status = attempts >= maxAttempts ? 'FAILED' : 'RETRYING';

        await db
          .updateTable('email_queue')
          .set({
            status,
            attempts,
            last_error: (error as Error).message,
            updated_at: new Date(),
          })
          .where('id', '=', email.id)
          .execute();

        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      data: { processed: pendingEmails.length, succeeded, failed },
    });
  } catch (error) {
    console.error('Email queue worker failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Email queue worker failed' } },
      { status: 500 }
    );
  }
}
