import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE } from '@bharatyatra/admin-auth';
import { hasValidAdminSession } from './lib/proxy-auth.mjs';

export async function proxy(request){
  const response=NextResponse.next({request});
  response.headers.set('X-Content-Type-Options','nosniff');
  response.headers.set('X-Frame-Options','DENY');
  response.headers.set('Referrer-Policy','no-referrer');
  response.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  if(request.nextUrl.pathname==='/')return response;
  const token=request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if(!hasValidAdminSession(token,process.env))return NextResponse.redirect(new URL('/',request.url));
  return response;
}

export const config={matcher:['/','/dashboard/:path*','/content/:path*','/media/:path*','/audit/:path*']};
