import React from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#55C832] text-white shadow-xs hover:bg-[#4eb52c] hover:shadow-sm active:bg-[#318A25] disabled:bg-[#55C832]/50 font-bold',
  secondary:
    'bg-gray-100/90 text-[#172B4D] hover:bg-gray-200/90 active:bg-gray-200 border border-transparent disabled:bg-gray-100 font-semibold',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100/80 hover:text-[#172B4D] active:bg-gray-100',
  danger:
    'bg-[#F05252] text-white shadow-xs hover:bg-red-600 active:bg-red-700 disabled:bg-[#F05252]/50 font-bold',
  outline:
    'border border-gray-200/90 bg-white text-[#172B4D] hover:bg-[#FAFBEF] hover:border-emerald-300 shadow-2xs hover:shadow-xs active:bg-gray-100/80 font-semibold',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-sm font-semibold rounded-xl gap-2.5',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center select-none',
        'transition-all duration-150 cursor-pointer active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55C832] focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-60 disabled:cursor-not-allowed',
        'min-h-[44px]',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Processing...</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}
