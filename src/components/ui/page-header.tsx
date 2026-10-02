import React from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200/80 dark:border-[#293329]', className)}>
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-[#F4F7F2] tracking-tight">{title}</h1>
        {description && (
          <p className="text-xs sm:text-sm text-gray-500 dark:text-[#A8B3A5] mt-1">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2.5 shrink-0">{children}</div>}
    </div>
  )
}
