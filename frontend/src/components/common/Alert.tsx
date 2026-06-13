import { cn } from '@/lib/utils'

export type AlertVariant = 'info' | 'success' | 'warning' | 'error'

export interface AlertProps {
  variant?: AlertVariant
  title?: React.ReactNode
  children?: React.ReactNode
  onClose?: () => void
  className?: string
}

const variantClasses: Record<AlertVariant, string> = {
  info: 'bg-brand-50 text-brand-800 border-brand-200',
  success: 'bg-green-50 text-green-800 border-green-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  error: 'bg-red-50 text-red-800 border-red-200',
}

export function Alert({ variant = 'info', title, children, onClose, className }: AlertProps) {
  return (
    <div className={cn('rounded-lg border px-4 py-3 text-sm', variantClasses[variant], className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          {title && <p className="font-semibold">{title}</p>}
          {children && <div className={cn(title && 'mt-0.5')}>{children}</div>}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss"
            className="text-current/60 hover:text-current"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
