'use client';

import { useState } from 'react';
import type { AiResponse } from '@/lib/aiSchema';

export default function AiPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<AiResponse | null>(null);

  async function load() {
    const c = code.trim();
    if (!c) {
      setError('Введите код риска');
      return;
    }
    setLoading(true);
    setError('');
    setData(null);
    try {
      const res = await fetch(`/api/ai?code=${encodeURIComponent(c)}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Ошибка запроса');
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const hasStructured =
    data &&
    (data.summary ||
      (data.recommendations && data.recommendations.length > 0) ||
      (data.actions_7d && data.actions_7d.length > 0) ||
      (data.actions_30d && data.actions_30d.length > 0) ||
      (data.warning_signs && data.warning_signs.length > 0));

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">AI-анализ риска</h1>
          <p className="text-sm text-slate-600">
            Введите код риска — получите краткий AI-анализ и рекомендации (DeepSeek).
          </p>
        </header>

        <section className="periscope-card rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700">Код риска</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[var(--periscope-accent)] focus:ring-offset-1"
                placeholder="например: МП 8, K-06…"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && load()}
              />
            </div>
            <button
              className="periscope-btn-accent rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50"
              onClick={() => void load()}
              disabled={loading}
            >
              {loading ? 'Запрос…' : 'Анализ'}
            </button>
          </div>
          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          ) : null}
        </section>

        {data ? (
          <section className="periscope-card rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Результат</h2>
            {data.error ? (
              <p className="mt-2 text-sm text-red-600">{data.error}</p>
            ) : hasStructured ? (
              <div className="mt-4 space-y-4 text-sm">
                {data.level ? (
                  <div>
                    <h3 className="font-medium text-slate-700">Уровень</h3>
                    <p className="mt-1 text-slate-600">{data.level}</p>
                  </div>
                ) : null}
                {data.summary ? (
                  <div>
                    <h3 className="font-medium text-slate-700">Резюме</h3>
                    <p className="mt-1 whitespace-pre-wrap text-slate-600">
                      {data.summary}
                    </p>
                  </div>
                ) : null}
                {data.recommendations && data.recommendations.length > 0 ? (
                  <div>
                    <h3 className="font-medium text-slate-700">Рекомендации</h3>
                    <ul className="mt-1 list-inside list-disc text-slate-600">
                      {data.recommendations.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {data.actions_7d && data.actions_7d.length > 0 ? (
                  <div>
                    <h3 className="font-medium text-slate-700">
                      Действия на 7 дней
                    </h3>
                    <ul className="mt-1 list-inside list-disc text-slate-600">
                      {data.actions_7d.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {data.actions_30d && data.actions_30d.length > 0 ? (
                  <div>
                    <h3 className="font-medium text-slate-700">
                      Действия на 30 дней
                    </h3>
                    <ul className="mt-1 list-inside list-disc text-slate-600">
                      {data.actions_30d.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {data.warning_signs && data.warning_signs.length > 0 ? (
                  <div>
                    <h3 className="font-medium text-slate-700">
                      Сигналы контроля
                    </h3>
                    <ul className="mt-1 list-inside list-disc text-slate-600">
                      {data.warning_signs.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : data.analysis ? (
              <div className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-100 p-4 text-sm text-slate-700">
                {data.analysis}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Нет данных для отображения.</p>
            )}
          </section>
        ) : null}
      </main>
    </div>
  );
}
