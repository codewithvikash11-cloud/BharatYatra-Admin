import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@bharatyatra/admin-auth';

export async function adminApiFetch(path,options={}){
  const cookieStore=await cookies();
  const token=cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if(!verifyAdminSession(token,process.env))throw new Error('Admin session unavailable');
  const base=process.env.NEXT_PUBLIC_API_BASE_URL;
  if(!base)throw new Error('Admin API unavailable');
  return fetch(`${base.replace(/\/$/,'')}/admin/${path}`,{...options,headers:{...(options.headers||{}),authorization:`Bearer ${token}`},cache:'no-store'});
}
