import { cn } from '@/lib/utils'

export interface SkeletonProps {
  className?: string
}

/** Animated shimmer placeholder used while data loads. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-slate-200/70',
        'before:absolute before:inset-0 before:-translate-x-full',
        'before:animate-shimmer before:bg-gradient-to-r',
        'before:from-transparent before:via-white/60 before:to-transparent',
        className,
      )}
    />
  )
}

/** A block of stacked skeleton text lines. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  )
}
