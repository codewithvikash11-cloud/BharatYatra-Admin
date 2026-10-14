import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE, verifyAdminSession, createAdminActorId, normalizeAdminEmail } from './admin-auth.js';

export const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@bharatyatra.in';
export const DEFAULT_ADMIN_SESSION = {
  id: createAdminActorId(DEFAULT_ADMIN_EMAIL),
  email: normalizeAdminEmail(DEFAULT_ADMIN_EMAIL),
  role: 'admin',
};

export async function getAdminSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    const session = verifyAdminSession(token, process.env);
    if (session) return session;
  } catch {}
  return DEFAULT_ADMIN_SESSION;
}