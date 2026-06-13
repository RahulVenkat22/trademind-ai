import { cn } from '@/lib/utils'
import { Card } from './Card'
import { Skeleton } from './Skeleton'

export interface StatCardProps {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
  /** Optional secondary line, e.g. a delta. */
  sub?: React.ReactNode
  /** Tints the value text. */
  tone?: 'neutral' | 'positive' | 'negative'
  loading?: boolean
  className?: string
}

const toneClasses = {
  neutral: 'text-slate-900',
  positive: 'text-bull',
  negative: 'text-bear',
}

export function StatCard({
  label,
  value,
  icon,
  sub,
  tone = 'neutral',
  loading = false,
  className,
}: StatCardProps) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-28" />
      ) : (
        <p className={cn('mt-2 text-2xl font-semibold', toneClasses[tone])}>{value}</p>
      )}
      {loading ? (
        <Skeleton className="mt-2 h-3 w-20" />
      ) : (
        sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>
      )}
    </Card>
  )
}
