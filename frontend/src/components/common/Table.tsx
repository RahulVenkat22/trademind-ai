import { cn } from '@/lib/utils'
import { Skeleton } from './Skeleton'

export interface Column<T> {
  /** Unique key for the column. */
  key: string
  header: React.ReactNode
  /** Render a cell for a given row. */
  render: (row: T, index: number) => React.ReactNode
  className?: string
  headerClassName?: string
  align?: 'left' | 'right' | 'center'
}

export interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  /** Stable key extractor for rows. */
  rowKey: (row: T, index: number) => string | number
  loading?: boolean
  /** Number of skeleton rows to show while loading. */
  skeletonRows?: number
  emptyMessage?: React.ReactNode
  onRowClick?: (row: T) => void
  className?: string
}

const alignClass = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
}

export function Table<T>({
  columns,
  data,
  rowKey,
  loading = false,
  skeletonRows = 6,
  emptyMessage = 'No data to display.',
  onRowClick,
  className,
}: TableProps<T>) {
  return (
    <div className={cn('w-full overflow-x-auto scrollbar-thin', className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500',
                  alignClass[col.align || 'left'],
                  col.headerClassName,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: skeletonRows }).map((_, r) => (
              <tr key={`sk-${r}`} className="border-b border-slate-100">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <Skeleton className="h-4 w-full max-w-[140px]" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-sm text-slate-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={rowKey(row, i)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-slate-100 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-slate-50',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'whitespace-nowrap px-4 py-3 text-slate-700',
                      alignClass[col.align || 'left'],
                      col.className,
                    )}
                  >
                    {col.render(row, i)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
