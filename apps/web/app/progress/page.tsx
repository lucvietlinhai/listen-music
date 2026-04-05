import Link from "next/link";
import { executionRules, phaseCards, type PhaseCard } from "@/lib/project-progress-data";

const columns = [
  { key: "done", title: "Done", tone: "text-emerald-300 border-emerald-400/40 bg-emerald-400/10" },
  {
    key: "in_progress",
    title: "In Progress",
    tone: "text-amber-300 border-amber-400/40 bg-amber-400/10"
  },
  { key: "pending", title: "Planned", tone: "text-sky-300 border-sky-400/40 bg-sky-400/10" }
] as const;

export default function ProgressPage() {
  const doneCount = phaseCards.filter((item) => item.status === "done").length;
  const inProgressCount = phaseCards.filter((item) => item.status === "in_progress").length;
  const percent = Math.round((doneCount / phaseCards.length) * 100);

  return (
    <main className="min-h-screen bg-bg text-text">
      <div className="mx-auto flex w-full max-w-[1400px] gap-4 px-4 py-5 lg:gap-6">
        <aside className="hidden h-[calc(100vh-2.5rem)] w-72 shrink-0 rounded-2xl border border-line bg-card p-4 lg:flex lg:flex-col">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">ListenWithMe</p>
          <h1 className="mt-2 text-xl font-extrabold">Project Control</h1>
          <p className="mt-2 text-sm text-muted">
            Bảng theo dõi chung cho mọi agent. Cập nhật theo 10 phase gốc.
          </p>

          <div className="mt-5 space-y-2 text-sm">
            <div className="rounded-lg border border-line bg-surface px-3 py-2">
              <p className="text-muted">Tiến độ hoàn thành</p>
              <p className="text-lg font-extrabold text-accent">{percent}%</p>
            </div>
            <div className="rounded-lg border border-line bg-surface px-3 py-2">
              <p className="text-muted">Done</p>
              <p className="font-bold text-emerald-300">{doneCount} phase</p>
            </div>
            <div className="rounded-lg border border-line bg-surface px-3 py-2">
              <p className="text-muted">In progress</p>
              <p className="font-bold text-amber-300">{inProgressCount} phase</p>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold">Quick links</p>
            <div className="mt-2 flex flex-col gap-2 text-sm">
              <Link href="/" className="rounded-md border border-line bg-surface px-3 py-2">
                Landing
              </Link>
              <Link href="/rooms" className="rounded-md border border-line bg-surface px-3 py-2">
                Rooms
              </Link>
              <Link href="/room/mock-id" className="rounded-md border border-line bg-surface px-3 py-2">
                Room UI
              </Link>
              <Link href="/profile" className="rounded-md border border-line bg-surface px-3 py-2">
                Profile
              </Link>
            </div>
          </div>

          <div className="mt-6 border-t border-line pt-4">
            <p className="text-sm font-semibold">Working rules</p>
            <ul className="mt-2 space-y-2 text-xs text-muted">
              {executionRules.map((rule) => (
                <li key={rule}>• {rule}</li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="rounded-2xl border border-line bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                  Delivery board
                </p>
                <h2 className="text-2xl font-extrabold">Kế hoạch 10 phase theo dõi trực tiếp</h2>
              </div>
              <span className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-muted">
                Updated by agent trong codebase
              </span>
            </div>
            <p className="mt-2 text-sm text-muted">
              Bảng này phản ánh chính xác những gì đã hoàn thành, đang làm, và chưa làm so với
              bản kế hoạch ban đầu.
            </p>
          </header>

          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            {columns.map((col) => {
              const items = phaseCards.filter((item) => item.status === col.key);
              return (
                <div key={col.key} className="rounded-2xl border border-line bg-card p-3">
                  <div className={`rounded-lg border px-3 py-2 text-sm font-semibold ${col.tone}`}>
                    {col.title} · {items.length}
                  </div>
                  <div className="mt-3 space-y-3">
                    {items.map((item) => (
                      <PhaseItem key={item.phase} item={item} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

function PhaseItem({ item }: { item: PhaseCard }) {
  return (
    <article className="rounded-xl border border-line bg-surface p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            Phase {item.phase}
          </p>
          <h3 className="text-base font-bold">{item.title}</h3>
        </div>
      </div>

      <p className="mt-2 text-sm text-muted">{item.summary}</p>

      <div className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
          Completed
        </p>
        <ul className="mt-1 space-y-1 text-sm text-muted">
          {item.completed.length ? (
            item.completed.map((line) => <li key={line}>• {line}</li>)
          ) : (
            <li>• Chưa có mục hoàn thành.</li>
          )}
        </ul>
      </div>

      <div className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">Remaining</p>
        <ul className="mt-1 space-y-1 text-sm text-muted">
          {item.remaining.length ? (
            item.remaining.map((line) => <li key={line}>• {line}</li>)
          ) : (
            <li>• Không còn việc mở.</li>
          )}
        </ul>
      </div>

      {item.notes?.length ? (
        <div className="mt-3 rounded-lg border border-line bg-card px-2 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">Notes</p>
          <ul className="mt-1 space-y-1 text-xs text-muted">
            {item.notes.map((line) => (
              <li key={line}>• {line}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

