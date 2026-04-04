// @witness [AD-001]
import { NextResponse } from 'next/server';

import { requireAuth, AuthError } from '@/lib/auth';
import { adsService } from '@/lib/services/ads';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth(request);
    const ad = await adsService.getAdById(id, user.id);

    return NextResponse.json({ success: true, data: ad });
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
        { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Ad not found' } },
        { status: 404 }
      );
    }

    if (message === 'ADS_NOT_ACTIVE') {
      return NextResponse.json(
        { success: false, error: { code: 'ADS_NOT_ACTIVE', message: 'Ad is not active' } },
        { status: 403 }
      );
    }

    console.error('Error fetching ad:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch ad' } },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth(request);
    const body = await request.json();

    const ad = await adsService.updateAd(id, body, user.id);

    return NextResponse.json({ success: true, data: ad });
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
        { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Ad not found' } },
        { status: 404 }
      );
    }

    if (message === 'ADS_UPDATE_NOT_DRAFT') {
      return NextResponse.json(
        { success: false, error: { code: 'ADS_UPDATE_NOT_DRAFT', message: 'Can only edit ads in DRAFT or PENDING_PAYMENT state' } },
        { status: 400 }
      );
    }

    if (message === 'ADS_UPDATE_NOT_OWNER') {
      return NextResponse.json(
        { success: false, error: { code: 'ADS_UPDATE_NOT_OWNER', message: 'You do not own this ad' } },
        { status: 403 }
      );
    }

    console.error('Error updating ad:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update ad' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth(_request);
    const result = await adsService.deleteAd(id, user.id);

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
        { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Ad not found' } },
        { status: 404 }
      );
    }

    if (message === 'ADS_DELETE_ACTIVE') {
      return NextResponse.json(
        { success: false, error: { code: 'ADS_DELETE_ACTIVE', message: 'Cannot delete active ads — use pause instead' } },
        { status: 400 }
      );
    }

    if (message === 'ADS_DELETE_NOT_OWNER') {
      return NextResponse.json(
        { success: false, error: { code: 'ADS_DELETE_NOT_OWNER', message: 'You do not own this ad' } },
        { status: 403 }
      );
    }

    console.error('Error deleting ad:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete ad' } },
      { status: 500 }
    );
  }
}
