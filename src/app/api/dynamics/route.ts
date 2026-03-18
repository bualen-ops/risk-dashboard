import { NextResponse } from 'next/server';
import { dynamicsResponseSchema } from '@/lib/dynamicsSchema';

function resolveUpstreamUrl() {
  const explicit = (process.env.RISK_DYNAMICS_API_BASE_URL || '').trim();
  if (explicit) return explicit;

  const baseRisks = (process.env.RISK_API_BASE_URL || '').trim();
  if (!baseRisks) return '';

  // Best-effort derive: .../risk-api/risks -> .../risk-api/dynamics
  try {
    const u = new URL(baseRisks);
    u.pathname = u.pathname.replace(/\/risks\/?$/, '/dynamics');
    return u.toString();
  } catch {
    return baseRisks.replace(/\/risks\/?$/, '/dynamics');
  }
}

export async function GET(req: Request) {
  try {
    const baseUrl = resolveUpstreamUrl();
    const token = (process.env.RISK_API_TOKEN || '').trim();
    const url = new URL(req.url);
    const code = (url.searchParams.get('code') || '').trim();

    if (!baseUrl) {
      return NextResponse.json(
        { error: 'Missing env: RISK_DYNAMICS_API_BASE_URL (or RISK_API_BASE_URL)' },
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
        { error: json?.error || `Upstream error (${res.status})`, upstream: upstream.toString() },
        { status: 502 },
      );
    }

    const parsed = dynamicsResponseSchema.safeParse({ items: json?.items || [] });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Bad upstream payload', issues: parsed.error.issues },
        { status: 502 },
      );
    }

    const items = parsed.data.items
      .map((p) => ({
        ...p,
        score: typeof p.score === 'number' ? p.score : p.probability * p.impact,
      }))
      .sort((a, b) => a.ts.localeCompare(b.ts));

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || String(e) },
      { status: 500 },
    );
  }
}

