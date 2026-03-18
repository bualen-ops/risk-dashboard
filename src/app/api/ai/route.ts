import { NextResponse } from 'next/server';
import { aiResponseSchema } from '@/lib/aiSchema';

function resolveUpstreamUrl() {
  const explicit = (process.env.RISK_AI_API_BASE_URL || '').trim();
  if (explicit) return explicit;
  const baseRisks = (process.env.RISK_API_BASE_URL || '').trim();
  if (!baseRisks) return '';
  try {
    const u = new URL(baseRisks);
    u.pathname = u.pathname.replace(/\/risks\/?$/, '/ai');
    return u.toString();
  } catch {
    return baseRisks.replace(/\/risks\/?$/, '/ai');
  }
}

export async function GET(req: Request) {
  try {
    const baseUrl = resolveUpstreamUrl();
    const token = (process.env.RISK_API_TOKEN || 'risk_api_alenos_2026_03_18_k9f3w7x2p8m4').trim();
    const url = new URL(req.url);
    const code = (url.searchParams.get('code') || '').replace(/\s+/g, ' ').trim();

    if (!baseUrl) {
      return NextResponse.json(
        { error: 'Missing env: RISK_AI_API_BASE_URL (or RISK_API_BASE_URL)' },
        { status: 500 },
      );
    }
    if (!token) {
      return NextResponse.json(
        { error: 'Missing env: RISK_API_TOKEN' },
        { status: 500 },
      );
    }
    if (!code) {
      return NextResponse.json(
        { error: 'Missing query param: code' },
        { status: 400 },
      );
    }

    const upstream = new URL(baseUrl);
    upstream.searchParams.set('code', code);

    const res = await fetch(upstream.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: json?.error || `Upstream error (${res.status})` },
        { status: 502 },
      );
    }

    const parsed = aiResponseSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Bad upstream payload', issues: parsed.error.issues },
        { status: 502 },
      );
    }

    return NextResponse.json(parsed.data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
