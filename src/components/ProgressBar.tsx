import { formatKcal } from '../lib/format'

/** Linear goal bar: solid for banked calories, animated stripes for calories on hold. */
export function ProgressBar({ banked, pending, goal }: { banked: number; pending: number; goal: number }) {
  const pct = (n: number) => Math.max(0, Math.min(100, (n / goal) * 100))
  const bankedPct = pct(banked)
  const pendingPct = Math.max(0, pct(Math.max(banked, 0) + pending) - bankedPct)
  return (
    <div
      role="progressbar"
      aria-label="Calories avoided toward goal"
      aria-valuemin={0}
      aria-valuemax={goal}
      aria-valuenow={Math.max(0, banked)}
      aria-valuetext={`${formatKcal(banked)} of ${formatKcal(goal)} kcal banked${pending ? `, ${formatKcal(pending)} on hold` : ''}`}
      className="flex h-4 w-full overflow-hidden rounded-full bg-surface-2"
    >
      <div className="h-full bg-accent transition-[width] duration-700 ease-out" style={{ width: `${bankedPct}%` }} />
      <div className="bg-stripes h-full transition-[width] duration-700 ease-out" style={{ width: `${pendingPct}%`, minWidth: pending > 0 ? 8 : 0 }} />
    </div>
  )
}
