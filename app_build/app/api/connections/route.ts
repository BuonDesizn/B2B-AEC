// @witness [HD-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
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

    const connection = await connectionService.createConnection(user.id, {
      target_id: body.target_id,
      message: body.message,
    });

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

    if (message === 'HANDSHAKE_INITIATE_SELF_CONNECT') {
      return NextResponse.json(
        { success: false, error: { code: 'HANDSHAKE_INITIATE_SELF_CONNECT', message: 'Cannot connect to your own profile' } },
        { status: 400 }
      );
    }

    if (message === 'HANDSHAKE_INITIATE_SUBSCRIPTION_LOCKED') {
      return NextResponse.json(
        { success: false, error: { code: 'HANDSHAKE_INITIATE_SUBSCRIPTION_LOCKED', message: 'Your subscription is locked' } },
        { status: 403 }
      );
    }

    if (message === 'HANDSHAKE_INITIATE_INSUFFICIENT_CREDITS') {
      return NextResponse.json(
        { success: false, error: { code: 'HANDSHAKE_INITIATE_INSUFFICIENT_CREDITS', message: 'No handshake credits remaining' } },
        { status: 402 }
      );
    }

    if (message === 'HANDSHAKE_INITIATE_ALREADY_CONNECTED') {
      return NextResponse.json(
        { success: false, error: { code: 'HANDSHAKE_INITIATE_ALREADY_CONNECTED', message: 'An active connection already exists' } },
        { status: 409 }
      );
    }

    if (message === 'HANDSHAKE_INITIATE_BLOCKED_USER') {
      return NextResponse.json(
        { success: false, error: { code: 'HANDSHAKE_INITIATE_BLOCKED_USER', message: 'Cannot connect to a blocked user' } },
        { status: 403 }
      );
    }

    console.error('Error creating connection:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create connection' } },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status') || undefined;
    const direction = searchParams.get('direction') || undefined;
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const page_size = parseInt(searchParams.get('page_size') ?? '20', 10);

    let query = db
      .selectFrom('connections')
      .selectAll()
      .where((eb) => {
        const conditions: any[] = [];

        if (direction === 'incoming') {
          conditions.push(eb('target_id', '=', user.id));
        } else if (direction === 'outgoing') {
          conditions.push(eb('requester_id', '=', user.id));
        } else {
          conditions.push(eb.or([
            eb('requester_id', '=', user.id),
            eb('target_id', '=', user.id),
          ]));
        }

        if (status) {
          conditions.push(eb('status', '=', status));
        }

        return eb.and(conditions);
      });

    const countQuery = db
      .selectFrom('connections')
      .select(db.fn.count('id').as('count'))
      .where((eb) => {
        const conditions: any[] = [];

        if (direction === 'incoming') {
          conditions.push(eb('target_id', '=', user.id));
        } else if (direction === 'outgoing') {
          conditions.push(eb('requester_id', '=', user.id));
        } else {
          conditions.push(eb.or([
            eb('requester_id', '=', user.id),
            eb('target_id', '=', user.id),
          ]));
        }

        if (status) {
          conditions.push(eb('status', '=', status));
        }

        return eb.and(conditions);
      });

    const offset = (page - 1) * page_size;

    const items = await query
      .orderBy('initiated_at', 'desc')
      .limit(page_size)
      .offset(offset)
      .execute();

    const countResult = await countQuery.executeTakeFirst();
    const totalCount = Number(countResult?.count ?? 0);

    const profilesWithNames = await db
      .selectFrom('profiles')
      .select(['id', 'org_name'])
      .where('id', 'in', items.flatMap(c => [c.requester_id, c.target_id]))
      .execute();

    const profileMap = new Map(profilesWithNames.map(p => [p.id, p.org_name]));

    const enrichedItems = items.map(c => ({
      ...c,
      requester_name: profileMap.get(c.requester_id) ?? null,
      target_name: profileMap.get(c.target_id) ?? null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: enrichedItems,
        meta: {
          page,
          page_size,
          total_count: totalCount,
          total_pages: Math.ceil(totalCount / page_size),
        },
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }

    console.error('Error listing connections:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list connections' } },
      { status: 500 }
    );
  }
}
