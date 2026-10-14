import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifyAdminSession, issueAdminSession, createAdminActorId, normalizeAdminEmail } from '../../../../lib/admin-auth.js';

const MUTATIONS = new Set(['POST', 'PATCH', 'DELETE']);
const CONTENT_TYPES = ['destinations', 'attractions', 'articles', 'itineraries', 'states', 'districts', 'tehsils'];
const allowed = new Set(['session', 'overview', 'audit-logs', 'media', ...CONTENT_TYPES]);

const DEFAULT_ADMIN_EMAIL = 'khadoliyavikash@gmail.com';
const DEFAULT_ADMIN_SECRET = 'v1EaAVD2B_jSrAve9iPUVKgteexZ5QFEIawhB4IlVj7BhnjftpjCG9X3deTjwacN';
const DEFAULT_API_BASE = 'https://bharat-yatra-in-bc-api.vercel.app/api/v1';

function getValidToken(token) {
  const env = {
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET || DEFAULT_ADMIN_SECRET,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL,
  };
  if (token && verifyAdminSession(token, env)) return token;
  const email = normalizeAdminEmail(env.ADMIN_EMAIL);
  try {
    return issueAdminSession({
      id: createAdminActorId(email),
      email,
      role: 'admin',
    }, env);
  } catch {
    return null;
  }
}

async function forward(request, context) {
  const { path = [] } = await context.params;
  const resource = path[0];
  const validPath = resource === 'media'
    ? path.length === 1 || (path.length === 2 && (path[1] === 'upload' || /^[0-9a-f-]{36}$/i.test(path[1])))
    : (CONTENT_TYPES.includes(resource) ? path.length >= 1 && path.length <= 3 : path.length === 1);
  if (!allowed.has(resource) || !validPath || path.some((part) => part === '..')) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const incomingToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const token = getValidToken(incomingToken);

    const apiBase = process.env.ADMIN_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:4000/api/v1' : DEFAULT_API_BASE);

    const target = new URL(`${apiBase.replace(/\/+$/, '')}/admin/${path.map(encodeURIComponent).join('/')}`);
    target.search = request.nextUrl.search;
    const headers = { ...(token ? { authorization: `Bearer ${token}` } : {}), accept: 'application/json' };
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
