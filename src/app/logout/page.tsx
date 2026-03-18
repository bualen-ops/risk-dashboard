'use client';

import { useEffect, useMemo } from 'react';

function getHost() {
  if (typeof window === 'undefined') return '';
  return window.location.host;
}

export default function LogoutPage() {
  const host = useMemo(getHost, []);

  useEffect(() => {
    // Best-effort basic-auth logout trick:
    // navigate to a URL with bogus credentials so browser replaces cached creds.
    // Works in many browsers; Safari may keep cached creds.
    if (!host) return;
    const url = `${window.location.protocol}//logout:logout@${host}/`;
    window.location.replace(url);
  }, [host]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex max-w-xl flex-col gap-4 px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Выход…</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Если браузер не спросит логин/пароль заново, открой сайт в режиме
          инкогнито или очисти сохранённые данные для этого домена.
        </p>
        <a
          className="inline-flex w-fit items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-white"
          href="/"
        >
          На главную
        </a>
      </main>
    </div>
  );
}

