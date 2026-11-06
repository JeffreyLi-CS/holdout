import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type ThemePref = 'system' | 'light' | 'dark'
const KEY = 'holdout.theme'
const media = window.matchMedia('(prefers-color-scheme: dark)')

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

function apply(pref: ThemePref) {
  const dark = pref === 'dark' || (pref === 'system' && media.matches)
  document.documentElement.classList.toggle('dark', dark)
}

const ThemeContext = createContext<{ pref: ThemePref; setPref: (p: ThemePref) => void } | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>(readPref)

  useEffect(() => {
    apply(pref)
    if (pref !== 'system') return
    const onChange = () => apply('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [pref])

  const setPref = (p: ThemePref) => {
    try {
      localStorage.setItem(KEY, p)
    } catch {
      // Private mode: the choice lasts for this session only.
    }
    setPrefState(p)
  }

  return <ThemeContext.Provider value={{ pref, setPref }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
