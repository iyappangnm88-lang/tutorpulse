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
    'bg-[#55C832] dark:bg-[#6BEA45] text-white dark:text-[#0B0F0C] shadow-xs hover:bg-[#4eb52c] dark:hover:bg-[#5DD838] hover:shadow-sm active:bg-[#318A25] dark:active:bg-[#3FB82F] disabled:bg-[#55C832]/50 dark:disabled:bg-[#6BEA45]/40 font-bold',
  secondary:
    'bg-gray-100/90 dark:bg-[#1C261C] text-[#172B4D] dark:text-[#F4F7F2] hover:bg-gray-200/90 dark:hover:bg-[#232F23] active:bg-gray-200 dark:active:bg-[#2A382A] border border-transparent dark:border-[#293329] disabled:bg-gray-100 dark:disabled:bg-[#161D16] font-semibold',
  ghost:
    'bg-transparent text-gray-600 dark:text-[#A8B3A5] hover:bg-gray-100/80 dark:hover:bg-[#1C261C] hover:text-[#172B4D] dark:hover:text-[#F4F7F2] active:bg-gray-100 dark:active:bg-[#232F23]',
  danger:
    'bg-[#F05252] text-white shadow-xs hover:bg-red-600 active:bg-red-700 disabled:bg-[#F05252]/50 font-bold',
  outline:
    'border border-gray-200/90 dark:border-[#293329] bg-white dark:bg-[#161D16] text-[#172B4D] dark:text-[#F4F7F2] hover:bg-[#FAFBEF] dark:hover:bg-[#1C261C] hover:border-emerald-300 dark:hover:border-[#6BEA45]/50 shadow-2xs hover:shadow-xs active:bg-gray-100/80 dark:active:bg-[#232F23] font-semibold',
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
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55C832] dark:focus-visible:ring-[#6BEA45] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0B0F0C]',
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
