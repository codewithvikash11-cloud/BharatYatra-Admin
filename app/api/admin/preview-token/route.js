import { NextResponse } from 'next/server';
import { createHmac } from 'node:crypto';
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '../../../../lib/admin-auth.js';

export async function GET(request) {
  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!verifyAdminSession(token, process.env)) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const slug = searchParams.get('slug');

    if (!type || !slug) {
      return NextResponse.json({ error: 'type and slug required' }, { status: 400 });
    }

    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Secret not configured' }, { status: 500 });
    }

    // Generate secure preview token valid for this type and slug
    const previewToken = createHmac('sha256', secret).update(`${type}:${slug}`).digest('hex');
    const webOrigin = process.env.WEB_ORIGIN || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://bharat-yatra-in.vercel.app');
    const previewUrl = `${webOrigin.replace(/\/+$/, '')}/preview/${encodeURIComponent(type)}/${encodeURIComponent(slug)}?token=${previewToken}`;

    return NextResponse.json({ token: previewToken, previewUrl });
  } catch {
    return NextResponse.json({ error: 'Failed to generate preview token' }, { status: 500 });
  }
}
