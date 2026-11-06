import { Dexie, type EntityTable } from 'dexie'
import type { Entry } from './types'

interface KeyValue {
  key: string
  value: unknown
}

export class HoldoutDB extends Dexie {
  entries!: EntityTable<Entry, 'id'>
  kv!: EntityTable<KeyValue, 'key'>

  constructor() {
    super('holdout')
    this.version(1).stores({
      entries: 'id, at, kind',
      kv: 'key',
    })
  }
}

export const db = new HoldoutDB()
