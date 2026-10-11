import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from './admin-auth.js';

export async function getAdminSession() {
  const cookieStore = await cookies();
  return verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value, process.env);
}