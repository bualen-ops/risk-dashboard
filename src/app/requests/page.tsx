'use client';

import { useEffect, useMemo, useState } from 'react';

type RequestRow = {
  row_number: number;
  timestamp: string;
  user_chat_id: string;
  user_name: string;
  request_type: string;
  risk_code: string;
  request_text: string;
  status: string;
  response_text: string;
  response_at: string;
};

function formatTs(ts: string) {
  if (!ts) return '';
  // keep it simple; ISO is readable enough
  return ts.replace('T', ' ').replace('Z', '');
}

export default function RequestsPage() {
  const [items, setItems] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filter, setFilter] = useState('');

  const [newUserName, setNewUserName] = useState('');
  const [newType, setNewType] = useState('WEB');
  const [newRiskCode, setNewRiskCode] = useState('');
  const [newText, setNewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [answerRow, setAnswerRow] = useState<RequestRow | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [answerSubmitting, setAnswerSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/requests', { cache: 'no-store' });
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
  }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) => {
      const hay = [
        r.user_name,
        r.request_type,
        r.risk_code,
        r.request_text,
        r.status,
        r.response_text,
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, filter]);

  async function submitNew() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          user_name: newUserName,
          request_type: newType,
          risk_code: newRiskCode,
          request_text: newText,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to create request');
      setNewText('');
      setNewRiskCode('');
      await load();
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitAnswer() {
    if (!answerRow) return;
    setAnswerSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/requests/answer', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          row_number: answerRow.row_number,
          response_text: answerText,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to save answer');
      setAnswerRow(null);
      setAnswerText('');
      await load();
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setAnswerSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Запросы</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Реестр запросов риск‑менеджеру и ответов (Google Sheets → Requests).
          </p>
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="text-sm font-medium">Фильтр</label>
                <input
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-white/10 dark:bg-zinc-900 dark:focus:ring-white/20"
                  placeholder="по тексту, коду, статусу..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
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
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200">
                {error}
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <label className="text-sm font-medium">Кто</label>
                <input
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-white/10 dark:bg-zinc-900 dark:focus:ring-white/20"
                  placeholder="например, Alen"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Тип</label>
                <input
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-white/10 dark:bg-zinc-900 dark:focus:ring-white/20"
                  placeholder="WEB / REPORT_NEW / ..."
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Код риска</label>
                <input
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-white/10 dark:bg-zinc-900 dark:focus:ring-white/20"
                  placeholder="например, 5 или МП 5"
                  value={newRiskCode}
                  onChange={(e) => setNewRiskCode(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <button
                  className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                  onClick={() => void submitNew()}
                  disabled={submitting || !newUserName.trim() || !newText.trim()}
                  title={
                    !newUserName.trim() || !newText.trim()
                      ? 'Заполни поля "Кто" и "Текст"'
                      : ''
                  }
                >
                  {submitting ? 'Отправляю…' : 'Создать запрос'}
                </button>
              </div>
              <div className="md:col-span-4">
                <label className="text-sm font-medium">Текст</label>
                <textarea
                  className="mt-1 min-h-[90px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-white/10 dark:bg-zinc-900 dark:focus:ring-white/20"
                  placeholder="Опиши запрос риск‑менеджеру"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <div className="border-b border-zinc-200 px-6 py-4 text-sm text-zinc-600 dark:border-white/10 dark:text-zinc-400">
            {loading ? 'Загрузка…' : `Записей: ${filtered.length}`}
          </div>

          <div className="overflow-auto">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="sticky top-0 bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Время</th>
                  <th className="px-4 py-3">Кто</th>
                  <th className="px-4 py-3">Тип</th>
                  <th className="px-4 py-3">Код</th>
                  <th className="px-4 py-3">Текст</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3">Ответ</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.row_number}
                    className="border-t border-zinc-100 align-top dark:border-white/10"
                  >
                    <td className="px-4 py-3 text-zinc-500">{r.row_number}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatTs(r.timestamp)}
                    </td>
                    <td className="px-4 py-3">{r.user_name}</td>
                    <td className="px-4 py-3">{r.request_type}</td>
                    <td className="px-4 py-3">{r.risk_code}</td>
                    <td className="px-4 py-3 max-w-[420px] whitespace-pre-wrap">
                      {r.request_text}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                          r.status === 'answered'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200'
                            : 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200',
                        ].join(' ')}
                      >
                        {r.status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[340px] whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                      {r.response_text ? (
                        <>
                          <div>{r.response_text}</div>
                          <div className="mt-1 text-xs text-zinc-500">
                            {formatTs(r.response_at)}
                          </div>
                        </>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"
                        disabled={r.status === 'answered'}
                        onClick={() => {
                          setAnswerRow(r);
                          setAnswerText(r.response_text || '');
                        }}
                      >
                        Ответить
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 ? (
                  <tr>
                    <td className="px-6 py-10 text-sm text-zinc-500" colSpan={9}>
                      Нет записей.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        {answerRow ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
            <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-zinc-950">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-zinc-500">
                    Ответ на запрос #{answerRow.row_number}
                  </div>
                  <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                    {answerRow.request_text}
                  </div>
                </div>
                <button
                  className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10"
                  onClick={() => setAnswerRow(null)}
                >
                  ✕
                </button>
              </div>

              <textarea
                className="mt-4 min-h-[120px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-white/10 dark:bg-zinc-900 dark:focus:ring-white/20"
                placeholder="Текст ответа"
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
              />

              <div className="mt-4 flex gap-2">
                <button
                  className="flex-1 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
                  onClick={() => setAnswerRow(null)}
                >
                  Отмена
                </button>
                <button
                  className="flex-1 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-black dark:hover:bg-white"
                  disabled={answerSubmitting || !answerText.trim()}
                  onClick={() => void submitAnswer()}
                >
                  {answerSubmitting ? 'Сохраняю…' : 'Сохранить ответ'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

