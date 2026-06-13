import { api } from './client'
import type {
  Decision,
  MarketDataPoint,
  Paginated,
  PerformanceMetrics,
  PortfolioSummary,
  SentimentSnapshot,
  Trade,
  User,
} from '@/types'

/** Unwrap either a plain array or a DRF paginated response. */
function asList<T>(data: T[] | Paginated<T>): T[] {
  return Array.isArray(data) ? data : data.results
}

export const tradesApi = {
  async list(params?: { status?: string; symbol?: string }): Promise<Trade[]> {
    const { data } = await api.get<Trade[] | Paginated<Trade>>('/trades', { params })
    return asList(data)
  },
  async get(id: number): Promise<Trade> {
    const { data } = await api.get<Trade>(`/trades/${id}`)
    return data
  },
}

export const decisionsApi = {
  async list(params?: { symbol?: string; action?: string }): Promise<Decision[]> {
    const { data } = await api.get<Decision[] | Paginated<Decision>>('/decisions', { params })
    return asList(data)
  },
}

export const portfolioApi = {
  async get(): Promise<PortfolioSummary> {
    const { data } = await api.get<PortfolioSummary>('/portfolio')
    return data
  },
}

export const performanceApi = {
  async get(): Promise<PerformanceMetrics> {
    const { data } = await api.get<PerformanceMetrics>('/performance')
    return data
  },
}

export const marketApi = {
  async history(symbol: string): Promise<MarketDataPoint[]> {
    const { data } = await api.get<MarketDataPoint[] | Paginated<MarketDataPoint>>(
      `/market-data`,
      { params: { symbol } },
    )
    return asList(data)
  },
}

export const sentimentApi = {
  async list(symbol?: string): Promise<SentimentSnapshot[]> {
    const { data } = await api.get<SentimentSnapshot[] | Paginated<SentimentSnapshot>>(
      '/sentiment',
      { params: symbol ? { symbol } : undefined },
    )
    return asList(data)
  },
}

export interface CreateUserPayload {
  username: string
  email: string
  password?: string
  is_staff?: boolean
  is_superuser?: boolean
}

export const usersApi = {
  async list(): Promise<User[]> {
    const { data } = await api.get<User[] | Paginated<User>>('/users')
    return asList(data)
  },
  async create(payload: CreateUserPayload): Promise<User> {
    const { data } = await api.post<User>('/users', payload)
    return data
  },
  async update(id: number, payload: Partial<CreateUserPayload>): Promise<User> {
    const { data } = await api.put<User>(`/users/${id}`, payload)
    return data
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/users/${id}`)
  },
}

export const systemApi = {
  /** Trigger a full agent cycle (admin only). */
  async runCycle(): Promise<{ status: string; message?: string }> {
    const { data } = await api.post<{ status: string; message?: string }>('/run-cycle')
    return data
  },
}
