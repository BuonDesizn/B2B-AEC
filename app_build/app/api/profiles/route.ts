// @witness [ID-001]
import { NextResponse } from 'next/server';

import { requireAuth, AuthError } from '@/lib/auth';
import { profileService } from '@/lib/services/profiles';

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    if (!body.persona_type || !body.org_name) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'Missing required fields: persona_type, org_name' } },
        { status: 400 }
      );
    }

    const result = await profileService.createProfile(
      {
        persona_type: body.persona_type,
        org_name: body.org_name,
        pan: body.pan ?? 'TEMP' + user.id.slice(0, 8),
        location: body.location,
        gstin: body.gstin,
      },
      user.id,
      user.email ?? ''
    );

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }

    const message = error instanceof Error ? error.message : '';

    if (message === 'IDENTITY_VERIFY_INVALID_GSTIN') {
      return NextResponse.json(
        { success: false, error: { code: 'IDENTITY_VERIFY_INVALID_GSTIN', message: 'GSTIN is required for organizations and must be valid' } },
        { status: 400 }
      );
    }

    console.error('Error creating profile:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create profile' } },
      { status: 500 }
    );
  }
}
