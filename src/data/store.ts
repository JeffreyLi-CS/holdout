import { db } from './db'
import { parseSettings } from './backup'
import { newId } from './ids'
import type { Backup, Entry, NewEntry, Settings } from './types'

/**
 * All persistence goes through this interface so a sync-capable backend can replace
 * the IndexedDB one later. Reads made inside useLiveQuery re-run when Dexie data changes.
 */
export interface DataStore {
  listEntries(): Promise<Entry[]>
  addEntry(entry: NewEntry, at?: number): Promise<Entry>
  restoreEntry(entry: Entry): Promise<void>
  deleteEntry(id: string): Promise<void>
  getSettings(): Promise<Settings>
  saveSettings(settings: Settings): Promise<void>
  exportAll(): Promise<Backup>
  replaceAll(backup: Backup): Promise<void>
  eraseAll(): Promise<void>
}

const SETTINGS_KEY = 'settings'

export const store: DataStore = {
  listEntries: () => db.entries.orderBy('at').toArray(),

  async addEntry(entry, at = Date.now()) {
    const saved = { ...entry, id: newId(), at } as Entry
    await db.entries.add(saved)
    return saved
  },

  async restoreEntry(entry) {
    await db.entries.put(entry)
  },

  async deleteEntry(id) {
    await db.entries.delete(id)
  },

  async getSettings() {
    const row = await db.kv.get(SETTINGS_KEY)
    return parseSettings(row?.value)
  },

  async saveSettings(settings) {
    await db.kv.put({ key: SETTINGS_KEY, value: settings })
  },

  async exportAll() {
    const [entries, settings] = await Promise.all([this.listEntries(), this.getSettings()])
    return { app: 'holdout', version: 1, exportedAt: new Date().toISOString(), settings, entries }
  },

  async replaceAll(backup) {
    await db.transaction('rw', db.entries, db.kv, async () => {
      await db.entries.clear()
      await db.entries.bulkAdd(backup.entries)
      await db.kv.put({ key: SETTINGS_KEY, value: backup.settings })
    })
  },

  async eraseAll() {
    await db.transaction('rw', db.entries, db.kv, async () => {
      await db.entries.clear()
      await db.kv.clear()
    })
  },
}
