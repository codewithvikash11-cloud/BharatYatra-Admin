'use server';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createLoginRateLimiter,
  issueAdminSession,
  verifyAdminCredentials,
} from '@bharatyatra/admin-auth';

const loginLimiter=createLoginRateLimiter();
const LOGIN_ERROR='Invalid email or password. Try again later.';

export async function signInAction(_previous,formData){
  const email=String(formData.get('email')||'').trim();
  const password=String(formData.get('password')||'');
  const requestHeaders=await headers();
  const clientKey=requestHeaders.get('x-forwarded-for')?.split(',')[0].trim()||requestHeaders.get('x-real-ip')||'unknown';
  if(loginLimiter.isBlocked(clientKey))return {error:LOGIN_ERROR};
  const principal=await verifyAdminCredentials(email,password,process.env);
  if(!principal){loginLimiter.recordFailure(clientKey);return {error:LOGIN_ERROR};}
  const token=issueAdminSession(principal,process.env);
  const cookieStore=await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE,token,adminSessionCookieOptions());
  loginLimiter.reset(clientKey);
  redirect('/dashboard');
}
