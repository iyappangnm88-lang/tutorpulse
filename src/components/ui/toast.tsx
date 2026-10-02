'use client'

import React from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/contexts/toast-context'
import type { Toast, ToastType } from '@/types'

const toastConfig: Record<
  ToastType,
  { icon: React.ElementType; bg: string; text: string; border: string }
> = {
  success: {
    icon: CheckCircle,
    bg: 'bg-green-50 dark:bg-[#162414]',
    text: 'text-green-800 dark:text-[#6BEA45]',
    border: 'border-green-200 dark:border-[#6BEA45]/30',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-50 dark:bg-[#2A1414]',
    text: 'text-red-800 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800/40',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-yellow-50 dark:bg-[#282210]',
    text: 'text-yellow-800 dark:text-[#FFD84A]',
    border: 'border-yellow-200 dark:border-yellow-800/40',
  },
  info: {
    icon: Info,
    bg: 'bg-[#FAFBEF] dark:bg-[#1C261C]',
    text: 'text-[#172B4D] dark:text-[#F4F7F2]',
    border: 'border-[#55C832]/30 dark:border-[#293329]',
  },
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const { icon: Icon, bg, text, border } = toastConfig[toast.type]

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'flex w-full items-start gap-3 rounded-2xl border p-4 shadow-lg backdrop-blur-xs',
        'transition-all duration-200 animate-in slide-in-from-top-2',
        bg,
        text,
        border
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.message && (
          <p className="mt-0.5 text-xs opacity-85 leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 rounded-lg p-1 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  )
}
