// @witness [AD-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { adsService } from '@/lib/services/ads';

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    if (!body.title || !body.description || !body.location || !body.radius_km || !body.budget_inr) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'Missing required fields: title, description, location, radius_km, budget_inr' } },
        { status: 400 }
      );
    }

    const ad = await adsService.createAd(user.id, {
      title: body.title,
      description: body.description,
      location: body.location,
      radius_km: body.radius_km,
      budget_inr: body.budget_inr,
    });

    return NextResponse.json({ success: true, data: ad }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }

    const message = error instanceof Error ? error.message : '';

    if (message === 'ADS_CREATE_SUBSCRIPTION_LOCKED') {
      return NextResponse.json(
        { success: false, error: { code: 'ADS_CREATE_SUBSCRIPTION_LOCKED', message: 'Your subscription is locked. Cannot create ads.' } },
        { status: 403 }
      );
    }

    if (message === 'Profile not found') {
      return NextResponse.json(
        { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Profile not found' } },
        { status: 404 }
      );
    }

    console.error('Error creating ad:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create ad' } },
      { status: 500 }
    );
  }
}
