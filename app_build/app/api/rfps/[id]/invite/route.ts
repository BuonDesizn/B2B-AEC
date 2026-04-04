// @witness [RFP-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { rfpService } from '@/lib/services/rfp';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth(request);
    const body = await request.json();

    if (!body.invitee_id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'invitee_id is required' } },
        { status: 400 }
      );
    }

    const invitation = await rfpService.inviteProfile(id, body.invitee_id, user.id);

    return NextResponse.json({ success: true, data: invitation });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_FAILED', message: (error as Error).message } },
      { status: 400 }
    );
  }
}
