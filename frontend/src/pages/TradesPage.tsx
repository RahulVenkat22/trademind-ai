import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Badge,
  Card,
  PageHeader,
  Select,
  Table,
  type Column,
} from '@/components/common'
import { useApi } from '@/hooks/useApi'
import { tradesApi } from '@/api/resources'
import { formatCurrency, formatDateTime, formatPercent } from '@/lib/utils'
import type { Trade } from '@/types'

const statusOptions = [
  { label: 'All trades', value: '' },
  { label: 'Open', value: 'OPEN' },
  { label: 'Closed', value: 'CLOSED' },
]

export function TradesPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const { data, loading, error } = useApi(
    () => tradesApi.list(status ? { status } : undefined),
    [status],
  )

  const columns: Column<Trade>[] = [
    {
      key: 'symbol',
      header: 'Symbol',
      render: (t) => <span className="font-medium text-slate-900">{t.symbol}</span>,
    },
    { key: 'buy_price', header: 'Buy', align: 'right', render: (t) => formatCurrency(t.buy_price) },
    {
      key: 'sell_price',
      header: 'Sell',
      align: 'right',
      render: (t) => (t.sell_price != null ? formatCurrency(t.sell_price) : '—'),
    },
    {
      key: 'pnl',
      header: 'P/L %',
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
      key: 'sell_time',
      header: 'Closed',
      render: (t) => (t.sell_time ? formatDateTime(t.sell_time) : '—'),
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => <Badge color={t.status === 'OPEN' ? 'blue' : 'gray'}>{t.status}</Badge>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Trades"
        description="All paper trades, with buy/sell details"
        action={
          <div className="w-44">
            <Select
              options={statusOptions}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Filter by status"
            />
          </div>
        }
      />

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <Card>
        <Table
          columns={columns}
          data={data ?? []}
          rowKey={(t) => t.id}
          loading={loading}
          emptyMessage="No trades found."
          onRowClick={(t) => navigate(`/stocks/${t.symbol}`)}
        />
      </Card>
    </div>
  )
}
