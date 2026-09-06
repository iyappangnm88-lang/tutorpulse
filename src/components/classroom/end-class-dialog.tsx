'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface EndClassDialogProps {
  isOpen: boolean
  isEnding: boolean
  batchName: string
  onClose: () => void
  onConfirm: () => void
}

export function EndClassDialog({
  isOpen,
  isEnding,
  batchName,
  onClose,
  onConfirm,
}: EndClassDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="End Online Class?"
      description={`Are you sure you want to end the online class for ${batchName}?`}
    >
      <div className="space-y-4 pt-2">
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-950">
              Ending the class will mark this session as completed.
            </p>
            <p className="text-amber-800 leading-relaxed">
              Active participants will be notified and disconnected from the classroom. The session end timestamp will be recorded in your batch history and calendar records.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isEnding}
            className="text-xs"
          >
            Stay in Class
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            loading={isEnding}
            className="text-xs bg-rose-600 hover:bg-rose-700 text-white"
          >
            Yes, End Class Now
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
