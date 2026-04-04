// @witness [ID-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { profileService } from '@/lib/services/profiles';

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    if (!body.new_gstin || !body.reason) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'Missing required fields: new_gstin, reason' } },
        { status: 400 }
      );
    }

    const result = await profileService.requestGstinChange(user.id, body.new_gstin, body.reason);

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

    if (message === 'IDENTITY_VERIFY_INVALID_GSTIN') {
      return NextResponse.json(
        { success: false, error: { code: 'IDENTITY_VERIFY_INVALID_GSTIN', message: 'Invalid GSTIN format' } },
        { status: 400 }
      );
    }

    if (message === 'IDENTITY_VERIFY_DUPLICATE_GSTIN') {
      return NextResponse.json(
        { success: false, error: { code: 'IDENTITY_VERIFY_DUPLICATE_GSTIN', message: 'GSTIN already linked to another profile' } },
        { status: 409 }
      );
    }

    if (message === 'IDENTITY_GSTIN_CHANGE_PENDING') {
      return NextResponse.json(
        { success: false, error: { code: 'IDENTITY_GSTIN_CHANGE_PENDING', message: 'A GSTIN change request is already pending' } },
        { status: 409 }
      );
    }

    if (message === 'VALIDATION_FAILED') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'Existing GSTIN must be verified' } },
        { status: 400 }
      );
    }

    console.error('Error requesting GSTIN change:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to request GSTIN change' } },
      { status: 500 }
    );
  }
}
