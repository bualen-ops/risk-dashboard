'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { MapPoint } from '@/lib/mapSchema';

function level(score: number) {
  if (score >= 16) return { label: 'Высокий', dot: '#ef4444' }; // red-500
  if (score >= 9) return { label: 'Средний', dot: '#f59e0b' }; // amber-500
  return { label: 'Низкий', dot: '#10b981' }; // emerald-500
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

type DrawPoint = MapPoint & {
  score: number;
  x: number;
  y: number;
  color: string;
};

export default function MapPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const [items, setItems] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [q, setQ] = useState('');
  const [minScore, setMinScore] = useState<number>(0);
  const [hover, setHover] = useState<DrawPoint | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const url = new URL('/api/map', window.location.origin);
      if (q.trim()) url.searchParams.set('q', q.trim());
      if (minScore > 0) url.searchParams.set('minScore', String(minScore));
      const res = await fetch(url.toString(), { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load');
      setItems(Array.isArray(json.items) ? json.items : []);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const points = useMemo(() => {
    const filtered = items
      .map((p) => ({
        ...p,
        risk_name: p.risk_name || '',
        probability: Number(p.probability || 0),
        impact: Number(p.impact || 0),
        score: Number((p as any).score ?? (Number(p.probability || 0) * Number(p.impact || 0))),
      }))
      .filter((p) => (minScore ? p.score >= minScore : true))
      .filter((p) => {
        const qq = q.trim().toLowerCase();
        if (!qq) return true;
        return (
          String(p.risk_code).toLowerCase().includes(qq) ||
          String(p.risk_name).toLowerCase().includes(qq)
        );
      });

    const maxP = Math.max(1, ...filtered.map((p) => p.probability));
    const maxI = Math.max(1, ...filtered.map((p) => p.impact));

    return { filtered, maxP, maxI };
  }, [items, minScore, q]);

  function draw() {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const rect = wrap.getBoundingClientRect();
    const cssW = Math.max(320, Math.floor(rect.width));
    const cssH = 520;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    // Layout
    const padL = 56;
    const padR = 18;
    const padT = 18;
    const padB = 44;
    const w = cssW - padL - padR;
    const h = cssH - padT - padB;

    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, cssW, cssH);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const x = padL + (w * i) / 5;
      const y = padT + (h * i) / 5;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + w, y);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(255,255,255,0.20)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + h);
    ctx.lineTo(padL + w, padT + h);
    ctx.stroke();

    // Labels
    ctx.fillStyle = 'rgba(255,255,255,0.70)';
    ctx.font = '12px ui-sans-serif, system-ui, -apple-system';
    ctx.fillText('Impact', 12, padT + 12);
    ctx.fillText('Probability →', padL + w - 92, padT + h + 32);

    const maxP = points.maxP || 1;
    const maxI = points.maxI || 1;

    // Ticks
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i <= 5; i++) {
      const tP = (maxP * i) / 5;
      const x = padL + (w * i) / 5;
      ctx.fillText(String(Math.round(tP * 10) / 10), x - 6, padT + h + 18);

      const tI = (maxI * (5 - i)) / 5;
      const y = padT + (h * i) / 5;
      ctx.fillText(String(Math.round(tI * 10) / 10), 14, y + 4);
    }

    const mapped: DrawPoint[] = points.filtered.map((p) => {
      const x = padL + (clamp(p.probability, 0, maxP) / maxP) * w;
      const y = padT + h - (clamp(p.impact, 0, maxI) / maxI) * h;
      const s = p.score;
      return {
        ...p,
        score: s,
        x,
        y,
        color: level(s).dot,
      };
    });

    // Density blur-ish shadow
    ctx.globalAlpha = 0.18;
    for (const p of mapped) {
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Dots
    for (const p of mapped) {
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Hover highlight
    if (hover) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.lineWidth = 2;
      ctx.arc(hover.x, hover.y, 9, 0, Math.PI * 2);
      ctx.stroke();
    }

    return mapped;
  }

  const mappedRef = useRef<DrawPoint[]>([]);

  useEffect(() => {
    mappedRef.current = draw() || [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points.filtered, points.maxI, points.maxP, hover]);

  useEffect(() => {
    function onResize() {
      mappedRef.current = draw() || [];
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleMove(e: React.MouseEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const pts = mappedRef.current;
    let best: DrawPoint | null = null;
    let bestD = Infinity;
    for (const p of pts) {
      const dx = p.x - mx;
      const dy = p.y - my;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }

    if (best && bestD <= 14 * 14) setHover(best);
    else setHover(null);
  }

  const stats = useMemo(() => {
    const a = points.filtered;
    const maxScore = a.reduce((m, p) => Math.max(m, p.probability * p.impact), 0);
    const hi = a.filter((p) => p.probability * p.impact >= 16).length;
    const mid = a.filter((p) => {
      const s = p.probability * p.impact;
      return s >= 9 && s < 16;
    }).length;
    const low = a.length - hi - mid;
    return { total: a.length, maxScore, hi, mid, low };
  }, [points.filtered]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12">
        <header className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">Карта рисков</h1>
            <div className="flex flex-wrap gap-2">
              <a
                className="inline-flex w-fit items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/5"
                href="/risks"
              >
                Реестр
              </a>
              <a
                className="inline-flex w-fit items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/5"
                href="/requests"
              >
                Запросы
              </a>
              <a
                className="inline-flex w-fit items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/5"
                href="/logout"
              >
                Выйти
              </a>
            </div>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Probability × Impact по последнему состоянию риска. Наведи мышь на точку, чтобы увидеть детали.
          </p>
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Поиск</label>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-white/10 dark:bg-zinc-900 dark:focus:ring-white/20"
                placeholder="код или название…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-[220px]">
              <label className="text-sm font-medium">Мин. score</label>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-white/10 dark:bg-zinc-900 dark:focus:ring-white/20"
                type="number"
                min={0}
                step={1}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value || 0))}
              />
            </div>
            <button
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-black dark:hover:bg-white"
              onClick={() => void load()}
              disabled={loading}
            >
              Обновить
            </button>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <span className="rounded-full border border-zinc-200 px-2 py-1 dark:border-white/10">
              Всего: {loading ? '…' : stats.total}
            </span>
            <span className="rounded-full border border-zinc-200 px-2 py-1 dark:border-white/10">
              Высокий: {loading ? '…' : stats.hi}
            </span>
            <span className="rounded-full border border-zinc-200 px-2 py-1 dark:border-white/10">
              Средний: {loading ? '…' : stats.mid}
            </span>
            <span className="rounded-full border border-zinc-200 px-2 py-1 dark:border-white/10">
              Низкий: {loading ? '…' : stats.low}
            </span>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div
            ref={wrapRef}
            className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950"
          >
            <div className="border-b border-zinc-200 px-6 py-4 text-sm text-zinc-600 dark:border-white/10 dark:text-zinc-400">
              {loading ? 'Загрузка…' : 'Карта (Probability → / Impact ↑)'}
            </div>
            <div className="p-4">
              <canvas
                ref={canvasRef}
                className="block w-full rounded-xl"
                onMouseMove={handleMove}
                onMouseLeave={() => setHover(null)}
              />
            </div>
            {hover ? (
              <div className="pointer-events-none absolute left-6 top-16 max-w-[calc(100%-3rem)] rounded-xl border border-white/10 bg-black/85 px-3 py-2 text-sm text-white shadow-lg">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: hover.color }}
                  />
                  <span className="font-semibold">{hover.risk_code}</span>
                  <span className="text-white/70">
                    {level(hover.score).label} ({Math.round(hover.score * 10) / 10})
                  </span>
                </div>
                <div className="mt-1 text-white/80">
                  P: {Math.round(hover.probability * 10) / 10} • I: {Math.round(hover.impact * 10) / 10}
                </div>
                {hover.risk_name ? <div className="mt-1 text-white/70">{hover.risk_name}</div> : null}
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold">Топ по score</h2>
            <div className="mt-3 space-y-2">
              {points.filtered
                .map((p) => ({ ...p, score: p.probability * p.impact }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 10)
                .map((p) => (
                  <div
                    key={p.risk_code}
                    className="rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-white/10"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">{p.risk_code}</div>
                      <div className="text-zinc-600 dark:text-zinc-400">
                        {Math.round(p.score * 10) / 10}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                      P {Math.round(p.probability * 10) / 10} • I {Math.round(p.impact * 10) / 10}
                    </div>
                    {p.risk_name ? (
                      <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                        {p.risk_name}
                      </div>
                    ) : null}
                  </div>
                ))}
              {!loading && points.filtered.length === 0 ? (
                <div className="text-sm text-zinc-500">Нет данных.</div>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

