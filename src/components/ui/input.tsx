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
            'flex h-10 w-full rounded-xl border border-gray-300/80 bg-white px-3.5 py-2 text-sm text-gray-900 placeholder:text-gray-400',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400',
            'min-h-[44px]',
            error && 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error && id ? `${id}-error` : undefined}
          {...props}
        />
        {error && (
          <p
            id={id ? `${id}-error` : undefined}
            className="mt-1 text-xs text-rose-600"
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
