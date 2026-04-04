// @witness [RFP-001]
import { NextResponse } from 'next/server';

import { requireAuth, AuthError } from '@/lib/auth';
import { rfpService } from '@/lib/services/rfp';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status') ?? undefined;
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = Math.min(parseInt(searchParams.get('page_size') ?? '20', 10), 50);

    const responses = await rfpService.getResponses(id, user.id, { status, page, pageSize });

    return NextResponse.json({ success: true, data: responses });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch responses' } },
      { status: 500 }
    );
  }
}
