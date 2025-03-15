import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If user is not signed in and the current path is not /auth/*, redirect to /auth/signin
  if (!session && !req.nextUrl.pathname.startsWith('/auth/')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/auth/signin';
    return NextResponse.redirect(redirectUrl);
  }

  // Allow everyone to access auth pages regardless of login status
  if (req.nextUrl.pathname.startsWith('/auth/')) {
    return res;
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 