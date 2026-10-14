import { NextResponse } from 'next/server';
import { createHmac } from 'node:crypto';

export async function GET(request) {
  try {
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
    const webOrigin = process.env.WEB_ORIGIN || 'http://localhost:3000';
    const previewUrl = `${webOrigin.replace(/\/+$/, '')}/preview/${encodeURIComponent(type)}/${encodeURIComponent(slug)}?token=${previewToken}`;

    return NextResponse.json({ token: previewToken, previewUrl });
  } catch {
    return NextResponse.json({ error: 'Failed to generate preview token' }, { status: 500 });
  }
}
