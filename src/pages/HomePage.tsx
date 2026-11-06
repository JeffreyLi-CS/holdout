import { Cookie, House, Lock, ShieldCheck, Utensils } from 'lucide-react'
import { useMemo } from 'react'
import { Card, ChoiceButton, ErrorPanel, Spinner } from '../components/ui'
import { HoldRing } from '../components/HoldRing'
import { ProgressBar } from '../components/ProgressBar'
import { useToast } from '../components/Toast'
import { store } from '../data/store'
import { SIZES, type Entry, type NewEntry, type Settings } from '../data/types'
import { computeProgress, KCAL_PER_LB, lockMinutesFor, MEAL_OUT_KCAL, SNACK_KCAL } from '../domain/rules'
import { useAppData } from '../hooks/useAppData'
import { useNow } from '../hooks/useNow'
import { formatDuration, formatKcal, formatTime, signedKcal, SIZE_LABEL } from '../lib/format'

export function HomePage() {
  const data = useAppData()
  if (data.status === 'loading') return <Spinner />
  if (data.status === 'error') return <ErrorPanel error={data.error} />
  return <Dashboard entries={data.data.entries} settings={data.data.settings} />
}

function startOfToday(now: number) {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function Dashboard({ entries, settings }: { entries: Entry[]; settings: Settings }) {
  const now = useNow(1000)
  const toast = useToast()
  const progress = useMemo(() => computeProgress(entries, now), [entries, now])
  const { banked, hold, streak, outcomes } = progress

  const today = startOfToday(now)
  const todayNet = entries
    .filter((e) => e.at >= today)
    .reduce((sum, e) => sum + (outcomes.get(e.id)?.delta ?? 0), 0)

  const log = async (entry: NewEntry, message: string) => {
    try {
      const saved = await store.addEntry(entry)
      toast({ message, action: { label: 'Undo', run: () => store.deleteEntry(saved.id) } })
    } catch (e) {
      toast({ message: `Could not save: ${e instanceof Error ? e.message : String(e)}`, tone: 'error' })
    }
  }

  const goal = settings.goalKcal
  const pct = Math.max(0, (banked / goal) * 100)

  return (
    <div className="flex flex-col gap-4">
      {/* Progress */}
      <Card>
        <p className="text-[13px] font-medium uppercase tracking-wide text-muted">Calories avoided</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className={`text-[44px] font-bold leading-none tracking-tight tabular-nums ${banked < 0 ? 'text-danger' : ''}`}>
            {banked < 0 ? '−' : ''}
            {formatKcal(Math.abs(banked))}
          </span>
          <span className="text-[17px] text-muted tabular-nums">/ {formatKcal(goal)}</span>
        </div>
        <div className="mt-4">
          <ProgressBar banked={banked} pending={hold?.amount ?? 0} goal={goal} />
        </div>
        <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-[13px] text-muted tabular-nums">
          <span>
            {pct.toFixed(1)}% · ≈ {(Math.max(0, banked) / KCAL_PER_LB).toFixed(1)} lb
          </span>
          <span>Today {signedKcal(todayNet)}</span>
        </div>
      </Card>

      {/* Active hold */}
      {hold && (
        <Card className="ring-1 ring-warn/40">
          <div className="flex items-center gap-4">
            <HoldRing startedAt={hold.startedAt} endsAt={hold.endsAt} now={now} />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[17px] font-semibold">
                <Lock className="size-4 text-warn" aria-hidden /> Snacks locked
              </p>
              <p className="mt-1 text-[15px]">
                <span className="font-semibold text-warn tabular-nums">+{formatKcal(hold.amount)}</span> on hold
              </p>
              <p className="mt-1 text-[13px] text-muted">
                Banked at {formatTime(hold.endsAt)}. Eat a snack before then and you lose the hold and the snack counts against you.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Craving */}
      <Card
        title="Craving a snack?"
        icon={<ShieldCheck className="size-5 text-accent" aria-hidden />}
        subtitle={
          hold
            ? 'Already holding. Ride out the current lock first.'
            : `Skip it to put the calories on hold.${streak ? ` Streak ${streak}: locks are longer.` : ''}`
        }
      >
        <div className="grid grid-cols-3 gap-2">
          {SIZES.map((size) => {
            const minutes = lockMinutesFor(size, settings, streak)
            return (
              <ChoiceButton
                key={size}
                label={SIZE_LABEL[size]}
                detail={`+${SNACK_KCAL[size]}`}
                sub={`lock ${formatDuration(minutes)}`}
                tone="good"
                disabled={!!hold}
                aria-label={`Skip a ${size} snack: hold ${SNACK_KCAL[size]} calories, lock ${formatDuration(minutes)}`}
                onClick={() =>
                  log({ kind: 'resist', size, lockMinutes: minutes }, `Holding +${SNACK_KCAL[size]} for ${formatDuration(minutes)}`)
                }
              />
            )
          })}
        </div>
      </Card>

      {/* Ate a snack */}
      <Card
        title="Ate a snack"
        icon={<Cookie className="size-5 text-muted" aria-hidden />}
        subtitle={hold ? `This breaks your hold: you lose +${formatKcal(hold.amount)} as well.` : 'Counts against your total. No lock.'}
      >
        <div className="grid grid-cols-3 gap-2">
          {SIZES.map((size) => (
            <ChoiceButton
              key={size}
              label={SIZE_LABEL[size]}
              detail={`−${SNACK_KCAL[size]}`}
              tone="bad"
              aria-label={`Ate a ${size} snack: minus ${SNACK_KCAL[size]} calories`}
              onClick={() =>
                log(
                  { kind: 'snack', size },
                  hold ? `Hold broken: −${formatKcal(hold.amount + SNACK_KCAL[size])}` : `Snack logged −${SNACK_KCAL[size]}`,
                )
              }
            />
          ))}
        </div>
      </Card>

      {/* Meals */}
      <Card title="Meal" icon={<Utensils className="size-5 text-muted" aria-hidden />} subtitle="Eating out counts extra. Food from home is free.">
        <div className="grid grid-cols-3 gap-2">
          {SIZES.map((size) => (
            <ChoiceButton
              key={size}
              label={`${SIZE_LABEL[size]} out`}
              detail={`−${formatKcal(MEAL_OUT_KCAL[size])}`}
              tone="bad"
              aria-label={`Ate a ${size} meal out: minus ${MEAL_OUT_KCAL[size]} calories`}
              onClick={() => log({ kind: 'meal', source: 'out', size }, `Meal out −${formatKcal(MEAL_OUT_KCAL[size])}`)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => log({ kind: 'meal', source: 'home', size: 'regular' }, 'Home meal logged. Nice.')}
          className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent/12 text-[15px] font-medium text-accent transition active:scale-[0.98]"
        >
          <House className="size-4" aria-hidden /> Brought food from home · 0
        </button>
      </Card>
    </div>
  )
}
