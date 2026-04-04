// @witness [RM-001]
import { NextResponse } from 'next/server';

import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);

    const items = await db
      .selectFrom('portfolio_items')
      .selectAll()
      .where('profile_id', '=', user.id)
      .orderBy('created_at', 'desc')
      .execute();

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Error listing portfolio:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list portfolio items' } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    if (!body.title) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'Title is required' } },
        { status: 400 }
      );
    }

    const result = await db
      .insertInto('portfolio_items')
      .values({
        profile_id: user.id,
        title: body.title,
        description: body.description || null,
        created_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }
    console.error('Error creating portfolio item:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create portfolio item' } },
      { status: 500 }
    );
  }
}
