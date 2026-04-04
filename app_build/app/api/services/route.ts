// @witness [C-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { servicesService } from '@/lib/services/services';

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    if (!body.title || !body.category) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'title and category are required' } },
        { status: 400 }
      );
    }

    const service = await servicesService.create(user.id, body);
    return NextResponse.json({ success: true, data: service }, { status: 201 });
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

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only') !== 'false';

    const services = await servicesService.listByProfile(user.id, activeOnly);
    return NextResponse.json({ success: true, data: services });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list services' } },
      { status: 500 }
    );
  }
}
