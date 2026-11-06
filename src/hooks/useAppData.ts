import { store } from '../data/store'
import type { Entry, Settings } from '../data/types'
import { useLiveQuery, type QueryState } from './useLiveQuery'

export function useAppData(): QueryState<{ entries: Entry[]; settings: Settings }> {
  return useLiveQuery(async () => {
    const [entries, settings] = await Promise.all([store.listEntries(), store.getSettings()])
    return { entries, settings }
  }, [])
}
