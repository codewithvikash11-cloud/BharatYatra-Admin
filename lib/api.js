import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE, verifyAdminSession, issueAdminSession, createAdminActorId, normalizeAdminEmail } from './admin-auth.js';

export async function adminApiFetch(path, options = {}) {
  let token;
  try {
    const cookieStore = await cookies();
    token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    if (!verifyAdminSession(token, process.env)) {
      token = null;
    }
  } catch {}

  if (!token) {
    const email = normalizeAdminEmail(process.env.ADMIN_EMAIL || 'admin@bharatyatra.in');
    try {
      token = issueAdminSession({
        id: createAdminActorId(email),
        email,
        role: 'admin',
      }, process.env);
    } catch {}
  }

  const base = process.env.ADMIN_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:4000/api/v1' : process.env.NEXT_PUBLIC_API_BASE_URL);
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
