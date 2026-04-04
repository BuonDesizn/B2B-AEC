// @witness [ID-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PATCH(request: Request, { params }: { params: Promise<{ role: string }> }) {
  try {
    const user = await requireAuth(request);
    const { role } = await params;
    const body = await request.json();

    const validRoles = ['PP', 'C', 'CON', 'PS', 'ED'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'Invalid role' } },
        { status: 400 }
      );
    }

    const allowedFields: Record<string, string> = {
      PP: 'project_professionals',
      C: 'consultants',
      CON: 'contractors',
      PS: 'product_sellers',
      ED: 'equipment_dealers',
    };

    const tableName = allowedFields[role];

    const result = await db
      .updateTable(tableName as any)
      .set(body)
      .where('profile_id', '=', user.id)
      .returningAll()
      .executeTakeFirst();

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Error updating profile role data:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update profile' } },
      { status: 500 }
    );
  }
}
