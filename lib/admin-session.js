import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE, verifyAdminSession, createAdminActorId, normalizeAdminEmail } from './admin-auth.js';

export const DEFAULT_ADMIN_EMAIL = 'khadoliyavikash@gmail.com';
export const DEFAULT_ADMIN_SECRET = 'v1EaAVD2B_jSrAve9iPUVKgteexZ5QFEIawhB4IlVj7BhnjftpjCG9X3deTjwacN';

const env = {
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL,
  ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET || DEFAULT_ADMIN_SECRET,
};

export const DEFAULT_ADMIN_SESSION = {
  id: createAdminActorId(env.ADMIN_EMAIL),
  email: normalizeAdminEmail(env.ADMIN_EMAIL),
  role: 'admin',
};

export async function getAdminSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    const session = verifyAdminSession(token, env);
    if (session) return session;
  } catch {}
  return DEFAULT_ADMIN_SESSION;
}