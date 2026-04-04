// @witness [AD-001]
import { NextResponse } from 'next/server';

import { requireAuth, AuthError } from '@/lib/auth';
import { adsService } from '@/lib/services/ads';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth(request);
    const body = await request.json();

    if (!body.message) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'Missing required field: message' } },
        { status: 400 }
      );
    }

    const connection = await adsService.connectFromAd(id, body.message, user.id);

    return NextResponse.json(
      { success: true, data: { connection_id: connection.id, status: connection.status } },
      { status: 201 }
    );
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

    if (message === 'ADS_NOT_ACTIVE_FOR_CONNECT') {
      return NextResponse.json(
        { success: false, error: { code: 'ADS_NOT_ACTIVE', message: 'Ad is not active' } },
        { status: 400 }
      );
    }

    if (message === 'ADS_CONNECT_SELF') {
      return NextResponse.json(
        { success: false, error: { code: 'ADS_CONNECT_SELF', message: 'Cannot connect to your own ad' } },
        { status: 400 }
      );
    }

    if (message === 'ADS_CONNECT_ALREADY_CONNECTED') {
      return NextResponse.json(
        { success: false, error: { code: 'ADS_CONNECT_ALREADY_CONNECTED', message: 'An active connection already exists' } },
        { status: 409 }
      );
    }

    console.error('Error connecting from ad:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create connection' } },
      { status: 500 }
    );
  }
}
