import { DEFAULT_SETTINGS, SIZES, type Backup, type Entry, type Settings, type Size } from './types'

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const isSize = (v: unknown): v is Size => SIZES.includes(v as Size)
const isPosNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0

function parseEntry(v: unknown, i: number): Entry {
  const fail = (why: string): never => {
    throw new Error(`Entry ${i + 1}: ${why}`)
  }
  if (!isObj(v)) return fail('not an object')
  const { id, at, kind, size } = v
  if (typeof id !== 'string' || !id) fail('missing id')
  if (!isPosNum(at)) fail('bad timestamp')
  if (!isSize(size)) fail('bad size')
  const base = { id: id as string, at: at as number, size: size as Size }
  switch (kind) {
    case 'resist':
      if (!isPosNum(v.lockMinutes)) fail('bad lock length')
      return { ...base, kind, lockMinutes: v.lockMinutes as number }
    case 'snack':
      return { ...base, kind }
    case 'meal':
      if (v.source !== 'out' && v.source !== 'home') fail('bad meal source')
      return { ...base, kind, source: v.source as 'out' | 'home' }
    default:
      return fail('unknown kind')
  }
}

export function parseSettings(v: unknown): Settings {
  if (!isObj(v)) return DEFAULT_SETTINGS
  const lock = isObj(v.lockMinutes) ? v.lockMinutes : {}
  const minutes = (s: Size) => (isPosNum(lock[s]) ? (lock[s] as number) : DEFAULT_SETTINGS.lockMinutes[s])
  return {
    goalKcal: isPosNum(v.goalKcal) ? v.goalKcal : DEFAULT_SETTINGS.goalKcal,
    lockMinutes: { small: minutes('small'), regular: minutes('regular'), large: minutes('large') },
    growLockWithStreak:
      typeof v.growLockWithStreak === 'boolean' ? v.growLockWithStreak : DEFAULT_SETTINGS.growLockWithStreak,
  }
}

export function parseBackup(json: string): Backup {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    throw new Error('This file is not valid JSON.')
  }
  if (!isObj(raw) || raw.app !== 'holdout') throw new Error('This is not a Holdout backup.')
  if (raw.version !== 1) throw new Error(`Unsupported backup version: ${String(raw.version)}`)
  if (!Array.isArray(raw.entries)) throw new Error('Backup has no entries list.')
  return {
    app: 'holdout',
    version: 1,
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : '',
    settings: parseSettings(raw.settings),
    entries: raw.entries.map(parseEntry),
  }
}
