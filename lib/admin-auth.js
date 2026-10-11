import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';

export const ADMIN_SESSION_COOKIE = 'by_admin_session';
export const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;

const SESSION_ISSUER = 'bharatyatra-admin';
const BCRYPT_HASH = /^\$2[ab]\$(?:1[2-9]|2\d|3[01])\$[./A-Za-z0-9]{53}$/;
const MAX_PASSWORD_BYTES = 72;

export function normalizeAdminEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

export function hasAdminSessionSecret(env = process.env) {
  return typeof env.ADMIN_SESSION_SECRET === 'string' && Buffer.byteLength(env.ADMIN_SESSION_SECRET) >= 32;
}

export function createAdminActorId(email) {
  const bytes = createHash('sha256').update(`bharatyatra-admin:${normalizeAdminEmail(email)}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function hashAdminPassword(password, cost = 12) {
  const passwordBytes = typeof password === 'string' ? Buffer.byteLength(password, 'utf8') : 0;
  if (typeof password !== 'string' || passwordBytes < 16 || passwordBytes > MAX_PASSWORD_BYTES) {
    throw new Error('Choose a password between 16 and 72 UTF-8 bytes.');
  }
  if (!Number.isInteger(cost) || cost < 12 || cost > 15) throw new Error('Invalid password hash cost.');
  return bcrypt.hash(password, cost);
}

export async function verifyAdminCredentials(email, password, env = process.env) {
  const configuredEmail = normalizeAdminEmail(env.ADMIN_EMAIL);
  const suppliedEmail = normalizeAdminEmail(email);
  const hash = typeof env.ADMIN_PASSWORD_HASH === 'string' ? env.ADMIN_PASSWORD_HASH : '';
  const hashIsValid = BCRYPT_HASH.test(hash);
  const secretIsValid = hasAdminSessionSecret(env);
  const passwordText = typeof password === 'string' ? password : '';
  const passwordWithinLimit = Buffer.byteLength(passwordText, 'utf8') <= MAX_PASSWORD_BYTES;
  let passwordMatches = false;

  if (hashIsValid) {
    try {
      passwordMatches = await bcrypt.compare(passwordWithinLimit ? passwordText : '', hash);
    } catch {
      passwordMatches = false;
    }
  }

  if (!configuredEmail || !suppliedEmail || !secretIsValid || !hashIsValid || !passwordWithinLimit || suppliedEmail !== configuredEmail || !passwordMatches) return null;

  return {
    id: createAdminActorId(configuredEmail),
    email: configuredEmail,
    role: 'admin',
  };
}

function sign(payload, secret) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function issueAdminSession(principal, env = process.env, now = Date.now()) {
  if (!hasAdminSessionSecret(env)) throw new Error('Admin session is not configured.');
  const email = normalizeAdminEmail(env.ADMIN_EMAIL);
  if (!email || principal?.email !== email || principal?.id !== createAdminActorId(email)) throw new Error('Invalid admin principal.');

  const issuedAt = Math.floor(now / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss: SESSION_ISSUER,
    sub: principal.id,
    email,
    role: 'admin',
    iat: issuedAt,
    exp: issuedAt + ADMIN_SESSION_TTL_SECONDS,
  })).toString('base64url');

  return `${payload}.${sign(payload, env.ADMIN_SESSION_SECRET)}`;
}

export function verifyAdminSession(token, env = process.env, now = Date.now()) {
  if (!hasAdminSessionSecret(env) || typeof token !== 'string' || token.length > 2048) return null;
  const parts = token.split('.');
  if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !/^[A-Za-z0-9_-]+$/.test(parts[1])) return null;

  const expectedSignature = Buffer.from(sign(parts[0], env.ADMIN_SESSION_SECRET), 'base64url');
  const suppliedSignature = Buffer.from(parts[1], 'base64url');
  if (expectedSignature.length !== suppliedSignature.length || !timingSafeEqual(expectedSignature, suppliedSignature)) return null;

  try {
    const session = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    const nowSeconds = Math.floor(now / 1000);
    const email = normalizeAdminEmail(env.ADMIN_EMAIL);
    if (session.iss !== SESSION_ISSUER || session.email !== email || session.sub !== createAdminActorId(email) || session.role !== 'admin') return null;
    if (!Number.isInteger(session.iat) || !Number.isInteger(session.exp) || session.iat > nowSeconds + 60) return null;
    if (session.exp <= nowSeconds || session.exp - session.iat > ADMIN_SESSION_TTL_SECONDS) return null;
    return { id: session.sub, email, role: 'admin', expiresAt: session.exp };
  } catch {
    return null;
  }
}

export function adminSessionCookieOptions({ production = process.env.NODE_ENV === 'production', maxAge = ADMIN_SESSION_TTL_SECONDS } = {}) {
  return { httpOnly: true, sameSite: 'lax', secure: production, path: '/', maxAge };
}

export function createLoginRateLimiter({ maxAttempts = 5, windowMs = 15 * 60 * 1000, maxKeys = 10000 } = {}) {
  const failures = new Map();

  function prune(now) {
    for (const [key, entry] of failures) if (entry.resetAt <= now) failures.delete(key);
    while (failures.size >= maxKeys) failures.delete(failures.keys().next().value);
  }

  return {
    isBlocked(key, now = Date.now()) {
      const entry = failures.get(key);
      if (!entry || entry.resetAt <= now) {
        failures.delete(key);
        return false;
      }
      return entry.count >= maxAttempts;
    },
    recordFailure(key, now = Date.now()) {
      prune(now);
      const entry = failures.get(key);
      if (!entry || entry.resetAt <= now) failures.set(key, { count: 1, resetAt: now + windowMs });
      else entry.count += 1;
    },
    reset(key) {
      failures.delete(key);
    },
  };
}