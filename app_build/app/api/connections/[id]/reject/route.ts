// @witness [HD-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { connectionService } from '@/lib/services/connections';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    const connection = await connectionService.rejectConnection(id, user.id);

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

    if (message === 'RESOURCE_NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Connection not found' } },
        { status: 404 }
      );
    }

    if (message === 'HANDSHAKE_ACCEPT_NOT_TARGET') {
      return NextResponse.json(
        { success: false, error: { code: 'HANDSHAKE_ACCEPT_NOT_TARGET', message: 'Only the target can reject this handshake' } },
        { status: 403 }
      );
    }

    console.error('Error rejecting connection:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to reject connection' } },
      { status: 500 }
    );
  }
}
