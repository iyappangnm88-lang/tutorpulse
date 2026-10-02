'use client'

import React from 'react'
import { X } from 'lucide-react'
import { Button } from './button'

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children?: React.ReactNode
  confirmLabel?: string
  confirmVariant?: 'primary' | 'danger'
  onConfirm?: () => void
  isLoading?: boolean
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  onConfirm,
  isLoading = false,
}: DialogProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#161D16] p-6 shadow-2xl border border-gray-100 dark:border-[#293329] z-10 space-y-4 animate-in zoom-in-95 text-[#172B4D] dark:text-[#F4F7F2]">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-[#F4F7F2]">{title}</h3>
            {description && (
              <p className="mt-1 text-xs text-gray-500 dark:text-[#A8B3A5] leading-relaxed">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1C261C] hover:text-gray-600 dark:hover:text-[#F4F7F2] min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {children && <div className="py-2">{children}</div>}

        {onConfirm && (
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-[#293329]">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant={confirmVariant}
              size="sm"
              onClick={onConfirm}
              loading={isLoading}
            >
              {confirmLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
