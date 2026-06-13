import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'
import type { AuthTokens } from '@/types'
import { tokenStore } from './tokenStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach the access token to every outgoing request.
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.getAccess()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// --- Refresh handling ---------------------------------------------------
// When a request fails with 401 we try to refresh the access token once,
// queueing any concurrent requests until the refresh resolves.

let isRefreshing = false
let pendingQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = []

function flushQueue(error: unknown, token: string | null) {
  pendingQueue.forEach((p) => {
    if (token) p.resolve(token)
    else p.reject(error)
  })
  pendingQueue = []
}

/** Called when refresh fails — clears tokens and notifies the app. */
let onAuthFailure: (() => void) | null = null
export function setAuthFailureHandler(handler: () => void) {
  onAuthFailure = handler
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    // Never try to refresh the refresh/login endpoints themselves.
    if (original.url?.includes('/auth/refresh') || original.url?.includes('/auth/login')) {
      tokenStore.clear()
      onAuthFailure?.()
      return Promise.reject(error)
    }

    const refresh = tokenStore.getRefresh()
    if (!refresh) {
      onAuthFailure?.()
      return Promise.reject(error)
    }

    if (isRefreshing) {
      // Wait for the in-flight refresh, then retry with the new token.
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            original.headers.Authorization = `Bearer ${token}`
            original._retry = true
            resolve(api(original))
          },
          reject,
        })
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post<Pick<AuthTokens, 'access'>>(
        `${BASE_URL}/auth/refresh`,
        { refresh },
        { headers: { 'Content-Type': 'application/json' } },
      )
      tokenStore.set({ access: data.access })
      flushQueue(null, data.access)
      original.headers.Authorization = `Bearer ${data.access}`
      return api(original)
    } catch (refreshErr) {
      flushQueue(refreshErr, null)
      tokenStore.clear()
      onAuthFailure?.()
      return Promise.reject(refreshErr)
    } finally {
      isRefreshing = false
    }
  },
)

/** Normalise an axios error into a human-readable message. */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as Record<string, unknown> | undefined
    if (data) {
      if (typeof data.detail === 'string') return data.detail
      if (typeof data.message === 'string') return data.message
      // DRF field errors: collect the first one.
      const firstField = Object.values(data)[0]
      if (Array.isArray(firstField) && typeof firstField[0] === 'string') return firstField[0]
    }
    if (err.code === 'ERR_NETWORK') return 'Cannot reach the server. Is the backend running?'
    return err.message || fallback
  }
  return fallback
}
