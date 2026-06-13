// Shared domain types mirroring the Django REST API contracts (see scope doc).

export type Role = 'admin' | 'user'

export interface User {
  id: number
  username: string
  email: string
  is_staff: boolean
  is_superuser: boolean
  created_at?: string
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginResponse extends AuthTokens {
  user?: User
}

export type TradeStatus = 'OPEN' | 'CLOSED'
export type Action = 'BUY' | 'SELL' | 'HOLD'
export type AgentType = 'BUY' | 'SELL'

export interface Trade {
  id: number
  symbol: string
  buy_price: number
  sell_price: number | null
  status: TradeStatus
  buy_time: string
  sell_time: string | null
  quantity?: number
  pnl?: number | null
  pnl_percent?: number | null
  reason?: string
}

export interface Decision {
  id: number
  symbol: string
  action: Action
  confidence: number
  reason: string
  agent_type: AgentType
  timestamp: string
  approved?: boolean
}

export interface MarketDataPoint {
  symbol: string
  price: number
  rsi: number | null
  macd?: string
  sentiment: number | null
  timestamp: string
}

export interface PortfolioSummary {
  total_value: number
  cash: number
  invested: number
  open_positions: number
  positions: Trade[]
}

export interface PerformanceMetrics {
  total_pnl: number
  total_pnl_percent: number
  win_rate: number
  total_trades: number
  winning_trades: number
  losing_trades: number
  active_trades: number
  // Optional equity curve for charting
  equity_curve?: { timestamp: string; value: number }[]
}

export interface SentimentSnapshot {
  symbol: string
  news_summary: string
  news_sentiment: number
  reddit_summary: string
  reddit_sentiment: number
  overall_sentiment: number
  timestamp: string
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ApiError {
  detail?: string
  message?: string
  [key: string]: unknown
}
