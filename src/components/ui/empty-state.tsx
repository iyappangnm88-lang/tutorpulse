import React from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ElementType | React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-3xl border border-dashed border-gray-200 dark:border-[#303A32] bg-gray-50/50 dark:bg-[#171C18]/50 space-y-3',
        className
      )}
    >
      {Icon && (
        <div className="h-12 w-12 rounded-2xl bg-white dark:bg-[#1D241F] border border-gray-200/80 dark:border-[#303A32] flex items-center justify-center text-gray-400 dark:text-[#89958C] shadow-2xs">
          {React.isValidElement(Icon) ? (
            Icon
          ) : typeof Icon === 'function' ? (
            <Icon className="h-6 w-6" />
          ) : null}
        </div>
      )}
      <div className="max-w-sm space-y-1">
        <h3 className="text-sm font-bold text-gray-900 dark:text-[#F2F5F2]">{title}</h3>
        {description && (
          <p className="text-xs text-gray-500 dark:text-[#B3BDB5] leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  )
}
