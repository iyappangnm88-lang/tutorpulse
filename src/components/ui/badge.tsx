import React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 dark:bg-[#1C261C] text-gray-700 dark:text-[#A8B3A5] border-gray-200/80 dark:border-[#293329]',
  success: 'bg-[#55C832]/12 dark:bg-[#6BEA45]/15 text-[#318A25] dark:text-[#6BEA45] border-[#55C832]/30 dark:border-[#6BEA45]/30',
  warning: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-[#FFD84A] border-amber-200/80 dark:border-amber-800/40',
  danger: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/40',
  info: 'bg-slate-100 dark:bg-[#1C261C] text-[#172B4D] dark:text-[#F4F7F2] border-slate-200 dark:border-[#293329]',
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
