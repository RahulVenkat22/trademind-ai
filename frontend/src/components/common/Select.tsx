import { forwardRef, useId, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  label: string
  value: string
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, options, placeholder, className, id, ...props },
  ref,
) {
  const autoId = useId()
  const selectId = id || autoId

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        aria-invalid={!!error}
        className={cn(
          'h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 shadow-sm',
          'focus:outline-none focus:ring-2',
          error
            ? 'border-bear focus:border-bear focus:ring-red-200'
            : 'border-slate-300 focus:border-brand-500 focus:ring-brand-200',
          'disabled:cursor-not-allowed disabled:bg-slate-50',
          className,
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-xs text-bear">{error}</p>}
    </div>
  )
})
