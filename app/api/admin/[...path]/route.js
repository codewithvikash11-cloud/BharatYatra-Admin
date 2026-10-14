import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '../../../../lib/admin-auth.js';

const MUTATIONS = new Set(['POST', 'PATCH', 'DELETE']);
const CONTENT_TYPES = ['destinations', 'attractions', 'articles', 'itineraries', 'states', 'districts', 'tehsils'];
const allowed = new Set(['session', 'overview', 'audit-logs', 'media', ...CONTENT_TYPES]);

async function forward(request, context) {
  const { path = [] } = await context.params;
  const resource = path[0];
  const validPath = resource === 'media'
    ? path.length === 1 || (path.length === 2 && (path[1] === 'upload' || /^[0-9a-f-]{36}$/i.test(path[1])))
    : (CONTENT_TYPES.includes(resource) ? path.length >= 1 && path.length <= 3 : path.length === 1);
  if (!allowed.has(resource) || !validPath || path.some((part) => part === '..')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (MUTATIONS.has(request.method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    const configured = process.env.ADMIN_ORIGIN;
    let allowedOrigin = false;
    if (origin) {
      try {
        const originUrl = new URL(origin);
        if (configured && originUrl.origin === new URL(configured).origin) allowedOrigin = true;
        if (host && (originUrl.host === host || originUrl.hostname === host)) allowedOrigin = true;
      } catch {}
    }
    if (!allowedOrigin && configured) {
      return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
    }
  }

  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!verifyAdminSession(token, process.env)) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const apiBase = process.env.ADMIN_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:4000/api/v1' : 'https://bharat-yatra-in-bc-api.vercel.app/api/v1');
    if (!apiBase) return NextResponse.json({ error: 'Admin API is not configured' }, { status: 503 });

    const target = new URL(`${apiBase.replace(/\/+$/, '')}/admin/${path.map(encodeURIComponent).join('/')}`);
    target.search = request.nextUrl.search;
    const headers = { authorization: `Bearer ${token}`, accept: 'application/json' };
    let body;
    if (MUTATIONS.has(request.method)) {
      const contentType = request.headers.get('content-type') || 'application/json';
      headers['content-type'] = contentType;
      if (contentType.toLowerCase().startsWith('application/octet-stream')) {
        body = await request.arrayBuffer();
        if (body.byteLength > 5 * 1024 * 1024) return NextResponse.json({ error: 'Request too large' }, { status: 413 });
      } else {
        body = await request.text();
        if (body.length > 1024 * 1024) return NextResponse.json({ error: 'Request too large' }, { status: 413 });
      }
      const filename = request.headers.get('x-file-name');
      if (filename) headers['x-file-name'] = filename.slice(0, 200);
    }
    const upstream = await fetch(target, { method: request.method, headers, body, cache: 'no-store', signal: AbortSignal.timeout(15000) });
    return new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') || 'application/json',
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
        'referrer-policy': 'no-referrer',
      },
    });
  } catch (err) {
    console.error('Admin API forward error:', err);
    return NextResponse.json({ error: 'Admin service unavailable' }, { status: 503 });
  }
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const DELETE = forward;
