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
    bg: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-200',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-yellow-50',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
  },
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const { icon: Icon, bg, text, border } = toastConfig[toast.type]

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'flex w-full items-start gap-3 rounded-lg border p-4 shadow-md',
        'transition-all duration-200',
        bg,
        text,
        border
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.message && (
          <p className="mt-0.5 text-sm opacity-80">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className={cn(
          'flex-shrink-0 rounded p-0.5 opacity-70 hover:opacity-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current'
        )}
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
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  )
}
