import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

interface ToastData {
  id: number
  message: string
  tone?: 'default' | 'error'
  action?: { label: string; run: () => void | Promise<void> }
}

const ToastContext = createContext<((t: Omit<ToastData, 'id'>) => void) | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastData | null>(null)
  const counter = useRef(0)
  const show = useCallback((t: Omit<ToastData, 'id'>) => setToast({ ...t, id: ++counter.current }), [])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), toast.action ? 8000 : 3500)
    return () => window.clearTimeout(id)
  }, [toast])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] z-50 flex justify-center px-4 md:bottom-6"
      >
        {toast && (
          <div
            key={toast.id}
            className="pointer-events-auto flex max-w-md animate-[toast-in_180ms_ease-out] items-center gap-3 rounded-2xl bg-fg py-2 pl-4 pr-2 text-[15px] text-bg shadow-lg"
          >
            <span className={toast.tone === 'error' ? 'text-danger' : ''}>{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                className="min-h-10 rounded-xl px-3 font-semibold text-accent"
                onClick={() => {
                  void toast.action?.run()
                  setToast(null)
                }}
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
