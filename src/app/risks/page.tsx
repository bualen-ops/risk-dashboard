'use client';

import { useEffect, useMemo, useState } from 'react';
import { LayoutList } from 'lucide-react';

type RiskRow = {
  risk_code: string;
  description: string;
  status: string;
  owner: string;
  probability: number | null;
  impact: number | null;
};

function score(p: number | null, i: number | null) {
  return (p || 0) * (i || 0);
}

function level(s: number) {
  if (s >= 16) return { label: 'Высокий', cls: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200' };
  if (s >= 9) return { label: 'Средний', cls: 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200' };
  return { label: 'Низкий', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200' };
}

export default function RisksPage() {
  const [items, setItems] = useState<RiskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  async function load(query: string) {
    setLoading(true);
    setError('');
    try {
      const url = query.trim() ? `/api/risks?q=${encodeURIComponent(query.trim())}` : '/api/risks';
      const res = await fetch(url, { cache: 'no-store' });
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
    void load('');
  }, []);

  const rows = useMemo(() => {
    return items.map((r) => {
      const s = score(r.probability, r.impact);
      return { ...r, score: s, level: level(s) };
    });
  }, [items]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <header className="flex flex-col gap-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
            <LayoutList className="h-7 w-7 text-[var(--periscope-primary)]" aria-hidden />
            Реестр рисков
          </h1>
          <p className="text-sm text-slate-600">
            Данные из MS SQL (PERISCOPE): rm.Risk + последний StateRecord.
          </p>
        </header>

        <section className="periscope-card rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700">Поиск</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[var(--periscope-accent)] focus:ring-offset-1"
                placeholder="код, описание, владелец, статус…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <button
              className="periscope-btn-primary rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50"
              onClick={() => void load(q)}
              disabled={loading}
            >
              Найти
            </button>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          ) : null}
        </section>

        <section className="periscope-card overflow-hidden rounded-2xl shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4 text-sm text-slate-600">
            {loading ? 'Загрузка…' : `Рисков: ${rows.length}`}
          </div>

          <div className="overflow-auto">
            <table className="min-w-[1100px] w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Код</th>
                  <th className="px-4 py-3">Уровень</th>
                  <th className="px-4 py-3">P</th>
                  <th className="px-4 py-3">I</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3">Владелец</th>
                  <th className="px-4 py-3">Описание</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.risk_code} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-3 font-medium">{r.risk_code}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${r.level.cls}`}>
                        {r.level.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">{r.probability ?? '—'}</td>
                    <td className="px-4 py-3">{r.impact ?? '—'}</td>
                    <td className="px-4 py-3">{r.score}</td>
                    <td className="px-4 py-3">{r.status || '—'}</td>
                    <td className="px-4 py-3">{r.owner || '—'}</td>
                    <td className="px-4 py-3 max-w-[520px] whitespace-pre-wrap">{r.description || '—'}</td>
                  </tr>
                ))}
                {!loading && rows.length === 0 ? (
                  <tr>
                    <td className="px-6 py-10 text-sm text-slate-500" colSpan={8}>
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

