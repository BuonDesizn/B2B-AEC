// @witness [ID-001]
import { NextResponse } from 'next/server';

import { requireAuth, AuthError } from '@/lib/auth';
import { personnelService } from '@/lib/services/company-personnel';

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    if (!body.personnel || !Array.isArray(body.personnel) || body.personnel.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'Missing required field: personnel (array)' } },
        { status: 400 }
      );
    }

    if (body.personnel.length > 50) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'Maximum 50 personnel per request' } },
        { status: 400 }
      );
    }

    for (const p of body.personnel) {
      if (!p.full_name || !p.designation) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_FAILED', message: 'Each personnel requires full_name and designation' } },
          { status: 400 }
        );
      }
    }

    const result = await personnelService.bulkCreatePersonnel(user.id, body.personnel);

    return NextResponse.json({ success: true, data: result }, { status: 201 });
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
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'Caller must have a verified GSTIN' } },
        { status: 400 }
      );
    }

    console.error('Error bulk creating personnel:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create personnel' } },
      { status: 500 }
    );
  }
}
