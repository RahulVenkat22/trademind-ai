import { api } from './client'
import { tokenStore } from './tokenStore'
import type { LoginResponse, User } from '@/types'

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
    tokenStore.set({ access: data.access, refresh: data.refresh })
    return data
  },

  async logout(): Promise<void> {
    const refresh = tokenStore.getRefresh()
    try {
      // Backend blacklists the refresh token; ignore failures on logout.
      await api.post('/auth/logout', { refresh })
    } catch {
      /* no-op */
    } finally {
      tokenStore.clear()
    }
  },

  /** Fetch the currently authenticated user's profile. */
  async me(): Promise<User> {
    const { data } = await api.get<User>('/auth/me')
    return data
  },
}
