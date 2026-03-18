export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-12">
        <header className="flex flex-col gap-3">
          <p className="text-sm font-medium text-slate-600">
            Информационная система контроля проектов
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Управление рисками
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            Реестр рисков, карта, динамика, AI‑анализ и запросы риск‑менеджеру — всё в одном дашборде.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="periscope-card rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Реестр и карта</h2>
            <p className="mt-2 text-sm text-slate-600">
              Таблица рисков из PERISCOPE, карта по оси вероятность × влияние, ключевые риски по приоритету.
            </p>
          </div>
          <div className="periscope-card rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Динамика и AI</h2>
            <p className="mt-2 text-sm text-slate-600">
              График динамики риска по коду, AI‑анализ и рекомендации. Запросы риск‑менеджеру с ответами в реестре.
            </p>
          </div>
        </section>

        <section className="flex flex-wrap gap-3">
          <a
            className="periscope-btn-primary inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium transition"
            href="/risks"
          >
            Реестр рисков
          </a>
          <a
            className="periscope-btn-accent inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium transition"
            href="/key-risks"
          >
            Ключевые риски
          </a>
          <a
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            href="/map"
          >
            Карта рисков
          </a>
          <a
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            href="/dynamics"
          >
            Динамика
          </a>
          <a
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            href="/ai"
          >
            AI-анализ
          </a>
          <a
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            href="/requests"
          >
            Запросы
          </a>
        </section>
      </main>
    </div>
  );
}
