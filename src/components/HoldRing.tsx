import { formatCountdown } from '../lib/format'

/** Circular countdown that fills as the lock runs out and shifts from amber to green near the end. */
export function HoldRing({ startedAt, endsAt, now }: { startedAt: number; endsAt: number; now: number }) {
  const total = Math.max(1, endsAt - startedAt)
  const done = Math.min(1, Math.max(0, (now - startedAt) / total))
  const r = 52
  const c = 2 * Math.PI * r
  const color = done > 0.85 ? 'var(--accent)' : 'var(--warn)'
  return (
    <div className="relative size-36 shrink-0">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - done)}
          className="transition-[stroke-dashoffset,stroke] duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[22px] font-semibold tabular-nums">{formatCountdown(endsAt - now)}</span>
        <span className="text-[12px] text-muted">left</span>
      </div>
    </div>
  )
}
