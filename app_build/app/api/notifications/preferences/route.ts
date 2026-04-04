// @witness [COM-001]
import { NextResponse } from 'next/server';

import { requireAuth, AuthError } from '@/lib/auth';
import { notificationService } from '@/lib/services/notifications';

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);

    const prefs = await notificationService.getPreferences(user.id);

    return NextResponse.json({ success: true, data: prefs });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Failed to get preferences:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get preferences' } },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    const { user_id: _user_id, ...updates } = body;

    const prefs = await notificationService.updatePreferences(user.id, updates);

    return NextResponse.json({ success: true, data: prefs });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Failed to update preferences:', error);
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_FAILED', message: (error as Error).message } },
      { status: 400 }
    );
  }
}
