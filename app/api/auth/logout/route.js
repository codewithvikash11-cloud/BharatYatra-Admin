import { ADMIN_SESSION_COOKIE, adminSessionCookieOptions } from '@bharatyatra/admin-auth';

export async function POST(request) {
  const origin=request.headers.get('origin');
  const expectedOrigin=process.env.ADMIN_ORIGIN||new URL(request.url).origin;
  try {
    if(!origin||new URL(origin).origin!==new URL(expectedOrigin).origin)return new Response('Forbidden',{status:403});
  } catch {
    return new Response('Forbidden',{status:403});
  }

  const options=adminSessionCookieOptions();
  const response=new Response(null,{status:303,headers:{location:new URL('/',request.url).toString()}});
  const secure=options.secure?'; Secure':'';
  response.headers.append('set-cookie',`${ADMIN_SESSION_COOKIE}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax${secure}`);
  return response;
}