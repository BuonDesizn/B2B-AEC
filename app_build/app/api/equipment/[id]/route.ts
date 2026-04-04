// @witness [ED-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { equipmentService } from '@/lib/services/equipment';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request);
    const { id } = await params;

    const equipment = await equipmentService.getEquipmentById(id);

    return NextResponse.json({ success: true, data: equipment });
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
        { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Equipment not found' } },
        { status: 404 }
      );
    }

    console.error('Error fetching equipment:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch equipment' } },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const body = await request.json();

    const equipment = await equipmentService.updateEquipment(id, {
      name: body.name,
      description: body.description,
      category: body.category,
      type: body.type,
      rental_rate_per_day: body.rental_rate_per_day,
      operator_included: body.operator_included,
      location: body.location,
      images: body.images,
      available: body.available,
    }, user.id);

    return NextResponse.json({ success: true, data: equipment });
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
        { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Equipment not found' } },
        { status: 404 }
      );
    }

    if (message === 'EQUIPMENT_UPDATE_NOT_OWNER') {
      return NextResponse.json(
        { success: false, error: { code: 'EQUIPMENT_UPDATE_NOT_OWNER', message: 'You do not own this equipment listing' } },
        { status: 403 }
      );
    }

    console.error('Error updating equipment:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update equipment' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    const result = await equipmentService.deleteEquipment(id, user.id);

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
        { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Equipment not found' } },
        { status: 404 }
      );
    }

    if (message === 'EQUIPMENT_DELETE_NOT_OWNER') {
      return NextResponse.json(
        { success: false, error: { code: 'EQUIPMENT_DELETE_NOT_OWNER', message: 'You do not own this equipment listing' } },
        { status: 403 }
      );
    }

    console.error('Error deleting equipment:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete equipment' } },
      { status: 500 }
    );
  }
}
