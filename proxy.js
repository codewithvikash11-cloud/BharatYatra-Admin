import { NextResponse } from 'next/server';
import { hasValidAdminSession } from './lib/proxy-auth.mjs';

const ADMIN_SESSION_COOKIE = 'by_admin_session';

export async function proxy(request) {
  const response = NextResponse.next({ request });
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const isAuthenticated = await hasValidAdminSession(token, process.env);

  if (request.nextUrl.pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return response;
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/articles/:path*',
    '/content/:path*',
    '/media/:path*',
    '/appearance/:path*',
    '/audit/:path*',
  ],
};
