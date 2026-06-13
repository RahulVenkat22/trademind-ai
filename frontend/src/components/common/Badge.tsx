import { cn } from '@/lib/utils'

export type BadgeColor =
  | 'gray'
  | 'green'
  | 'red'
  | 'blue'
  | 'amber'
  | 'purple'

export interface BadgeProps {
  color?: BadgeColor
  children: React.ReactNode
  className?: string
}

const colorClasses: Record<BadgeColor, string> = {
  gray: 'bg-slate-100 text-slate-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-brand-100 text-brand-700',
  amber: 'bg-amber-100 text-amber-700',
  purple: 'bg-purple-100 text-purple-700',
}

export function Badge({ color = 'gray', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        colorClasses[color],
        className,
      )}
    >
      {children}
    </span>
  )
}
