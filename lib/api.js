import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE, verifyAdminSession, issueAdminSession, createAdminActorId, normalizeAdminEmail } from './admin-auth.js';

const DEFAULT_ADMIN_EMAIL = 'khadoliyavikash@gmail.com';
const DEFAULT_ADMIN_SECRET = 'v1EaAVD2B_jSrAve9iPUVKgteexZ5QFEIawhB4IlVj7BhnjftpjCG9X3deTjwacN';
const DEFAULT_API_BASE = 'https://bharat-yatra-in-bc-api.vercel.app/api/v1';

export async function adminApiFetch(path, options = {}) {
  const env = {
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET || DEFAULT_ADMIN_SECRET,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL,
  };

  let token;
  try {
    const cookieStore = await cookies();
    token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    if (!verifyAdminSession(token, env)) {
      token = null;
    }
  } catch {}

  if (!token) {
    const email = normalizeAdminEmail(env.ADMIN_EMAIL);
    try {
      token = issueAdminSession({
        id: createAdminActorId(email),
        email,
        role: 'admin',
      }, env);
    } catch {}
  }

  const base = process.env.ADMIN_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:4000/api/v1' : DEFAULT_API_BASE);

  return fetch(`${base.replace(/\/$/, '')}/admin/${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });
}
