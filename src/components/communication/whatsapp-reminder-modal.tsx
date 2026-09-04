'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/fee-utils'
import { constructWhatsAppReminderUrl } from '@/lib/communication-utils'
import type { FeeReminderItem } from '@/types'

interface WhatsAppReminderModalProps {
  isOpen: boolean
  onClose: () => void
  item: FeeReminderItem | null
}

export function WhatsAppReminderModal({ isOpen, onClose, item }: WhatsAppReminderModalProps) {
  if (!item) return null

  const hasPhone = !!item.parent_phone && item.parent_phone.trim().length >= 10
  const whatsappUrl = hasPhone
    ? constructWhatsAppReminderUrl({
        parentPhone: item.parent_phone!,
        parentName: item.parent_name || 'Parent',
        studentName: item.student_name,
        feeTitle: item.title,
        amount: item.amount,
        paid: item.total_paid,
        balance: item.balance,
      })
    : ''

  function handleOpenWhatsApp() {
    if (whatsappUrl) {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
      onClose()
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Send WhatsApp Reminder"
      description="Review pre-filled reminder message before opening WhatsApp."
      confirmLabel={hasPhone ? 'Open WhatsApp' : 'Phone Required'}
      onConfirm={handleOpenWhatsApp}
    >
      <div className="space-y-4">
        {/* Recipient info */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3.5 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Student:</span>
            <span className="font-semibold text-gray-900">
              {item.student_name} {item.class_name ? `(${item.class_name})` : ''}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Parent:</span>
            <span className="font-semibold text-gray-900">{item.parent_name || 'Not on file'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Phone:</span>
            <span className={hasPhone ? 'font-semibold text-gray-900 font-mono' : 'font-semibold text-red-600'}>
              {item.parent_phone || 'Missing phone number'}
            </span>
          </div>
          <div className="flex justify-between border-t border-gray-200/60 pt-2 font-medium">
            <span className="text-gray-500">Pending Amount:</span>
            <span className="font-bold text-red-600 text-sm">{formatCurrency(item.balance)}</span>
          </div>
        </div>

        {/* Missing Phone Alert */}
        {!hasPhone && (
          <div className="flex items-start gap-2.5 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
            <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Parent phone number is not available.</p>
              <p className="mt-0.5 text-[11px] text-yellow-700">
                Please add a valid phone number to the parent profile before sending a reminder.
              </p>
            </div>
          </div>
        )}

        {/* Message Preview */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700">Message Preview</label>
          <div className="rounded-xl border border-gray-200 bg-white p-3.5 text-xs text-gray-800 font-mono whitespace-pre-wrap leading-relaxed shadow-2xs">
            {`Hello ${item.parent_name || 'Parent'},\n\nThis is a friendly reminder regarding ${item.student_name}'s tuition fee for ${item.title}.\n\nAmount due: ${formatCurrency(item.amount)}\n${item.total_paid > 0 ? `Amount paid: ${formatCurrency(item.total_paid)}\n` : ''}Amount pending: ${formatCurrency(item.balance)}\n\nThank you.\n— TutorPulse`}
          </div>
        </div>
      </div>
    </Dialog>
  )
}
