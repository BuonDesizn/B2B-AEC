# Auth Integration Pattern

## Overview

All API routes MUST validate the authenticated user before executing any business logic. Services should NEVER accept user IDs from request bodies — the authenticated user is extracted from the Supabase session.

## Architecture

```
Request → middleware.ts (session check) → API Route → requireAuth() → Service
```

## Implementation

### 1. Auth Helper (`lib/auth.ts`)

```typescript
// @witness [ID-001]
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export class AuthError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Extract and validate authenticated user from request.
 * Throws AuthError if no valid session.
 */
export async function requireAuth(request: Request) {
  const supabase = createServerClient();
  
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    throw new AuthError(
      'AUTH_MISSING',
      401,
      'Authentication required'
    );
  }
  
  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role ?? 'user',
  };
}

/**
 * Extract authenticated user, return null if not authenticated.
 * Use for endpoints that work for both authenticated and anonymous users.
 */
export async function getOptionalAuth(request: Request) {
  const supabase = createServerClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) return null;
  
  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role ?? 'user',
  };
}

/**
 * Check if user has super_admin role.
 * Throws AuthError if not admin.
 */
export async function requireAdmin(request: Request) {
  const user = await requireAuth(request);
  
  if (user.role !== 'super_admin') {
    throw new AuthError(
      'AUTH_INSUFFICIENT_ROLE',
      403,
      'Admin access required'
    );
  }
  
  return user;
}
```

### 2. API Route Pattern

```typescript
// @witness [RFP-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { rfpService } from '@/lib/services/rfp';

export async function POST(request: Request) {
  try {
    // Extract authenticated user — NEVER trust requester_id from body
    const user = await requireAuth(request);
    
    const body = await request.json();
    
    const rfp = await rfpService.create({
      ...body,
      requester_id: user.id, // Inject authenticated user ID
    });
    
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
```

### 3. Service Pattern Update

Services should accept `userId` as a parameter but the API route is responsible for injecting it:

```typescript
// Service method signature
async create(input: CreateRfpInput) {
  // input.requester_id comes from authenticated user, not request body
}

// API route
const user = await requireAuth(request);
const rfp = await rfpService.create({ ...body, requester_id: user.id });
```

## Security Rules

1. **NEVER** accept `user_id`, `requester_id`, `responder_id`, etc. from request body
2. **ALWAYS** use `requireAuth()` to extract the authenticated user
3. **ALWAYS** inject `user.id` into service calls
4. **ALWAYS** catch `AuthError` and return proper error response
5. **NEVER** bypass auth for protected endpoints

## Error Response Format

```typescript
// Auth errors follow the global API contract
{
  success: false,
  error: {
    code: 'AUTH_MISSING' | 'AUTH_INSUFFICIENT_ROLE',
    message: 'Human readable message',
  }
}
```

## Testing

```typescript
// Mock auth in tests
vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'user',
  }),
  AuthError: class AuthError extends Error {
    constructor(public code: string, public status: number, message: string) {
      super(message);
    }
  },
}));
```
