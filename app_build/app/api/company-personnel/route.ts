// @witness [ID-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import { personnelService } from '@/lib/services/company-personnel';

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);

    const profile = await db
      .selectFrom('profiles')
      .select(['gstin', 'verification_status'])
      .where('id', '=', user.id)
      .executeTakeFirst();

    if (!profile?.gstin || profile.verification_status !== 'VERIFIED') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'Caller must have a verified GSTIN' } },
        { status: 400 }
      );
    }

    const filters = {
      is_active: searchParams.has('is_active') ? searchParams.get('is_active') === 'true' : undefined,
      page: parseInt(searchParams.get('page') ?? '1', 10),
      page_size: parseInt(searchParams.get('page_size') ?? '20', 10),
    };

    const result = await personnelService.listPersonnel(profile.gstin, filters);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }

    console.error('Error listing personnel:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list personnel' } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    if (!body.full_name || !body.designation) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'Missing required fields: full_name, designation' } },
        { status: 400 }
      );
    }

    const result = await personnelService.createPersonnel(user.id, {
      full_name: body.full_name,
      designation: body.designation,
      qualification: body.qualification,
      specialty: body.specialty,
      experience_years: body.experience_years,
      email: body.email,
      phone: body.phone,
      detailed_bio: body.detailed_bio,
    });

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

    console.error('Error creating personnel:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create personnel' } },
      { status: 500 }
    );
  }
}
