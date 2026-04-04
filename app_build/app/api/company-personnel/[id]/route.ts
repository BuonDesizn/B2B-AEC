// @witness [ID-001]
import { NextResponse } from 'next/server';

import { requireAuth, AuthError } from '@/lib/auth';
import { personnelService } from '@/lib/services/company-personnel';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireAuth(request);

    const result = await personnelService.getPersonnelById(id, user.id);

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
        { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Personnel not found' } },
        { status: 404 }
      );
    }

    if (message === 'AUTH_INSUFFICIENT_ROLE') {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_INSUFFICIENT_ROLE', message: 'Insufficient access rights' } },
        { status: 403 }
      );
    }

    console.error('Error fetching personnel:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch personnel' } },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireAuth(request);
    const body = await request.json();

    const result = await personnelService.updatePersonnel(id, body, user.id);

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
        { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Personnel not found' } },
        { status: 404 }
      );
    }

    if (message === 'AUTH_INSUFFICIENT_ROLE') {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_INSUFFICIENT_ROLE', message: 'You can only update your own personnel records' } },
        { status: 403 }
      );
    }

    if (message === 'VALIDATION_FAILED') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'No valid fields to update' } },
        { status: 400 }
      );
    }

    console.error('Error updating personnel:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update personnel' } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireAuth(request);

    const result = await personnelService.deletePersonnel(id, user.id);

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
        { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Personnel not found' } },
        { status: 404 }
      );
    }

    if (message === 'AUTH_INSUFFICIENT_ROLE') {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_INSUFFICIENT_ROLE', message: 'You can only delete your own personnel records' } },
        { status: 403 }
      );
    }

    console.error('Error deleting personnel:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete personnel' } },
      { status: 500 }
    );
  }
}
