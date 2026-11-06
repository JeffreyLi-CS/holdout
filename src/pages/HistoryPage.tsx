import { Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { Card, ErrorPanel, PageTitle, Spinner } from '../components/ui'
import { useToast } from '../components/Toast'
import { store } from '../data/store'
import type { Entry } from '../data/types'
import { computeProgress, MEAL_OUT_KCAL, SNACK_KCAL, type Outcome } from '../domain/rules'
import { useAppData } from '../hooks/useAppData'
import { useNow } from '../hooks/useNow'
import { formatKcal, formatTime, signedKcal, SIZE_LABEL } from '../lib/format'

function describe(e: Entry, o: Outcome | undefined): { title: string; detail: string; tone: string; note?: string } {
  switch (e.kind) {
    case 'resist': {
      const kcal = SNACK_KCAL[e.size]
      if (o?.status === 'pending') return { title: `Skipped ${SIZE_LABEL[e.size].toLowerCase()} snack`, detail: `+${kcal} on hold`, tone: 'text-warn' }
      if (o?.status === 'forfeited') return { title: `Skipped ${SIZE_LABEL[e.size].toLowerCase()} snack`, detail: `+${kcal} lost`, tone: 'text-muted line-through' }
      return { title: `Skipped ${SIZE_LABEL[e.size].toLowerCase()} snack`, detail: `+${kcal}`, tone: 'text-accent' }
    }
    case 'snack': {
      const kcal = SNACK_KCAL[e.size]
      const broke = o?.status === 'brokeHold'
      return {
        title: `${SIZE_LABEL[e.size]} snack`,
        detail: `−${kcal}`,
        tone: 'text-danger',
        note: broke ? `Broke lock, lost +${formatKcal(o?.forfeited ?? 0)}` : undefined,
      }
    }
    case 'meal':
      return e.source === 'home'
        ? { title: 'Meal from home', detail: '0', tone: 'text-accent' }
        : { title: `${SIZE_LABEL[e.size]} meal out`, detail: `−${formatKcal(MEAL_OUT_KCAL[e.size])}`, tone: 'text-danger' }
  }
}

const dayKey = (t: number) => new Date(t).toDateString()
const dayLabel = (t: number) =>
  new Date(t).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })

export function HistoryPage() {
  const data = useAppData()
  const now = useNow(30_000)
  const toast = useToast()
  const entries = data.status === 'ready' ? data.data.entries : null

  const groups = useMemo(() => {
    if (!entries) return []
    const { outcomes } = computeProgress(entries, now)
    const map = new Map<string, { label: string; net: number; rows: { e: Entry; o: Outcome | undefined }[] }>()
    for (const e of [...entries].reverse()) {
      const k = dayKey(e.at)
      const g = map.get(k) ?? { label: dayLabel(e.at), net: 0, rows: [] }
      const o = outcomes.get(e.id)
      g.net += o?.delta ?? 0
      g.rows.push({ e, o })
      map.set(k, g)
    }
    return [...map.values()]
  }, [entries, now])

  if (data.status === 'loading') return <Spinner />
  if (data.status === 'error') return <ErrorPanel error={data.error} />

  const remove = async (e: Entry) => {
    await store.deleteEntry(e.id)
    toast({ message: 'Entry deleted', action: { label: 'Undo', run: () => store.restoreEntry(e) } })
  }

  return (
    <div>
      <PageTitle>History</PageTitle>
      {groups.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-[15px] text-muted">
            Nothing logged yet. The next time a craving hits, skip it from the Today tab.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((g) => (
            <section key={g.label}>
              <h2 className="mb-1.5 flex justify-between px-1 text-[13px] font-medium uppercase tracking-wide text-muted">
                <span>{g.label}</span>
                <span className="tabular-nums">{signedKcal(g.net)}</span>
              </h2>
              <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-surface">
                {g.rows.map(({ e, o }) => {
                  const d = describe(e, o)
                  return (
                    <li key={e.id} className="flex min-h-14 items-center gap-3 pl-4 pr-1">
                      <div className="min-w-0 flex-1 py-2">
                        <p className="truncate text-[15px]">{d.title}</p>
                        <p className="text-[13px] text-muted">
                          {formatTime(e.at)}
                          {d.note && <span className="text-danger"> · {d.note}</span>}
                        </p>
                      </div>
                      <span className={`text-[15px] font-medium tabular-nums ${d.tone}`}>{d.detail}</span>
                      <button
                        type="button"
                        aria-label={`Delete ${d.title} at ${formatTime(e.at)}`}
                        onClick={() => void remove(e)}
                        className="flex size-11 items-center justify-center rounded-xl text-muted transition hover:bg-surface-2 active:scale-95"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
