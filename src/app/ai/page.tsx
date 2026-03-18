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
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
        <header className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">AI-анализ риска</h1>
            <div className="flex flex-wrap gap-2">
              <a
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/5"
                href="/dynamics"
              >
                Динамика
              </a>
              <a
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/5"
                href="/map"
              >
                Карта
              </a>
              <a
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/5"
                href="/risks"
              >
                Реестр
              </a>
              <a
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/5"
                href="/logout"
              >
                Выйти
              </a>
            </div>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Введите код риска — получите краткий AI-анализ и рекомендации (DeepSeek).
          </p>
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Код риска</label>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-white/10 dark:bg-zinc-900 dark:focus:ring-white/20"
                placeholder="например: МП 8, K-06…"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && load()}
              />
            </div>
            <button
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-black dark:hover:bg-white"
              onClick={() => void load()}
              disabled={loading}
            >
              {loading ? 'Запрос…' : 'Анализ'}
            </button>
          </div>
          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          ) : null}
        </section>

        {data ? (
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold">Результат</h2>
            {data.error ? (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{data.error}</p>
            ) : hasStructured ? (
              <div className="mt-4 space-y-4 text-sm">
                {data.level ? (
                  <div>
                    <h3 className="font-medium text-zinc-700 dark:text-zinc-300">Уровень</h3>
                    <p className="mt-1 text-zinc-600 dark:text-zinc-400">{data.level}</p>
                  </div>
                ) : null}
                {data.summary ? (
                  <div>
                    <h3 className="font-medium text-zinc-700 dark:text-zinc-300">Резюме</h3>
                    <p className="mt-1 whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">
                      {data.summary}
                    </p>
                  </div>
                ) : null}
                {data.recommendations && data.recommendations.length > 0 ? (
                  <div>
                    <h3 className="font-medium text-zinc-700 dark:text-zinc-300">Рекомендации</h3>
                    <ul className="mt-1 list-inside list-disc text-zinc-600 dark:text-zinc-400">
                      {data.recommendations.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {data.actions_7d && data.actions_7d.length > 0 ? (
                  <div>
                    <h3 className="font-medium text-zinc-700 dark:text-zinc-300">
                      Действия на 7 дней
                    </h3>
                    <ul className="mt-1 list-inside list-disc text-zinc-600 dark:text-zinc-400">
                      {data.actions_7d.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {data.actions_30d && data.actions_30d.length > 0 ? (
                  <div>
                    <h3 className="font-medium text-zinc-700 dark:text-zinc-300">
                      Действия на 30 дней
                    </h3>
                    <ul className="mt-1 list-inside list-disc text-zinc-600 dark:text-zinc-400">
                      {data.actions_30d.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {data.warning_signs && data.warning_signs.length > 0 ? (
                  <div>
                    <h3 className="font-medium text-zinc-700 dark:text-zinc-300">
                      Сигналы контроля
                    </h3>
                    <ul className="mt-1 list-inside list-disc text-zinc-600 dark:text-zinc-400">
                      {data.warning_signs.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : data.analysis ? (
              <div className="mt-4 whitespace-pre-wrap rounded-xl bg-zinc-100 p-4 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                {data.analysis}
              </div>
            ) : (
              <p className="mt-2 text-sm text-zinc-500">Нет данных для отображения.</p>
            )}
          </section>
        ) : null}
      </main>
    </div>
  );
}
