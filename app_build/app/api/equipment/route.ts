// @witness [ED-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { equipmentService } from '@/lib/services/equipment';

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'Missing required field: name' } },
        { status: 400 }
      );
    }

    const equipment = await equipmentService.createEquipment(user.id, {
      name: body.name,
      description: body.description,
      category: body.category,
      type: body.type,
      rental_rate_per_day: body.rental_rate_per_day,
      operator_included: body.operator_included,
      location: body.location,
      images: body.images,
      available: body.available,
    });

    return NextResponse.json({ success: true, data: equipment }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }

    const message = error instanceof Error ? error.message : '';

    if (message === 'EQUIPMENT_CREATE_NOT_ED') {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_INSUFFICIENT_ROLE', message: 'Only ED (Equipment Dealer) accounts can create equipment listings' } },
        { status: 403 }
      );
    }

    if (message === 'EQUIPMENT_CREATE_SUBSCRIPTION_LOCKED') {
      return NextResponse.json(
        { success: false, error: { code: 'EQUIPMENT_CREATE_SUBSCRIPTION_LOCKED', message: 'Your subscription is locked. Cannot create equipment listings.' } },
        { status: 403 }
      );
    }

    if (message === 'Profile not found') {
      return NextResponse.json(
        { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Profile not found' } },
        { status: 404 }
      );
    }

    console.error('Error creating equipment:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create equipment listing' } },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const dealerId = searchParams.get('dealer_id') || undefined;
    const category = searchParams.get('category') || undefined;
    const availableOnly = searchParams.get('available_only') === 'true';
    const page = searchParams.has('page') ? parseInt(searchParams.get('page')!, 10) : 1;
    const pageSize = searchParams.has('page_size') ? parseInt(searchParams.get('page_size')!, 10) : 20;

    const result = await equipmentService.listEquipment({
      dealer_id: dealerId,
      category,
      available_only: availableOnly,
      page,
      page_size: pageSize,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error listing equipment:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list equipment' } },
      { status: 500 }
    );
  }
}
