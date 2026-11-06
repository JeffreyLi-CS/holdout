import type { Size } from '../data/types'

const nf = new Intl.NumberFormat()

export const formatKcal = (n: number) => nf.format(Math.round(n))
export const signedKcal = (n: number) => (n > 0 ? `+${formatKcal(n)}` : n < 0 ? `−${formatKcal(-n)}` : '0')

export function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (x: number) => String(x).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`
}

export const formatTime = (t: number) => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

export const SIZE_LABEL: Record<Size, string> = { small: 'Small', regular: 'Regular', large: 'Large' }
