'use client'

// ==============================================================================
// TUTORPULSE PHASE 4: CLEAR PAGE CONFIRMATION MODAL
// Guard against accidental destruction of whiteboard page contents
// ==============================================================================

import React from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ClearConfirmModalProps {
  isOpen: boolean
  pageNumber: number
  pageTitle?: string
  onClose: () => void
  onConfirm: () => void
}

export function ClearConfirmModal({
  isOpen,
  pageNumber,
  pageTitle,
  onClose,
  onConfirm,
}: ClearConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="clear-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in"
    >
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between">
          <div className="h-10 w-10 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-400 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <h2 id="clear-modal-title" className="text-sm font-bold text-white">
            Clear {pageTitle || `Page ${pageNumber}`}?
          </h2>
          <p className="mt-1 text-xs text-gray-400 leading-relaxed">
            All drawing strokes, shapes, and text on this page will be removed. Other pages will not be affected.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="bg-rose-600 hover:bg-rose-500 text-white"
          >
            Clear Page
          </Button>
        </div>
      </div>
    </div>
  )
}
