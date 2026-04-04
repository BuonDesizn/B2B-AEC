// @witness [HD-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { connectionService } from '@/lib/services/connections';

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);

    const entries = await connectionService.getAddressBook(user.id);

    const data = entries.map((entry) => ({
      id: entry.id,
      org_name: entry.org_name,
      contact: {
        email: entry.email_business,
        phone: entry.phone_primary,
      },
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }

    console.error('Error fetching address book:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch address book' } },
      { status: 500 }
    );
  }
}
