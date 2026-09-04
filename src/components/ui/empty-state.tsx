import React from 'react'
import { Button } from './button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  actionLabel?: string
  onAction?: () => void
  children?: React.ReactNode
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center sm:p-12">
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50/80 text-indigo-600 border border-indigo-100/80 shadow-2xs">
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold text-gray-900">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-gray-500 leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
      {actionLabel && onAction && !action && (
        <div className="mt-5">
          <Button size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
      {children && <div className="mt-5">{children}</div>}
    </div>
  )
}
