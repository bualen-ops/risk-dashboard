'use client';

import Link from 'next/link';

export default function NavBar() {
  return (
    <header className="periscope-nav sticky top-0 z-50 shadow-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-semibold text-white hover:text-white/95">
          Управление рисками
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
          <Link
            href="/risks"
            className="rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
          >
            Реестр
          </Link>
          <Link
            href="/key-risks"
            className="rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
          >
            Ключевые риски
          </Link>
          <Link
            href="/map"
            className="rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
          >
            Карта
          </Link>
          <Link
            href="/dynamics"
            className="rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
          >
            Динамика
          </Link>
          <Link
            href="/ai"
            className="rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
          >
            AI-анализ
          </Link>
          <Link
            href="/requests"
            className="rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
          >
            Запросы
          </Link>
          <Link
            href="/logout"
            className="ml-2 rounded-lg border border-white/30 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Выйти
          </Link>
        </nav>
      </div>
    </header>
  );
}
