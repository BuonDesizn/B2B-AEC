// @witness [RFP-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { rfpService } from '@/lib/services/rfp';

export async function GET(request: Request) {
  try {
    await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') ?? undefined;
    const state = searchParams.get('state') ?? undefined;
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    const rfps = await rfpService.browseOpenRfps(limit, offset, category, state);

    return NextResponse.json({ success: true, data: rfps });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Error browsing RFPs:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to browse RFPs' } },
      { status: 500 }
    );
  }
}
