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
            'flex w-full rounded-xl border border-gray-300/80 dark:border-[#293329] bg-white dark:bg-[#111711] px-3.5 py-2.5 text-sm text-[#172B4D] dark:text-[#F4F7F2] placeholder:text-gray-400 dark:placeholder:text-[#6C7A6A]',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-[#55C832]/25 dark:focus:ring-[#6BEA45]/25 focus:border-[#55C832] dark:focus:border-[#6BEA45]',
            'disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-[#161D16] disabled:text-gray-400 dark:disabled:text-[#6C7A6A]',
            'min-h-[80px]',
            error && 'border-rose-300 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
