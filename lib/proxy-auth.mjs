export async function hasValidAdminSession(token, env = process.env) {
  if (typeof token !== 'string' || !env.ADMIN_SESSION_SECRET || env.ADMIN_SESSION_SECRET.length < 32) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [b64Payload, signatureHex] = parts;

  try {
    const sessionStr = Buffer.from(b64Payload, 'base64url').toString('utf8');
    const session = JSON.parse(sessionStr);
    const issuedAt = parseInt(session.iat, 10);
    if (isNaN(issuedAt) || Date.now() / 1000 - issuedAt > 8 * 60 * 60) return false;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(env.ADMIN_SESSION_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    // The signature from admin-auth is base64url, so we need to decode it.
    const signatureBytes = Buffer.from(signatureHex, 'base64url');
    const data = enc.encode(b64Payload);
    
    return await crypto.subtle.verify('HMAC', key, signatureBytes, data);
  } catch {
    return false;
  }
}