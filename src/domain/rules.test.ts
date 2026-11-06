import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, type Entry } from '../data/types'
import { computeProgress, lockMinutesFor } from './rules'

const MIN = 60_000
const resist = (id: string, at: number, size: 'small' | 'regular' | 'large', lockMinutes = 60): Entry => ({
  id,
  at,
  kind: 'resist',
  size,
  lockMinutes,
})
const snack = (id: string, at: number, size: 'small' | 'regular' | 'large'): Entry => ({ id, at, kind: 'snack', size })

describe('computeProgress', () => {
  it('holds skipped calories until the lock ends, then banks them', () => {
    const entries = [resist('a', 0, 'regular')]
    const during = computeProgress(entries, 30 * MIN)
    expect(during.banked).toBe(0)
    expect(during.hold).toEqual({ amount: 225, startedAt: 0, endsAt: 60 * MIN })
    expect(during.outcomes.get('a')).toEqual({ status: 'pending', delta: 0 })

    const after = computeProgress(entries, 60 * MIN)
    expect(after.banked).toBe(225)
    expect(after.hold).toBeNull()
    expect(after.streak).toBe(1)
    expect(after.outcomes.get('a')).toEqual({ status: 'banked', delta: 225 })
  })

  it('eating during a lock forfeits the hold and subtracts the snack', () => {
    const p = computeProgress([resist('a', 0, 'large'), snack('b', 10 * MIN, 'regular')], 120 * MIN)
    expect(p.banked).toBe(-225)
    expect(p.hold).toBeNull()
    expect(p.streak).toBe(0)
    expect(p.outcomes.get('a')?.status).toBe('forfeited')
    expect(p.outcomes.get('b')).toEqual({ status: 'brokeHold', delta: -225, forfeited: 400 })
  })

  it('banked calories survive a later snack, which only subtracts itself', () => {
    const p = computeProgress([resist('a', 0, 'large'), snack('b', 61 * MIN, 'small')], 200 * MIN)
    expect(p.banked).toBe(400 - 150)
    expect(p.streak).toBe(0)
  })

  it('meals out subtract, meals from home do not', () => {
    const p = computeProgress(
      [
        { id: 'm1', at: 0, kind: 'meal', source: 'out', size: 'large' },
        { id: 'm2', at: 1, kind: 'meal', source: 'home', size: 'large' },
      ],
      10,
    )
    expect(p.banked).toBe(-1000)
  })

  it('a skip logged during an active lock joins the hold and extends it', () => {
    const p = computeProgress([resist('a', 0, 'small', 60), resist('b', 30 * MIN, 'small', 60)], 70 * MIN)
    expect(p.hold).toEqual({ amount: 300, startedAt: 0, endsAt: 90 * MIN })
  })
})

describe('lockMinutesFor', () => {
  it('grows with the streak and caps at double', () => {
    expect(lockMinutesFor('regular', DEFAULT_SETTINGS, 0)).toBe(90)
    expect(lockMinutesFor('regular', DEFAULT_SETTINGS, 2)).toBe(135)
    expect(lockMinutesFor('regular', DEFAULT_SETTINGS, 99)).toBe(180)
    expect(lockMinutesFor('regular', { ...DEFAULT_SETTINGS, growLockWithStreak: false }, 3)).toBe(90)
  })
})
