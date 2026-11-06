import { Gauge, History, Monitor, Moon, Settings, Sun, type LucideIcon } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { useTheme, type ThemePref } from '../theme/theme'

const NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: 'Today', icon: Gauge },
  { to: '/history', label: 'History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const NEXT_THEME: Record<ThemePref, ThemePref> = { system: 'light', light: 'dark', dark: 'system' }
const THEME_ICON: Record<ThemePref, LucideIcon> = { system: Monitor, light: Sun, dark: Moon }

function ThemeButton() {
  const { pref, setPref } = useTheme()
  const Icon = THEME_ICON[pref]
  return (
    <button
      type="button"
      onClick={() => setPref(NEXT_THEME[pref])}
      aria-label={`Theme: ${pref}. Switch to ${NEXT_THEME[pref]}`}
      title={`Theme: ${pref}`}
      className="flex size-11 items-center justify-center rounded-xl text-muted transition hover:bg-surface-2 active:scale-95"
    >
      <Icon className="size-5" aria-hidden />
    </button>
  )
}

export function AppShell() {
  return (
    <div className="min-h-dvh md:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-surface/60 p-3 backdrop-blur md:flex">
        <div className="mb-6 flex items-center justify-between px-2 pt-2">
          <span className="text-[19px] font-bold tracking-tight">Holdout</span>
          <ThemeButton />
        </div>
        <nav aria-label="Main" className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition ${
                  isActive ? 'bg-accent/12 text-accent' : 'text-fg hover:bg-surface-2'
                }`
              }
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="pt-safe px-safe sticky top-0 z-30 flex items-center justify-between bg-bg/80 backdrop-blur-xl md:hidden">
          <span className="py-2.5 text-[17px] font-semibold">Holdout</span>
          <ThemeButton />
        </header>

        <main className="px-safe mx-auto w-full max-w-2xl flex-1 pb-[calc(env(safe-area-inset-bottom)+6rem)] pt-3 md:px-8 md:pb-10 md:pt-10">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tabs */}
      <nav
        aria-label="Main"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-line bg-surface/85 backdrop-blur-xl md:hidden"
      >
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition ${
                isActive ? 'text-accent' : 'text-muted'
              }`
            }
          >
            <Icon className="size-6" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
