import { liveQuery } from 'dexie'
import { useEffect, useState, type DependencyList } from 'react'

export type QueryState<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; error: Error }

/** Subscribes to a Dexie-backed read and re-renders whenever the underlying tables change. */
export function useLiveQuery<T>(querier: () => Promise<T>, deps: DependencyList): QueryState<T> {
  const [state, setState] = useState<QueryState<T>>({ status: 'loading' })
  useEffect(() => {
    const sub = liveQuery(querier).subscribe({
      next: (data) => setState({ status: 'ready', data }),
      error: (e: unknown) => setState({ status: 'error', error: e instanceof Error ? e : new Error(String(e)) }),
    })
    return () => sub.unsubscribe()
  }, deps)
  return state
}
