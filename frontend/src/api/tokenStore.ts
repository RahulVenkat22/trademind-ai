import type { AuthTokens } from '@/types'

const ACCESS_KEY = 'tm_access'
const REFRESH_KEY = 'tm_refresh'

/** Lightweight wrapper around localStorage for JWT access/refresh tokens. */
export const tokenStore = {
  getAccess(): string | null {
    return localStorage.getItem(ACCESS_KEY)
  },
  getRefresh(): string | null {
    return localStorage.getItem(REFRESH_KEY)
  },
  set(tokens: Partial<AuthTokens>) {
    if (tokens.access) localStorage.setItem(ACCESS_KEY, tokens.access)
    if (tokens.refresh) localStorage.setItem(REFRESH_KEY, tokens.refresh)
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}
