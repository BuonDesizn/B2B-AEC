// @witness [ID-001]
import { db } from './db';
import { createApiClient } from './supabase/server';

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

export interface AuthUser {
  id: string;
  email: string | undefined;
  role: string;
}

function createApiSupabaseClient(request: Request) {
  return createApiClient({
    getAll() {
      const cookieHeader = request.headers.get('cookie') || '';
      return cookieHeader.split(';').map(c => {
        const [name, ...valueParts] = c.trim().split('=');
        return { name: name.trim(), value: valueParts.join('=').trim() };
      }).filter(c => c.name && c.value);
    },
    setAll() {
      // Cookies are set via response headers, not needed for auth extraction
    },
  });
}

/**
 * Extract and validate authenticated user from request.
 * Throws AuthError if no valid session.
 */
export async function requireAuth(request: Request): Promise<AuthUser> {
  const supabase = createApiSupabaseClient(request);
  
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
    role: (session.user as any).role ?? 'user',
  };
}

/**
 * Extract authenticated user, return null if not authenticated.
 * Use for endpoints that work for both authenticated and anonymous users.
 */
export async function getOptionalAuth(request: Request): Promise<AuthUser | null> {
  const supabase = createApiSupabaseClient(request);
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) return null;
  
  return {
    id: session.user.id,
    email: session.user.email,
    role: (session.user as any).role ?? 'user',
  };
}

/**
 * Check if user has super_admin role.
 * Throws AuthError if not admin.
 */
export async function requireAdmin(request: Request): Promise<AuthUser> {
  const user = await requireAuth(request);

  const profile = await db
    .selectFrom('profiles')
    .select('role')
    .where('id', '=', user.id)
    .executeTakeFirst();

  if (profile?.role !== 'super_admin') {
    throw new AuthError(
      'AUTH_INSUFFICIENT_ROLE',
      403,
      'Admin access required'
    );
  }

  return user;
}
