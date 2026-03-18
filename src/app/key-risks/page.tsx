'use client';

import { useEffect, useMemo, useState } from 'react';

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

const TOP_N = 25;

export default function KeyRisksPage() {
  const [items, setItems] = useState<RiskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/risks', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load');
      setItems(Array.isArray(json.items) ? json.items : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const rows = useMemo(() => {
    return items
      .map((r) => ({ ...r, score: score(r.probability, r.impact), level: level(score(r.probability, r.impact)) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_N);
  }, [items]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Ключевые риски</h1>
          <p className="text-sm text-slate-600">
            Топ {TOP_N} рисков по приоритету (score = P × I). Данные из реестра.
          </p>
        </header>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <section className="periscope-card overflow-hidden rounded-2xl shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4 text-sm text-slate-600">
            {loading ? 'Загрузка…' : `Показано: ${rows.length} из ${items.length}`}
          </div>
          <div className="overflow-auto">
            <table className="min-w-[1100px] w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">#</th>
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
                {rows.map((r, idx) => (
                  <tr key={r.risk_code} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
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
                    <td className="px-6 py-10 text-sm text-slate-500" colSpan={9}>
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
