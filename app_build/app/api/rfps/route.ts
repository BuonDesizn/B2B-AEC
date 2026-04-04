// @witness [RFP-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { rfpService, CreateRfpInput } from '@/lib/services/rfp';

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    if (!body.title || !body.category || !body.expiry_date) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'Missing required fields: title, category, expiry_date' } },
        { status: 400 }
      );
    }

    const input: CreateRfpInput = {
      requester_id: user.id,
      title: body.title,
      description: body.description,
      category: body.category,
      subcategory: body.subcategory,
      budget_min: body.budget_min,
      budget_max: body.budget_max,
      location: body.location,
      expiry_date: new Date(body.expiry_date),
    };

    const rfp = await rfpService.create(input);

    return NextResponse.json({ success: true, data: rfp }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Error creating RFP:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create RFP' } },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get('limit') ?? '20', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    const rfps = await rfpService.listByRequester(user.id, limit, offset);

    return NextResponse.json({ success: true, data: rfps });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Error listing RFPs:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list RFPs' } },
      { status: 500 }
    );
  }
}
