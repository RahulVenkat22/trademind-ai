import { forwardRef, useId, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leftIcon, rightIcon, className, id, ...props },
  ref,
) {
  const autoId = useId()
  const inputId = id || autoId

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={cn(
            'h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 shadow-sm',
            'placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            error
              ? 'border-bear focus:border-bear focus:ring-red-200'
              : 'border-slate-300 focus:border-brand-500 focus:ring-brand-200',
            'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
            leftIcon && 'pl-9',
            rightIcon && 'pr-9',
            className,
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
            {rightIcon}
          </span>
        )}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-bear">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
})
