import React from 'react'
import { cn } from '@/lib/utils'

type CardProps = React.HTMLAttributes<HTMLDivElement>

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-200/80 dark:border-[#303A32] bg-white dark:bg-[#1D241F] shadow-xs text-[#172B4D] dark:text-[#F2F5F2]',
        'hover:border-gray-300/80 dark:hover:border-[#3F4C41] transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('px-5 py-4 border-b border-gray-100/90 dark:border-[#303A32]', className)} {...props}>
      {children}
    </div>
  )
}

export function CardBody({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('px-5 py-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'px-5 py-3.5 border-t border-gray-100/90 dark:border-[#303A32] bg-gray-50/60 dark:bg-[#171C18]/80 rounded-b-2xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
