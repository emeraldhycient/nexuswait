import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1'

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

let getToken: () => string | null = () => null

export function setApiTokenGetter(fn: () => string | null): void {
  getToken = fn
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const url = err.config?.url || ''
      // Skip redirect for auth endpoints that handle 401 themselves
      const isAuthEndpoint = ['/auth/login', '/auth/register', '/auth/google', '/auth/me'].some(
        (p) => url.includes(p),
      )
      if (!isAuthEndpoint) {
        const win = typeof window !== 'undefined' ? (window as Window & { __logout?: () => void }) : null
        if (win?.__logout) win.__logout()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  }
)
