import { useNavigate } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
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
  type Column,
} from '@/components/common'
import { RefreshIcon } from '@/components/icons'
import { useApi } from '@/hooks/useApi'
import { performanceApi, portfolioApi } from '@/api/resources'
import { formatCurrency, formatDateTime, formatPercent } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import type { Trade } from '@/types'

export function DashboardPage() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const perf = useApi(() => performanceApi.get(), [])
  const portfolio = useApi(() => portfolioApi.get(), [])

  const metrics = perf.data
  const positions = portfolio.data?.positions ?? []

  const columns: Column<Trade>[] = [
    {
      key: 'symbol',
      header: 'Symbol',
      render: (t) => <span className="font-medium text-slate-900">{t.symbol}</span>,
    },
    { key: 'buy_price', header: 'Buy Price', align: 'right', render: (t) => formatCurrency(t.buy_price) },
    {
      key: 'pnl',
      header: 'Unrealized P/L',
      align: 'right',
      render: (t) =>
        t.pnl_percent != null ? (
          <span className={t.pnl_percent >= 0 ? 'text-bull' : 'text-bear'}>
            {formatPercent(t.pnl_percent, true)}
          </span>
        ) : (
          '—'
        ),
    },
    { key: 'buy_time', header: 'Opened', render: (t) => formatDateTime(t.buy_time) },
    {
      key: 'status',
      header: 'Status',
      render: (t) => <Badge color={t.status === 'OPEN' ? 'blue' : 'gray'}>{t.status}</Badge>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your paper-trading performance"
        action={
          isAdmin && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshIcon className="h-4 w-4" />}
              onClick={() => {
                perf.refetch()
                portfolio.refetch()
              }}
            >
              Refresh
            </Button>
          )
        }
      />

      {perf.error && (
        <Alert variant="error" className="mb-4">
          {perf.error}
        </Alert>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Profit / Loss"
          loading={perf.loading}
          value={formatCurrency(metrics?.total_pnl)}
          tone={(metrics?.total_pnl ?? 0) >= 0 ? 'positive' : 'negative'}
          sub={metrics ? formatPercent(metrics.total_pnl_percent, true) : undefined}
        />
        <StatCard
          label="Win Rate"
          loading={perf.loading}
          value={metrics ? formatPercent(metrics.win_rate, true) : '—'}
          sub={metrics ? `${metrics.winning_trades}/${metrics.total_trades} winning` : undefined}
        />
        <StatCard
          label="Active Trades"
          loading={perf.loading}
          value={metrics?.active_trades ?? '—'}
          sub="Max 3 open positions"
        />
        <StatCard
          label="Total Trades"
          loading={perf.loading}
          value={metrics?.total_trades ?? '—'}
          sub={metrics ? `${metrics.losing_trades} losing` : undefined}
        />
      </div>

      {/* Equity curve */}
      <Card className="mt-6">
        <CardHeader title="Equity Curve" subtitle="Portfolio value over time" />
        <CardBody>
          {perf.loading ? (
            <Skeleton className="h-64 w-full" />
          ) : metrics?.equity_curve && metrics.equity_curve.length > 0 ? (
            <ResponsiveContainer width="100%" height={256}>
              <AreaChart data={metrics.equity_curve} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3478f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3478f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(v) => new Date(v).toLocaleDateString()}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  labelFormatter={(l) => formatDateTime(l as string)}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3478f6"
                  strokeWidth={2}
                  fill="url(#equityFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-slate-400">
              No equity data yet. The chart will populate once trading cycles run.
            </div>
          )}
        </CardBody>
      </Card>

      {/* Active positions */}
      <Card className="mt-6">
        <CardHeader
          title="Active Positions"
          subtitle="Currently open paper trades"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/trades')}>
              View all
            </Button>
          }
        />
        <Table
          columns={columns}
          data={positions}
          rowKey={(t) => t.id}
          loading={portfolio.loading}
          skeletonRows={3}
          emptyMessage="No open positions."
          onRowClick={(t) => navigate(`/stocks/${t.symbol}`)}
        />
      </Card>
    </div>
  )
}
