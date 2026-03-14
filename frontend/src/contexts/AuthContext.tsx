import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { api, setApiTokenGetter } from '../api/client'
import { clearUserScopeCache } from '../api/clearUserCache'

interface AuthUser {
  id: string
  email?: string
  firstName?: string
  lastName?: string
  roles?: string[]
  accountId?: string
  provider?: string
  avatarUrl?: string
  emailVerifiedAt?: string | null
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
  isEmailVerified: boolean
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
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

  // Clear user-scoped cache on logout or when token changes (e.g. login/register) so the new session never sees previous user's data
  useEffect(() => {
    clearUserScopeCache(queryClient)
  }, [token, queryClient])

  useEffect(() => {
    if (!token) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect -- clear user when token is gone */
      setUser(null)
      setLoading(false)
      return
    }
    setLoading(true)
    api
      .get<AuthUser>('/auth/me')
      .then((res) => {
        setUser(res.data)
      })
      .catch((err: unknown) => {
        // Only clear auth on genuine 401 (expired / invalid token).
        // Network errors (backend down, timeout) should NOT log the user out —
        // the token may still be perfectly valid once the server is reachable again.
        if (isAxiosError(err) && err.response?.status === 401) {
          setToken(null)
          setUser(null)
        }
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
    isEmailVerified: !!user?.emailVerifiedAt || user?.provider === 'google',
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/* eslint-disable react-refresh/only-export-components -- useAuth is the primary export alongside AuthProvider */
export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
