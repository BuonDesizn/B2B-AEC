import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export interface CookieMethods {
  getAll: () => { name: string; value: string }[];
  setAll: (cookiesToSet: { name: string; value: string; options?: Record<string, any> }[]) => void;
}

/**
 * Create a Supabase server client for Server Components.
 * Uses next/headers cookies automatically.
 */
export const createServerClient = async () => {
  const cookieStore = await cookies();
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, any> }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
};

/**
 * Create a Supabase client for API routes.
 * Takes cookie methods from the request context.
 */
export const createApiClient = (cookieMethods: CookieMethods) => {
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: cookieMethods.getAll,
        setAll: cookieMethods.setAll,
      },
    }
  );
};
