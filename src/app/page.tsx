export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-col gap-3">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Risk Bot MVP
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Риски в кармане — Dashboard
          </h1>
          <p className="max-w-2xl text-base leading-7 text-zinc-700 dark:text-zinc-300">
            Веб‑интерфейс к тем же данным и функциям, что и в Telegram‑боте:
            реестр рисков, динамика, карта, AI‑анализ и реестр запросов
            риск‑менеджеру.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold">Статус</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              MVP‑страница развернута. Дальше подключим API и дашборды.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold">Что будет здесь</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
              <li>Реестр рисков (таблица + фильтры)</li>
              <li>Динамика риска по коду</li>
              <li>Карта рисков Probability × Impact</li>
              <li>Запросы риск‑менеджеру и ответы (Google Sheets)</li>
            </ul>
          </div>
        </section>

        <section className="flex flex-wrap gap-3">
          <a
            className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-white"
            href="/requests"
          >
            Открыть «Запросы»
          </a>
        </section>
      </main>
    </div>
  );
}
