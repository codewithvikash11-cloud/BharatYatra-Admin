import { NextResponse } from 'next/server';

export async function proxy(request) {
  const response = NextResponse.next({ request });
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
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
