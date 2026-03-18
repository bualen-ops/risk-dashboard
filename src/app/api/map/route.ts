import { NextResponse } from 'next/server';
import { mapResponseSchema } from '@/lib/mapSchema';

function resolveUpstreamUrl() {
  const explicit = (process.env.RISK_MAP_API_BASE_URL || '').trim();
  if (explicit) return explicit;

  const baseRisks = (process.env.RISK_API_BASE_URL || '').trim();
  if (!baseRisks) return '';

  // Best-effort derive: .../risk-api/risks -> .../risk-api/map
  try {
    const u = new URL(baseRisks);
    u.pathname = u.pathname.replace(/\/risks\/?$/, '/map');
    return u.toString();
  } catch {
    return baseRisks.replace(/\/risks\/?$/, '/map');
  }
}

export async function GET(req: Request) {
  try {
    const baseUrl = resolveUpstreamUrl();
    const token = (process.env.RISK_API_TOKEN || '').trim();

    if (!baseUrl) {
      return NextResponse.json(
        { error: 'Missing env: RISK_MAP_API_BASE_URL (or RISK_API_BASE_URL)' },
        { status: 500 },
      );
    }
    if (!token) {
      return NextResponse.json(
        { error: 'Missing env: RISK_API_TOKEN' },
        { status: 500 },
      );
    }

    const url = new URL(req.url);
    const q = (url.searchParams.get('q') || '').trim();
    const minScoreRaw = (url.searchParams.get('minScore') || '').trim();

    const upstream = new URL(baseUrl);
    if (q) upstream.searchParams.set('q', q);
    if (minScoreRaw) upstream.searchParams.set('minScore', minScoreRaw);

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

    // Normalize shape to { items: [...] }
    const parsed = mapResponseSchema.safeParse({ items: json?.items || [] });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Bad upstream payload', issues: parsed.error.issues },
        { status: 502 },
      );
    }

    const items = parsed.data.items.map((p) => ({
      ...p,
      score: typeof p.score === 'number' ? p.score : p.probability * p.impact,
    }));

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || String(e) },
      { status: 500 },
    );
  }
}

