// @witness [HD-001]
import { NextResponse } from 'next/server';

import { requireAuth, AuthError } from '@/lib/auth';
import { connectionService } from '@/lib/services/connections';

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    if (!body.target_id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'Missing required field: target_id' } },
        { status: 400 }
      );
    }

    const connection = await connectionService.blockUser(user.id, body.target_id);

    return NextResponse.json(
      { success: true, data: { connection_id: connection.id, status: connection.status } }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }

    const message = error instanceof Error ? error.message : '';

    if (message === 'HANDSHAKE_INITIATE_SELF_CONNECT') {
      return NextResponse.json(
        { success: false, error: { code: 'HANDSHAKE_INITIATE_SELF_CONNECT', message: 'Cannot block your own profile' } },
        { status: 400 }
      );
    }

    console.error('Error blocking user:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to block user' } },
      { status: 500 }
    );
  }
}
