import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge conditional class names with Tailwind conflict resolution. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Format a number as a currency string (defaults to USD). */
export function formatCurrency(value: number | null | undefined, currency = 'USD'): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

/** Format a number as a percentage string, e.g. 0.0421 -> "4.21%". */
export function formatPercent(value: number | null | undefined, fromFraction = false): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  const pct = fromFraction ? value * 100 : value
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`
}

/** Format an ISO timestamp into a readable local date-time. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
