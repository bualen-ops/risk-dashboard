import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get('q') || '').trim();

    const baseUrl = (process.env.RISK_API_BASE_URL || '').trim();
    const token = (process.env.RISK_API_TOKEN || 'risk_api_alenos_2026_03_18_k9f3w7x2p8m4').trim();

    if (!baseUrl) {
      return NextResponse.json(
        { error: 'Missing env: RISK_API_BASE_URL' },
        { status: 500 },
      );
    }
    if (!token) {
      return NextResponse.json(
        { error: 'Missing env: RISK_API_TOKEN' },
        { status: 500 },
      );
    }

    const upstream = new URL(baseUrl);
    if (q) upstream.searchParams.set('q', q);

    const res = await fetch(upstream.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: json?.error || `Upstream error (${res.status})`, upstream: upstream.toString() },
        { status: 502 },
      );
    }

    return NextResponse.json({ items: json.items || [] });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || String(e) },
      { status: 500 },
    );
  }
}

