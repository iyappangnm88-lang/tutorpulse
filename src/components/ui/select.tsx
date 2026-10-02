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
            'flex w-full rounded-xl border border-gray-300/80 dark:border-[#293329] bg-white dark:bg-[#111711] px-3.5 py-2.5 text-sm text-[#172B4D] dark:text-[#F4F7F2]',
            'transition-colors duration-150 appearance-none',
            'focus:outline-none focus:ring-2 focus:ring-[#55C832]/25 dark:focus:ring-[#6BEA45]/25 focus:border-[#55C832] dark:focus:border-[#6BEA45]',
            'disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-[#161D16] disabled:text-gray-400 dark:disabled:text-[#6C7A6A]',
            'min-h-[44px]',
            error && 'border-rose-300 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Select.displayName = 'Select'
