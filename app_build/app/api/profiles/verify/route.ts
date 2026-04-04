// @witness [ID-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { profileService } from '@/lib/services/profiles';

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    if (!body.pan || !body.gstin || !body.org_name || !body.establishment_year) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'Missing required fields: pan, gstin, org_name, establishment_year' } },
        { status: 400 }
      );
    }

    const result = await profileService.submitVerification(user.id, {
      pan: body.pan,
      gstin: body.gstin,
      org_name: body.org_name,
      establishment_year: body.establishment_year,
    });

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
        { success: false, error: { code: 'IDENTITY_VERIFY_INVALID_GSTIN', message: 'Invalid PAN or GSTIN format' } },
        { status: 400 }
      );
    }

    if (message === 'IDENTITY_CREATE_DUPLICATE_PAN') {
      return NextResponse.json(
        { success: false, error: { code: 'IDENTITY_CREATE_DUPLICATE_PAN', message: 'PAN already registered for this persona_type' } },
        { status: 409 }
      );
    }

    if (message === 'IDENTITY_VERIFY_DUPLICATE_GSTIN') {
      return NextResponse.json(
        { success: false, error: { code: 'IDENTITY_VERIFY_DUPLICATE_GSTIN', message: 'GSTIN already linked to another profile' } },
        { status: 409 }
      );
    }

    console.error('Error submitting verification:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to submit verification' } },
      { status: 500 }
    );
  }
}
