import React from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          ref={ref}
          className={cn(
            'flex w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900',
            'placeholder:text-gray-400',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
            'min-h-[80px]',
            error
              ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
              : 'border-gray-300',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
