import test from 'node:test';
import assert from 'node:assert/strict';
import { ADMIN_SESSION_COOKIE, createAdminActorId, issueAdminSession } from '@bharatyatra/admin-auth';
import { hasValidAdminSession } from '../lib/proxy-auth.mjs';

const originalEmail=process.env.ADMIN_EMAIL;
const originalSecret=process.env.ADMIN_SESSION_SECRET;
process.env.ADMIN_EMAIL='admin@example.invalid';
process.env.ADMIN_SESSION_SECRET='test-only-session-secret-which-is-long-enough';

test('rejects unauthenticated dashboard requests',()=>{
  assert.equal(hasValidAdminSession(undefined,process.env),false);
});

test('accepts protected dashboard requests carrying a valid admin session',()=>{
  const principal={id:createAdminActorId(process.env.ADMIN_EMAIL),email:process.env.ADMIN_EMAIL,role:'admin'};
  const token=issueAdminSession(principal,process.env);
  assert.equal(hasValidAdminSession(token,process.env),true);
  assert.equal(ADMIN_SESSION_COOKIE,'by_admin_session');
});

test.after(()=>{
  if(originalEmail===undefined)delete process.env.ADMIN_EMAIL;
  else process.env.ADMIN_EMAIL=originalEmail;
  if(originalSecret===undefined)delete process.env.ADMIN_SESSION_SECRET;
  else process.env.ADMIN_SESSION_SECRET=originalSecret;
});