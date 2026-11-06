import { RefreshCw, X } from 'lucide-react'
import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useToast } from './Toast'

/**
 * The new service worker waits until the user chooses to reload, so nothing is
 * swapped out mid-interaction. Every log is written to IndexedDB immediately,
 * so reloading never loses data.
 */
export function UpdatePrompt() {
  const toast = useToast()
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    if (!offlineReady) return
    toast({ message: 'Ready to work offline' })
    setOfflineReady(false)
  }, [offlineReady, setOfflineReady, toast])

  if (!needRefresh) return null
  return (
    <div className="fixed inset-x-0 top-[calc(env(safe-area-inset-top)+0.5rem)] z-50 flex justify-center px-4">
      <div role="alert" className="flex items-center gap-2 rounded-2xl bg-surface py-2 pl-4 pr-2 text-[15px] shadow-lg ring-1 ring-line">
        <span>A new version is ready.</span>
        <button
          type="button"
          onClick={() => void updateServiceWorker(true)}
          className="flex min-h-10 items-center gap-1.5 rounded-xl bg-accent px-3 font-semibold text-accent-fg"
        >
          <RefreshCw className="size-4" aria-hidden /> Update
        </button>
        <button
          type="button"
          aria-label="Later"
          onClick={() => setNeedRefresh(false)}
          className="flex size-10 items-center justify-center rounded-xl text-muted"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>
    </div>
  )
}
