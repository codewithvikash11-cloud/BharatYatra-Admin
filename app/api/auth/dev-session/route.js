import { NextResponse } from 'next/server';
import {
  issueAdminSession,
  createAdminActorId,
  normalizeAdminEmail,
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
} from '../../../../lib/admin-auth.js';

export async function GET(request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Dev environment only' }, { status: 403 });
  }

  const email = process.env.ADMIN_EMAIL || 'admin@bharatyatra.in';
  const principal = {
    id: createAdminActorId(email),
    email: normalizeAdminEmail(email),
    role: 'admin',
  };
  const token = issueAdminSession(principal, process.env);

  const nextPath = request.nextUrl.searchParams.get('next') || '/content/articles';
  const redirectUrl = new URL(nextPath, request.url);
  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions());
  return response;
}
