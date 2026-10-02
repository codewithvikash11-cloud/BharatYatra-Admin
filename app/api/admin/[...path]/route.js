import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@bharatyatra/admin-auth';

const MUTATIONS=new Set(['POST','PATCH','DELETE']);
async function forward(request,context){
  const {path=[]}=await context.params;
  const allowed=new Set(['session','overview','audit-logs','media','destinations','attractions','articles']);
  const resource=path[0];
  const validPath=resource==='media'?path.length===1||(path.length===2&&(path[1]==='upload'||/^[0-9a-f-]{36}$/i.test(path[1]))):(['destinations','attractions','articles'].includes(resource)?path.length>=1&&path.length<=3:path.length===1);
  if(!allowed.has(resource)||!validPath||path.some((part)=>part==='..')) return NextResponse.json({error:'Not found'},{status:404});
  if(MUTATIONS.has(request.method)){
    const origin=request.headers.get('origin');
    const configured=process.env.ADMIN_ORIGIN;
    if(!origin||!configured||new URL(origin).origin!==new URL(configured).origin) return NextResponse.json({error:'Origin not allowed'},{status:403});
  }
  try{
    const token=request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if(!verifyAdminSession(token,process.env)) return NextResponse.json({error:'Authentication required'},{status:401});
    const apiBase=process.env.NEXT_PUBLIC_API_BASE_URL;
    if(!apiBase) return NextResponse.json({error:'Admin API is not configured'},{status:503});
    const target=new URL(`/admin/${path.map(encodeURIComponent).join('/')}`,apiBase.replace(/\/$/,''));
    target.search=request.nextUrl.search;
    const headers={authorization:`Bearer ${token}`,accept:'application/json'};
    let body;
    if(MUTATIONS.has(request.method)){
      const contentType=request.headers.get('content-type')||'application/json';
      headers['content-type']=contentType;
      if(contentType.toLowerCase().startsWith('application/octet-stream')){body=await request.arrayBuffer();if(body.byteLength>5*1024*1024)return NextResponse.json({error:'Request too large'},{status:413});}
      else{body=await request.text();if(body.length>1024*1024)return NextResponse.json({error:'Request too large'},{status:413});}
      const filename=request.headers.get('x-file-name');if(filename)headers['x-file-name']=filename.slice(0,200);
    }
    const upstream=await fetch(target,{method:request.method,headers,body,cache:'no-store',signal:AbortSignal.timeout(12000)});
    return new NextResponse(await upstream.text(),{status:upstream.status,headers:{'content-type':upstream.headers.get('content-type')||'application/json','cache-control':'no-store','x-content-type-options':'nosniff','x-frame-options':'DENY','referrer-policy':'no-referrer'}});
  }catch{return NextResponse.json({error:'Admin service unavailable'},{status:503});}
}
export const GET=forward;
export const POST=forward;
export const PATCH=forward;
