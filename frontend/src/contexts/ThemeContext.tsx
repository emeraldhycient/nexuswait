import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  /** The user's preference: 'light', 'dark', or 'system' */
  mode: ThemeMode
  /** The resolved/actual active mode (never 'system') */
  resolved: 'light' | 'dark'
  /** Set the theme preference */
  setMode: (mode: ThemeMode) => void
}

const STORAGE_KEY = 'nexuswait_theme'

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function resolveMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') return getSystemPreference()
  return mode
}

function applyToDocument(resolved: 'light' | 'dark') {
  const html = document.documentElement
  html.classList.remove('light', 'dark')
  html.classList.add(resolved)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'dark'
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    return stored && ['light', 'dark', 'system'].includes(stored) ? stored : 'dark'
  })

  const resolved = resolveMode(mode)

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m)
    localStorage.setItem(STORAGE_KEY, m)
  }, [])

  // Apply class to <html> on mount and when resolved changes
  useEffect(() => {
    applyToDocument(resolved)
  }, [resolved])

  // Listen for OS preference changes when mode is 'system'
  useEffect(() => {
    if (mode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const handler = () => applyToDocument(resolveMode('system'))
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [mode])

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

/* eslint-disable react-refresh/only-export-components -- useTheme is the primary export alongside ThemeProvider */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
