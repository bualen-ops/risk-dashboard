'use client';

import { useMemo, useRef, useState } from 'react';
import type { DynamicsPoint } from '@/lib/dynamicsSchema';

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch {
    return iso;
  }
}

export default function DynamicsPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [code, setCode] = useState('');
  const [items, setItems] = useState<DynamicsPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    setItems([]);
    try {
      const c = code.trim();
      if (!c) throw new Error('Введите код риска');
      const res = await fetch(`/api/dynamics?code=${encodeURIComponent(c)}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load');
      setItems(Array.isArray(json.items) ? json.items : []);
      // draw after state update tick
      setTimeout(() => draw(Array.isArray(json.items) ? json.items : []), 0);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  function draw(src: DynamicsPoint[]) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cssW = canvas.parentElement ? Math.floor(canvas.parentElement.getBoundingClientRect().width) : 900;
    const cssH = 420;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, cssW, cssH);

    const padL = 56;
    const padR = 16;
    const padT = 18;
    const padB = 40;
    const w = cssW - padL - padR;
    const h = cssH - padT - padB;

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padT + (h * i) / 5;
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

    const rows = (src || [])
      .map((p) => ({
        ...p,
        probability: Number(p.probability || 0),
        impact: Number(p.impact || 0),
        score: Number((p as any).score ?? (Number(p.probability || 0) * Number(p.impact || 0))),
      }))
      .sort((a, b) => a.ts.localeCompare(b.ts));

    if (rows.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.font = '12px ui-sans-serif, system-ui, -apple-system';
      ctx.fillText('Нет данных', padL + 8, padT + 18);
      return;
    }

    const maxY = Math.max(
      1,
      ...rows.map((r) => r.probability),
      ...rows.map((r) => r.impact),
      ...rows.map((r) => r.score),
    );

    // Y ticks
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '12px ui-sans-serif, system-ui, -apple-system';
    for (let i = 0; i <= 5; i++) {
      const v = (maxY * (5 - i)) / 5;
      const y = padT + (h * i) / 5;
      ctx.fillText(String(Math.round(v * 10) / 10), 14, y + 4);
    }

    const xAt = (idx: number) => padL + (w * (rows.length === 1 ? 0.5 : idx / (rows.length - 1)));
    const yAt = (v: number) => padT + h - (clamp(v, 0, maxY) / maxY) * h;

    const drawLine = (getY: (r: any) => number, color: string) => {
      ctx.beginPath();
      for (let i = 0; i < rows.length; i++) {
        const x = xAt(i);
        const y = yAt(getY(rows[i]));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // points
      for (let i = 0; i < rows.length; i++) {
        const x = xAt(i);
        const y = yAt(getY(rows[i]));
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(x, y, 3.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    drawLine((r) => r.probability, '#60a5fa'); // blue
    drawLine((r) => r.impact, '#34d399'); // green
    drawLine((r) => r.score, '#fbbf24'); // amber

    // X labels (first/last)
    ctx.fillStyle = 'rgba(255,255,255,0.60)';
    ctx.font = '12px ui-sans-serif, system-ui, -apple-system';
    ctx.fillText(fmtDate(rows[0].ts), padL, padT + h + 28);
    ctx.fillText(fmtDate(rows[rows.length - 1].ts), padL + w - 84, padT + h + 28);

    // Legend
    const lx = padL + 8;
    const ly = padT + 10;
    const legend = [
      { label: 'P', color: '#60a5fa' },
      { label: 'I', color: '#34d399' },
      { label: 'Score', color: '#fbbf24' },
    ];
    let x = lx;
    for (const it of legend) {
      ctx.fillStyle = it.color;
      ctx.beginPath();
      ctx.arc(x, ly, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillText(it.label, x + 10, ly + 4);
      x += 64;
    }
  }

  const header = useMemo(() => {
    const name = items[0]?.risk_name ? ` — ${items[0]?.risk_name}` : '';
    return code.trim() ? `${code.trim()}${name}` : '—';
  }, [code, items]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Динамика риска</h1>
          <p className="text-sm text-slate-600">
            Введите код риска и получите историю изменений Probability/Impact/Score.
          </p>
        </header>

        <section className="periscope-card rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700">Код риска</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[var(--periscope-accent)] focus:ring-offset-1"
                placeholder="например: МП 8 или K-06…"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void load();
                }}
              />
            </div>
            <button
              className="periscope-btn-primary rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50"
              onClick={() => void load()}
              disabled={loading}
            >
              Показать
            </button>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          ) : null}
        </section>

        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <div className="border-b border-zinc-200 px-6 py-4 text-sm text-zinc-600 dark:border-white/10 dark:text-zinc-400">
            {loading ? 'Загрузка…' : `Риск: ${header} • точек: ${items.length}`}
          </div>
          <div className="p-4">
            <canvas ref={canvasRef} className="block w-full rounded-xl" />
          </div>
        </section>

        <section className="periscope-card overflow-hidden rounded-2xl shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4 text-sm text-slate-600">
            История
          </div>
          <div className="overflow-auto">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Дата</th>
                  <th className="px-4 py-3">P</th>
                  <th className="px-4 py-3">I</th>
                  <th className="px-4 py-3">Score</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r, idx) => (
                  <tr key={`${r.ts}-${idx}`} className="border-t border-slate-100">
                    <td className="px-4 py-3">{fmtDate(r.ts)}</td>
                    <td className="px-4 py-3">{Math.round(r.probability * 10) / 10}</td>
                    <td className="px-4 py-3">{Math.round(r.impact * 10) / 10}</td>
                    <td className="px-4 py-3">{Math.round((r as any).score * 10) / 10}</td>
                  </tr>
                ))}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td className="px-6 py-10 text-sm text-slate-500" colSpan={4}>
                      Нет данных.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

