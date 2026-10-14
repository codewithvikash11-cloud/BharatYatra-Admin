import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE, verifyAdminSession, issueAdminSession, createAdminActorId, normalizeAdminEmail } from './admin-auth.js';

export async function adminApiFetch(path, options = {}) {
  const env = process.env;
  let token;
  try {
    const cookieStore = await cookies();
    token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    if (!verifyAdminSession(token, env)) {
      token = null;
    }
  } catch {}

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

  const base = env.ADMIN_API_URL || env.NEXT_PUBLIC_API_BASE_URL || (env.NODE_ENV === 'development' ? 'http://localhost:4000/api/v1' : 'https://bharat-yatra-in-bc-api.vercel.app/api/v1');
  if (!base) throw new Error('Admin API unavailable');

  return fetch(`${base.replace(/\/$/, '')}/admin/${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });
}
