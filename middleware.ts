import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If there's no session and the user is not on an auth page,
  // redirect them to signin
  if (!session && !req.nextUrl.pathname.startsWith('/auth/')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/auth/signin';
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If there is a session and the user is on an auth page,
  // redirect them to the home page
  if (session && req.nextUrl.pathname.startsWith('/auth/')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

// Specify which routes should be protected
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes that don't require authentication
     * - auth routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/public|auth).*)',
  ],
}; 