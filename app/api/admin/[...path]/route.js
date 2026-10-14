import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifyAdminSession, issueAdminSession, createAdminActorId, normalizeAdminEmail } from '../../../../lib/admin-auth.js';

const DEFAULT_API_BASE = 'https://bharat-yatra-in-bc-api.vercel.app/api/v1';

async function handleProxy(request, { params }) {
  const resolvedParams = await params;
  const pathSegments = resolvedParams?.path || [];
  const subPath = pathSegments.join('/');

  const env = process.env;
  let token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!verifyAdminSession(token, env)) {
    token = null;
  }

  if (!token && env.ADMIN_SESSION_SECRET && env.ADMIN_EMAIL) {
    const email = normalizeAdminEmail(env.ADMIN_EMAIL);
    try {
      token = issueAdminSession({
        id: createAdminActorId(email),
        email,
        role: 'admin',
      }, env);
    } catch {}
  }

  const base = env.ADMIN_API_URL || env.NEXT_PUBLIC_API_BASE_URL || (env.NODE_ENV === 'development' ? 'http://localhost:4000/api/v1' : DEFAULT_API_BASE);
  const targetUrl = new URL(`${base.replace(/\/$/, '')}/admin/${subPath}`);
  const requestUrl = new URL(request.url);
  requestUrl.searchParams.forEach((val, key) => targetUrl.searchParams.set(key, val));

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (!['host', 'connection', 'cookie', 'content-length'].includes(lower)) {
      headers.set(key, value);
    }
  });

  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }

  const options = {
    method: request.method,
    headers,
    cache: 'no-store',
  };

  if (!['GET', 'HEAD'].includes(request.method.toUpperCase())) {
    try {
      options.body = await request.text();
    } catch {}
  }

  try {
    const res = await fetch(targetUrl.toString(), options);
    const responseHeaders = new Headers();
    res.headers.forEach((val, key) => {
      const lower = key.toLowerCase();
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(lower)) {
        responseHeaders.set(key, val);
      }
    });

    const data = await res.arrayBuffer();
    return new NextResponse(data, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Backend API connection failed', details: err.message }, { status: 502 });
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
