'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Map as MapIcon } from 'lucide-react';
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
  const [showLabels, setShowLabels] = useState(true);
  const [maxLabels, setMaxLabels] = useState(28);

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

  function heatColor(score: number) {
    if (score >= 16) return 'rgba(239,68,68,0.22)'; // red
    if (score >= 9) return 'rgba(245,158,11,0.18)'; // amber
    return 'rgba(16,185,129,0.14)'; // emerald
  }

  function drawLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fontSize: number) {
    ctx.save();
    ctx.font = `${fontSize}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(2, fontSize * 0.3);
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function draw() {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const rect = wrap.getBoundingClientRect();
    const cssW = Math.max(280, Math.floor(rect.width));
    const mobile = cssW < 480;
    const cssH = mobile
      ? Math.min(380, typeof window !== 'undefined' ? Math.floor(window.innerHeight * 0.5) : 380)
      : 520;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    // Layout: меньше отступов на узком экране
    const padL = mobile ? 40 : 56;
    const padR = mobile ? 10 : 18;
    const padT = mobile ? 14 : 18;
    const padB = mobile ? 34 : 44;
    const w = cssW - padL - padR;
    const h = cssH - padT - padB;

    const axisFont = mobile ? 14 : 12;
    const labelFont = mobile ? 13 : 11;

    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, cssW, cssH);

    // Heatmap cells (classic risk map)
    const maxP = points.maxP || 1;
    const maxI = points.maxI || 1;
    for (let gx = 0; gx < 5; gx++) {
      for (let gy = 0; gy < 5; gy++) {
        // Cell center in "axis units"
        const pCenter = (maxP * (gx + 0.5)) / 5;
        const iCenter = (maxI * (gy + 0.5)) / 5;
        const cellScore = pCenter * iCenter;
        const x0 = padL + (w * gx) / 5;
        const y0 = padT + (h * (4 - gy)) / 5;
        ctx.fillStyle = heatColor(cellScore);
        ctx.fillRect(x0, y0, w / 5, h / 5);
      }
    }

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
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `${axisFont}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
    ctx.fillText('Impact', 8, padT + axisFont);
    const probText = mobile ? 'P →' : 'Probability →';
    ctx.fillText(probText, padL + w - (mobile ? 36 : 92), padT + h + (mobile ? 24 : 32));

    // Ticks
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = `${axisFont}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
    for (let i = 0; i <= 5; i++) {
      const tP = (maxP * i) / 5;
      const x = padL + (w * i) / 5;
      ctx.fillText(String(Math.round(tP * 10) / 10), x - (mobile ? 8 : 6), padT + h + (mobile ? 14 : 18));

      const tI = (maxI * (5 - i)) / 5;
      const y = padT + (h * i) / 5;
      ctx.fillText(String(Math.round(tI * 10) / 10), 10, y + 4);
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

    // Labels on points (risk codes): на мобиле меньше подписей и крупнее шрифт
    if (showLabels) {
      const maxShow = mobile ? Math.min(maxLabels, 14) : Math.min(120, maxLabels);
      const picks = [...mapped]
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.max(0, maxShow));

      for (const p of picks) {
        const text = String(p.risk_code || '').trim();
        if (!text) continue;
        const tx = clamp(p.x + (mobile ? 6 : 8), padL + 2, padL + w - (mobile ? 28 : 40));
        const ty = clamp(p.y - (mobile ? 8 : 10), padT + 8, padT + h - 8);
        drawLabel(ctx, text, tx, ty, labelFont);
      }
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
  }, [points.filtered, points.maxI, points.maxP, hover, showLabels, maxLabels]);

  useEffect(() => {
    function onResize() {
      mappedRef.current = draw() || [];
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function findPointAt(clientX: number, clientY: number): DrawPoint | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    const pts = mappedRef.current;
    let best: DrawPoint | null = null;
    let bestD = Infinity;
    const hitRadius = 20;
    for (const p of pts) {
      const dx = p.x - mx;
      const dy = p.y - my;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    return best && bestD <= hitRadius * hitRadius ? best : null;
  }

  function handleMove(e: React.MouseEvent) {
    const best = findPointAt(e.clientX, e.clientY);
    setHover(best);
  }

  function handleTouchStart(e: React.TouchEvent) {
    const touch = e.targetTouches[0] || e.changedTouches[0];
    if (!touch) return;
    const best = findPointAt(touch.clientX, touch.clientY);
    setHover(best);
  }

  function handleTouchEnd() {
    setTimeout(() => setHover(null), 500);
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
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <header className="flex flex-col gap-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
            <MapIcon className="h-7 w-7 text-[var(--periscope-primary)]" aria-hidden />
            Карта рисков
          </h1>
          <p className="text-sm text-slate-600">
            Probability × Impact по последнему состоянию. Наведите мышь или коснитесь точки — появится подсказка.
          </p>
        </header>

        <section className="periscope-card rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700">Поиск</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[var(--periscope-accent)] focus:ring-offset-1"
                placeholder="код или название…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-[220px]">
              <label className="text-sm font-medium text-slate-700">Мин. score</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[var(--periscope-accent)] focus:ring-offset-1"
                type="number"
                min={0}
                step={1}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value || 0))}
              />
            </div>
            <div className="flex items-center gap-3 sm:pb-1">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                />
                Показывать коды
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600">до</span>
                <input
                  className="w-[76px] rounded-xl border border-slate-300 bg-white px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--periscope-accent)] focus:ring-offset-1"
                  type="number"
                  min={0}
                  max={120}
                  step={1}
                  value={maxLabels}
                  onChange={(e) => setMaxLabels(Number(e.target.value || 0))}
                  disabled={!showLabels}
                />
              </div>
            </div>
            <button
              className="periscope-btn-primary rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50"
              onClick={() => void load()}
              disabled={loading}
            >
              Обновить
            </button>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="rounded-full border border-slate-200 px-2 py-1">
              Всего: {loading ? '…' : stats.total}
            </span>
            <span className="rounded-full border border-slate-200 px-2 py-1">
              Высокий: {loading ? '…' : stats.hi}
            </span>
            <span className="rounded-full border border-slate-200 px-2 py-1">
              Средний: {loading ? '…' : stats.mid}
            </span>
            <span className="rounded-full border border-slate-200 px-2 py-1">
              Низкий: {loading ? '…' : stats.low}
            </span>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div
            ref={wrapRef}
            className="periscope-card relative overflow-hidden rounded-2xl shadow-sm"
          >
            <div className="border-b border-slate-200 px-6 py-4 text-sm text-slate-600">
              {loading ? 'Загрузка…' : 'Карта (Probability → / Impact ↑)'}
            </div>
            <div className="p-2 sm:p-4">
              <canvas
                ref={canvasRef}
                className="block w-full rounded-xl touch-none"
                onMouseMove={handleMove}
                onMouseLeave={() => setHover(null)}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
              />
            </div>
            {hover ? (
              <div className="pointer-events-none absolute left-4 right-4 top-14 z-10 max-w-[calc(100%-2rem)] rounded-xl border border-white/20 bg-slate-900 px-3 py-2.5 text-sm text-white shadow-xl sm:left-6 sm:right-auto sm:max-w-md">
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

          <div className="periscope-card rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Топ по score</h2>
            <div className="mt-3 space-y-2">
              {points.filtered
                .map((p) => ({ ...p, score: p.probability * p.impact }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 10)
                .map((p) => (
                  <div
                    key={p.risk_code}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-slate-900">{p.risk_code}</div>
                      <div className="text-slate-600">
                        {Math.round(p.score * 10) / 10}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      P {Math.round(p.probability * 10) / 10} • I {Math.round(p.impact * 10) / 10}
                    </div>
                    {p.risk_name ? (
                      <div className="mt-1 text-xs text-slate-500">
                        {p.risk_name}
                      </div>
                    ) : null}
                  </div>
                ))}
              {!loading && points.filtered.length === 0 ? (
                <div className="text-sm text-slate-500">Нет данных.</div>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

