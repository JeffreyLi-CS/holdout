import { useEffect, useState } from 'react'

/** Current time, refreshed on an interval and immediately when the app returns to the foreground. */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const tick = () => setNow(Date.now())
    const id = window.setInterval(tick, intervalMs)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [intervalMs])
  return now
}
