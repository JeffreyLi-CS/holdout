export type Size = 'small' | 'regular' | 'large'
export const SIZES: readonly Size[] = ['small', 'regular', 'large']

interface EntryBase {
  id: string
  /** Epoch milliseconds. */
  at: number
}

/** A craving skipped. Lock length is fixed when logged so later settings changes never rewrite history. */
export interface ResistEntry extends EntryBase {
  kind: 'resist'
  size: Size
  lockMinutes: number
}

export interface SnackEntry extends EntryBase {
  kind: 'snack'
  size: Size
}

export interface MealEntry extends EntryBase {
  kind: 'meal'
  source: 'out' | 'home'
  size: Size
}

export type Entry = ResistEntry | SnackEntry | MealEntry

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never
export type NewEntry = DistributiveOmit<Entry, 'id' | 'at'>

export interface Settings {
  goalKcal: number
  lockMinutes: Record<Size, number>
  growLockWithStreak: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  goalKcal: 50_000,
  lockMinutes: { small: 60, regular: 90, large: 120 },
  growLockWithStreak: true,
}

export interface Backup {
  app: 'holdout'
  version: 1
  exportedAt: string
  settings: Settings
  entries: Entry[]
}
