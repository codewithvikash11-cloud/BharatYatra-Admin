import { NextResponse } from 'next/server';
import { hasValidAdminSession } from './lib/proxy-auth.mjs';

const ADMIN_SESSION_COOKIE = 'by_admin_session';

export async function proxy(request){
  const response=NextResponse.next({request});
  response.headers.set('X-Content-Type-Options','nosniff');
  response.headers.set('X-Frame-Options','DENY');
  response.headers.set('Referrer-Policy','no-referrer');
  response.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  if(request.nextUrl.pathname==='/')return response;
  const token=request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if(!(await hasValidAdminSession(token,process.env)))return NextResponse.redirect(new URL('/',request.url));
  return response;
}

export const config={matcher:['/','/dashboard/:path*','/content/:path*','/media/:path*','/audit/:path*']};
