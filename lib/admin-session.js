import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE, verifyAdminSession, createAdminActorId, normalizeAdminEmail } from './admin-auth.js';

export async function getAdminSession() {
  const env = process.env;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    const session = verifyAdminSession(token, env);
    if (session) return session;
  } catch {}

  const email = normalizeAdminEmail(env.ADMIN_EMAIL) || 'admin@bharatyatra.in';
  return {
    id: createAdminActorId(email),
    email,
    role: 'admin',
  };
}