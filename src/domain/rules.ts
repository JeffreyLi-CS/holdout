import type { Entry, Settings, Size } from '../data/types'

export const SNACK_KCAL: Record<Size, number> = { small: 150, regular: 225, large: 400 }
export const MEAL_OUT_KCAL: Record<Size, number> = { small: 300, regular: 500, large: 1000 }
export const KCAL_PER_LB = 3500
/** Each completed hold in a row lengthens the next lock by this fraction, up to MAX_STREAK_STEPS. */
export const STREAK_STEP = 0.25
export const MAX_STREAK_STEPS = 4

export type OutcomeStatus = 'pending' | 'banked' | 'forfeited' | 'applied' | 'brokeHold'

export interface Outcome {
  status: OutcomeStatus
  /** What this entry contributed to the banked total (pending holds contribute 0 until they mature). */
  delta: number
  /** For a snack that broke a hold: the pending calories it cost. */
  forfeited?: number
}

export interface Hold {
  amount: number
  startedAt: number
  endsAt: number
}

export interface Progress {
  banked: number
  hold: Hold | null
  /** Holds completed in a row since the last snack. */
  streak: number
  outcomes: Map<string, Outcome>
}

/**
 * Folds the entry log into the current state. Pure, so deleting or importing entries
 * always yields a consistent result.
 *
 * - Skipping a craving puts its calories on hold and locks snacking until the lock ends.
 * - When the lock ends, the held calories are banked for good.
 * - Eating a snack subtracts its calories. If a hold is active, the held calories are forfeited too.
 * - Eating out subtracts the meal's calories; a meal from home changes nothing.
 */
export function computeProgress(entries: readonly Entry[], now: number): Progress {
  const sorted = [...entries].sort((a, b) => a.at - b.at)
  const outcomes = new Map<string, Outcome>()
  let banked = 0
  let streak = 0
  let hold: (Hold & { ids: string[] }) | null = null

  const settle = (t: number) => {
    if (!hold || t < hold.endsAt) return
    banked += hold.amount
    for (const id of hold.ids) {
      const o = outcomes.get(id)
      if (o) outcomes.set(id, { status: 'banked', delta: o.delta })
    }
    streak += 1
    hold = null
  }

  for (const e of sorted) {
    settle(e.at)
    switch (e.kind) {
      case 'resist': {
        const kcal = SNACK_KCAL[e.size]
        const endsAt = e.at + e.lockMinutes * 60_000
        outcomes.set(e.id, { status: 'pending', delta: kcal })
        if (hold) {
          hold.amount += kcal
          hold.endsAt = Math.max(hold.endsAt, endsAt)
          hold.ids.push(e.id)
        } else {
          hold = { amount: kcal, startedAt: e.at, endsAt, ids: [e.id] }
        }
        break
      }
      case 'snack': {
        const kcal = SNACK_KCAL[e.size]
        banked -= kcal
        streak = 0
        if (hold) {
          for (const id of hold.ids) outcomes.set(id, { status: 'forfeited', delta: 0 })
          outcomes.set(e.id, { status: 'brokeHold', delta: -kcal, forfeited: hold.amount })
          hold = null
        } else {
          outcomes.set(e.id, { status: 'applied', delta: -kcal })
        }
        break
      }
      case 'meal': {
        const kcal = e.source === 'out' ? MEAL_OUT_KCAL[e.size] : 0
        banked -= kcal
        outcomes.set(e.id, { status: 'applied', delta: -kcal })
        break
      }
    }
  }
  settle(now)

  // While folding, a pending outcome carries its held kcal so settle() can bank it; report 0 now.
  for (const [id, o] of outcomes) if (o.status === 'pending') outcomes.set(id, { ...o, delta: 0 })

  const h = hold as (Hold & { ids: string[] }) | null
  return {
    banked,
    hold: h ? { amount: h.amount, startedAt: h.startedAt, endsAt: h.endsAt } : null,
    streak,
    outcomes,
  }
}

export function lockMinutesFor(size: Size, settings: Settings, streak: number): number {
  const base = settings.lockMinutes[size]
  if (!settings.growLockWithStreak) return base
  return Math.round(base * (1 + STREAK_STEP * Math.min(streak, MAX_STREAK_STEPS)))
}
