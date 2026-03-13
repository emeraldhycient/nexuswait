import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { api, setApiTokenGetter } from '../api/client'

interface AuthUser {
  id: string
  email?: string
  firstName?: string
  lastName?: string
  roles?: string[]
  accountId?: string
  provider?: string
  avatarUrl?: string
  account?: { id: string; plan: string }
  [key: string]: unknown
}

interface AuthValue {
  user: AuthUser | null
  token: string | null
  setToken: (t: string | null) => void
  logout: () => void
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem('nexuswait_token'))
  const [loading, setLoading] = useState(true)

  const setToken = useCallback((t: string | null) => {
    setTokenState(t)
    if (t) localStorage.setItem('nexuswait_token', t)
    else localStorage.removeItem('nexuswait_token')
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    if (typeof window !== 'undefined') (window as Window & { __logout?: () => void }).__logout = undefined
  }, [setToken])

  useEffect(() => {
    setApiTokenGetter(() => token)
    if (typeof window !== 'undefined') (window as Window & { __logout?: () => void }).__logout = logout
  }, [token, logout])

  useEffect(() => {
    if (!token) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect -- clear user when token is gone */
      setUser(null)
      setLoading(false)
      return
    }
    api
      .get<AuthUser>('/auth/me')
      .then((res) => {
        setUser(res.data)
      })
      .catch(() => {
        setToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [token, setToken])

  const value: AuthValue = {
    user,
    token,
    setToken,
    logout,
    loading,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.roles?.includes('admin') ?? false,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/* eslint-disable react-refresh/only-export-components -- useAuth is the primary export alongside AuthProvider */
export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
