// @witness [COM-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { notificationService } from '@/lib/services/notifications';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    const result = await notificationService.markAsRead(params.id, user.id);

    if (!result) {
      return NextResponse.json(
        { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Notification not found or not owned by user' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Failed to mark notification as read:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to mark notification as read' } },
      { status: 400 }
    );
  }
}
