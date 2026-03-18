import Link from 'next/link';
import {
  Shield,
  LayoutList,
  BarChart2,
  LineChart,
  Sparkles,
  TrendingUp,
  Map,
  MessageSquare,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Subtle grid pattern */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.02]" aria-hidden>
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v40H0V0zm1 0h1v40H1V0z' fill='%231e3a5f' fill-opacity='1'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <main className="relative mx-auto flex max-w-4xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-12">
        {/* Hero */}
        <header className="flex flex-col gap-4 sm:gap-5">
          <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-[var(--periscope-primary)] to-[#2d4a6f] p-5 text-white shadow-lg sm:p-6">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-white/20">
              <Shield className="h-8 w-8" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white/80">
                Информационная система контроля проектов
              </p>
              <h1 className="mt-0.5 text-2xl font-semibold tracking-tight sm:text-3xl">
                РИСКИ в КАРМАНЕ
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-white/90 sm:text-base">
                Реестр рисков, карта, динамика, AI‑анализ и запросы риск‑менеджеру — всё в одном дашборде.
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="periscope-card group rounded-2xl p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600 group-hover:bg-sky-200">
                <BarChart2 className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Реестр и карта</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Таблица рисков из PERISCOPE, карта по оси вероятность × влияние, ключевые риски по приоритету.
                </p>
              </div>
            </div>
          </div>
          <div className="periscope-card group rounded-2xl p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 group-hover:bg-amber-200">
                <LineChart className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Динамика и AI</h2>
                <p className="mt-2 text-sm text-slate-600">
                  График динамики риска по коду, AI‑анализ и рекомендации. Запросы риск‑менеджеру с ответами в реестре.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-wrap gap-3">
          <Link
            href="/risks"
            className="periscope-btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition hover:shadow-md"
          >
            <LayoutList className="h-4 w-4" aria-hidden />
            Реестр рисков
          </Link>
          <Link
            href="/key-risks"
            className="periscope-btn-accent inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition hover:shadow-md"
          >
            <TrendingUp className="h-4 w-4" aria-hidden />
            Ключевые риски
          </Link>
          <Link
            href="/map"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:shadow"
          >
            <Map className="h-4 w-4" aria-hidden />
            Карта рисков
          </Link>
          <Link
            href="/dynamics"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:shadow"
          >
            <LineChart className="h-4 w-4" aria-hidden />
            Динамика
          </Link>
          <Link
            href="/ai"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:shadow"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            AI-анализ
          </Link>
          <Link
            href="/requests"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:shadow"
          >
            <MessageSquare className="h-4 w-4" aria-hidden />
            Запросы
          </Link>
        </section>
      </main>
    </div>
  );
}
