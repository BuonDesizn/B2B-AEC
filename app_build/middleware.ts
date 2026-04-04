import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware protects routes that require authentication
export async function middleware(request: NextRequest) {
  console.log('[Middleware] Starting', request.nextUrl.pathname);
  console.log('[Middleware] SUPABASE_URL set:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('[Middleware] SUPABASE_ANON_KEY set:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const response = NextResponse.next();
  let session = null;

  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('[Middleware] Missing Supabase env vars');
      return response;
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: any) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            });
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    console.log('[Middleware] Supabase client created');

    const { data } = await supabase.auth.getSession();
    session = data.session;
    console.log('[Middleware] Session:', session ? 'found' : 'none');
  } catch (error) {
    console.error('[Middleware] Error:', error);
  }

  const publicPaths = [
    '/',
    '/auth/callback',
    '/auth/login',
    '/auth/signup',
    '/auth/reset-password',
    '/api/payment/phonepe/callback',
    '/api/jobs/',
  ];

  const path = request.nextUrl.pathname;

  if (
    publicPaths.some((publicPath) => path.startsWith(publicPath)) ||
    path.startsWith('/_next/') ||
    path.startsWith('/favicon.ico')
  ) {
    return response;
  }

  if (!session) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('callbackUrl', encodeURIComponent(path));
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};