// @witness [ID-001]
import { NextResponse } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/auth';
import { profileService } from '@/lib/services/profiles';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const admin = await requireAdmin(request);
    const body = await request.json();

    if (!body.action || !['approve', 'reject'].includes(body.action)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'action must be "approve" or "reject"' } },
        { status: 400 }
      );
    }

    const result = await profileService.adminVerifyProfile(id, body.action, admin.id);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }

    const message = error instanceof Error ? error.message : '';

    if (message === 'RESOURCE_NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Profile not found' } },
        { status: 404 }
      );
    }

    if (message === 'VALIDATION_FAILED') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'Invalid verification state transition' } },
        { status: 400 }
      );
    }

    console.error('Error updating verification:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update verification' } },
      { status: 500 }
    );
  }
}
