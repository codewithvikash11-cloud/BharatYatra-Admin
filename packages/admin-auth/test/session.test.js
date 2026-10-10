import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_SESSION_TTL_SECONDS,
  adminSessionCookieOptions,
  createAdminActorId,
  createLoginRateLimiter,
  hashAdminPassword,
  issueAdminSession,
  verifyAdminCredentials,
  verifyAdminSession,
} from '../src/index.js';

const password = 'Test-only-Passphrase-752!';
const env = {
  ADMIN_EMAIL: 'khadoliyavikash@gmail.com',
  ADMIN_PASSWORD_HASH: '',
  ADMIN_SESSION_SECRET: 'test-only-session-secret-which-is-long-enough',
};

test('accepts configured email and password hash, then verifies a signed session', async () => {
  const configured = { ...env, ADMIN_PASSWORD_HASH: await hashAdminPassword(password) };
  const principal = await verifyAdminCredentials('  KHADOLIYAVIKASH@gmail.com ', password, configured);
  assert.deepEqual(principal, { id: createAdminActorId(configured.ADMIN_EMAIL), email: configured.ADMIN_EMAIL, role: 'admin' });

  const now = Date.now();
  const token = issueAdminSession(principal, configured, now);
  assert.deepEqual(verifyAdminSession(token, configured, now), {
    ...principal,
    expiresAt: Math.floor(now / 1000) + ADMIN_SESSION_TTL_SECONDS,
  });
});

test('rejects an incorrect email or password without revealing which was wrong', async () => {
  const configured = { ...env, ADMIN_PASSWORD_HASH: await hashAdminPassword(password) };
  assert.equal(await verifyAdminCredentials('someone@example.com', password, configured), null);
  assert.equal(await verifyAdminCredentials(configured.ADMIN_EMAIL, 'Incorrect-Passphrase-753!', configured), null);
});

test('rejects tampered, expired, and differently configured sessions', async () => {
  const configured = { ...env, ADMIN_PASSWORD_HASH: await hashAdminPassword(password) };
  const principal = await verifyAdminCredentials(configured.ADMIN_EMAIL, password, configured);
  const now = Date.now();
  const token = issueAdminSession(principal, configured, now);
  const [payload, signature] = token.split('.');
  const tampered = `${payload}.${signature.slice(0, -1)}${signature.endsWith('A') ? 'B' : 'A'}`;

  assert.equal(verifyAdminSession(tampered, configured, now), null);
  assert.equal(verifyAdminSession(token, configured, now + (ADMIN_SESSION_TTL_SECONDS + 1) * 1000), null);
  assert.equal(verifyAdminSession(token, { ...configured, ADMIN_SESSION_SECRET: 'another-long-session-secret-value' }, now), null);
  assert.equal(verifyAdminSession(token, { ...configured, ADMIN_EMAIL: 'other@example.com' }, now), null);
});

test('uses HttpOnly, SameSite=Lax cookies and Secure in production', () => {
  assert.deepEqual(adminSessionCookieOptions({ production: true }), {
    httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: ADMIN_SESSION_TTL_SECONDS,
  });
  assert.equal(adminSessionCookieOptions({ production: false }).secure, false);
});

test('limits repeated failures per key and expires the window', () => {
  const limiter = createLoginRateLimiter({ maxAttempts: 2, windowMs: 1000 });
  limiter.recordFailure('client-a', 1000);
  assert.equal(limiter.isBlocked('client-a', 1000), false);
  limiter.recordFailure('client-a', 1100);
  assert.equal(limiter.isBlocked('client-a', 1100), true);
  assert.equal(limiter.isBlocked('client-a', 2100), false);
  limiter.recordFailure('client-b', 2100);
  limiter.reset('client-b');
  assert.equal(limiter.isBlocked('client-b', 2100), false);
});