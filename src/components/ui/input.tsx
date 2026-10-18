import React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          id={id}
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-xl border border-gray-300/80 dark:border-[#303A32] bg-white dark:bg-[#171C18] px-3.5 py-2 text-sm text-[#172B4D] dark:text-[#F2F5F2] placeholder:text-gray-400 dark:placeholder:text-[#89958C]',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-[#55C832]/25 dark:focus:ring-[#55C832]/25 focus:border-[#55C832] dark:focus:border-[#55C832]',
            'disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-[#1D241F] disabled:text-gray-400 dark:disabled:text-[#89958C]',
            'min-h-[44px]',
            error && 'border-rose-300 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error && id ? `${id}-error` : undefined}
          {...props}
        />
        {error && (
          <p
            id={id ? `${id}-error` : undefined}
            className="mt-1 text-xs text-rose-600 dark:text-rose-400"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
