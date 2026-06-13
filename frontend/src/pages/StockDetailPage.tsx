import { useNavigate, useParams } from 'react-router-dom'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  PageHeader,
  Skeleton,
  StatCard,
  Table,
  type BadgeColor,
  type Column,
} from '@/components/common'
import { useApi } from '@/hooks/useApi'
import { decisionsApi, marketApi, tradesApi } from '@/api/resources'
import { formatCurrency, formatDateTime, formatPercent } from '@/lib/utils'
import type { Action, Decision, MarketDataPoint, Trade } from '@/types'

const actionColor: Record<Action, BadgeColor> = { BUY: 'green', SELL: 'red', HOLD: 'amber' }

export function StockDetailPage() {
  const { symbol = '' } = useParams<{ symbol: string }>()
  const navigate = useNavigate()

  const history = useApi(() => marketApi.history(symbol), [symbol])
  const trades = useApi(() => tradesApi.list({ symbol }), [symbol])
  const decisions = useApi(() => decisionsApi.list({ symbol }), [symbol])

  const series: MarketDataPoint[] = history.data ?? []
  const latest = series[series.length - 1]

  // Build buy/sell markers anchored to the nearest price point in the series.
  function nearestPrice(iso: string): number | null {
    if (!series.length) return null
    const target = new Date(iso).getTime()
    let best = series[0]
    let bestDiff = Infinity
    for (const p of series) {
      const diff = Math.abs(new Date(p.timestamp).getTime() - target)
      if (diff < bestDiff) {
        bestDiff = diff
        best = p
      }
    }
    return best.price
  }

  const markers = (trades.data ?? []).flatMap((t) => {
    const out: { time: string; price: number; type: 'BUY' | 'SELL' }[] = []
    const buyPrice = nearestPrice(t.buy_time) ?? t.buy_price
    out.push({ time: t.buy_time, price: buyPrice, type: 'BUY' })
    if (t.sell_time && t.sell_price != null) {
      out.push({ time: t.sell_time, price: t.sell_price, type: 'SELL' })
    }
    return out
  })

  const decisionColumns: Column<Decision>[] = [
    { key: 'timestamp', header: 'Time', render: (d) => formatDateTime(d.timestamp) },
    { key: 'action', header: 'Action', render: (d) => <Badge color={actionColor[d.action]}>{d.action}</Badge> },
    { key: 'confidence', header: 'Conf.', align: 'right', render: (d) => `${Math.round(d.confidence * 100)}%` },
    { key: 'reason', header: 'Reason', className: 'max-w-md whitespace-normal', render: (d) => d.reason },
  ]

  const tradeColumns: Column<Trade>[] = [
    { key: 'buy_price', header: 'Buy', align: 'right', render: (t) => formatCurrency(t.buy_price) },
    { key: 'sell_price', header: 'Sell', align: 'right', render: (t) => (t.sell_price != null ? formatCurrency(t.sell_price) : '—') },
    {
      key: 'pnl',
      header: 'P/L %',
      align: 'right',
      render: (t) =>
        t.pnl_percent != null ? (
          <span className={t.pnl_percent >= 0 ? 'text-bull' : 'text-bear'}>{formatPercent(t.pnl_percent, true)}</span>
        ) : (
          '—'
        ),
    },
    { key: 'status', header: 'Status', render: (t) => <Badge color={t.status === 'OPEN' ? 'blue' : 'gray'}>{t.status}</Badge> },
  ]

  return (
    <div>
      <PageHeader
        title={symbol}
        description="Price history with buy / sell markers"
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            ← Back
          </Button>
        }
      />

      {history.error && (
        <Alert variant="error" className="mb-4">
          {history.error}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Latest Price" loading={history.loading} value={formatCurrency(latest?.price)} />
        <StatCard label="RSI" loading={history.loading} value={latest?.rsi ?? '—'} />
        <StatCard
          label="Sentiment"
          loading={history.loading}
          value={latest?.sentiment != null ? latest.sentiment.toFixed(2) : '—'}
          tone={(latest?.sentiment ?? 0) >= 0 ? 'positive' : 'negative'}
        />
      </div>

      <Card className="mt-6">
        <CardHeader title="Price Chart" subtitle="Markers show executed buy/sell points" />
        <CardBody>
          {history.loading ? (
            <Skeleton className="h-72 w-full" />
          ) : series.length > 0 ? (
            <ResponsiveContainer width="100%" height={288}>
              <LineChart data={series} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(v) => new Date(v).toLocaleDateString()}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  labelFormatter={(l) => formatDateTime(l as string)}
                />
                <Line type="monotone" dataKey="price" stroke="#3478f6" strokeWidth={2} dot={false} />
                {markers.map((m, i) => (
                  <ReferenceDot
                    key={i}
                    x={m.time}
                    y={m.price}
                    r={6}
                    fill={m.type === 'BUY' ? '#16a34a' : '#dc2626'}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-72 items-center justify-center text-sm text-slate-400">
              No market data for {symbol} yet.
            </div>
          )}
        </CardBody>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Trades" subtitle={`Paper trades for ${symbol}`} />
          <Table
            columns={tradeColumns}
            data={trades.data ?? []}
            rowKey={(t) => t.id}
            loading={trades.loading}
            skeletonRows={3}
            emptyMessage="No trades for this symbol."
          />
        </Card>
        <Card>
          <CardHeader title="Decisions" subtitle={`AI decisions for ${symbol}`} />
          <Table
            columns={decisionColumns}
            data={decisions.data ?? []}
            rowKey={(d) => d.id}
            loading={decisions.loading}
            skeletonRows={3}
            emptyMessage="No decisions for this symbol."
          />
        </Card>
      </div>
    </div>
  )
}
