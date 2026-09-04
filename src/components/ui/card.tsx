import React from 'react'
import { cn } from '@/lib/utils'

type CardProps = React.HTMLAttributes<HTMLDivElement>

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-200/80 bg-white shadow-xs',
        'hover:border-gray-300/80 transition-all duration-200',
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
    <div className={cn('px-5 py-4 border-b border-gray-100/90', className)} {...props}>
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
      className={cn('px-5 py-3.5 border-t border-gray-100/90 bg-gray-50/60 rounded-b-2xl', className)}
      {...props}
    >
      {children}
    </div>
  )
}
