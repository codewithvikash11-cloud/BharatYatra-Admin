import test from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../app/api/auth/logout/route.js';

test('logout expires the HttpOnly admin session cookie and redirects to sign-in',async()=>{
  const originalOrigin=process.env.ADMIN_ORIGIN;
  process.env.ADMIN_ORIGIN='http://localhost:3001';
  try{
    const request=new Request('http://localhost:3001/api/auth/logout',{method:'POST',headers:{origin:'http://localhost:3001'}});
    const response=await POST(request);
    const cookie=response.headers.get('set-cookie')||'';
    assert.equal(response.status,303);
    assert.equal(response.headers.get('location'),'http://localhost:3001/');
    assert.match(cookie,/by_admin_session=/);
    assert.match(cookie,/Max-Age=0/i);
    assert.match(cookie,/HttpOnly/i);
    assert.match(cookie,/SameSite=lax/i);
  }finally{
    if(originalOrigin===undefined)delete process.env.ADMIN_ORIGIN;
    else process.env.ADMIN_ORIGIN=originalOrigin;
  }
});

test('logout rejects cross-origin requests',async()=>{
  const originalOrigin=process.env.ADMIN_ORIGIN;
  process.env.ADMIN_ORIGIN='http://localhost:3001';
  try{
    const request=new Request('http://localhost:3001/api/auth/logout',{method:'POST',headers:{origin:'https://attacker.example'}});
    const response=await POST(request);
    assert.equal(response.status,403);
    assert.equal(response.headers.has('set-cookie'),false);
  }finally{
    if(originalOrigin===undefined)delete process.env.ADMIN_ORIGIN;
    else process.env.ADMIN_ORIGIN=originalOrigin;
  }
});