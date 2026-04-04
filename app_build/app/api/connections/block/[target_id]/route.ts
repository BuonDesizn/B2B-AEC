// @witness [HD-001]
import { NextResponse } from 'next/server';

import { requireAuth, AuthError } from '@/lib/auth';
import { connectionService } from '@/lib/services/connections';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ target_id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { target_id } = await params;

    const connection = await connectionService.unblockUser(user.id, target_id);

    return NextResponse.json(
      { success: true, data: { unblocked: true, connection_status: connection.status } }
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
        { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'No blocked connection found for this user' } },
        { status: 404 }
      );
    }

    console.error('Error unblocking user:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to unblock user' } },
      { status: 500 }
    );
  }
}
