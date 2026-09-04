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
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {children}
        </div>
      )}
    </div>
  )
}
