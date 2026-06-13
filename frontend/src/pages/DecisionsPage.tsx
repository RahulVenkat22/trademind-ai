import { useState } from 'react'
import {
  Alert,
  Badge,
  Card,
  PageHeader,
  Select,
  Table,
  type BadgeColor,
  type Column,
} from '@/components/common'
import { useApi } from '@/hooks/useApi'
import { decisionsApi } from '@/api/resources'
import { formatDateTime } from '@/lib/utils'
import type { Action, Decision } from '@/types'

const actionColor: Record<Action, BadgeColor> = {
  BUY: 'green',
  SELL: 'red',
  HOLD: 'amber',
}

const actionOptions = [
  { label: 'All actions', value: '' },
  { label: 'Buy', value: 'BUY' },
  { label: 'Sell', value: 'SELL' },
  { label: 'Hold', value: 'HOLD' },
]

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const tone = value >= 0.7 ? 'bg-bull' : value >= 0.5 ? 'bg-amber-500' : 'bg-bear'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-slate-600">{pct}%</span>
    </div>
  )
}

export function DecisionsPage() {
  const [action, setAction] = useState('')
  const { data, loading, error } = useApi(
    () => decisionsApi.list(action ? { action } : undefined),
    [action],
  )

  const columns: Column<Decision>[] = [
    { key: 'timestamp', header: 'Time', render: (d) => formatDateTime(d.timestamp) },
    {
      key: 'symbol',
      header: 'Symbol',
      render: (d) => <span className="font-medium text-slate-900">{d.symbol}</span>,
    },
    {
      key: 'action',
      header: 'Action',
      render: (d) => <Badge color={actionColor[d.action]}>{d.action}</Badge>,
    },
    {
      key: 'confidence',
      header: 'Confidence',
      render: (d) => <ConfidenceBar value={d.confidence} />,
    },
    {
      key: 'agent_type',
      header: 'Agent',
      render: (d) => <Badge color="purple">{d.agent_type}</Badge>,
    },
    {
      key: 'approved',
      header: 'Risk Check',
      render: (d) =>
        d.approved == null ? (
          '—'
        ) : (
          <Badge color={d.approved ? 'green' : 'red'}>
            {d.approved ? 'Approved' : 'Rejected'}
          </Badge>
        ),
    },
    {
      key: 'reason',
      header: 'Reason',
      className: 'max-w-md whitespace-normal',
      render: (d) => <span className="text-slate-600">{d.reason}</span>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="AI Decisions"
        description="Every BUY / SELL / HOLD decision with the model's reasoning"
        action={
          <div className="w-44">
            <Select
              options={actionOptions}
              value={action}
              onChange={(e) => setAction(e.target.value)}
              aria-label="Filter by action"
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
          rowKey={(d) => d.id}
          loading={loading}
          emptyMessage="No decisions logged yet."
        />
      </Card>
    </div>
  )
}
