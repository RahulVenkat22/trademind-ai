import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { authApi } from '@/api/auth'
import { setAuthFailureHandler } from '@/api/client'
import { tokenStore } from '@/api/tokenStore'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  /** True during the initial token bootstrap so guards can wait. */
  initializing: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [initializing, setInitializing] = useState(true)

  const clearSession = useCallback(() => {
    tokenStore.clear()
    setUser(null)
  }, [])

  // Register the global auth-failure handler used by the axios interceptor.
  useEffect(() => {
    setAuthFailureHandler(() => {
      setUser(null)
    })
  }, [])

  // On mount, if we have a token, try to restore the session.
  useEffect(() => {
    let cancelled = false
    async function bootstrap() {
      if (!tokenStore.getAccess()) {
        setInitializing(false)
        return
      }
      try {
        const me = await authApi.me()
        if (!cancelled) setUser(me)
      } catch {
        if (!cancelled) clearSession()
      } finally {
        if (!cancelled) setInitializing(false)
      }
    }
    bootstrap()
    return () => {
      cancelled = true
    }
  }, [clearSession])

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    // Prefer the user returned by login; otherwise fetch the profile.
    const profile = res.user ?? (await authApi.me())
    setUser(profile)
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      user,
      isAuthenticated: !!user,
      isAdmin: !!user && (user.is_staff || user.is_superuser),
      initializing,
      login,
      logout,
    }),
    [user, initializing, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
