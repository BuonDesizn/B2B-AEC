// @witness [ID-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireAuth(request);

    const result = await db
      .selectFrom('profiles')
      .select((eb) =>
        eb.fn('get_visible_contact_info', [
          eb.val(id),
          eb.val(user.id),
        ]).as('contact')
      )
      .executeTakeFirst();

    const contact = result?.contact as { email: string; phone: string } | null;

    return NextResponse.json({
      success: true,
      data: {
        email: contact?.email ?? '***@***',
        phone_primary: contact?.phone ?? '+91**********',
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }

    console.error('Error fetching contact info:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch contact info' } },
      { status: 500 }
    );
  }
}
