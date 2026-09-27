import React from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="w-full">
        <select
          ref={ref}
          className={cn(
            'flex w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-[#172B4D]',
            'transition-colors duration-150 appearance-none',
            'focus:outline-none focus:ring-2 focus:ring-[#55C832]/25 focus:border-[#55C832]',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
            'min-h-[44px]',
            error
              ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
              : 'border-gray-300',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Select.displayName = 'Select'
