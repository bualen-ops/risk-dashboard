'use client';

import { useEffect, useMemo } from 'react';
import { LogOut } from 'lucide-react';

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
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
          <LogOut className="h-7 w-7 text-slate-500" aria-hidden />
          Выход…
        </h1>
        <p className="text-sm text-slate-600">
          Если браузер не спросит логин/пароль заново, открой сайт в режиме
          инкогнито или очисти сохранённые данные для этого домена.
        </p>
        <a
          className="periscope-btn-primary inline-flex w-fit items-center justify-center rounded-xl px-4 py-2 text-sm font-medium"
          href="/"
        >
          На главную
        </a>
      </main>
    </div>
  );
}

