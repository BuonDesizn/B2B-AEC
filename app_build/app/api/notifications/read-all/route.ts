// @witness [COM-001]
import { NextResponse } from 'next/server';

import { requireAuth, AuthError } from '@/lib/auth';
import { notificationService } from '@/lib/services/notifications';

export async function PATCH(request: Request) {
  try {
    const user = await requireAuth(request);

    const result = await notificationService.markAllAsRead(user.id);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Failed to mark all as read:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to mark all as read' } },
      { status: 400 }
    );
  }
}
